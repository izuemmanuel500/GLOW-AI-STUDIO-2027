const modal = document.getElementById("studioModal");
const modalContent = document.getElementById("modalContent");

function openStudio(type) {
    modal.classList.add("active");

    if (type === "music") {
        showMusicStudio();
    } else if (type === "video") {
        showVideoStudio();
    }
}

function closeStudio() {
    modal.classList.remove("active");
    modalContent.innerHTML = "";
}

function showMusicStudio() {
    modalContent.innerHTML = `
        <div class="studio-modal">
            <div class="studio-icon">🎵</div>

            <h2>AI Music Studio</h2>
            <p>Create complete AI music from your imagination.</p>

            <label>Describe your song</label>

            <textarea
                id="musicPrompt"
                placeholder="Example: Create an energetic Afrobeat song about success, with powerful drums, warm bass, guitar and catchy vocals..."
            ></textarea>

            <div class="form-row">

                <div>
                    <label>Genre</label>
                    <select id="musicGenre">
                        <option>Afrobeat</option>
                        <option>Afropop</option>
                        <option>Hip-Hop</option>
                        <option>R&B</option>
                        <option>Pop</option>
                        <option>Gospel</option>
                        <option>Reggae</option>
                        <option>Highlife</option>
                        <option>Electronic</option>
                    </select>
                </div>

                <div>
                    <label>Mood</label>
                    <select id="musicMood">
                        <option>Energetic</option>
                        <option>Happy</option>
                        <option>Romantic</option>
                        <option>Emotional</option>
                        <option>Dark</option>
                        <option>Chill</option>
                        <option>Inspirational</option>
                    </select>
                </div>

            </div>

            <label>Song length</label>

            <select id="musicLength">
                <option value="30000">30 seconds</option>
                <option value="60000" selected>1 minute</option>
                <option value="120000">2 minutes</option>
                <option value="180000">3 minutes</option>
            </select>

            <button
                class="generate-btn"
                id="generateMusicButton"
                onclick="generateMusic()"
            >
                🎵 Generate AI Song
            </button>

            <div id="musicResult"></div>
        </div>
    `;
}

function showVideoStudio() {
    modalContent.innerHTML = `
        <div class="studio-modal">

            <div class="studio-icon">🎬</div>

            <h2>AI Video Studio</h2>
            <p>Create cinematic videos from your ideas.</p>

            <label>Describe your video</label>

            <textarea
                id="videoPrompt"
                placeholder="Example: A young African footballer rises from a small village and becomes a world champion..."
            ></textarea>

            <label>Video style</label>

            <select id="videoStyle">
                <option>Cinematic</option>
                <option>Music Video</option>
                <option>Drama</option>
                <option>Action</option>
                <option>Documentary</option>
                <option>Anime</option>
                <option>Realistic</option>
            </select>

            <label>Video length</label>

            <select id="videoLength">
                <option>Short</option>
                <option>Medium</option>
                <option>Long</option>
            </select>

            <button
                class="generate-btn"
                onclick="generateVideo()"
            >
                🎬 Generate AI Video
            </button>

            <div id="videoResult"></div>

        </div>
    `;
}

async function generateMusic() {

    const promptElement = document.getElementById("musicPrompt");
    const genreElement = document.getElementById("musicGenre");
    const moodElement = document.getElementById("musicMood");
    const lengthElement = document.getElementById("musicLength");

    const result = document.getElementById("musicResult");
    const button = document.getElementById("generateMusicButton");

    const prompt = promptElement.value.trim();
    const genre = genreElement.value;
    const mood = moodElement.value;
    const length = Number(lengthElement.value);

    if (!prompt) {
        result.innerHTML = `
            <div class="result-error">
                ⚠️ Please describe the song you want to create.
            </div>
        `;
        return;
    }

    const finalPrompt = `
Create a complete ${genre} song.

Mood: ${mood}.

User's idea:
${prompt}

Make the song musical, polished and engaging.
Include appropriate instruments, rhythm, melody and production.
If vocals are appropriate, create suitable original vocals and lyrics.
`;

    button.disabled = true;
    button.innerHTML = "⏳ Creating your song...";

    result.innerHTML = `
        <div class="generating">
            <div class="loading-spinner"></div>
            <h3>GLOW AI is creating your song...</h3>
            <p>This can take a little while.</p>
        </div>
    `;

    try {

        const response = await fetch("/api/music", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                prompt: finalPrompt,
                music_length_ms: length
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "Music generation failed."
            );
        }

        result.innerHTML = `
            <div class="music-success">

                <h3>✨ Your song is ready!</h3>

                <audio
                    controls
                    class="audio-player"
                    src="${data.audio}">
                </audio>

                <a
                    class="download-btn"
                    href="${data.audio}"
                    download="GLOW-AI-Song.mp3"
                >
                    ⬇️ Download Song
                </a>

                <button
                    class="secondary-btn"
                    onclick="showMusicStudio()"
                >
                    🎵 Create Another Song
                </button>

            </div>
        `;

    } catch (error) {

        console.error("GLOW MUSIC ERROR:", error);

        result.innerHTML = `
            <div class="result-error">

                <h3>❌ Music generation failed</h3>

                <p>${escapeHTML(error.message)}</p>

                <p>
                    Check that the Eleven Music API key is connected
                    to the server.
                </p>

            </div>
        `;

    } finally {

        button.disabled = false;
        button.innerHTML = "🎵 Generate AI Song";

    }
}

async function generateVideo() {

    const promptElement = document.getElementById("videoPrompt");
    const styleElement = document.getElementById("videoStyle");
    const lengthElement = document.getElementById("videoLength");

    const result = document.getElementById("videoResult");

    const prompt = promptElement.value.trim();
    const style = styleElement.value;
    const length = lengthElement.value;

    if (!prompt) {
        result.innerHTML = `
            <div class="result-error">
                ⚠️ Please describe the video you want to create.
            </div>
        `;
        return;
    }

    result.innerHTML = `
        <div class="generating">
            <div class="loading-spinner"></div>

            <h3>🎬 Video request prepared</h3>

            <p>
                Your ${style.toLowerCase()} video idea is ready.
            </p>

            <p>
                The AI video generation engine will be connected next.
            </p>
        </div>
    `;

    console.log({
        prompt,
        style,
        length
    });
}

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

modal.addEventListener("click", function(event) {

    if (event.target === modal) {
        closeStudio();
    }

});

document.addEventListener("keydown", function(event) {

    if (event.key === "Escape") {
        closeStudio();
    }

});
