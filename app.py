import os
import sqlite3
import secrets
from datetime import datetime, timezone

import fal_client
from flask import Flask, jsonify, request, send_from_directory, session, redirect
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash


# ============================================================
# GLOW AI STUDIO 2027
# Backend
# ============================================================

app = Flask(__name__)

# ------------------------------------------------------------
# SECRET KEY
# ------------------------------------------------------------
# Keep GLOW_SECRET_KEY in Render Environment Variables.
# Fallback is only for local development.
app.secret_key = os.getenv(
    "GLOW_SECRET_KEY",
    "glow-development-secret-change-in-render"
)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=True,
)

# Same-origin frontend/backend does not require CORS,
# but keeping Flask-CORS available avoids breaking setups
# that may use a separate frontend later.
CORS(
    app,
    supports_credentials=True,
    origins=os.getenv("GLOW_FRONTEND_ORIGIN", "*")
)


# ============================================================
# CONFIGURATION
# ============================================================

DATABASE = os.getenv("GLOW_DATABASE", "glow.db")

FAL_KEY = os.getenv("FAL_KEY")

MUSIC_MODEL = "fal-ai/ace-step/prompt-to-audio"
IMAGE_MODEL = "fal-ai/flux/schnell"
VIDEO_MODEL = "minimax/h3-max-turbo/text-to-video"


# ============================================================
# PLANS
# ============================================================

PLANS = {
    "free": {
        "name": "Free",
        "price": 0,
        "images": 5,
        "music": 0,
        "videos": 0,
        "resolution": "standard",
        "commercial": False,
    },

    "trial": {
        "name": "Trial",
        "price": 1000,
        "images": 5,
        "music": 2,
        "videos": 1,
        "resolution": "720p",
        "commercial": False,
    },

    "weekly": {
        "name": "Weekly Tester",
        "price": 2000,
        "images": 20,
        "music": 5,
        "videos": 5,
        "resolution": "720p",
        "commercial": False,
    },

    "monthly": {
        "name": "Monthly Main",
        "price": 5000,
        "images": 100,
        "music": 15,
        "videos": 20,
        "resolution": "1080p",
        "commercial": True,
    },
}


# ============================================================
# DATABASE
# ============================================================

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            plan TEXT NOT NULL DEFAULT 'free',
            credits INTEGER NOT NULL DEFAULT 0,

            image_used INTEGER NOT NULL DEFAULT 0,
            music_used INTEGER NOT NULL DEFAULT 0,
            video_used INTEGER NOT NULL DEFAULT 0,

            subscription_status TEXT NOT NULL DEFAULT 'active',
            subscription_expires_at TEXT,

            profile_name TEXT,
            profile_photo TEXT,

            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS creations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            creation_type TEXT NOT NULL,
            prompt TEXT,
            status TEXT NOT NULL DEFAULT 'submitted',
            media_url TEXT,
            request_id TEXT,
            created_at TEXT NOT NULL,

            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plan TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            credits INTEGER NOT NULL DEFAULT 0,
            started_at TEXT,
            expires_at TEXT,
            payment_reference TEXT,

            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    # --------------------------------------------------------
    # Safe migration for older databases
    # --------------------------------------------------------

    existing_columns = {
        row["name"]
        for row in cursor.execute("PRAGMA table_info(users)").fetchall()
    }

    migrations = {
        "credits": "ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 0",
        "image_used": "ALTER TABLE users ADD COLUMN image_used INTEGER NOT NULL DEFAULT 0",
        "music_used": "ALTER TABLE users ADD COLUMN music_used INTEGER NOT NULL DEFAULT 0",
        "video_used": "ALTER TABLE users ADD COLUMN video_used INTEGER NOT NULL DEFAULT 0",
        "subscription_status": "ALTER TABLE users ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'active'",
        "subscription_expires_at": "ALTER TABLE users ADD COLUMN subscription_expires_at TEXT",
        "profile_name": "ALTER TABLE users ADD COLUMN profile_name TEXT",
        "profile_photo": "ALTER TABLE users ADD COLUMN profile_photo TEXT",
        "created_at": "ALTER TABLE users ADD COLUMN created_at TEXT",
        "updated_at": "ALTER TABLE users ADD COLUMN updated_at TEXT",
    }

    for column, sql in migrations.items():
        if column not in existing_columns:
            try:
                cursor.execute(sql)
            except sqlite3.OperationalError:
                pass

    conn.commit()
    conn.close()


init_db()


# ============================================================
# HELPERS
# ============================================================

def now_iso():
    return datetime.now(timezone.utc).isoformat()


def current_user():
    user_id = session.get("user_id")

    if not user_id:
        return None

    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    conn.close()

    return user


def require_user():
    user = current_user()

    if not user:
        return None, jsonify({
            "ok": False,
            "error": "Authentication required."
        }), 401

    return user, None, None


def user_data(user):
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "plan": user["plan"],
        "profile_name": user["profile_name"],
        "profile_photo": user["profile_photo"],
        "subscription_status": user["subscription_status"],
        "subscription_expires_at": user["subscription_expires_at"],
        "created_at": user["created_at"],
    }


def usage_data(user):
    plan_name = user["plan"]

    plan = PLANS.get(
        plan_name,
        PLANS["free"]
    )

    image_used = user["image_used"] or 0
    music_used = user["music_used"] or 0
    video_used = user["video_used"] or 0

    return {
        "plan": plan_name,

        "image": {
            "used": image_used,
            "limit": plan["images"],
            "remaining": max(0, plan["images"] - image_used),
        },

        "music": {
            "used": music_used,
            "limit": plan["music"],
            "remaining": max(0, plan["music"] - music_used),
        },

        "video": {
            "used": video_used,
            "limit": plan["videos"],
            "remaining": max(0, plan["videos"] - video_used),
        },
    }


def can_generate(user, generation_type):
    plan = PLANS.get(
        user["plan"],
        PLANS["
