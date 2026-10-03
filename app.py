import os
import base64
from io import BytesIO

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from elevenlabs.client import ElevenLabs


app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("ELEVENLABS_API_KEY")

if not API_KEY:
    print("WARNING: ELEVENLABS_API_KEY is not configured.")

elevenlabs = ElevenLabs(
    api_key=API_KEY
) if API_KEY else None


# =========================
# WEBSITE FILES
# =========================

@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)


# =========================
# HEALTH CHECK
# =========================

@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "app": "GLOW AI STUDIO 2027",
        "music_engine": (
            "configured"
            if API_KEY
            else "missing_api_key"
        )
    })


# =========================
# AI MUSIC
# =========================

@app.route("/api/music", methods=["POST"])
def generate_music():

    try:

        if not API_KEY or elevenlabs is None:
            return jsonify({
                "success": False,
                "error": "ELEVENLABS_API_KEY is missing on the server."
            }), 500

        data = request.get_json(silent=True) or {}

        prompt = str(
            data.get("prompt", "")
        ).strip()

        if not prompt:
            return jsonify({
                "success": False,
                "error": "Please enter a music prompt."
            }), 400

        prompt = prompt[:4100]

        length = data.get(
            "music_length_ms",
            60000
        )

        try:
            length = int(length)
        except (TypeError, ValueError):
            length = 60000

        length = max(
            3000,
            min(length, 600000)
        )

        print(
            f"GLOW MUSIC: generating {length}ms song"
        )

        track = elevenlabs.music.compose(
            prompt=prompt,
            music_length_ms=length,
            model_id="music_v2_5"
        )

        audio_buffer = BytesIO()

        for chunk in track:
            if chunk:
                audio_buffer.write(chunk)

        audio_buffer.seek(0)

        audio_bytes = audio_buffer.getvalue()

        if not audio_bytes:
            return jsonify({
                "success": False,
                "error": "The music engine returned empty audio."
            }), 502

        audio_base64 = base64.b64encode(
            audio_bytes
        ).decode("utf-8")

        return jsonify({
            "success": True,
            "message": "Music generated successfully.",
            "audio": (
                f"data:audio/mpeg;base64,{audio_base64}"
            ),
            "format": "mp3",
            "length_ms": length
        })

    except Exception as error:

        print(
            "GLOW MUSIC ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


# =========================
# TEST MUSIC
# =========================

@app.route("/api/music/test", methods=["POST"])
def test_music():

    try:

        if not API_KEY or elevenlabs is None:
            return jsonify({
                "success": False,
                "error": "ELEVENLABS_API_KEY is missing."
            }), 500

        track = elevenlabs.music.compose(
            prompt=(
                "A short uplifting Afrobeat "
                "instrumental intro with warm bass, "
                "African percussion, guitar, piano "
                "and energetic drums."
            ),
            music_length_ms=10000,
            model_id="music_v2_5"
        )

        audio_buffer = BytesIO()

        for chunk in track:
            if chunk:
                audio_buffer.write(chunk)

        audio_buffer.seek(0)

        return send_file(
            audio_buffer,
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="glow-test.mp3"
        )

    except Exception as error:

        print(
            "GLOW TEST ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


# =========================
# START SERVER
# =========================

if __name__ == "__main__":

    port = int(
        os.getenv("PORT", 10000)
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
