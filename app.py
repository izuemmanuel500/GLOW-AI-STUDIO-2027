import os
import sqlite3
import secrets
import tempfile
from datetime import datetime, timezone, timedelta

import fal_client
from flask import Flask, jsonify, render_template, request, send_from_directory, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash


# =========================================================
# GLOW AI STUDIO 2027
# FAL AI BACKEND
# =========================================================

app = Flask(__name__)

CORS(
    app,
    supports_credentials=True,
    origins="*"
)

app.secret_key = os.getenv(
    "GLOW_SECRET_KEY",
    secrets.token_hex(32)
)

DATABASE = os.getenv("GLOW_DATABASE", "glow.db")

FAL_KEY = os.getenv("FAL_KEY")


# =========================================================
# FAL MODELS
# =========================================================

MUSIC_MODEL = "fal-ai/ace-step/prompt-to-audio"
IMAGE_MODEL = "fal-ai/flux/schnell"
VIDEO_MODEL = "minimax/h3-max-turbo/text-to-video"


# =========================================================
# PLAN LIMITS
# =========================================================
#
# Free:
#   Pictures only
#   5 pictures
#
# Trial:
#   1 video
#   2 music
#   5 pictures
#
# Weekly:
#   5 videos
#   5 music
#   20 pictures
#
# Monthly:
#   20 videos
#   15 music
#   100 pictures
#
# =========================================================

PLAN_LIMITS = {
    "free": {
        "price": 0,
        "video": 0,
        "music": 0,
        "image": 5,
        "resolution": "standard",
        "commercial": False,
    },

    "trial": {
        "price": 1000,
        "video": 1,
        "music": 2,
        "image": 5,
        "resolution": "720p",
        "commercial": False,
    },

    "weekly": {
        "price": 2000,
        "video": 5,
        "music": 5,
        "image": 20,
        "resolution": "720p",
        "commercial": False,
    },

    "monthly": {
        "price": 5000,
        "video": 20,
        "music": 15,
        "image": 100,
        "resolution": "1080p",
        "commercial": True,
    },
}


# =========================================================
# DATABASE
# =========================================================

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db


def column_exists(db, table_name, column_name):
    rows = db.execute(
        f"PRAGMA table_info({table_name})"
    ).fetchall()

    return any(row["name"] == column_name for row in rows)


def add_column_if_missing(
    db,
    table_name,
    column_name,
    column_definition
):
    if not column_exists(db, table_name, column_name):
        db.execute(
            f"ALTER TABLE {table_name} "
            f"ADD COLUMN {column_name} {column_definition}"
        )


