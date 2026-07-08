import os 
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

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
    origins=[os.environ.get("FRONTEND_URL", "http://localhost:5173")]
  )

  @app.get("/api/health")
  def health():
    return jsonify(status="ok")

  return app

app = create_app()

if __name__ == "__main__":
  app.run(port=5000, debug=True)