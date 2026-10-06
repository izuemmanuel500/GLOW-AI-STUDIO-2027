import os
import sqlite3
import secrets
from datetime import datetime, timezone

import requests

from flask import (
    Flask,
    request,
    jsonify,
    send_from_directory,
    session
)

from flask_cors import CORS
from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)


# =========================================================
# GLOW AI STUDIO 2027
# ACCOUNTS + LOGIN + CREDITS + SUBSCRIPTIONS
# + PIXAZO MUSIC ENGINE
# =========================================================

app = Flask(__name__)

CORS(
    app,
    supports_credentials=True
)


# =========================================================
# SECURITY
# =========================================================

app.secret_key = os.getenv(
    "GLOW_SECRET_KEY",
    secrets.token_hex(32)
)


# =========================================================
# DATABASE
# =========================================================

DATABASE = os.getenv(
    "GLOW_DATABASE",
    "glow.db"
)


# =========================================================
# PIXAZO
# =========================================================

PIXAZO_API_KEY = os.getenv(
    "PIXAZO_API_KEY"
)

PIXAZO_GENERATE_URL = (
    "https://gateway.pixazo.ai/tracks/v1/generate"
)

PIXAZO_STATUS_URL = (
    "https://gateway.pixazo.ai/v2/requests/status/"
)


# =========================================================
# CREDIT / PLAN SETTINGS
# =========================================================

FREE_CREDITS = 10

CREATOR_WEEKLY_CREDITS = 100

PRO_WEEKLY_CREDITS = 300

STUDIO_WEEKLY_CREDITS = 1000


# =========================================================
# DATABASE
# =========================================================