def init_db():
    db = get_db()

    # -----------------------------------------------------
    # USERS
    # -----------------------------------------------------

    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,

            plan TEXT DEFAULT 'free',

            credits INTEGER DEFAULT 0,

            image_used INTEGER DEFAULT 0,
            music_used INTEGER DEFAULT 0,
            video_used INTEGER DEFAULT 0,

            subscription_status TEXT DEFAULT 'inactive',
            subscription_expires_at TEXT,

            profile_name TEXT,
            profile_photo TEXT,

            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # -----------------------------------------------------
    # CREATIONS
    # -----------------------------------------------------

    db.execute("""
        CREATE TABLE IF NOT EXISTS creations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,

            creation_type TEXT NOT NULL,
            prompt TEXT,

            status TEXT DEFAULT 'processing',

            media_url TEXT,
            request_id TEXT,

            created_at TEXT NOT NULL,

            FOREIGN KEY(user_id)
            REFERENCES users(id)
        )
    """)

    # -----------------------------------------------------
    # SUBSCRIPTIONS
    # -----------------------------------------------------

    db.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,

            plan TEXT NOT NULL,
            status TEXT NOT NULL,

            credits INTEGER DEFAULT 0,

            started_at TEXT,
            expires_at TEXT,

            payment_reference TEXT,

            FOREIGN KEY(user_id)
            REFERENCES users(id)
        )
    """)

    # -----------------------------------------------------
    # DATABASE MIGRATION
    # -----------------------------------------------------

    add_column_if_missing(
        db,
        "users",
        "image_used",
        "INTEGER DEFAULT 0"
    )

    add_column_if_missing(
        db,
        "users",
        "music_used",
        "INTEGER DEFAULT 0"
    )

    add_column_if_missing(
        db,
        "users",
        "video_used",
        "INTEGER DEFAULT 0"
    )

    add_column_if_missing(
        db,
        "users",
        "plan",
        "TEXT DEFAULT 'free'"
    )

    add_column_if_missing(
        db,
        "users",
        "subscription_status",
        "TEXT DEFAULT 'inactive'"
    )

    add_column_if_missing(
        db,
        "users",
        "subscription_expires_at",
        "TEXT"
    )

    db.commit()
    db.close()


init_db()


# =========================================================
# TIME HELPERS
# =========================================================

def now_iso():
    return datetime.now(timezone.utc).isoformat()


# =========================================================
# AUTH HELPERS
# =========================================================

def current_user():
    user_id = session.get("user_id")

    if not user_id:
        return None

    db = get_db()

    user = db.execute(
        "SELECT * FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    db.close()

    return user


def require_login():
    user = current_user()

    if not user:
        return None, jsonify({
            "ok": False,
            "error": "Please sign in first."
        }), 401

    return user, None, None


# =========================================================
# PLAN HELPERS
# =========================================================

def get_plan(user):
    plan = (user["plan"] or "free").lower()

    if plan not in PLAN_LIMITS:
        plan = "free"

    return plan


def get_usage(user):
    plan = get_plan(user)
    limits = PLAN_LIMITS[plan]

    return {
        "plan": plan,

        "image": {
            "used": user["image_used"] or 0,
            "limit": limits["image"],
            "remaining": max(
                0,
                limits["image"] - (user["image_used"] or 0)
            )
        },

        "music": {
            "used": user["music_used"] or 0,
            "limit": limits["music"],
            "remaining": max(
                0,
                limits["music"] - (user["music_used"] or 0)
            )
        },

        "video": {
            "used": user["video_used"] or 0,
            "limit": limits["video"],
            "remaining": max(
                0,
                limits["video"] - (user["video_used"] or 0)
            )
        }
    }


def resource_column(resource):
    mapping = {
        "image": "image_used",
        "music": "music_used",
        "video": "video_used"
    }

    return mapping.get(resource)


def has_usage(user, resource):
    plan = get_plan(user)
    limits = PLAN_LIMITS[plan]

    column = resource_column(resource)

    if not column:
        return False

    used = user[column] or 0
    limit = limits[resource]

    return used < limit


def consume_usage(user_id, resource):
    column = resource_column(resource)

    if not column:
        return False

    db = get_db()

    db.execute(
        f"""
        UPDATE users
        SET {column} = COALESCE({column}, 0) + 1,
            updated_at = ?
        WHERE id = ?
        """,
        (now_iso(), user_id)
    )

    db.commit()
    db.close()

    return True


# =========================================================
# FAL ERROR HELPER
# =========================================================

def fal_ready():
    return bool(FAL_KEY)


def fal_error_message(error):
    message = str(error)

    if len(message) > 500:
        message = message[:500]

    return message


# =========================================================
# FILE / PAGE ROUTES
# =========================================================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)


# =========================================================
# HEALTH
# =========================================================

@app.route("/api/health")
def health():
    return jsonify({
        "ok": True,
        "service": "GLOW AI STUDIO 2027",
        "fal_configured": bool(FAL_KEY),
        "models": {
            "music": MUSIC_MODEL,
            "image": IMAGE_MODEL,
            "video": VIDEO_MODEL
        }
    })


# =========================================================
# AUTH — SIGN UP
# =========================================================

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}

    username = str(
        data.get("username", "")
    ).strip()

    email = str(
        data.get("email", "")
    ).strip().lower()

    password = str(
        data.get("password", "")
    )

    if len(username) < 3:
        return jsonify({
            "ok": False,
            "error": "Username must be at least 3 characters."
        }), 400

    if "@" not in email:
        return jsonify({
            "ok": False,
            "error": "Please enter a valid email."
        }), 400

    if len(password) < 6:
        return jsonify({
            "ok": False,
            "error": "Password must be at least 6 characters."
        }), 400

    db = get_db()

    existing = db.execute(
        """
        SELECT id
        FROM users
        WHERE username = ?
           OR email = ?
        """,
        (username, email)
    ).fetchone()

    if existing:
        db.close()

        return jsonify({
            "ok": False,
            "error": "Username or email already exists."
        }), 409

    timestamp = now_iso()

    cursor = db.execute(
        """
        INSERT INTO users (
            username,
            email,
            password_hash,
            plan,
            credits,
            image_used,
            music_used,
            video_used,
            subscription_status,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, 'free', 0, 0, 0, 0, 'inactive', ?, ?)
        """,
        (
            username,
            email,
            generate_password_hash(password),
            timestamp,
            timestamp
        )
    )

    user_id = cursor.lastrowid

    db.commit()
    db.close()

    session["user_id"] = user_id

    return jsonify({
        "ok": True,
        "message": "Account created successfully.",
        "user": {
            "id": user_id,
            "username": username,
            "email": email,
            "plan": "free"
        },
        "usage": get_usage({
            "plan": "free",
            "image_used": 0,
            "music_used": 0,
            "video_used": 0
        })
    })


# =========================================================
# AUTH — LOGIN
# =========================================================

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    identity = str(
        data.get("username", "")
    ).strip()

    password = str(
        data.get("password", "")
    )

    if not identity or not password:
        return jsonify({
            "ok": False,
            "error": "Enter your username/email and password."
        }), 400

    db = get_db()

    user = db.execute(
        """
        SELECT *
        FROM users
        WHERE username = ?
           OR email = ?
        """,
        (identity, identity.lower())
    ).fetchone()

    db.close()

    if not user:
        return jsonify({
            "ok": False,
            "error": "Invalid login details."
        }), 401

    if not check_password_hash(
        user["password_hash"],
        password
    ):
        return jsonify({
            "ok": False,
            "error": "Invalid login details."
        }), 401

    session["user_id"] = user["id"]

    return jsonify({
        "ok": True,
        "message": "Login successful.",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "plan": get_plan(user),
            "subscription_status": user["subscription_status"]
        },
        "usage": get_usage(user)
    })


# =========================================================
# AUTH — LOGOUT
# =========================================================

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "ok": True,
        "message": "Logged out."
    })


# =========================================================
# AUTH — CURRENT USER
# =========================================================

@app.route("/api/auth/me")
def auth_me():
    user = current_user()

    if not user:
        return jsonify({
            "ok": True,
            "logged_in": False
        })

    return jsonify({
        "ok": True,
        "logged_in": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "plan": get_plan(user),
            "subscription_status": user["subscription_status"],
            "subscription_expires_at": user["subscription_expires_at"],
            "profile_name": user["profile_name"],
            "profile_photo": user["profile_photo"]
        },
        "usage": get_usage(user)
    })


# =========================================================
# PROFILE
# =========================================================

@app.route("/api/profile", methods=["GET"])
def get_profile():
    user = current_user()

    if not user:
        return jsonify({
            "ok": False,
            "error": "Please sign in first."
        }), 401

    return jsonify({
        "ok": True,
        "profile": {
            "username": user["username"],
            "email": user["email"],
            "name": user["profile_name"],
            "photo": user["profile_photo"]
        }
    })


@app.route("/api/profile", methods=["PUT"])
def update_profile():
    user, error_response, status = require_login()

    if error_response:
        return error_response, status

    data = request.get_json(silent=True) or {}

    name = data.get("name")
    photo = data.get("photo")

    db = get_db()

    db.execute(
        """
        UPDATE users
        SET profile_name = ?,
            profile_photo = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            name,
            photo,
            now_iso(),
            user["id"]
        )
    )

    db.commit()
    db.close()

    return jsonify({
        "ok": True,
        "message": "Profile updated."
    })


