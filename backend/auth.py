import logging
import os
import secrets

import requests
from flask import Blueprint, session, redirect, request, jsonify

from models import User
from extensions import db

import spotify_client as sp

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)


def _frontend_url():
    return os.environ.get("FRONTEND_URL", "http://localhost:5173")

# GET /api/login - start Spotify OAuth with a random state for CSRF protection.
@auth_bp.get("/api/login")
def login():
    state = secrets.token_urlsafe(16)
    session["oauth_state"] = state
    return redirect(sp.build_authorize_url(state))

# GET /api/callback - handle Spotify's redirect, verify state, and log the user in.
# On failure we redirect back to the landing page with an ?auth_error= reason
# instead of returning a raw 500, so a hiccup never leaves the user stuck.
@auth_bp.get("/api/callback")
def callback():
    frontend = _frontend_url()
    if request.args.get("error"):
        return redirect(f"{frontend}/?auth_error=denied")

    code = request.args.get("code")
    state = request.args.get("state")
    # Require a code AND a matching state (also avoids a bare-request crash where
    # both sides were None and compared equal).
    if not code or not state or state != session.get("oauth_state"):
        return redirect(f"{frontend}/?auth_error=state")

    try:
        token_data = sp.exchange_code_for_token(code)
        profile = sp.get_user_profile(token_data["access_token"])
    except requests.RequestException:
        # Reused/expired code or Spotify API issue. Detailed error stays in
        # server logs (no secrets); the user just sees a friendly retry prompt.
        logger.exception("Spotify token/profile exchange failed during login")
        return redirect(f"{frontend}/?auth_error=spotify")

    try:
        user = User.query.filter_by(spotify_id=profile["id"]).first()
        # Create the user on first login, otherwise refresh their display name.
        if not user:
            user = User(
                spotify_id=profile["id"],
                display_name=profile.get("display_name"),
            )
            db.session.add(user)
        else:
            user.display_name = profile.get("display_name")
        db.session.commit()
    except Exception:
        # Roll back so the dead/stale connection is returned to the pool clean.
        db.session.rollback()
        logger.exception("Login DB write failed")
        return redirect(f"{frontend}/?auth_error=server")

    session["user_id"] = user.id
    session["spotify_id"] = profile["id"]
    session["display_name"] = profile.get("display_name")
    session["hide_explicit"] = user.hide_explicit
    # Spotify subscription level ("premium", "free", or "open") drives playback mode.
    session["product"] = profile.get("product")
    session["access_token"] = token_data["access_token"]
    session["refresh_token"] = token_data.get("refresh_token")
    session["expires_at"] = sp.token_expiry_timestamp(token_data["expires_in"])
    session.pop("oauth_state", None)

    return redirect(f"{frontend}/search")


# GET /api/me - return the current session's user info.
@auth_bp.get("/api/me")
def me():
    if "spotify_id" not in session:
        return jsonify(error="Not authenticated"), 401
    return jsonify(
        id=session["user_id"],
        spotifyId=session["spotify_id"],
        displayName=session.get("display_name"),
        product=session.get("product"),
    )


# POST /api/logout - clear the session.
@auth_bp.post("/api/logout")
def logout():
    session.clear()
    return jsonify(status="logged out")
