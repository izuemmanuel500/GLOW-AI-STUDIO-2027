const modal = document.getElementById("studioModal");
const modalContent = document.getElementById("modalContent");

/* =========================================================
OPEN STUDIO
========================================================= */

function openStudio(type) {

if (!modal || !modalContent) return;

if (type === "music") {

    modalContent.innerHTML = `

        <div class="studio-modal-header">

            <span class="studio-modal-badge">
                🎵 GLOW MUSIC STUDIO
            </span>

            <h2>
                Create Your Music
            </h2>

            <p>
                Describe the song in your imagination.
                GLOW will prepare the creative direction
                for your AI music project.
            </p>

        </div>


        <form
            class="music-form"
            onsubmit="generateMusic(event)"
        >

            <div class="form-group">

                <label for="songPrompt">
                    Describe your song
                </label>

                <span class="form-hint">
                    Tell GLOW about the sound, story, instruments,
                    vocals and feeling you want.
                </span>

                <textarea
                    id="songPrompt"
                    placeholder="Example: Create an energetic Afrobeat song about success, with powerful drums, warm bass, guitar and catchy vocals..."
                    required
                ></textarea>

            </div>


            <div class="form-options">

                <div class="select-box">

                    <label for="genre">
                        Genre
                    </label>

                    <select id="genre">

                        <option>Afrobeat</option>
                        <option>Afropop</option>
                        <option>Hip-Hop</option>
                        <option>R&B</option>
                        <option>Pop</option>
                        <option>Reggae</option>
                        <option>Dancehall</option>
                        <option>Gospel</option>
                        <option>Amapiano</option>
                        <option>Rock</option>
                        <option>Electronic</option>

                    </select>

                </div>


                <div class="select-box">

                    <label for="mood">
                        Mood
                    </label>

                    <select id="mood">

                        <option>Energetic</option>
                        <option>Happy</option>
                        <option>Romantic</option>
                        <option>Sad</option>
                        <option>Emotional</option>
                        <option>Motivational</option>
                        <option>Dark</option>
                        <option>Chill</option>
                        <option>Epic</option>

                    </select>

                </div>


                <div class="select-box">

                    <label for="length">
                        Song length
                    </label>

                    <select id="length">

                        <option value="60">
                            1 minute
                        </option>

                        <option value="120">
                            2 minutes
                        </option>

                        <option value="180">
                            3 minutes
                        </option>

                        <option value="240">
                            4 minutes
                        </option>

                    </select>

                </div>

            </div>


            <button
                type="submit"
                class="generate-btn"
                id="generateMusicBtn"
            >
                🎵 Generate AI Song
            </button>


            <div
                class="generation-status"
                id="generationStatus"
            >

                <div class="loading-ring"></div>

                <strong>
                    Preparing your music...
                </strong>

                <p style="
                    margin-top:8px;
                    color:#888895;
                    font-size:13px;
                ">
                    GLOW is preparing your creative project.
                </p>

            </div>

        </form>

    `;

}


else if (type === "video") {

    modalContent.innerHTML = `

        <div class="studio-modal-header">

            <span class="studio-modal-badge">
                🎬 GLOW VIDEO STUDIO
            </span>

            <h2>
                Create Your Video
            </h2>

            <p>
                Turn your imagination into a cinematic
                video concept with characters, scenes,
                music and story direction.
            </p>

        </div>


        <form
            class="music-form"
            onsubmit="generateVideo(event)"
        >

            <div class="form-group">

                <label for="videoPrompt">
                    Describe your video
                </label>

                <span class="form-hint">
                    Describe the story, characters, location,
                    action and visual style.
                </span>

                <textarea
                    id="videoPrompt"
                    placeholder="Example: A young Nigerian footballer rises from a small neighborhood pitch to become a world-famous player..."
                    required
                ></textarea>

            </div>


            <div class="form-options">

                <div class="select-box">

                    <label for="videoStyle">
                        Visual Style
                    </label>

                    <select id="videoStyle">

                        <option>Cinematic</option>
                        <option>Realistic</option>
                        <option>Music Video</option>
                        <option>Anime</option>
                        <option>Documentary</option>

                    </select>

                </div>


                <div class="select-box">

                    <label for="videoMood">
                        Mood
                    </label>

                    <select id="videoMood">

                        <option>Epic</option>
                        <option>Emotional</option>
                        <option>Dark</option>
                        <option>Happy</option>
                        <option>Inspirational</option>

                    </select>

                </div>


                <div class="select-box">

                    <label for="videoLength">
                        Duration
                    </label>

                    <select id="videoLength">

                        <option>30 seconds</option>
                        <option>1 minute</option>
                        <option>3 minutes</option>
                        <option>5 minutes</option>

                    </select>

                </div>

            </div>


            <button
                type="submit"
                class="generate-btn"
            >
                🎬 Generate AI Video
            </button>

        </form>

    `;

}


modal.classList.add("active");

document.body.style.overflow = "hidden";

}

/* =========================================================
CLOSE STUDIO
========================================================= */

function closeStudio() {

if (!modal) return;

modal.classList.remove("active");

document.body.style.overflow = "";

}

/* Close when clicking outside */

function closeStudioOutside(event) {

if (event.target === modal) {
    closeStudio();
}

}

/* ESC key */

document.addEventListener("keydown", function(event) {

if (event.key === "Escape") {
    closeStudio();
}

});

/* =========================================================
GENERATE MUSIC
========================================================= */

function generateMusic(event) {

event.preventDefault();

const prompt =
    document.getElementById("songPrompt").value.trim();

const genre =
    document.getElementById("genre").value;

const mood =
    document.getElementById("mood").value;

const length =
    document.getElementById("length").value;

const button =
    document.getElementById("generateMusicBtn");

const status =
    document.getElementById("generationStatus");


if (!prompt) {
    alert("Please describe the song you want to create.");
    return;
}


button.disabled = true;

button.textContent = "✨ Preparing Music...";

status.classList.add("active");


/*
   CURRENT STAGE:

   This creates the creative project interface.
   The actual AI audio generation API can be
   connected here later.
*/

setTimeout(function() {

    button.disabled = false;

    button.textContent = "🎵 Generate AI Song";

    status.innerHTML = `

        <div style="font-size:30px;">
            ✨
        </div>

        <strong>
            Music project created
        </strong>

        <p style="
            margin-top:8px;
            color:#888895;
            font-size:13px;
            line-height:1.6;
        ">
            ${escapeHTML(genre)}
            •
            ${escapeHTML(mood)}
            •
            ${escapeHTML(length)} seconds
        </p>

        <p style="
            margin-top:8px;
            color:#888895;
            font-size:13px;
        ">
            Your AI generation pipeline can be connected
            to this project next.
        </p>

    `;

}, 1800);

}

/* =========================================================
GENERATE VIDEO
========================================================= */

function generateVideo(event) {

event.preventDefault();

const prompt =
    document.getElementById("videoPrompt").value.trim();

if (!prompt) {
    alert("Please describe the video you want to create.");
    return;
}

alert(
    "Your video project has been created. " +
    "The AI video generation engine can be connected next."
);

}

/* =========================================================
SECURITY HELPER
========================================================= */

function escapeHTML(value) {

return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

        }
