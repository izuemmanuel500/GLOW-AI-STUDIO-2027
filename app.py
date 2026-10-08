import os
import sqlite3
import json
from datetime import datetime, timezone
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

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
# COMPLETE FLASK BACKEND
#
# IMPORTANT:
# - Supabase stores permanent user accounts.
# - SQLite remains as a compatibility/shadow database for
#   existing dashboard, usage and creation functionality.
# - FAL AI generation system is preserved.
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

SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    ""
).strip().rstrip("/")

SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    ""
).strip()


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

        # TESTING LIMITS
        "images": 5,
        "music": 2,
        "videos": 1,

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
# SUPABASE REST HELPERS
# ============================================================

def supabase_configured():

    return bool(
        SUPABASE_URL
        and SUPABASE_SERVICE_ROLE_KEY
    )


def supabase_headers():

    if not supabase_configured():
        raise RuntimeError(
            "Supabase is not configured. "
            "Add SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY "
            "to Render Environment Variables."
        )

    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization":
            f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


def supabase_request(
    method,
    path,
    payload=None,
    params=None
):

    if not supabase_configured():

        raise RuntimeError(
            "Supabase is not configured. "
            "Please add SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY."
        )

    url = (
        f"{SUPABASE_URL}/rest/v1/{path}"
    )

    if params:

        query_parts = []

        for key, value in params.items():

            query_parts.append(
                f"{quote(str(key), safe='')}="
                f"{quote(str(value), safe='')}"
            )

        if query_parts:

            url += "?" + "&".join(
                query_parts
            )

    body = None

    if payload is not None:

        body = json.dumps(
            payload
        ).encode("utf-8")

    headers = supabase_headers()

    headers["Prefer"] = (
        "return=representation"
    )

    req = Request(
        url,
        data=body,
        headers=headers,
        method=method.upper()
    )

    try:

        with urlopen(
            req,
            timeout=20
        ) as response:

            raw = response.read()

            if not raw:
                return []

            return json.loads(
                raw.decode("utf-8")
            )

    except HTTPError as exc:

        try:
            raw_error = exc.read().decode(
                "utf-8",
                errors="replace"
            )
        except Exception:
            raw_error = ""

        raise RuntimeError(
            f"Supabase request failed "
            f"({exc.code}): {raw_error}"
        )

    except URLError as exc:

        raise RuntimeError(
            "Unable to connect to Supabase: "
            f"{exc.reason}"
        )

    except json.JSONDecodeError:

        raise RuntimeError(
            "Supabase returned an invalid response."
        )


def supabase_find_user(
    username=None,
    email=None
):

    if username:

        result = supabase_request(
            "GET",
            "users",
            params={
                "username": f"eq.{username}",
                "select": "*",
                "limit": "1"
            }
        )

        if result:
            return result[0]

    if email:

        result = supabase_request(
            "GET",
            "users",
            params={
                "email": f"eq.{email.lower()}",
                "select": "*",
                "limit": "1"
            }
        )

        if result:
            return result[0]

    return None


def supabase_find_by_identifier(
    identifier
):

    identifier = str(
        identifier or ""
    ).strip()

    if not identifier:
        return None

    # Try username first.
    result = supabase_find_user(
        username=identifier
    )

    if result:
        return result

    # Then email.
    result = supabase_find_user(
        email=identifier.lower()
    )

    return result


def supabase_create_user(
    username,
    email,
    password_hash
):

    payload = {
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "plan": "free",
    }

    result = supabase_request(
        "POST",
        "users",
        payload=payload
    )

    if not result:

        raise RuntimeError(
            "Supabase did not return the new user."
        )

    return result[0]


# ============================================================
# SQLITE DATABASE
# ============================================================