def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_database():

    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            username TEXT NOT NULL UNIQUE,

            email TEXT NOT NULL UNIQUE,

            password_hash TEXT NOT NULL,

            plan TEXT NOT NULL DEFAULT 'free',

            credits INTEGER NOT NULL DEFAULT 10,

            subscription_status TEXT NOT NULL
                DEFAULT 'inactive',

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

            status TEXT NOT NULL
                DEFAULT 'processing',

            media_url TEXT,

            request_id TEXT,

            created_at TEXT NOT NULL,

            FOREIGN KEY(user_id)
                REFERENCES users(id)

        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER NOT NULL,

            plan TEXT NOT NULL,

            status TEXT NOT NULL,

            credits INTEGER NOT NULL,

            started_at TEXT NOT NULL,

            expires_at TEXT,

            payment_reference TEXT,

            FOREIGN KEY(user_id)
                REFERENCES users(id)

        )
    """)

    db.commit()
    db.close()


init_database()


# =========================================================
# TIME HELPERS
# =========================================================

def iso_now():
    return datetime.now(timezone.utc).isoformat()


# =========================================================
# USER HELPER
# =========================================================

def user_to_dict(user):

    if not user:
        return None

    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "profile_name": (
            user["profile_name"]
            or user["username"]
        ),
        "profile_photo": user["profile_photo"],
        "plan": user["plan"],
        "credits": user["credits"],
        "subscription_status": (
            user["subscription_status"]
        ),
        "subscription_expires_at": (
            user["subscription_expires_at"]
        ),
        "created_at": user["created_at"]
    }


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
def static_files(filename):

    return send_from_directory(
        ".",
        filename
    )


# =========================================================
# HEALTH
# =========================================================

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    return jsonify({
        "status": "ok",
        "app": "GLOW AI STUDIO 2027",
        "accounts": "enabled",
        "music_engine": (
            "Pixazo Tracks"
            if PIXAZO_API_KEY
            else "missing_pixazo_api_key"
        )
    })


# =========================================================
# SIGN UP
# =========================================================

@app.route(
    "/api/auth/signup",
    methods=["POST"]
)
def signup():

    try:

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        username = str(
            data.get(
                "username",
                ""
            )
        ).strip()

        email = str(
            data.get(
                "email",
                ""
            )
        ).strip().lower()

        password = str(
            data.get(
                "password",
                ""
            )
        )

        if not username:

            return jsonify({
                "success": False,
                "error":
                    "Username is required."
            }), 400

        if len(username) < 3:

            return jsonify({
                "success": False,
                "error":
                    "Username must contain at least 3 characters."
            }), 400

        if len(username) > 30:

            return jsonify({
                "success": False,
                "error":
                    "Username cannot exceed 30 characters."
            }), 400

        if not email or "@" not in email:

            return jsonify({
                "success": False,
                "error":
                    "Please enter a valid email address."
            }), 400

        if len(password) < 8:

            return jsonify({
                "success": False,
                "error":
                    "Password must contain at least 8 characters."
            }), 400

        db = get_db()

        existing_username = db.execute(
            """
            SELECT id
            FROM users
            WHERE username = ?
            LIMIT 1
            """,
            (username,)
        ).fetchone()

        if existing_username:

            db.close()

            return jsonify({
                "success": False,
                "error":
                    "That username is already taken."
            }), 409

        existing_email = db.execute(
            """
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            """,
            (email,)
        ).fetchone()

        if existing_email:

            db.close()

            return jsonify({
                "success": False,
                "error":
                    "An account with that email already exists."
            }), 409

        password_hash = generate_password_hash(
            password
        )

        timestamp = iso_now()

        cursor = db.execute(
            """
            INSERT INTO users (
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
                password_hash,
                "free",
                FREE_CREDITS,
                "inactive",
                username,
                timestamp,
                timestamp
            )
        )

        user_id = cursor.lastrowid

        db.commit()
        db.close()

        session.clear()
        session["user_id"] = user_id
        session["username"] = username

        return jsonify({
            "success": True,
            "message":
                "GLOW account created successfully.",
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "plan": "free",
                "credits": FREE_CREDITS
            }
        }), 201

    except sqlite3.IntegrityError:

        return jsonify({
            "success": False,
            "error":
                "Username or email is already registered."
        }), 409

    except Exception as error:

        print(
            "SIGNUP ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "error":
                "Could not create your GLOW account."
        }), 500


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/api/auth/login",
    methods=["POST"]
)
def login():

    try:

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        login_value = str(
            data.get(
                "username",
                ""
            )
        ).strip()

        password = str(
            data.get(
                "password",
                ""
            )
        )

        if not login_value:

            return jsonify({
                "success": False,
                "error":
                    "Username or email is required."
            }), 400

        if not password:

            return jsonify({
                "success": False,
                "error":
                    "Password is required."
            }), 400

        db = get_db()

        user = db.execute(
            """
            SELECT *
            FROM users
            WHERE username = ?
               OR email = ?
            LIMIT 1
            """,
            (
                login_value,
                login_value.lower()
            )
        ).fetchone()

        db.close()

        if not user:

            return jsonify({
                "success": False,
                "error":
                    "Invalid username/email or password."
            }), 401

        if not check_password_hash(
            user["password_hash"],
            password
        ):

            return jsonify({
                "success": False,
                "error":
                    "Invalid username/email or password."
            }), 401

        session.clear()

        session["user_id"] = user["id"]
        session["username"] = user["username"]

        return jsonify({
            "success": True,
            "message":
                "Welcome back to GLOW.",
            "user":
                user_to_dict(user)
        })

    except Exception as error:

        print(
            "LOGIN ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "error":
                "Login failed."
        }), 500


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
        "success": True,
        "message":
            "You have been logged out."
    })


# =========================================================
# CURRENT USER
# =========================================================

@app.route(
    "/api/auth/me",
    methods=["GET"]
)
def current_user():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": True,
            "logged_in": False,
            "user": None
        })

    db = get_db()

    user = db.execute(
        """
        SELECT *
        FROM users
        WHERE id = ?
        LIMIT 1
        """,
        (user_id,)
    ).fetchone()

    db.close()

    if not user:

        session.clear()

        return jsonify({
            "success": True,
            "logged_in": False,
            "user": None
        })

    return jsonify({
        "success": True,
        "logged_in": True,
        "user":
            user_to_dict(user)
    })


# =========================================================
# PROFILE
# =========================================================

@app.route(
    "/api/profile",
    methods=["GET"]
)
def get_profile():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": False,
            "error":
                "Please log in first."
        }), 401

    db = get_db()

    user = db.execute(
        """
        SELECT *
        FROM users
        WHERE id = ?
        LIMIT 1
        """,
        (user_id,)
    ).fetchone()

    db.close()

    if not user:

        return jsonify({
            "success": False,
            "error":
                "User account was not found."
        }), 404

    return jsonify({
        "success": True,
        "user":
            user_to_dict(user)
    })


# =========================================================
# UPDATE PROFILE
# =========================================================

