import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from auth import auth_bp

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")

    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("FLASK_ENV") == "production",
    )
  
    CORS(
        app,
        supports_credentials=True,
        origins=[os.environ.get("FRONTEND_URL", "http://localhost:5173")],
    )

    app.register_blueprint(auth_bp)

    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
