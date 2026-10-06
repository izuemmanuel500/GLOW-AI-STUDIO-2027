import os
import sqlite3
import secrets
from datetime import datetime, timezone

import fal_client
from flask import Flask, jsonify, request, send_from_directory, session
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

DATABASE = os.getenv(
    "GLOW_DATABASE",
    "glow.db"
)

FAL_KEY = os.getenv("FAL_KEY")


# =========================================================
# FAL MODELS
# =========================================================

MUSIC_MODEL = "fal-ai/ace-step/prompt-to-audio"

IMAGE_MODEL = "fal-ai/flux/schnell"

VIDEO_MODEL = "minimax/h3-max-turbo/text-to-video"


# =========================================================
# PLANS
# =========================================================

PLANS = {
    "free": {
        "price": 0,
        "images": 5,
        "music": 0,
        "videos": 0,
        "resolution": "standard",
        "commercial": False
    },

    "trial": {
        "price": 1000,
        "images": 5,
        "music": 2,
        "videos": 1,
        "resolution": "720p",
        "commercial": False
    },

    "weekly": {
        "price": 2000,
        "images": 20,
        "music": 5,
        "videos": 5,
        "resolution": "720p",
        "commercial": False
    },

    "monthly": {
        "price": 5000,
        "images": 100,
        "music": 15,
        "videos": 20,
        "resolution": "1080p",
        "commercial": True
    }
}


# =========================================================
# DATABASE
# =========================================================

def get_db():
    connection = sqlite3.connect(DATABASE)

    connection.row_factory = sqlite3.Row

    return connection


def now():
    return datetime.now(timezone.utc).isoformat()


def init_db():

    connection = get_db()

    connection.execute(
        """
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
        """
    )

    connection.execute(
        """
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
        """
    )

    connection.execute(
        """
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
        """
    )

    connection.commit()

    # -----------------------------------------------------
    # DATABASE MIGRATION
    # -----------------------------------------------------

    columns = {
        row["name"]
        for row in connection.execute(
            "PRAGMA table_info(users)"
        ).fetchall()
    }

    new_columns = {
        "plan": "TEXT DEFAULT 'free'",
        "credits": "INTEGER DEFAULT 0",
        "image_used": "INTEGER DEFAULT 0",
        "music_used": "INTEGER DEFAULT 0",
        "video_used": "INTEGER DEFAULT 0",
        "subscription_status": "TEXT DEFAULT 'inactive'",
        "subscription_expires_at": "TEXT",
        "profile_name": "TEXT",
        "profile_photo": "TEXT"
    }

    for column_name, definition in new_columns.items():

        if column_name not in columns:

            connection.execute(
                f"""
                ALTER TABLE users
                ADD COLUMN {column_name} {definition}
                """
            )

    connection.commit()

    connection.close()


init_db()


# =========================================================
# USER HELPERS
# =========================================================