@app.route(
    "/api/profile",
    methods=["PUT"]
)
def update_profile():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": False,
            "error":
                "Please log in first."
        }), 401

    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    profile_name = str(
        data.get(
            "profile_name",
            ""
        )
    ).strip()

    profile_photo = str(
        data.get(
            "profile_photo",
            ""
        )
    ).strip()

    if not profile_name:

        return jsonify({
            "success": False,
            "error":
                "Profile name cannot be empty."
        }), 400

    if len(profile_name) > 60:

        return jsonify({
            "success": False,
            "error":
                "Profile name is too long."
        }), 400

    db = get_db()

    db.execute(
        """
        UPDATE users
        SET
            profile_name = ?,
            profile_photo = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            profile_name,
            profile_photo,
            iso_now(),
            user_id
        )
    )

    db.commit()

    user = db.execute(
        """
        SELECT *
        FROM users
        WHERE id = ?
        LIMIT 1
        """,
        (user_id,)
    ).fetchone()

    db.close()

    return jsonify({
        "success": True,
        "message":
            "Profile updated.",
        "user":
            user_to_dict(user)
    })


# =========================================================
# SUBSCRIPTION
# =========================================================

@app.route(
    "/api/subscription",
    methods=["GET"]
)
def subscription():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": False,
            "error":
                "Please log in first."
        }), 401

    db = get_db()

    user = db.execute(
        """
        SELECT
            plan,
            credits,
            subscription_status,
            subscription_expires_at
        FROM users
        WHERE id = ?
        LIMIT 1
        """,
        (user_id,)
    ).fetchone()

    db.close()

    if not user:

        return jsonify({
            "success": False,
            "error":
                "User not found."
        }), 404

    return jsonify({
        "success": True,
        "subscription": {
            "plan": user["plan"],
            "credits": user["credits"],
            "status":
                user["subscription_status"],
            "expires_at":
                user["subscription_expires_at"]
        }
    })


# =========================================================
# AVAILABLE PLANS
# =========================================================

@app.route(
    "/api/plans",
    methods=["GET"]
)
def plans():

    return jsonify({

        "success": True,

        "plans": [

            {
                "id": "free",
                "name": "GLOW Free",
                "billing": "free",
                "credits": FREE_CREDITS
            },

            {
                "id": "creator",
                "name": "GLOW Creator",
                "billing": "weekly",
                "credits":
                    CREATOR_WEEKLY_CREDITS
            },

            {
                "id": "pro",
                "name": "GLOW Pro",
                "billing": "weekly",
                "credits":
                    PRO_WEEKLY_CREDITS
            },

            {
                "id": "studio",
                "name": "GLOW Studio",
                "billing": "weekly",
                "credits":
                    STUDIO_WEEKLY_CREDITS
            }

        ]

    })


# =========================================================
# CREDIT SYSTEM
# =========================================================

def consume_credit(
    user_id,
    amount=1
):

    db = get_db()

    user = db.execute(
        """
        SELECT credits
        FROM users
        WHERE id = ?
        LIMIT 1
        """,
        (user_id,)
    ).fetchone()

    if not user:

        db.close()

        return False

    if user["credits"] < amount:

        db.close()

        return False

    db.execute(
        """
        UPDATE users
        SET
            credits = credits - ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            amount,
            iso_now(),
            user_id
        )
    )

    db.commit()
    db.close()

    return True


# =========================================================
# MUSIC GENERATION
# =========================================================