# =========================================================
# PLANS
# =========================================================

@app.route("/api/plans")
def plans():
    return jsonify({
        "ok": True,
        "plans": {
            "free": {
                "name": "Free",
                "price": 0,
                "currency": "NGN",
                "video": 0,
                "music": 0,
                "image": 5,
                "resolution": "Standard",
                "commercial": False
            },

            "trial": {
                "name": "One-Time Trial",
                "price": 1000,
                "currency": "NGN",
                "video": 1,
                "music": 2,
                "image": 5,
                "resolution": "720p",
                "commercial": False
            },

            "weekly": {
                "name": "Weekly Tester",
                "price": 2000,
                "currency": "NGN",
                "video": 5,
                "music": 5,
                "image": 20,
                "resolution": "720p",
                "commercial": False
            },

            "monthly": {
                "name": "Monthly",
                "price": 5000,
                "currency": "NGN",
                "video": 20,
                "music": 15,
                "image": 100,
                "resolution": "1080p",
                "commercial": True
            }
        }
    })


# =========================================================
# USAGE
# =========================================================

@app.route("/api/usage")
def usage():
    user, error_response, status = require_login()

    if error_response:
        return error_response, status

    return jsonify({
        "ok": True,
        "usage": get_usage(user)
    })


# =========================================================
# SUBSCRIPTION INFO
# =========================================================

