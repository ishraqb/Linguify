import os
import secrets

from flask import Blueprint, session, redirect, request, jsonify

from models import User
from extensions import db

import spotify_client as sp

auth_bp = Blueprint("auth", __name__)

# GET /api/login - start Spotify OAuth with a random state for CSRF protection.
@auth_bp.get("/api/login")
def login():
    state = secrets.token_urlsafe(16)
    session["oauth_state"] = state
    return redirect(sp.build_authorize_url(state))

# GET /api/callback - handle Spotify's redirect, verify state, and log the user in.
@auth_bp.get("/api/callback")
def callback():
    if request.args.get("error"):
        return jsonify(error="Authorization failed"), 400
    # Reject if the returned state doesn't match what we stored (CSRF check).
    if request.args.get("state") != session.get("oauth_state"):
        return jsonify(error="Invalid state"), 400

    token_data = sp.exchange_code_for_token(request.args.get("code"))
    profile = sp.get_user_profile(token_data["access_token"])

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

    session["user_id"] = user.id
    session["spotify_id"] = profile["id"]
    session["display_name"] = profile.get("display_name")
    session["access_token"] = token_data["access_token"]
    session["refresh_token"] = token_data.get("refresh_token")
    session["expires_at"] = sp.token_expiry_timestamp(token_data["expires_in"])
    session.pop("oauth_state", None)

    frontend = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    return redirect(f"{frontend}/search")


# GET /api/me - return the current session's user info.
@auth_bp.get("/api/me")
def me():
    if "spotify_id" not in session:
        return jsonify(error="Not authenticated"), 401
    return jsonify(id=session["user_id"], spotifyId=session["spotify_id"], displayName=session.get("display_name"))


# POST /api/logout - clear the session.
@auth_bp.post("/api/logout")
def logout():
    session.clear()
    return jsonify(status="logged out")