def get_db():

    conn = sqlite3.connect(
        DATABASE
    )

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
            supabase_id TEXT,
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
            "ALTER TABLE users ADD COLUMN "
            "credits INTEGER NOT NULL DEFAULT 0",

        "image_used":
            "ALTER TABLE users ADD COLUMN "
            "image_used INTEGER NOT NULL DEFAULT 0",

        "music_used":
            "ALTER TABLE users ADD COLUMN "
            "music_used INTEGER NOT NULL DEFAULT 0",

        "video_used":
            "ALTER TABLE users ADD COLUMN "
            "video_used INTEGER NOT NULL DEFAULT 0",

        "subscription_status":
            "ALTER TABLE users ADD COLUMN "
            "subscription_status TEXT NOT NULL "
            "DEFAULT 'active'",

        "subscription_expires_at":
            "ALTER TABLE users ADD COLUMN "
            "subscription_expires_at TEXT",

        "profile_name":
            "ALTER TABLE users ADD COLUMN "
            "profile_name TEXT",

        "profile_photo":
            "ALTER TABLE users ADD COLUMN "
            "profile_photo TEXT",

        "supabase_id":
            "ALTER TABLE users ADD COLUMN "
            "supabase_id TEXT",

        "created_at":
            "ALTER TABLE users ADD COLUMN "
            "created_at TEXT",

        "updated_at":
            "ALTER TABLE users ADD COLUMN "
            "updated_at TEXT",
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
# GENERAL HELPERS
# ============================================================

def now_iso():

    return datetime.now(
        timezone.utc
    ).isoformat()


def ensure_local_shadow_user(
    supabase_user
):

    """
    Creates or updates a local SQLite shadow user.

    This keeps the existing dashboard, usage,
    creation history and FAL system working while
    Supabase becomes the permanent authentication store.
    """

    if not supabase_user:
        return None

    supabase_id = str(
        supabase_user.get("id", "")
    )

    username = str(
        supabase_user.get(
            "username",
            ""
        )
    )

    email = str(
        supabase_user.get(
            "email",
            ""
        )
    ).lower()

    password_hash = str(
        supabase_user.get(
            "password_hash",
            ""
        )
    )

    plan = str(
        supabase_user.get(
            "plan",
            "free"
        )
        or "free"
    )

    created_at = (
        supabase_user.get(
            "created_at"
        )
        or now_iso()
    )

    conn = get_db()

    local_user = None

    # --------------------------------------------------------
    # Find by Supabase UUID
    # --------------------------------------------------------

    if supabase_id:

        local_user = conn.execute(
            """
            SELECT *
            FROM users
            WHERE supabase_id = ?
            LIMIT 1
            """,
            (
                supabase_id,
            )
        ).fetchone()

    # --------------------------------------------------------
    # If not found, find by username/email.
    # This helps preserve older SQLite users.
    # --------------------------------------------------------

    if not local_user:

        local_user = conn.execute(
            """
            SELECT *
            FROM users
            WHERE username = ?
            OR email = ?
            LIMIT 1
            """,
            (
                username,
                email
            )
        ).fetchone()

    # --------------------------------------------------------
    # Existing local user
    # --------------------------------------------------------

    if local_user:

        conn.execute(
            """
            UPDATE users
            SET username = ?,
                email = ?,
                password_hash = ?,
                plan = ?,
                supabase_id = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                username,
                email,
                password_hash,
                plan,
                supabase_id,
                now_iso(),
                local_user["id"]
            )
        )

        conn.commit()

        updated = conn.execute(
            """
            SELECT *
            FROM users
            WHERE id = ?
            """,
            (
                local_user["id"],
            )
        ).fetchone()

        conn.close()

        return updated

    # --------------------------------------------------------
    # New local shadow user
    # --------------------------------------------------------

    timestamp = now_iso()

    try:

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
                supabase_id,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                username,
                email,
                password_hash,
                plan,
                0,
                "active",
                username,
                supabase_id,
                created_at,
                timestamp
            )
        )

        local_id = cursor.lastrowid

        conn.commit()

        local_user = conn.execute(
            """
            SELECT *
            FROM users
            WHERE id = ?
            """,
            (
                local_id,
            )
        ).fetchone()

        conn.close()

        return local_user

    except sqlite3.IntegrityError:

        # Handle an old local account with the same
        # username/email that appeared between checks.

        existing = conn.execute(
            """
            SELECT *
            FROM users
            WHERE username = ?
            OR email = ?
            LIMIT 1
            """,
            (
                username,
                email
            )
        ).fetchone()

        if existing:

            conn.execute(
                """
                UPDATE users
                SET password_hash = ?,
                    plan = ?,
                    supabase_id = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    password_hash,
                    plan,
                    supabase_id,
                    now_iso(),
                    existing["id"]
                )
            )

            conn.commit()

            updated = conn.execute(
                """
                SELECT *
                FROM users
                WHERE id = ?
                """,
                (
                    existing["id"],
                )
            ).fetchone()

            conn.close()

            return updated

        conn.close()

        raise


