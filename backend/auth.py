import os
import secrets

from flask import Blueprint, session, redirect, request, jsonify

from models import User
from extensions import db

import spotify_client as sp

auth_bp = Blueprint("auth", __name__)

@auth_bp.get("/api/login")
def login():
    state = secrets.token_urlsafe(16)
    session["oauth_state"] = state
    return redirect(sp.build_authorize_url(state))

@auth_bp.get("/api/callback")
def callback():
    if request.args.get("error"):
        return jsonify(error="Authorization failed"), 400
    if request.args.get("state") != session.get("oauth_state"):
        return jsonify(error="Invalid state"), 400

    token_data = sp.exchange_code_for_token(request.args.get("code"))
    profile = sp.get_user_profile(token_data["access_token"])

    user = User.query.filter_by(spotify_id=profile["id"]).first()

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


@auth_bp.get("/api/me")
def me():
    if "spotify_id" not in session:
        return jsonify(error="Not authenticated"), 401
    return jsonify(id=session["user_id"], spotifyId=session["spotify_id"], displayName=session.get("display_name"))


@auth_bp.post("/api/logout")
def logout():
    session.clear()
    return jsonify(status="logged out")
