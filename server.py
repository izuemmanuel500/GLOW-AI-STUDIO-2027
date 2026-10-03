import os
import base64
from flask import Flask, request, jsonify, send_file
from google import genai

app = Flask(__name__)

# Your Gemini API key must be stored as an environment variable.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not configured.")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


@app.route("/")
def home():
    return "GLOW AI STUDIO 2027 backend is running."


@app.route("/api/generate-music", methods=["POST"])
def generate_music():
    try:
        if not client:
            return jsonify({
                "success": False,
                "error": "GEMINI_API_KEY is not configured."
            }), 500

        data = request.get_json() or {}

        prompt = data.get("prompt", "").strip()
        genre = data.get("genre", "Afrobeat")
        mood = data.get("mood", "Energetic")
        length = data.get("length", "2")

        if not prompt:
            return jsonify({
                "success": False,
                "error": "Please describe the song you want to create."
            }), 400

        music_prompt = f"""
Create an original {genre} song.

Mood:
{mood}

User's creative idea:
{prompt}

Requested length:
{length} minutes.

Create a complete musical arrangement with a strong intro,
verses, chorus, transitions and ending.

Make the production polished, modern and suitable for a
professional music creation platform.
"""

        interaction = client.interactions.create(
            model="lyria-3.5",
            input=music_prompt,
            response_format={
                "type": "audio"
            }
        )

        audio_data = None

        if interaction.output_audio:
            audio_data = interaction.output_audio.data

        if not audio_data:
            return jsonify({
                "success": False,
                "error": "The AI did not return audio."
            }), 500

        # Save generated MP3 temporarily
        audio_bytes = base64.b64decode(audio_data)

        filename = "glow_generated_song.mp3"

        with open(filename, "wb") as audio_file:
            audio_file.write(audio_bytes)

        lyrics = interaction.output_text or ""

        return jsonify({
            "success": True,
            "message": "Your song has been generated!",
            "audio_url": "/api/music",
            "lyrics": lyrics,
            "genre": genre,
            "mood": mood,
            "length": length
        })

    except Exception as e:
        print("Generation error:", str(e))

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/music")
def music():
    filename = "glow_generated_song.mp3"

    if not os.path.exists(filename):
        return jsonify({
            "success": False,
            "error": "No generated song available."
        }), 404

    return send_file(
        filename,
        mimetype="audio/mpeg",
        as_attachment=False
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=True
    )