def current_user():

    local_user_id = session.get(
        "local_user_id"
    )

    supabase_id = session.get(
        "supabase_id"
    )

    # --------------------------------------------------------
    # First try the existing local shadow user.
    # --------------------------------------------------------

    if local_user_id:

        conn = get_db()

        user = conn.execute(
            """
            SELECT *
            FROM users
            WHERE id = ?
            """,
            (
                local_user_id,
            )
        ).fetchone()

        conn.close()

        if user:
            return user

    # --------------------------------------------------------
    # If Render restarted and SQLite disappeared,
    # rebuild the local shadow from Supabase.
    # --------------------------------------------------------

    if supabase_id and supabase_configured():

        try:

            result = supabase_request(
                "GET",
                "users",
                params={
                    "id":
                        f"eq.{supabase_id}",
                    "select": "*",
                    "limit": "1"
                }
            )

            if result:

                user = ensure_local_shadow_user(
                    result[0]
                )

                if user:

                    session["local_user_id"] = (
                        user["id"]
                    )

                    return user

        except Exception:

            return None

    return None


def require_user():

    user = current_user()

    if not user:

        return (
            None,
            jsonify({
                "ok": False,
                "error":
                    "Authentication required."
            }),
            401
        )

    return user, None, None


def user_data(user):

    return {

        "id":
            user["id"],

        "username":
            user["username"],

        "email":
            user["email"],

        "plan":
            user["plan"],

        "profile_name":
            user["profile_name"],

        "profile_photo":
            user["profile_photo"],

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

        "plan":
            plan_name,

        "image": {

            "used":
                image_used,

            "limit":
                plan["images"],

            "remaining":
                max(
                    0,
                    plan["images"] -
                    image_used
                ),
        },

        "music": {

            "used":
                music_used,

            "limit":
                plan["music"],

            "remaining":
                max(
                    0,
                    plan["music"] -
                    music_used
                ),
        },

        "video": {

            "used":
                video_used,

            "limit":
                plan["videos"],

            "remaining":
                max(
                    0,
                    plan["videos"] -
                    video_used
                ),
        },
    }


def can_generate(
    user,
    generation_type
):

    plan = PLANS.get(
        user["plan"],
        PLANS["free"]
    )

    if generation_type == "image":

        limit = plan["images"]

        used = (
            user["image_used"]
            or 0
        )

    elif generation_type == "music":

        limit = plan["music"]

        used = (
            user["music_used"]
            or 0
        )

    elif generation_type == "video":

        limit = plan["videos"]

        used = (
            user["video_used"]
            or 0
        )

    else:

        return (
            False,
            "Invalid generation type."
        )

    if used >= limit:

        return (
            False,
            f"{generation_type.title()} "
            "generation limit reached "
            "for your current plan."
        )

    return True, None


