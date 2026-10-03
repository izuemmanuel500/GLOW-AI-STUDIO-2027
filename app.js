const modal = document.getElementById("studioModal");
const modalContent = document.getElementById("modalContent");

function openStudio(type) {
    modal.classList.add("active");

    if (type === "music") {
        showMusicStudio();
    }

    if (type === "video") {
        showVideoStudio();
    }
}

function closeStudio() {
    modal.classList.remove("active");
    modalContent.innerHTML = "";
}


/* =========================
   MUSIC STUDIO
========================= */

function showMusicStudio() {

    modalContent.innerHTML = `
        <div class="studio-modal-content">

            <span class="card-label">
                GLOW AI MUSIC
            </span>

            <h2 style="margin-top:10px;">
                Create Your Song 🎵
            </h2>

            <p style="color:#92929e;margin-top:10px;line-height:1.6;">
                Describe the song you want GLOW AI to create.
                Add the mood, genre, story, instruments and vocal style.
            </p>

            <label style="display:block;margin-top:25px;margin-bottom:8px;">
                Song prompt
            </label>

            <textarea
                id="musicPrompt"
                placeholder="Example: Create an emotional Afrobeat song about a young man who never gives up..."
                style="
                    width:100%;
                    min-height:150px;
                    resize:vertical;
                    padding:16px;
                    border-radius:15px;
                    border:1px solid rgba(255,255,255,0.12);
                    background:#09090f;
                    color:white;
                    outline:none;
                    font-size:15px;
                    line-height:1.6;
                "
            ></textarea>

            <div style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:12px;
                margin-top:15px;
            ">

                <select id="musicGenre"
                    style="
                        padding:14px;
                        border-radius:12px;
                        background:#09090f;
                        color:white;
                        border:1px solid rgba(255,255,255,0.12);
                    "
                >
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

                <select id="musicMood"
                    style="
                        padding:14px;
                        border-radius:12px;
                        background:#09090f;
                        color:white;
                        border:1px solid rgba(255,255,255,0.12);
                    "
                >
                    <option>Energetic</option>
                    <option>Happy</option>
                    <option>Emotional</option>
                    <option>Romantic</option>
                    <option>Dark</option>
                    <option>Peaceful</option>
                    <option>Inspirational</option>
                </select>

            </div>

            <button
                onclick="generateMusic()"
                style="
                    width:100%;
                    margin-top:20px;
                    padding:16px;
                    border:none;
                    border-radius:14px;
                    background:linear-gradient(135deg,#7c3aed,#ec4899);
                    color:white;
                    font-size:16px;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                ✨ Generate AI Song
            </button>

            <div id="musicResult"></div>

        </div>
    `;
}


/* =========================
   VIDEO STUDIO
========================= */

function showVideoStudio() {

    modalContent.innerHTML = `
        <div class="studio-modal-content">

            <span class="card-label">
                GLOW AI VIDEO
            </span>

            <h2 style="margin-top:10px;">
                Create Your Video 🎬
            </h2>

            <p style="color:#92929e;margin-top:10px;line-height:1.6;">
                Describe the story, characters and scenes you want
                GLOW AI to create.
            </p>

            <label style="display:block;margin-top:25px;margin-bottom:8px;">
                Video prompt
            </label>

            <textarea
                id="videoPrompt"
                placeholder="Example: A cinematic African drama about a young musician who leaves his village to pursue his dream..."
                style="
                    width:100%;
                    min-height:170px;
                    resize:vertical;
                    padding:16px;
                    border-radius:15px;
                    border:1px solid rgba(255,255,255,0.12);
                    background:#09090f;
                    color:white;
                    outline:none;
                    font-size:15px;
                    line-height:1.6;
                "
            ></textarea>

            <div style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:12px;
                margin-top:15px;
            ">

                <select id="videoStyle"
                    style="
                        padding:14px;
                        border-radius:12px;
                        background:#09090f;
                        color:white;
                        border:1px solid rgba(255,255,255,0.12);
                    "
                >
                    <option>Cinematic</option>
                    <option>Music Video</option>
                    <option>Drama</option>
                    <option>Action</option>
                    <option>Documentary</option>
                    <option>Anime</option>
                    <option>Realistic</option>
                </select>

                <select id="videoLength"
                    style="
                        padding:14px;
                        border-radius:12px;
                        background:#09090f;
                        color:white;
                        border:1px solid rgba(255,255,255,0.12);
                    "
                >
                    <option>Short</option>
                    <option>Medium</option>
                    <option>Long</option>
                </select>

            </div>

            <button
                onclick="generateVideo()"
                style="
                    width:100%;
                    margin-top:20px;
                    padding:16px;
                    border:none;
                    border-radius:14px;
                    background:linear-gradient(135deg,#ec4899,#7c3aed);
                    color:white;
                    font-size:16px;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                🎬 Generate AI Video
            </button>

            <div id="videoResult"></div>

        </div>
    `;
}


/* =========================
   MUSIC GENERATION PLACEHOLDER
========================= */

function generateMusic() {

    const prompt = document.getElementById("musicPrompt").value.trim();
    const genre = document.getElementById("musicGenre").value;
    const mood = document.getElementById("musicMood").value;
    const result = document.getElementById("musicResult");

    if (!prompt) {
        alert("Please describe the song you want to create.");
        return;
    }

    result.innerHTML = `
        <div style="
            margin-top:25px;
            padding:20px;
            border-radius:15px;
            background:rgba(124,58,237,0.08);
            border:1px solid rgba(124,58,237,0.2);
        ">
            <strong>🎵 Music request prepared</strong>

            <p style="
                margin-top:10px;
                color:#9999a5;
                line-height:1.6;
            ">
                Genre: ${escapeHTML(genre)}<br>
                Mood: ${escapeHTML(mood)}<br>
                Prompt: ${escapeHTML(prompt)}
            </p>

            <p style="
                margin-top:12px;
                color:#a78bfa;
                font-size:13px;
            ">
                AI music engine connection will be added next.
            </p>
        </div>
    `;
}


/* =========================
   VIDEO GENERATION PLACEHOLDER
========================= */

function generateVideo() {

    const prompt = document.getElementById("videoPrompt").value.trim();
    const style = document.getElementById("videoStyle").value;
    const length = document.getElementById("videoLength").value;
    const result = document.getElementById("videoResult");

    if (!prompt) {
        alert("Please describe the video you want to create.");
        return;
    }

    result.innerHTML = `
        <div style="
            margin-top:25px;
            padding:20px;
            border-radius:15px;
            background:rgba(236,72,153,0.08);
            border:1px solid rgba(236,72,153,0.2);
        ">
            <strong>🎬 Video request prepared</strong>

            <p style="
                margin-top:10px;
                color:#9999a5;
                line-height:1.6;
            ">
                Style: ${escapeHTML(style)}<br>
                Length: ${escapeHTML(length)}<br>
                Prompt: ${escapeHTML(prompt)}
            </p>

            <p style="
                margin-top:12px;
                color:#f0abfc;
                font-size:13px;
            ">
                AI video engine connection will be added next.
            </p>
        </div>
    `;
}


/* =========================
   SAFETY / TEXT ESCAPING
========================= */

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =========================
   CLOSE MODAL WHEN CLICKING
   OUTSIDE THE WINDOW
========================= */

modal.addEventListener("click", function(event) {

    if (event.target === modal) {
        closeStudio();
    }

});


/* =========================
   ESC KEY
========================= */

document.addEventListener("keydown", function(event) {

    if (event.key === "Escape") {
        closeStudio();
    }

});
