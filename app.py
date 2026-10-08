import os
import sqlite3
import tempfile
from datetime import datetime, timezone

import fal_client

from flask import (
    Flask,
    jsonify,
    request,
    send_from_directory,
    session,
    redirect
)

from flask_cors import CORS

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)


# ============================================================
# GLOW AI STUDIO 2027
# BACKEND
# ============================================================

app = Flask(__name__)


# ============================================================
# SECRET KEY / SESSION
# ============================================================

app.secret_key = os.getenv(
    "GLOW_SECRET_KEY",
    "glow-development-secret-change-in-render"
)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=True,
    MAX_CONTENT_LENGTH=15 * 1024 * 1024
)


# ============================================================
# CORS
# ============================================================

frontend_origin = os.getenv("GLOW_FRONTEND_ORIGIN")

if frontend_origin:
    CORS(
        app,
        supports_credentials=True,
        origins=frontend_origin
    )


# ============================================================
# CONFIGURATION
# ============================================================

DATABASE = os.getenv(
    "GLOW_DATABASE",
    "glow.db"
)

FAL_KEY = os.getenv("FAL_KEY")

MUSIC_MODEL = "fal-ai/ace-step/prompt-to-audio"

IMAGE_MODEL = "fal-ai/flux/schnell"

IMAGE_EDIT_MODEL = "fal-ai/flux-pro/kontext/max"

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

    existing_columns = {
        row["name"]
        for row in cursor.execute(
            "PRAGMA table_info(users)"
        ).fetchall()
    }

    migrations = {

        "credits":
            "ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 0",

        "image_used":
            "ALTER TABLE users ADD COLUMN image_used INTEGER NOT NULL DEFAULT 0",

        "music_used":
            "ALTER TABLE users ADD COLUMN music_used INTEGER NOT NULL DEFAULT 0",

        "video_used":
            "ALTER TABLE users ADD COLUMN video_used INTEGER NOT NULL DEFAULT 0",

        "subscription_status":
            "ALTER TABLE users ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'active'",

        "subscription_expires_at":
            "ALTER TABLE users ADD COLUMN subscription_expires_at TEXT",

        "profile_name":
            "ALTER TABLE users ADD COLUMN profile_name TEXT",

        "profile_photo":
            "ALTER TABLE users ADD COLUMN profile_photo TEXT",

        "created_at":
            "ALTER TABLE users ADD COLUMN created_at TEXT",

        "updated_at":
            "ALTER TABLE users ADD COLUMN updated_at TEXT",
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
        """
        SELECT *
        FROM users
        WHERE id = ?
        """,
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

        "subscription_status":
            user["subscription_status"],

        "subscription_expires_at":
            user["subscription_expires_at"],

        "created_at":
            user["created_at"],
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

            "remaining": max(
                0,
                plan["images"] - image_used
            ),
        },

        "music": {

            "used": music_used,

            "limit": plan["music"],

            "remaining": max(
                0,
                plan["music"] - music_used
            ),
        },

        "video": {

            "used": video_used,

            "limit": plan["videos"],

            "remaining": max(
                0,
                plan["videos"] - video_used
            ),
        },
    }


def can_generate(user, generation_type):

    plan = PLANS.get(
        user["plan"],
        PLANS["free"]
    )

    if generation_type == "image":

        limit = plan["images"]
        used = user["image_used"] or 0

    elif generation_type == "music":

        limit = plan["music"]
        used = user["music_used"] or 0

    elif generation_type == "video":

        limit = plan["videos"]
        used = user["video_used"] or 0

    else:

        return False, "Invalid generation type."

    if used >= limit:

        return False, (
            f"{generation_type.title()} generation limit "
            "reached for your current plan."
        )

    return True, None


def consume_usage(user_id, generation_type):

    column_map = {

        "image": "image_used",

        "music": "music_used",

        "video": "video_used",
    }

    column = column_map.get(
        generation_type
    )

    if not column:
        return

    conn = get_db()

    conn.execute(
        f"""
        UPDATE users
        SET {column} = {column} + 1,
            updated_at = ?
        WHERE id = ?
        """,
        (
            now_iso(),
            user_id
        )
    )

    conn.commit()

    conn.close()