def consume_usage(
    user_id,
    generation_type
):

    column_map = {

        "image":
            "image_used",

        "music":
            "music_used",

        "video":
            "video_used",
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


# ============================================================
# CREATION DATABASE HELPERS
# ============================================================

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

    if (
        status is not None
        and media_url is not None
    ):

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

def submit_fal(
    model,
    arguments
):

    if not FAL_KEY:

        raise RuntimeError(
            "FAL_KEY is not configured "
            "in Render Environment Variables."
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

    if isinstance(
        handler,
        dict
    ):

        return (
            handler.get(
                "request_id"
            )
            or handler.get(
                "requestId"
            )
        )

    return None


def extract_media_url(result):

    if not result:
        return None

    if not isinstance(
        result,
        dict
    ):
        return None

    if isinstance(
        result.get("url"),
        str
    ):

        return result["url"]

    for key in [
        "audio",
        "video",
        "image",
        "file",
        "output"
    ]:

        value = result.get(
            key
        )

        if isinstance(
            value,
            dict
        ):

            url = value.get(
                "url"
            )

            if isinstance(
                url,
                str
            ):

                return url

        elif isinstance(
            value,
            str
        ):

            return value

    images = result.get(
        "images"
    )

    if (
        isinstance(images, list)
        and images
    ):

        first = images[0]

        if isinstance(
            first,
            dict
        ):

            url = first.get(
                "url"
            )

            if isinstance(
                url,
                str
            ):

                return url

    videos = result.get(
        "videos"
    )

    if (
        isinstance(videos, list)
        and videos
    ):

        first = videos[0]

        if isinstance(
            first,
            dict
        ):

            url = first.get(
                "url"
            )

            if isinstance(
                url,
                str
            ):

                return url

    audio_files = result.get(
        "audio_files"
    )

    if (
        isinstance(audio_files, list)
        and audio_files
    ):

        first = audio_files[0]

        if isinstance(
            first,
            dict
        ):

            url = first.get(
                "url"
            )

            if isinstance(
                url,
                str
            ):

                return url

    return None


# ============================================================
# FAL RESULT HANDLING
# ============================================================

def get_fal_result(
    request_id
):

    if not FAL_KEY:

        raise RuntimeError(
            "FAL_KEY is not configured."
        )

    return fal_client.result(
        request_id
    )


# ============================================================
# FRONTEND PAGES
# ============================================================

@app.route("/")
def home():

    return send_from_directory(
        ".",
        "index.html"
    )


@app.route("/login")
@app.route("/login.html")
def login_page():

    return send_from_directory(
        ".",
        "login.html"
    )


@app.route("/signup")
@app.route("/signup.html")
def signup_page():

    return send_from_directory(
        ".",
        "signup.html"
    )


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

    return redirect(
        "/dashboard.html"
    )


# ============================================================
# IMPORTANT STATIC FILE ROUTE
# ============================================================

@app.route(
    "/<path:filename>",
    methods=["GET"]
)
def frontend_static_files(
    filename
):

    if filename.startswith(
        "api/"
    ):

        return jsonify({

            "ok": False,

            "error":
                "API endpoint not found."
        }), 404

    allowed_extensions = (

        ".css",
        ".js",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".svg",
        ".webp",
        ".ico",
        ".mp3",
        ".wav",
        ".ogg",
        ".mp4",
        ".webm",
        ".json",
        ".woff",
        ".woff2",
        ".ttf",
        ".txt"
    )

    if not filename.lower().endswith(
        allowed_extensions
    ):

        return jsonify({

            "ok": False,

            "error":
                "File not found."
        }), 404

    return send_from_directory(
        ".",
        filename
    )


# ============================================================
# HEALTH
# ============================================================

@app.route("/api/health")
def health():

    return jsonify({

        "ok": True,

        "status": "ok",

        "fal_configured":
            bool(FAL_KEY),

        "supabase_configured":
            supabase_configured(),

        "models": {

            "image":
                IMAGE_MODEL,

            "image_edit":
                IMAGE_EDIT_MODEL,

            "music":
                MUSIC_MODEL,

            "video":
                VIDEO_MODEL,
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

    if (
        not username
        or not email
        or not password
    ):

        return jsonify({

            "ok": False,

            "error":
                "Username, email and password "
                "are required."
        }), 400

    if len(username) < 3:

        return jsonify({

            "ok": False,

            "error":
                "Username must contain at least "
                "3 characters."
        }), 400

    if len(password) < 6:

        return jsonify({

            "ok": False,

            "error":
                "Password must contain at least "
                "6 characters."
        }), 400

    # --------------------------------------------------------
    # Supabase is now the permanent user database.
    # --------------------------------------------------------

    if not supabase_configured():

        return jsonify({

            "ok": False,

            "error":
                "Supabase is not configured on the server. "
                "Please add SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY "
                "to Render Environment Variables."
        }), 503

    try:

        existing = supabase_find_user(
            username=username
        )

        if existing:

            return jsonify({

                "ok": False,

                "error":
                    "Username already exists."
            }), 409

        existing = supabase_find_user(
            email=email
        )

        if existing:

            return jsonify({

                "ok": False,

                "error":
                    "Email already exists."
            }), 409

        password_hash = (
            generate_password_hash(
                password
            )
        )

        supabase_user = (
            supabase_create_user(
                username,
                email,
                password_hash
            )
        )

        local_user = (
            ensure_local_shadow_user(
                supabase_user
            )
        )

        if not local_user:

            return jsonify({

                "ok": False,

                "error":
                    "Account was created in Supabase "
                    "but the local application profile "
                    "could not be initialized."
            }), 500

        session.clear()

        session["local_user_id"] = (
            local_user["id"]
        )

        session["supabase_id"] = (
            str(
                supabase_user["id"]
            )
        )

        return jsonify({

            "ok": True,

            "message":
                "Account created successfully.",

            "user": user_data(
                local_user
            )
        })

    except Exception as exc:

        error_text = str(
            exc
        )

        # Keep errors JSON so the frontend
        # never receives an empty response.

        return jsonify({

            "ok": False,

            "error":
                error_text
        }), 500


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
        data.get(
            "password",
            ""
        )
    )

    if (
        not identifier
        or not password
    ):

        return jsonify({

            "ok": False,

            "error":
                "Username/email and password "
                "are required."
        }), 400

    if not supabase_configured():

        return jsonify({

            "ok": False,

            "error":
                "Supabase is not configured on the server. "
                "Please add SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY "
                "to Render Environment Variables."
        }), 503

    try:

        supabase_user = (
            supabase_find_by_identifier(
                identifier
            )
        )

        if not supabase_user:

            return jsonify({

                "ok": False,

                "error":
                    "Invalid username/email "
                    "or password."
            }), 401

        stored_hash = str(
            supabase_user.get(
                "password_hash",
                ""
            )
        )

        if not stored_hash:

            return jsonify({

                "ok": False,

                "error":
                    "This account does not have "
                    "a valid password record."
            }), 401

        if not check_password_hash(
            stored_hash,
            password
        ):

            return jsonify({

                "ok": False,

                "error":
                    "Invalid username/email "
                    "or password."
            }), 401

        local_user = (
            ensure_local_shadow_user(
                supabase_user
            )
        )

        if not local_user:

            return jsonify({

                "ok": False,

                "error":
                    "Login succeeded but the "
                    "application profile could "
                    "not be initialized."
            }), 500

        session.clear()

        session["local_user_id"] = (
            local_user["id"]
        )

        session["supabase_id"] = (
            str(
                supabase_user["id"]
            )
        )

        return jsonify({

            "ok": True,

            "message":
                "Login successful.",

            "user":
                user_data(
                    local_user
                )
        })

    except Exception as exc:

        return jsonify({

            "ok": False,

            "error":
                str(exc)
        }), 500


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

        "message":
            "Logged out successfully."
    })


# ============================================================
# AUTH — CURRENT USER
# ============================================================

@app.route(
    "/api/auth/me"
)
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

        "user":
            user_data(user),

        "usage":
            usage_data(user)
    })