def current_user():

    user_id = session.get("user_id")

    if not user_id:
        return None

    connection = get_db()

    user = connection.execute(
        """
        SELECT *
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    ).fetchone()

    connection.close()

    return user


def require_user():

    user = current_user()

    if not user:

        return None, (
            jsonify({
                "ok": False,
                "error": "Please sign in first."
            }),
            401
        )

    return user, None


def user_data(user):

    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "plan": user["plan"] or "free",
        "subscription_status": (
            user["subscription_status"]
            or "inactive"
        ),
        "subscription_expires_at": (
            user["subscription_expires_at"]
        ),
        "profile_name": user["profile_name"],
        "profile_photo": user["profile_photo"]
    }


# =========================================================
# USAGE
# =========================================================

def usage_data(user):

    plan = user["plan"] or "free"

    if plan not in PLANS:
        plan = "free"

    limits = PLANS[plan]

    image_used = user["image_used"] or 0
    music_used = user["music_used"] or 0
    video_used = user["video_used"] or 0

    return {
        "plan": plan,

        "image": {
            "used": image_used,
            "limit": limits["images"],
            "remaining": max(
                0,
                limits["images"] - image_used
            )
        },

        "music": {
            "used": music_used,
            "limit": limits["music"],
            "remaining": max(
                0,
                limits["music"] - music_used
            )
        },

        "video": {
            "used": video_used,
            "limit": limits["videos"],
            "remaining": max(
                0,
                limits["videos"] - video_used
            )
        }
    }


def can_generate(user, kind):

    plan = user["plan"] or "free"

    if plan not in PLANS:
        plan = "free"

    limits = PLANS[plan]

    if kind == "image":

        used = user["image_used"] or 0

        return used < limits["images"]

    if kind == "music":

        used = user["music_used"] or 0

        return used < limits["music"]

    if kind == "video":

        used = user["video_used"] or 0

        return used < limits["videos"]

    return False


def consume_usage(user_id, kind):

    columns = {
        "image": "image_used",
        "music": "music_used",
        "video": "video_used"
    }

    column = columns.get(kind)

    if not column:
        return

    connection = get_db()

    connection.execute(
        f"""
        UPDATE users
        SET {column} = COALESCE({column}, 0) + 1,
            updated_at = ?
        WHERE id = ?
        """,
        (
            now(),
            user_id
        )
    )

    connection.commit()

    connection.close()


# =========================================================
# CREATION HELPERS
# =========================================================

def save_creation(
    user_id,
    creation_type,
    prompt,
    request_id
):

    connection = get_db()

    cursor = connection.execute(
        """
        INSERT INTO creations (
            user_id,
            creation_type,
            prompt,
            status,
            request_id,
            created_at
        )
        VALUES (
            ?,
            ?,
            ?,
            'processing',
            ?,
            ?
        )
        """,
        (
            user_id,
            creation_type,
            prompt,
            request_id,
            now()
        )
    )

    creation_id = cursor.lastrowid

    connection.commit()

    connection.close()

    return creation_id


def find_creation(
    user_id,
    request_id
):

    connection = get_db()

    creation = connection.execute(
        """
        SELECT *
        FROM creations
        WHERE user_id = ?
        AND request_id = ?
        ORDER BY id DESC
        LIMIT 1
        """,
        (
            user_id,
            request_id
        )
    ).fetchone()

    connection.close()

    return creation


def update_creation(
    creation_id,
    status,
    media_url=None
):

    connection = get_db()

    connection.execute(
        """
        UPDATE creations
        SET status = ?,
            media_url = COALESCE(?, media_url)
        WHERE id = ?
        """,
        (
            status,
            media_url,
            creation_id
        )
    )

    connection.commit()

    connection.close()


# =========================================================
# FAL HELPERS
# =========================================================

def fal_error(error):

    message = str(error).strip()

    if not message:
        message = "Unknown FAL error."

    return message[:700]


def submit_fal(
    model,
    arguments
):

    if not FAL_KEY:

        raise RuntimeError(
            "FAL_KEY is not configured in Render."
        )

    handler = fal_client.submit(
        model,
        arguments=arguments
    )

    return handler.request_id


# =========================================================
# WEBSITE
# =========================================================

@app.route("/")
def home():

    return send_from_directory(
        ".",
        "index.html"
    )


@app.route("/<path:filename>")
def serve_file(filename):

    return send_from_directory(
        ".",
        filename
    )


# =========================================================
# HEALTH
# =========================================================

@app.route("/api/health")
def health():

    return jsonify({

        "ok": True,

        "app":
            "GLOW AI STUDIO 2027",

        "fal_configured":
            bool(FAL_KEY),

        "music_engine":
            "FAL ACE-Step",

        "image_engine":
            "FAL FLUX Schnell",

        "video_engine":
            "FAL MiniMax H3 Max Turbo",

        "status":
            "ok"
    })


# =========================================================
# SIGN UP
# =========================================================

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

    if len(username) < 3:

        return jsonify({
            "ok": False,
            "error":
                "Username must be at least 3 characters."
        }), 400

    if "@" not in email:

        return jsonify({
            "ok": False,
            "error":
                "Enter a valid email."
        }), 400

    if len(password) < 6:

        return jsonify({
            "ok": False,
            "error":
                "Password must be at least 6 characters."
        }), 400

    connection = get_db()

    existing = connection.execute(
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

        connection.close()

        return jsonify({
            "ok": False,
            "error":
                "Username or email already exists."
        }), 409

    timestamp = now()

    cursor = connection.execute(
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
        VALUES (
            ?,
            ?,
            ?,
            'free',
            0,
            0,
            0,
            0,
            'inactive',
            ?,
            ?
        )
        """,
        (
            username,
            email,
            generate_password_hash(
                password
            ),
            timestamp,
            timestamp
        )
    )

    user_id = cursor.lastrowid

    connection.commit()

    connection.close()

    session["user_id"] = user_id

    user = current_user()

    return jsonify({

        "ok": True,

        "message":
            "Account created successfully.",

        "user":
            user_data(user),

        "usage":
            usage_data(user)
    })


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/api/auth/login",
    methods=["POST"]
)
def login():

    data = request.get_json(
        silent=True
    ) or {}

    identity = str(
        data.get("username", "")
    ).strip()

    password = str(
        data.get("password", "")
    )

    if not identity or not password:

        return jsonify({
            "ok": False,
            "error":
                "Enter your username/email and password."
        }), 400

    connection = get_db()

    user = connection.execute(
        """
        SELECT *
        FROM users
        WHERE username = ?
        OR email = ?
        """,
        (
            identity,
            identity.lower()
        )
    ).fetchone()

    connection.close()

    if not user:

        return jsonify({
            "ok": False,
            "error":
                "Invalid login details."
        }), 401

    if not check_password_hash(
        user["password_hash"],
        password
    ):

        return jsonify({
            "ok": False,
            "error":
                "Invalid login details."
        }), 401

    session["user_id"] = user["id"]

    return jsonify({

        "ok": True,

        "message":
            "Login successful.",

        "user":
            user_data(user),

        "usage":
            usage_data(user)
    })