def save_creation(
    user_id,
    creation_type,
    prompt,
    status="submitted",
    media_url=None,
    request_id=None
):

    conn = get_db()

    cursor = conn.execute(
        """
        INSERT INTO creations
        (
            user_id,
            creation_type,
            prompt,
            status,
            media_url,
            request_id,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            creation_type,
            prompt,
            status,
            media_url,
            request_id,
            now_iso(),
        )
    )

    creation_id = cursor.lastrowid

    conn.commit()

    conn.close()

    return creation_id


def update_creation(
    creation_id,
    status=None,
    media_url=None
):

    conn = get_db()

    if status is not None and media_url is not None:

        conn.execute(
            """
            UPDATE creations
            SET status = ?,
                media_url = ?
            WHERE id = ?
            """,
            (
                status,
                media_url,
                creation_id
            )
        )

    elif status is not None:

        conn.execute(
            """
            UPDATE creations
            SET status = ?
            WHERE id = ?
            """,
            (
                status,
                creation_id
            )
        )

    elif media_url is not None:

        conn.execute(
            """
            UPDATE creations
            SET media_url = ?
            WHERE id = ?
            """,
            (
                media_url,
                creation_id
            )
        )

    conn.commit()

    conn.close()


def get_creation_by_request(
    user_id,
    request_id
):

    conn = get_db()

    creation = conn.execute(
        """
        SELECT *
        FROM creations
        WHERE user_id = ?
        AND request_id = ?
        LIMIT 1
        """,
        (
            user_id,
            request_id
        )
    ).fetchone()

    conn.close()

    return creation


# ============================================================
# FAL HELPERS
# ============================================================

def submit_fal(model, arguments):

    if not FAL_KEY:

        raise RuntimeError(
            "FAL_KEY is not configured in Render Environment Variables."
        )

    return fal_client.submit(
        model,
        arguments=arguments
    )


def get_request_id(handler):

    request_id = getattr(
        handler,
        "request_id",
        None
    )

    if request_id:
        return request_id

    if isinstance(handler, dict):

        return (
            handler.get("request_id")
            or handler.get("requestId")
        )

    return None


def extract_media_url(result):

    if not result:
        return None

    if not isinstance(result, dict):
        return None

    if isinstance(result.get("url"), str):
        return result["url"]

    for key in [
        "audio",
        "video",
        "image",
        "file",
        "output"
    ]:

        value = result.get(key)

        if isinstance(value, dict):

            url = value.get("url")

            if isinstance(url, str):
                return url

        elif isinstance(value, str):

            return value

    images = result.get("images")

    if isinstance(images, list) and images:

        first = images[0]

        if isinstance(first, dict):

            url = first.get("url")

            if isinstance(url, str):
                return url

    videos = result.get("videos")

    if isinstance(videos, list) and videos:

        first = videos[0]

        if isinstance(first, dict):

            url = first.get("url")

            if isinstance(url, str):
                return url

    audio_files = result.get("audio_files")

    if isinstance(
        audio_files,
        list
    ) and audio_files:

        first = audio_files[0]

        if isinstance(first, dict):

            url = first.get("url")

            if isinstance(url, str):
                return url

    return None


# ============================================================
# PUBLIC WEBSITE
# ============================================================

@app.route("/")
def home():

    return send_from_directory(
        ".",
        "index.html"
    )


# ============================================================
# LOGIN PAGE
# ============================================================

@app.route("/login")
@app.route("/login.html")
def login_page():

    return send_from_directory(
        ".",
        "login.html"
    )


# ============================================================
# SIGN UP PAGE
# ============================================================

@app.route("/signup")
@app.route("/signup.html")
def signup_page():

    return send_from_directory(
        ".",
        "signup.html"
    )


# ============================================================
# DASHBOARD
# ============================================================

@app.route("/dashboard.html")
def dashboard():

    if not current_user():

        return redirect("/")

    return send_from_directory(
        ".",
        "dashboard.html"
    )


@app.route("/dashboard")
def dashboard_short():

    if not current_user():

        return redirect("/")

    return redirect("/dashboard.html")


# ============================================================
# HEALTH
# ============================================================

@app.route("/api/health")
def health():

    return jsonify({

        "ok": True,

        "status": "ok",

        "fal_configured": bool(FAL_KEY),

        "models": {

            "image": IMAGE_MODEL,

            "image_edit": IMAGE_EDIT_MODEL,

            "music": MUSIC_MODEL,

            "video": VIDEO_MODEL,
        }
    })


# ============================================================
# AUTH — SIGN UP
# ============================================================

@app.route(
    "/api/auth/signup",
    methods=["POST"]
)
def signup():

    data = request.get_json(
        silent=True
    ) or {}

    username = str(
        data.get("username", "")
    ).strip()

    email = str(
        data.get("email", "")
    ).strip().lower()

    password = str(
        data.get("password", "")
    )

    if not username or not email or not password:

        return jsonify({
            "ok": False,
            "error": (
                "Username, email and password "
                "are required."
            )
        }), 400

    if len(username) < 3:

        return jsonify({
            "ok": False,
            "error": (
                "Username must contain at least "
                "3 characters."
            )
        }), 400

    if len(password) < 6:

        return jsonify({
            "ok": False,
            "error": (
                "Password must contain at least "
                "6 characters."
            )
        }), 400

    conn = get_db()

    existing = conn.execute(
        """
        SELECT id
        FROM users
        WHERE username = ?
        OR email = ?
        """,
        (
            username,
            email
        )
    ).fetchone()

    if existing:

        conn.close()

        return jsonify({
            "ok": False,
            "error": (
                "Username or email already exists."
            )
        }), 409

    timestamp = now_iso()

    cursor = conn.execute(
        """
        INSERT INTO users
        (
            username,
            email,
            password_hash,
            plan,
            credits,
            subscription_status,
            profile_name,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            username,
            email,
            generate_password_hash(password),
            "free",
            0,
            "active",
            username,
            timestamp,
            timestamp,
        )
    )

    user_id = cursor.lastrowid

    conn.commit()

    conn.close()

    session.clear()

    session["user_id"] = user_id

    return jsonify({

        "ok": True,

        "message": "Account created successfully.",

        "user": {

            "id": user_id,

            "username": username,

            "email": email,

            "plan": "free"
        }
    })


