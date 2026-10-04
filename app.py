import os
import time
import requests

from flask import (
    Flask,
    request,
    jsonify,
    send_from_directory
)

from flask_cors import CORS


# =========================================================
# GLOW AI STUDIO 2027
# PIXAZO MUSIC ENGINE
# =========================================================

app = Flask(__name__)
CORS(app)


PIXAZO_API_KEY = os.getenv("PIXAZO_API_KEY")


PIXAZO_GENERATE_URL = (
    "https://gateway.pixazo.ai/tracks/v1/generate"
)

PIXAZO_STATUS_URL = (
    "https://gateway.pixazo.ai/v2/requests/status/"
)


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
# HEALTH CHECK
# =========================================================

@app.route("/api/health")
def health():

    return jsonify({

        "status": "ok",

        "app": "GLOW AI STUDIO 2027",

        "music_engine": (
            "Pixazo Tracks"
            if PIXAZO_API_KEY
            else "missing_pixazo_api_key"
        )

    })


# =========================================================
# MUSIC GENERATION
# =========================================================

@app.route(
    "/api/music",
    methods=["POST"]
)
def generate_music():

    try:

        # -------------------------------------------------
        # CHECK API KEY
        # -------------------------------------------------

        if not PIXAZO_API_KEY:

            return jsonify({

                "success": False,

                "error":
                    "PIXAZO_API_KEY is missing on the server."

            }), 500


        # -------------------------------------------------
        # READ REQUEST
        # -------------------------------------------------

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


        if not prompt:

            return jsonify({

                "success": False,

                "error":
                    "Please enter a music prompt."

            }), 400


        # -------------------------------------------------
        # DURATION
        # -------------------------------------------------

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


        # Pixazo Tracks allows 10-600 seconds

        duration = max(
            10,
            min(
                duration,
                600
            )
        )


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

            "prompt": prompt,

            "lyrics": "",

            "instrumental": False,

            "duration": duration,

            "bpm": 110,

            "time_signature": "4/4",

            "seed": -1

        }


        print(
            "GLOW MUSIC: sending request to Pixazo..."
        )


        response = requests.post(

            PIXAZO_GENERATE_URL,

            headers=headers,

            json=payload,

            timeout=30

        )


        # -------------------------------------------------
        # PIXAZO ERROR
        # -------------------------------------------------

        if response.status_code not in (
            200,
            201,
            202
        ):

            try:

                error_data = (
                    response.json()
                )

            except Exception:

                error_data = {
                    "message":
                        response.text
                }


            print(
                "PIXAZO GENERATION ERROR:",
                error_data
            )


            return jsonify({

                "success": False,

                "error":
                    "Pixazo music request failed.",

                "details":
                    error_data

            }), response.status_code


        # -------------------------------------------------
        # READ QUEUED JOB
        # -------------------------------------------------

        result = response.json()


        request_id = result.get(
            "request_id"
        )


        if not request_id:

            return jsonify({

                "success": False,

                "error":
                    "Pixazo did not return a request ID.",

                "details":
                    result

            }), 502


        print(
            "GLOW MUSIC REQUEST ID:",
            request_id
        )


        # -------------------------------------------------
        # RETURN JOB TO FRONTEND
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "status": "QUEUED",

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

            return jsonify({

                "success": False,

                "status":
                    status,

                "error":
                    data.get(
                        "error",
                        "Pixazo music generation failed."
                    )

            }), 500


        # -------------------------------------------------
        # STILL PROCESSING
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
            "PIXAZO STATUS ERROR:",
            repr(error)
        )


        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    port = int(
        os.getenv(
            "PORT",
            10000
        )
    )


    app.run(

        host="0.0.0.0",

        port=port,

        debug=False

        )