# =========================================================
# LOGOUT
# =========================================================

@app.route(
    "/api/auth/logout",
    methods=["POST"]
)
def logout():

    session.clear()

    return jsonify({
        "ok": True,
        "message":
            "Logged out."
    })


# =========================================================
# CURRENT USER
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

        "user":
            user_data(user),

        "usage":
            usage_data(user)
    })


# =========================================================
# PROFILE
# =========================================================

@app.route(
    "/api/profile",
    methods=["GET"]
)
def profile_get():

    user, error = require_user()

    if error:
        return error

    return jsonify({

        "ok": True,

        "profile": {
            "username":
                user["username"],

            "email":
                user["email"],

            "name":
                user["profile_name"],

            "photo":
                user["profile_photo"]
        }
    })


@app.route(
    "/api/profile",
    methods=["PUT"]
)
def profile_update():

    user, error = require_user()

    if error:
        return error

    data = request.get_json(
        silent=True
    ) or {}

    connection = get_db()

    connection.execute(
        """
        UPDATE users
        SET profile_name = ?,
            profile_photo = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            data.get("name"),
            data.get("photo"),
            now(),
            user["id"]
        )
    )

    connection.commit()

    connection.close()

    return jsonify({
        "ok": True,
        "message":
            "Profile updated."
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
                "videos": 0,
                "music": 0,
                "images": 5,
                "resolution": "Standard",
                "commercial": False
            },

            "trial": {
                "name": "One-Time Trial",
                "price": 1000,
                "currency": "NGN",
                "videos": 1,
                "music": 2,
                "images": 5,
                "resolution": "720p",
                "commercial": False
            },

            "weekly": {
                "name": "Weekly Tester",
                "price": 2000,
                "currency": "NGN",
                "videos": 5,
                "music": 5,
                "images": 20,
                "resolution": "720p",
                "commercial": False
            },

            "monthly": {
                "name": "Monthly",
                "price": 5000,
                "currency": "NGN",
                "videos": 20,
                "music": 15,
                "images": 100,
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

    user, error = require_user()

    if error:
        return error

    return jsonify({

        "ok": True,

        "usage":
            usage_data(user)
    })


# =========================================================
# SUBSCRIPTION
# =========================================================

@app.route("/api/subscription")
def subscription():

    user, error = require_user()

    if error:
        return error

    return jsonify({

        "ok": True,

        "subscription": {

            "plan":
                user["plan"] or "free",

            "status":
                user["subscription_status"]
                or "inactive",

            "expires_at":
                user["subscription_expires_at"]
        },

        "usage":
            usage_data(user)
    })


# =========================================================
# MUSIC GENERATION
# =========================================================

@app.route(
    "/api/music",
    methods=["POST"]
)
def generate_music():

    user, error = require_user()

    if error:
        return error

    if not can_generate(
        user,
        "music"
    ):

        return jsonify({

            "ok": False,

            "error":
                "Music generation is not available on your current plan or your music limit is finished.",

            "usage":
                usage_data(user)

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

    lyrics = str(
        data.get("lyrics", "")
    ).strip()

    if not prompt and not lyrics:

        return jsonify({

            "ok": False,

            "error":
                "Enter a music prompt or lyrics."
        }), 400

    pieces = [
        genre,
        mood,
        prompt
    ]

    pieces = [
        item for item in pieces
        if item
    ]

    final_prompt = ", ".join(
        pieces
    )

    if not final_prompt:
        final_prompt = "modern music"

    try:

        duration = int(
            data.get(
                "duration",
                60
            )
        )

    except (
        TypeError,
        ValueError
    ):

        duration = 60

    duration = max(
        10,
        min(duration, 60)
    )

    arguments = {

        "prompt":
            final_prompt,

        "duration":
            duration,

        "instrumental":
            not bool(lyrics)
    }

    if lyrics:

        arguments["prompt"] = (
            final_prompt
            + ". Lyrics: "
            + lyrics
        )

    try:

        request_id = submit_fal(
            MUSIC_MODEL,
            arguments
        )

    except Exception as exc:

        return jsonify({

            "ok": False,

            "error":
                "FAL music request failed: "
                + fal_error(exc)

        }), 502

    creation_id = save_creation(
        user["id"],
        "music",
        prompt or lyrics,
        request_id
    )

    consume_usage(
        user["id"],
        "music"
    )

    fresh_user = current_user()

    return jsonify({

        "ok": True,

        "message":
            "Music generation started.",

        "request_id":
            request_id,

        "creation_id":
            creation_id,

        "usage":
            usage_data(fresh_user)
    })


# =========================================================
# IMAGE GENERATION
# =========================================================

@app.route(
    "/api/image",
    methods=["POST"]
)
def generate_image():

    user, error = require_user()

    if error:
        return error

    if not can_generate(
        user,
        "image"
    ):

        return jsonify({

            "ok": False,

            "error":
                "Your picture generation limit is finished.",

            "usage":
                usage_data(user)

        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    prompt = str(
        data.get("prompt", "")
    ).strip()

    if not prompt:

        return jsonify({

            "ok": False,

            "error":
                "Enter a picture prompt."
        }), 400

    arguments = {

        "prompt":
            prompt,

        "image_size":
            "landscape_4_3",

        "num_images":
            1
    }

    try:

        request_id = submit_fal(
            IMAGE_MODEL,
            arguments
        )

    except Exception as exc:

        return jsonify({

            "ok": False,

            "error":
                "FAL image request failed: "
                + fal_error(exc)

        }), 502

    creation_id = save_creation(
        user["id"],
        "image",
        prompt,
        request_id
    )

    consume_usage(
        user["id"],
        "image"
    )

    fresh_user = current_user()

    return jsonify({

        "ok": True,

        "message":
            "Picture generation started.",

        "request_id":
            request_id,

        "creation_id":
            creation_id,

        "usage":
            usage_data(fresh_user)
    })


# =========================================================
# VIDEO GENERATION
# =========================================================

@app.route(
    "/api/video",
    methods=["POST"]
)
def generate_video():

    user, error = require_user()

    if error:
        return error

    if not can_generate(
        user,
        "video"
    ):

        return jsonify({

            "ok": False,

            "error":
                "Video generation is not available on your current plan or your video limit is finished.",

            "usage":
                usage_data(user)

        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    prompt = str(
        data.get("prompt", "")
    ).strip()

    if not prompt:

        return jsonify({

            "ok": False,

            "error":
                "Enter a video prompt."
        }), 400

    plan = user["plan"] or "free"

    if plan == "monthly":

        resolution = "1080P"

    else:

        resolution = "768P"

    arguments = {

        "prompt":
            prompt,

        "duration":
            10,

        "resolution":
            resolution,

        "prompt_expansion_mode":
            "disabled",

        "aspect_ratio":
            "16:9",

        "enable_safety_checker":
            True
    }

    try:

        request_id = submit_fal(
            VIDEO_MODEL,
            arguments
        )

    except Exception as exc:

        return jsonify({

            "ok": False,

            "error":
                "FAL video request failed: "
                + fal_error(exc)

        }), 502

    creation_id = save_creation(
        user["id"],
        "video",
        prompt,
        request_id
    )

    consume_usage(
        user["id"],
        "video"
    )

    fresh_user = current_user()

    return jsonify({

        "ok": True,

        "message":
            "Video generation started.",

        "request_id":
            request_id,

        "creation_id":
            creation_id,

        "usage":
            usage_data(fresh_user)
    })


# =========================================================
# RESULT URL EXTRACTION
# =========================================================

def get_media_url(
    result,
    creation_type
):

    if not isinstance(
        result,
        dict
    ):

        return None

    if creation_type == "music":

        audio = result.get(
            "audio"
        )

        if isinstance(
            audio,
            dict
        ):

            return audio.get(
                "url"
            )

    if creation_type == "video":

        video = result.get(
            "video"
        )

        if isinstance(
            video,
            dict
        ):

            return video.get(
                "url"
            )

    if creation_type == "image":

        images = result.get(
            "images"
        )

        if (
            isinstance(images, list)
            and len(images) > 0
            and isinstance(images[0], dict)
        ):

            return images[0].get(
                "url"
            )

    return None


# =========================================================
# GENERATION STATUS
# =========================================================

@app.route(
    "/api/generation/status/<request_id>"
)
def generation_status(
    request_id
):

    user, error = require_user()

    if error:
        return error

    creation = find_creation(
        user["id"],
        request_id
    )

    if not creation:

        return jsonify({

            "ok": False,

            "error":
                "Generation request not found."
        }), 404

    creation_type = (
        creation["creation_type"]
    )

    models = {

        "music":
            MUSIC_MODEL,

        "image":
            IMAGE_MODEL,

        "video":
            VIDEO_MODEL
    }

    model = models.get(
        creation_type
    )

    if not model:

        return jsonify({

            "ok": False,

            "error":
                "Unknown generation type."
        }), 400

    try:

        status = fal_client.status(
            model,
            request_id,
            with_logs=True
        )

        status_name = getattr(
            status,
            "status",
            None
        )

        if status_name is None:

            if isinstance(
                status,
                dict
            ):

                status_name = status.get(
                    "status"
                )

        status_name = str(
            status_name or ""
        ).upper()

        # -------------------------------------------------
        # STILL PROCESSING
        # -------------------------------------------------

        if status_name in (
            "IN_QUEUE",
            "QUEUED",
            "IN_PROGRESS",
            "PROCESSING"
        ):

            return jsonify({

                "ok": True,

                "status":
                    "processing",

                "request_id":
                    request_id
            })

        # -------------------------------------------------
        # FAILED
        # -------------------------------------------------

        if status_name in (
            "FAILED",
            "ERROR"
        ):

            update_creation(
                creation["id"],
                "failed"
            )

            return jsonify({

                "ok": False,

                "status":
                    "failed",

                "error":
                    "Generation failed."
            }), 502

        # -------------------------------------------------
        # COMPLETED
        # -------------------------------------------------

        if status_name in (
            "COMPLETED",
            "COMPLETE",
            "SUCCESS"
        ):

            result = fal_client.result(
                model,
                request_id
            )

            media_url = get_media_url(
                result,
                creation_type
            )

            if media_url:

                update_creation(
                    creation["id"],
                    "completed",
                    media_url
                )

                return jsonify({

                    "ok": True,

                    "status":
                        "completed",

                    "request_id":
                        request_id,

                    "creation_type":
                        creation_type,

                    "media_url":
                        media_url
                })

        return jsonify({

            "ok": True,

            "status":
                "processing",

            "request_id":
                request_id
        })

    except Exception as exc:

        return jsonify({

            "ok": False,

            "status":
                "error",

            "error":
                fal_error(exc)

        }), 502


# =========================================================
# MUSIC STATUS
# =========================================================

@app.route(
    "/api/music/status/<request_id>"
)
def music_status(
    request_id
):

    return generation_status(
        request_id
    )


# =========================================================
# CREATIONS
# =========================================================

@app.route("/api/creations")
def creations():

    user, error = require_user()

    if error:
        return error

    connection = get_db()

    rows = connection.execute(
        """
        SELECT
            id,
            creation_type,
            prompt,
            status,
            media_url,
            request_id,
            created_at
        FROM creations
        WHERE user_id = ?
        ORDER BY id DESC
        """,
        (user["id"],)
    ).fetchall()

    connection.close()

    return jsonify({

        "ok": True,

        "creations": [
            dict(row)
            for row in rows
        ]
    })


# =========================================================
# SERVER
# =========================================================

if __name__ == "__main__":

    port = int(
        os.getenv(
            "PORT",
            "5000"
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
)