# ============================================================
# AUTH — LOGIN
# ============================================================

@app.route(
    "/api/auth/login",
    methods=["POST"]
)
def login():

    data = request.get_json(
        silent=True
    ) or {}

    identifier = str(
        data.get("identifier")
        or data.get("username")
        or data.get("email")
        or ""
    ).strip()

    password = str(
        data.get("password", "")
    )

    if not identifier or not password:

        return jsonify({
            "ok": False,
            "error": (
                "Username/email and password "
                "are required."
            )
        }), 400

    conn = get_db()

    user = conn.execute(
        """
        SELECT *
        FROM users
        WHERE username = ?
        OR email = ?
        LIMIT 1
        """,
        (
            identifier,
            identifier.lower()
        )
    ).fetchone()

    conn.close()

    if not user:

        return jsonify({
            "ok": False,
            "error": (
                "Invalid username/email "
                "or password."
            )
        }), 401

    if not check_password_hash(
        user["password_hash"],
        password
    ):

        return jsonify({
            "ok": False,
            "error": (
                "Invalid username/email "
                "or password."
            )
        }), 401

    session.clear()

    session["user_id"] = user["id"]

    return jsonify({

        "ok": True,

        "message": "Login successful.",

        "user": user_data(user)
    })


# ============================================================
# AUTH — LOGOUT
# ============================================================

@app.route(
    "/api/auth/logout",
    methods=["POST"]
)
def logout():

    session.clear()

    return jsonify({

        "ok": True,

        "message": "Logged out successfully."
    })


# ============================================================
# AUTH — CURRENT USER
# ============================================================

@app.route("/api/auth/me")
def auth_me():

    user = current_user()

    if not user:

        return jsonify({

            "ok": False,

            "authenticated": False
        }), 401

    return jsonify({

        "ok": True,

        "authenticated": True,

        "user": user_data(user),

        "usage": usage_data(user)
    })


# ============================================================
# PROFILE
# ============================================================

