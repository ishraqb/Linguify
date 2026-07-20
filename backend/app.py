import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from routes import api_bp
from auth import auth_bp
from extensions import db
import models 
load_dotenv()

# Build and configure the Flask app (DB, CORS, cookies, blueprints).
def create_app():
    dist_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
    app = Flask(__name__, static_folder=dist_dir, static_url_path="")
    app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")
    # Managed Postgres (e.g. Render) hands out "postgres://", but SQLAlchemy needs "postgresql://".
    database_url = os.environ.get("DATABASE_URL", "sqlite:///linguify.db")
    if database_url.startswith("postgres://"):
      database_url = database_url.replace("postgres://", "postgresql://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    # Managed Postgres (Render) drops idle connections; pre_ping + recycle checks
    # the connection is alive and replaces stale ones so the first query after
    # an idle period doesn't fail with a dropped-connection error.
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }

    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE=os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
        SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true",
    )

    CORS(
        app,
        supports_credentials=True,
        origins=[os.environ.get("FRONTEND_URL", "http://localhost:5173")],
    )
    db.init_app(app)
    # Initialize the database and create tables if they don't exist.
    with app.app_context():
      db.create_all()

    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)

    # Simple health check endpoint.
    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    @app.get("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    # React Router owns client-side paths like /search and /dashboard.
    # Flask's static handler 404s on those (no matching file), so catch the
    # 404 and return the React entry point. Real /api 404s stay JSON.
    @app.errorhandler(404)
    def not_found(_):
        if request.path.startswith("/api/"):
            return jsonify(error="Not found"), 404
        return send_from_directory(app.static_folder, "index.html")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
