import os
import base64
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from elevenlabs.client import ElevenLabs
from io import BytesIO

app = Flask(__name__)
CORS(app)

# ============================================================
# GLOW AI STUDIO 2027
# REAL AI MUSIC BACKEND
# ============================================================

API_KEY = os.getenv("ELEVENLABS_API_KEY")

if not API_KEY:
    print("WARNING: ELEVENLABS_API_KEY is not configured.")

elevenlabs = ElevenLabs(
    api_key=API_KEY
) if API_KEY else None


@app.get("/")
def home():
    return jsonify({
        "status": "online",
        "app": "GLOW AI STUDIO 2027",
        "engine": "Eleven Music",
        "music": "ready"
    })


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "music_engine": "configured" if API_KEY else "missing_api_key"
    })


@app.post("/api/music")
def generate_music():
    try:
        if not API_KEY or elevenlabs is None:
            return jsonify({
                "success": False,
                "error": "Music engine is not configured on the server."
            }), 500

        data = request.get_json(silent=True) or {}

        prompt = str(data.get("prompt", "")).strip()

        if not prompt:
            return jsonify({
                "success": False,
                "error": "Please enter a music prompt."
            }), 400

        # ElevenLabs currently accepts prompts up to 4100 characters.
        prompt = prompt[:4100]

        # User can request a duration in milliseconds.
        # Default: 60 seconds.
        length = data.get("music_length_ms", 60000)

        try:
            length = int(length)
        except (TypeError, ValueError):
            length = 60000

        # Keep generation inside the API's supported range.
        length = max(3000, min(length, 600000))

        # Generate music using the current Eleven Music model.
        track = elevenlabs.music.compose(
            prompt=prompt,
            music_length_ms=length,
            model_id="music_v2_5"
        )

        # The SDK returns audio data as an iterable.
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

        # Send the MP3 back as base64 so the frontend can play it.
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        return jsonify({
            "success": True,
            "message": "Music generated successfully.",
            "audio": f"data:audio/mpeg;base64,{audio_base64}",
            "format": "mp3",
            "length_ms": length
        })

    except Exception as error:
        print("GLOW MUSIC ERROR:", repr(error))

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


@app.post("/api/music/test")
def test_music():
    """
    Small test endpoint.
    Useful for checking the ElevenLabs connection.
    """

    try:
        if not API_KEY or elevenlabs is None:
            return jsonify({
                "success": False,
                "error": "ELEVENLABS_API_KEY is missing."
            }), 500

        track = elevenlabs.music.compose(
            prompt=(
                "A short uplifting Afrobeat instrumental intro "
                "with warm bass, African percussion, guitar, "
                "piano and energetic drums."
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
        print("GLOW TEST ERROR:", repr(error))

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 10000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