@app.route(
    "/api/profile",
    methods=["POST"]
)
def update_profile():

    user, error_response, error_status = require_user()

    if error_response:

        return error_response, error_status

    data = request.get_json(
        silent=True
    ) or {}

    profile_name = data.get(
        "profile_name"
    )

    profile_photo = data.get(
        "profile_photo"
    )

    if profile_name is None:

        profile_name = user["profile_name"]

    if profile_photo is None:

        profile_photo = user["profile_photo"]

    profile_name = str(
        profile_name or ""
    ).strip()

    conn = get_db()

    conn.execute(
        """
        UPDATE users
        SET profile_name = ?,
            profile_photo = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            profile_name,
            profile_photo,
            now_iso(),
            user["id"]
        )
    )

    conn.commit()

    updated_user = conn.execute(
        """
        SELECT *
        FROM users
        WHERE id = ?
        """,
        (
            user["id"],
        )
    ).fetchone()

    conn.close()

    return jsonify({

        "ok": True,

        "user": user_data(updated_user)
    })


# ============================================================
# PLANS
# ============================================================

@app.route("/api/plans")
def api_plans():

    return jsonify({
        "ok": True,
        "plans": PLANS
    })


# ============================================================
# USAGE
# ============================================================

@app.route("/api/usage")
def api_usage():

    user, error_response, error_status = require_user()

    if error_response:

        return error_response, error_status

    return jsonify({
        "ok": True,
        "usage": usage_data(user)
    })


# ============================================================
# SUBSCRIPTION
# ============================================================

@app.route(
    "/api/subscription",
    methods=["GET"]
)
def api_subscription():

    user, error_response, error_status = require_user()

    if error_response:

        return error_response, error_status

    return jsonify({

        "ok": True,

        "subscription": {
            "plan": user["plan"],
            "status": user["subscription_status"],
            "expires_at": user["subscription_expires_at"]
        }
    })


# ============================================================
# AI MUSIC
# ============================================================

@app.route(
    "/api/music",
    methods=["POST"]
)
def api_music():

    user, error_response, error_status = require_user()

    if error_response:

        return error_response, error_status

    allowed, message = can_generate(
        user,
        "music"
    )

    if not allowed:

        return jsonify({
            "ok": False,
            "error": message
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    prompt = str(
        data.get("prompt", "")
    ).strip()

    genre = str(
        data.get("genre", "")
    ).strip()

    mood = str(
        data.get("mood", "")
    ).strip()

    duration = data.get(
        "duration",
        30
    )

    if not prompt:

        return jsonify({
            "ok": False,
            "error": "Music prompt is required."
        }), 400

    try:

        duration = int(duration)

    except (TypeError, ValueError):

        duration = 30

    duration = max(
        5,
        min(duration, 300)
    )

    full_prompt = prompt

    if genre:
        full_prompt += f", genre: {genre}"

    if mood:
        full_prompt += f", mood: {mood}"

    arguments = {
        "prompt": full_prompt,
        "duration": duration
    }

    try:

        handler = submit_fal(
            MUSIC_MODEL,
            arguments
        )

        request_id = get_request_id(handler)

        if not request_id:

            return jsonify({
                "ok": False,
                "error": "Music request ID was not returned."
            }), 502

        creation_id = save_creation(
            user["id"],
            "music",
            prompt,
            "submitted",
            None,
            request_id
        )

        consume_usage(
            user["id"],
            "music"
        )

        return jsonify({

            "ok": True,

            "status": "submitted",

            "request_id": request_id,

            "creation_id": creation_id,

            "creation_type": "music",

            "message": "Music generation started."
        })

    except Exception as exc:

        return jsonify({

            "ok": False,

            "error": str(exc)
        }), 500


# ============================================================
# AI IMAGE
# ============================================================

@app.route(
    "/api/image",
    methods=["POST"]
)
def api_image():

    user, error_response, error_status = require_user()

    if error_response:

        return error_response, error_status

    allowed, message = can_generate(
        user,
        "image"
    )

    if not allowed:

        return jsonify({
            "ok": False,
            "error": message
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    prompt = str(
        data.get("prompt", "")
    ).strip()

    image_size = str(
        data.get(
            "image_size",
            "square_hd"
        )
    ).strip()

    if not prompt:

        return jsonify({
            "ok": False,
            "error": "Image prompt is required."
        }), 400

    allowed_sizes = {
        "square",
        "square_hd",
        "portrait_4_3",
        "portrait_16_9",
        "landscape_4_3",
        "landscape_16_9"
    }

    if image_size not in allowed_sizes:

        image_size = "square_hd"

    arguments = {
        "prompt": prompt,
        "image_size": image_size
    }

    try:

        handler = submit_fal(
            IMAGE_MODEL,
            arguments
        )

        request_id = get_request_id(handler)

        if not request_id:

            return jsonify({
                "ok": False,
                "error": "Image request ID was not returned."
            }), 502

        creation_id = save_creation(
            user["id"],
            "image",
            prompt,
            "submitted",
            None,
            request_id
        )

        consume_usage(
            user["id"],
            "image"
        )

        return jsonify({

            "ok": True,

            "status": "submitted",

            "request_id": request_id,

            "creation_id": creation_id,

            "creation_type": "image",

            "message": "Image generation started."
        })

    except Exception as exc:

        return jsonify({

            "ok": False,

            "error": str(exc)
        }), 500


# ============================================================
# AI IMAGE EDIT
# ============================================================

@app.route(
    "/api/image/edit",
    methods=["POST"]
)
def api_image_edit():

    user, error_response, error_status = require_user()

    if error_response:

        return error