@app.route("/api/subscription")
def subscription():
    user, error_response, status = require_login()

    if error_response:
        return error_response, status

    return jsonify({
        "ok": True,
        "subscription": {
            "plan": get_plan(user),
            "status": user["subscription_status"],
            "expires_at": user["subscription_expires_at"]
        },
        "usage": get_usage(user)
    })


# =========================================================
# MUSIC
# =========================================================

@app.route("/api/music", methods=["POST"])
def generate_music():
    user, error_response, status = require_login()

    if error_response:
        return error_response, status

    if not fal_ready():
        return jsonify({
            "ok": False,
            "error": "FAL_KEY is not configured on the server."
        }), 500

    if not has_usage(user, "music"):
        plan = get_plan(user)

        if plan == "free":
            message = (
                "Music generation is not available on the Free plan. "
                "Choose a paid plan to create music."
            )
        else:
            message = (
                "You have used all your music generations "
                "for this plan."
            )

        return jsonify({
            "ok": False,
            "error": message,
            "usage": get_usage(user)
        }), 403

    data = request.get_json(silent=True) or {}

    prompt = str(
        data.get("prompt", "")
    ).strip()

    lyrics = str(
        data.get("lyrics", "")
    ).strip()

    genre = str(
        data.get("genre", "")
    ).strip()

    mood = str(
        data.get("mood", "")
    ).strip()

    duration = data.get("duration", 60)

    if not prompt and not lyrics:
        return jsonify({
            "ok": False,
            "error": "Enter a music prompt or lyrics."
        }), 400

    try:
        duration = int(duration)
    except Exception:
        duration = 60

    duration = max(10, min(duration, 60))

    tags = ", ".join(
        item for item in [
            genre,
            mood,
            prompt
        ]
        if item
    )

    if not tags:
        tags = "modern music"

    arguments = {
        "prompt": tags,
        "duration": duration
    }

    if lyrics:
        arguments["lyrics"] = lyrics

    try:
        handler = fal_client.submit(
            MUSIC_MODEL,
            arguments=arguments
        )

        request_id = handler.request_id

    except Exception as exc:
        return jsonify({
            "ok": False,
            "error": (
                "FAL music request failed: "
                + fal_error_message(exc)
            )
        }), 502

    db = get_db()

    cursor = db.execute(
        """
        INSERT INTO creations (