@app.route(
    "/api/music",
    methods=["POST"]
)
def generate_music():

    try:

        user_id = session.get("user_id")

        if not user_id:

            return jsonify({
                "success": False,
                "error":
                    "Please create a GLOW account or log in before generating music."
            }), 401

        if not PIXAZO_API_KEY:

            return jsonify({
                "success": False,
                "error":
                    "PIXAZO_API_KEY is missing on the server."
            }), 500

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        prompt = str(
            data.get(
                "prompt",
                ""
            )
        ).strip()

        lyrics = str(
            data.get(
                "lyrics",
                ""
            )
        ).strip()

        if not prompt and not lyrics:

            return jsonify({
                "success": False,
                "error":
                    "Please enter your song idea or lyrics."
            }), 400

        if not lyrics:

            lyrics = prompt

        length_ms = data.get(
            "music_length_ms",
            60000
        )

        try:

            length_ms = int(
                length_ms
            )

        except (
            TypeError,
            ValueError
        ):

            length_ms = 60000

        duration = int(
            length_ms / 1000
        )

        duration = max(
            10,
            min(
                duration,
                600
            )
        )

        music_prompt = str(
            data.get(
                "music_prompt",
                ""
            )
        ).strip()

        if not music_prompt:

            music_prompt = (
                "Professional Nigerian Afrobeats and "
                "Afropop production, energetic rhythm, "
                "African percussion, deep warm bass, "
                "melodic guitar and keyboard, catchy "
                "hook, expressive vocals, modern radio "
                "quality, polished professional studio "
                "sound."
            )

        # -------------------------------------------------
        # CHECK CREDITS
        # -------------------------------------------------

        db = get_db()

        user = db.execute(
            """
            SELECT
                credits,
                plan
            FROM users
            WHERE id = ?
            LIMIT 1
            """,
            (user_id,)
        ).fetchone()

        db.close()

        if not user:

            return jsonify({
                "success": False,
                "error":
                    "User account not found."
            }), 404

        if user["credits"] <= 0:

            return jsonify({
                "success": False,
                "error":
                    "You have no GLOW credits remaining. Choose a subscription plan to continue."
            }), 402

        # -------------------------------------------------
        # PIXAZO REQUEST
        # -------------------------------------------------

        headers = {
            "Content-Type":
                "application/json",

            "Cache-Control":
                "no-cache",

            "Ocp-Apim-Subscription-Key":
                PIXAZO_API_KEY
        }

        payload = {
            "prompt":
                music_prompt,

            "lyrics":
                lyrics,

            "instrumental":
                False,

            "duration":
                duration,

            "bpm":
                110,

            "time_signature":
                "4/4",

            "seed":
                -1
        }

        print(
            "======================================"
        )

        print(
            "GLOW MUSIC: sending request to Pixazo..."
        )

        print(
            "User ID:",
            user_id
        )

        print(
            "Duration:",
            duration,
            "seconds"
        )

        print(
            "Lyrics length:",
            len(lyrics)
        )

        print(
            "======================================"
        )

        response = requests.post(
            PIXAZO_GENERATE_URL,
            headers=headers,
            json=payload,
            timeout=60
        )

        try:

            result = response.json()

        except Exception:

            result = {
                "message":
                    response.text
            }

        print(
            "PIXAZO HTTP STATUS:",
            response.status_code
        )

        print(
            "PIXAZO RESPONSE:",
            result
        )

        if response.status_code not in (
            200,
            201,
            202
        ):

            error_message = (
                result.get("message")
                or result.get("error")
                or result.get("detail")
                or result.get("description")
                or response.text
                or (
                    "Pixazo music request failed "
                    f"with HTTP {response.status_code}."
                )
            )

            return jsonify({
                "success": False,
                "error":
                    str(error_message),
                "pixazo_status":
                    response.status_code,
                "details":
                    result
            }), response.status_code

        request_id = result.get(
            "request_id"
        )

        if not request_id:

            return jsonify({
                "success": False,
                "error":
                    "Pixazo accepted the request but did not return a request ID.",
                "details":
                    result
            }), 502

        print(
            "GLOW MUSIC REQUEST ID:",
            request_id
        )

        # -------------------------------------------------
        # CONSUME ONE CREDIT
        # -------------------------------------------------

        if not consume_credit(
            user_id,
            1
        ):

            return jsonify({
                "success": False,
                "error":
                    "Unable to reserve a GLOW credit."
            }), 402

        # -------------------------------------------------
        # SAVE CREATION
        # -------------------------------------------------

        db = get_db()

        db.execute(
            """
            INSERT INTO creations (
                user_id,
                creation_type,
                prompt,
                status,
                request_id,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                "music",
                prompt,
                "processing",
                request_id,
                iso_now()
            )
        )

        db.commit()
        db.close()

        return jsonify({
            "success": True,
            "status":
                result.get(
                    "status",
                    "QUEUED"
                ),
            "request_id":
                request_id
        })

    except requests.RequestException as error:

        print(
            "PIXAZO CONNECTION ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "error":
                "Could not connect to Pixazo.",
            "details":
                str(error)
        }), 502

    except Exception as error:

        print(
            "GLOW MUSIC ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "error":
                str(error)
        }), 500


# =========================================================
# MUSIC STATUS
# =========================================================

@app.route(
    "/api/music/status/<request_id>",
    methods=["GET"]
)
def music_status(request_id):

    try:

        user_id = session.get("user_id")

        if not user_id:

            return jsonify({
                "success": False,
                "error":
                    "Please log in first."
            }), 401

        if not PIXAZO_API_KEY:

            return jsonify({
                "success": False,
                "error":
                    "PIXAZO_API_KEY is missing."
            }), 500

        headers = {
            "Ocp-Apim-Subscription-Key":
                PIXAZO_API_KEY
        }

        url = (
            PIXAZO_STATUS_URL
            + request_id
        )

        response = requests.get(
            url,
            headers=headers,
            timeout=30
        )

        try:

            data = response.json()

        except Exception:

            data = {
                "error":
                    response.text
            }

        print(
            "PIXAZO STATUS:",
            data
        )

        if response.status_code != 200:

            return jsonify({
                "success": False,
                "error":
                    "Could not check Pixazo job status.",
                "details":
                    data
            }), response.status_code

        status = str(
            data.get(
                "status",
                ""
            )
        ).upper()

        # -------------------------------------------------
        # COMPLETED
        # -------------------------------------------------

        if status == "COMPLETED":

            output = (
                data.get(
                    "output"
                )
                or {}
            )

            media_urls = (
                output.get(
                    "media_url"
                )
                or []
            )

            if isinstance(
                media_urls,
                str
            ):

                media_urls = [
                    media_urls
                ]

            if not media_urls:

                return jsonify({
                    "success": False,
                    "status":
                        "ERROR",
                    "error":
                        "Pixazo completed the job but returned no audio URL.",
                    "details":
                        data
                }), 502

            audio_url = media_urls[0]

            db = get_db()

            db.execute(
                """
                UPDATE creations
                SET
                    status = ?,
                    media_url = ?
                WHERE
                    user_id = ?
                    AND request_id = ?
                """,
                (
                    "completed",
                    audio_url,
                    user_id,
                    request_id
                )
            )

            db.commit()
            db.close()

            return jsonify({
                "success": True,
                "status":
                    "COMPLETED",
                "audio":
                    audio_url,
                "format":
                    output.get(
                        "media_type",
                        "audio/mpeg"
                    )
            })

        # -------------------------------------------------
        # FAILED
        # -------------------------------------------------

        if status in (
            "FAILED",
            "ERROR"
        ):

            error_message = (
                data.get("error")
                or data.get("message")
                or data.get("detail")
                or data.get("description")
                or "Pixazo music generation failed."
            )

            db = get_db()

            db.execute(
                """
                UPDATE creations
                SET status = ?
                WHERE
                    user_id = ?
                    AND request_id = ?
                """,
                (
                    "failed",
                    user_id,
                    request_id
                )
            )

            db.commit()
            db.close()

            return jsonify({
                "success": False,
                "status":
                    status,
                "error":
                    str(error_message),
                "details":
                    data
            }), 500

        # -------------------------------------------------
        # PROCESSING
        # -------------------------------------------------

        return jsonify({
            "success": True,
            "status":
                status or "PROCESSING",
            "request_id":
                request_id
        })

    except requests.RequestException as error:

        return jsonify({
            "success": False,
            "error":
                "Could not connect to Pixazo status service.",
            "details":
                str(error)
        }), 502

    except Exception as error:

        print(
            "MUSIC STATUS ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "error":
                str(error)
        }), 500


# =========================================================
# MY CREATIONS
# =========================================================

@app.route(
    "/api/creations",
    methods=["GET"]
)
def my_creations():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": False,
            "error":
                "Please log in first."
        }), 401

    db = get_db()

    rows = db.execute(
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
        LIMIT 100
        """,
        (user_id,)
    ).fetchall()

    db.close()

    creations = []

    for row in rows:

        creations.append({
            "id":
                row["id"],

            "type":
                row["creation_type"],

            "prompt":
                row["prompt"],

            "status":
                row["status"],

            "media_url":
                row["media_url"],

            "request_id":
                row["request_id"],

            "created_at":
                row["created_at"]
        })

    return jsonify({
        "success": True,
        "creations":
            creations
    })


# =========================================================
# SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=int(
            os.getenv(
                "PORT",
                5000
            )
        ),
        debug=False
)