# ============================================================
# PROFILE
# ============================================================

@app.route(
    "/api/profile",
    methods=["POST"]
)
def update_profile():

    user, error_response, error_status = (
        require_user()
    )

    if error_response:

        return (
            error_response,
            error_status
        )

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

        profile_name = (
            user["profile_name"]
        )

    if profile_photo is None:

        profile_photo = (
            user["profile_photo"]
        )

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

        "user":
            user_data(
                updated_user
            )
    })


# ============================================================
# PLANS
# ============================================================

@app.route(
    "/api/plans"
)
def api_plans():

    return jsonify({

        "ok": True,

        "plans":
            PLANS
    })


# ============================================================
# USAGE
# ============================================================

@app.route(
    "/api/usage"
)
def api_usage():

    user, error_response, error_status = (
        require_user()
    )

    if error_response:

        return (
            error_response,
            error_status
        )

    return jsonify({

        "ok": True,

        "usage":
            usage_data(user)
    })


# ============================================================
# SUBSCRIPTION
# ============================================================

@app.route(
    "/api/subscription",
    methods=["GET"]
)
def api_subscription():

    user, error_response, error_status = (
        require_user()
    )

    if error_response:

        return (
            error_response,
            error_status
        )

    return jsonify({

        "ok": True,

        "subscription": {

            "plan":
                user["plan"],

            "status":
                user["subscription_status"],

            "expires_at":
                user[
                    "subscription_expires_at"
                ]
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

    user, error_response, error_status = (
        require_user()
    )

    if error_response:

        return (
            error_response,
            error_status
        )

    allowed, message = can_generate(
        user,
        "music"
    )

    if not allowed:

        return jsonify({

            "ok": False,

            "error":
                message
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    prompt = str(
        data.get(
            "prompt",
            ""
        )
    ).strip()

    genre = str(
        data.get(
            "genre",
            ""
        )
    ).strip()

    mood = str(
        data.get(
            "mood",
            ""
        )
    ).strip()

    duration = data.get(
        "duration",
        30
    )

    if not prompt:

        return jsonify({

            "ok": False,

            "error":
                "Music prompt is required."
        }), 400

    try:

        duration = int(
            duration
        )

    except (
        TypeError,
        ValueError
    ):

        duration = 30

    duration = max(
        5,
        min(
            duration,
            300
        )
    )

    full_prompt = prompt

    if genre:

        full_prompt += (
            f", genre: {genre}"
        )

    if mood:

        full_prompt += (
            f", mood: {mood}"
        )

    arguments = {

        "prompt":
            full_prompt,

        "duration":
            duration
    }

    try:

        handler = submit_fal(
            MUSIC_MODEL,
            arguments
        )

        request_id = get_request_id(
            handler
        )

        if not request_id:

            return jsonify({

                "ok": False,

                "error":
                    "Music request ID "
                    "was not returned."
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

            "status":
                "submitted",

            "request_id":
                request_id,

            "creation_id":
                creation_id,

            "creation_type":
                "music",

            "message":
                "Music generation started."
        })

    except Exception as exc:

        return jsonify({

            "ok": False,

            "error":
                str(exc)
        }), 500


# ============================================================
# AI IMAGE
# ============================================================

@app.route(
    "/api/image",
    methods=["POST"]
)
def api_image():

    user, error_response, error_status = (
        require_user()
    )

    if error_response:

        return (
            error_response,
            error_status
        )

    allowed, message = can_generate(
        user,
        "image"
    )

    if not allowed:

        return jsonify({

            "ok": False,

            "error":
                message
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    prompt = str(
        data.get(
            "prompt",
            ""
        )
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

            "error":
                "Image prompt is required."
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

        "prompt":
            prompt,

        "image_size":
            image_size
    }

    try:

        handler = submit_fal(
            IMAGE_MODEL,
            arguments
        )

        request_id = get_request_id(
            handler
        )

        if not request_id:

            return jsonify({

                "ok": False,

                "error":
                    "Image request ID "
                    "was not returned."
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

            "status":
                "submitted",

            "request_id":
                request_id,

            "creation_id":
                creation_id,

            "creation_type":
                "image",

            "message":
                "Image generation started."
        })

    except Exception as exc:

        return jsonify({

            "ok": False,

            "error":
                str(exc)
        }), 500


# ============================================================
# AI IMAGE EDIT
# ============================================================

@app.route(
    "/api/image/edit",
    methods=["POST"]
)
def api_image_edit():

    user, error_response, error_status = (
        require_user()
    )

    if error_response:

        return (
            error_response,
            error_status
        )

    allowed, message = can_generate(
        user,
        "image"
    )

    if not allowed:

        return jsonify({

            "ok": False,

            "error":
                message
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    prompt = str(
        data.get(
            "prompt",
            ""
        )
    ).strip()

    image_url = str(
        data.get(
            "image_url"
        )
        or data.get(
            "imageUrl"
        )
        or ""
    ).strip()

    if not prompt:

        return jsonify({

            "ok": False,

            "error":
                "Edit prompt is required."
        }), 400

    if not image_url:

        return jsonify({

            "ok": False,

            "error":
                "Image URL is required."
        }), 400

    arguments = {

        "prompt":
            prompt,

        "image_url":
            image_url
    }

    try:

        handler = submit_fal(
            IMAGE_EDIT_MODEL,
            arguments
        )

        request_id = get_request_id(
            handler
        )

        if not request_id:

            return jsonify({

                "ok": False,

                "error":
                    "Image edit request ID "
                    "was not returned."
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

            "status":
                "submitted",

            "request_id":
                request_id,

            "creation_id":
                creation_id,

            "creation_type":
                "image",

            "message":
                "Image editing started."
        })

    except Exception as exc:

        return jsonify({

            "ok": False,

            "error":
                str(exc)
        }), 500


# ============================================================
# AI VIDEO
# ============================================================

@app.route(
    "/api/video",
    methods=["POST"]
)
def api_video():

    user, error_response, error_status = (
        require_user()
    )

    if error_response:

        return (
            error_response,
            error_status
        )

    allowed, message = can_generate(
        user,
        "video"
    )

    if not allowed:

        return jsonify({

            "ok": False,

            "error":
                message
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    prompt = str(
        data.get(
            "prompt",
            ""
        )
    ).strip()

    if not prompt:

        return jsonify({

            "ok": False,

            "error":
                "Video prompt is required."
        }), 400

    arguments = {

        "prompt":
            prompt
    }

    for key in [

        "aspect_ratio",

        "duration",

        "resolution",

        "negative_prompt"

    ]:

        if data.get(key) not in (
            None,
            ""
        ):

            arguments[key] = data.get(
                key
            )

    try:

        handler = submit_fal(
            VIDEO_MODEL,
            arguments
        )

        request_id = get_request_id(
            handler
        )

        if not request_id:

            return jsonify({

                "ok": False,

                "error":
                    "Video request ID "
                    "was not returned."
            }), 502

        creation_id = save_creation(
            user["id"],
            "video",
            prompt,
            "submitted",
            None,
            request_id
        )

        consume_usage(
            user["id"],
            "video"
        )

        return jsonify({

            "ok": True,

            "status":
                "submitted",

            "request_id":
                request_id,

            "creation_id":
                creation_id,

            "creation_type":
                "video",

            "message":
                "Video generation started."
        })

    except Exception as exc:

        return jsonify({

            "ok": False,

            "error":
                str(exc)
        }), 500


# ============================================================
# GENERATION STATUS
# ============================================================

@app.route(
    "/api/generation/status/<request_id>",
    methods=["GET"]
)
def generation_status(
    request_id
):

    user, error_response, error_status = (
        require_user()
    )

    if error_response:

        return (
            error_response,
            error_status
        )

    creation = get_creation_by_request(
        user["id"],
        request_id
    )

    if not creation:

        return jsonify({

            "ok": False,

            "error":
                "Generation request not found."
        }), 404

    try:

        result = get_fal_result(
            request_id
        )

        media_url = extract_media_url(
            result
        )

        status = "completed"

        if media_url:

            update_creation(
                creation["id"],
                status,
                media_url
            )

        else:

            update_creation(
                creation["id"],
                status
            )

        return jsonify({

            "ok": True,

            "status":
                status,

            "request_id":
                request_id,

            "creation_id":
                creation["id"],

            "creation_type":
                creation[
                    "creation_type"
                ],

            "media_url":
                media_url,

            "result":
                result
        })

    except Exception as exc:

        error_text = str(
            exc
        ).lower()

        if any(
            word in error_text
            for word in [
                "pending",
                "processing",
                "queue",
                "not ready",
                "in progress"
            ]
        ):

            return jsonify({

                "ok": True,

                "status":
                    "processing",

                "request_id":
                    request_id,

                "creation_id":
                    creation["id"],

                "creation_type":
                    creation[
                        "creation_type"
                    ],

                "media_url":
                    creation[
                        "media_url"
                    ]
            })

        update_creation(
            creation["id"],
            "failed"
        )

        return jsonify({

            "ok": False,

            "status":
                "failed",

            "request_id":
                request_id,

            "error":
                str(exc)
        }), 500


# ============================================================
# CREATIONS / HISTORY
# ============================================================

@app.route(
    "/api/creations",
    methods=["GET"]
)
def api_creations():

    user, error_response, error_status = (
        require_user()
    )

    if error_response:

        return (
            error_response,
            error_status
        )

    conn = get_db()

    rows = conn.execute(
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
        (
            user["id"],
        )
    ).fetchall()

    conn.close()

    creations = []

    for row in rows:

        creations.append({

            "id":
                row["id"],

            "creation_type":
                row["creation_type"],

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

        "ok": True,

        "creations":
            creations
    })


# ============================================================
# DELETE CREATION
# ============================================================

@app.route(
    "/api/creations/<int:creation_id>",
    methods=["DELETE"]
)
def delete_creation(
    creation_id
):

    user, error_response, error_status = (
        require_user()
    )

    if error_response:

        return (
            error_response,
            error_status
        )

    conn = get_db()

    row = conn.execute(
        """
        SELECT id
        FROM creations
        WHERE id = ?
        AND user_id = ?
        """,
        (
            creation_id,
            user["id"]
        )
    ).fetchone()

    if not row:

        conn.close()

        return jsonify({

            "ok": False,

            "error":
                "Creation not found."
        }), 404

    conn.execute(
        """
        DELETE FROM creations
        WHERE id = ?
        AND user_id = ?
        """,
        (
            creation_id,
            user["id"]
        )
    )

    conn.commit()

    conn.close()

    return jsonify({

        "ok": True,

        "message":
            "Creation deleted successfully."
    })


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({

        "ok": False,

        "error":
            "The requested page or endpoint "
            "was not found."
    }), 404


@app.errorhandler(413)
def file_too_large(error):

    return jsonify({

        "ok": False,

        "error":
            "The uploaded file is too large."
    }), 413


@app.errorhandler(500)
def internal_error(error):

    return jsonify({

        "ok": False,

        "error":
            "Internal server error."
    }), 500


# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

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
