/* =========================================================
   GLOW AI STUDIO 2027
   MAIN FRONTEND JAVASCRIPT
   Music + Video Studio
   ========================================================= */

const modal = document.getElementById("studioModal");
const modalContent = document.getElementById("modalContent");


/* =========================================================
   OPEN STUDIO
   ========================================================= */

function openStudio(type) {

    if (!modal || !modalContent) return;


    /* =========================
       MUSIC STUDIO
       ========================= */

    if (type === "music") {

        modalContent.innerHTML = `

            <div class="studio-modal-header">

                <span class="studio-modal-badge">
                    🎵 GLOW MUSIC STUDIO
                </span>

                <h2>Create Your Music</h2>

                <p>
                    Turn your idea into a complete AI-generated
                    music project with vocals, instruments,
                    rhythm and professional production.
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
                        Tell GLOW about the story, sound,
                        vocals, instruments and feeling you want.
                    </span>

                    <textarea
                        id="songPrompt"
                        placeholder="Example: Create an energetic Afrobeat song about success, with powerful African drums, warm bass, guitar, piano and catchy vocals..."
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

                            <option value="30">
                                30 seconds
                            </option>

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

                    <p
                        style="
                            margin-top:8px;
                            color:#888895;
                            font-size:13px;
                        "
                    >
                        GLOW is preparing your AI music project.
                    </p>

                </div>

            </form>

        `;
    }


    /* =========================
       VIDEO STUDIO
       ========================= */

    else if (type === "video") {

        modalContent.innerHTML = `

            <div class="studio-modal-header">

                <span class="studio-modal-badge">
                    🎬 GLOW VIDEO STUDIO
                </span>

                <h2>Create Your Video</h2>

                <p>
                    Turn your imagination into a cinematic
                    video concept with characters, scenes,
                    action, music and story direction.
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
                        Describe the story, characters,
                        location, action and visual style.
                    </span>

                    <textarea
                        id="videoPrompt"
                        placeholder="Example: A young Nigerian footballer rises from a small neighborhood pitch and becomes a world-famous football star..."
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

                            <option>
                                30 seconds
                            </option>

                            <option>
                                1 minute
                            </option>

                            <option>
                                3 minutes
                            </option>

                            <option>
                                5 minutes
                            </option>

                        </select>

                    </div>

                </div>


                <button
                    type="submit"
                    class="generate-btn"
                    id="generateVideoBtn"
                >
                    🎬 Generate AI Video
                </button>


                <div
                    class="generation-status"
                    id="videoGenerationStatus"
                >

                    <div class="loading-ring"></div>

                    <strong>
                        Preparing your video...
                    </strong>

                    <p
                        style="
                            margin-top:8px;
                            color:#888895;
                            font-size:13px;
                        "
                    >
                        GLOW is preparing your cinematic project.
                    </p>

                </div>

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


function closeStudioOutside(event) {

    if (event.target === modal) {

        closeStudio();

    }

}


/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeStudio();

        }

    }
);


/* =========================================================
   GENERATE AI MUSIC
   CONNECTS TO FLASK /api/music
   ========================================================= */

async function generateMusic(event) {

    event.preventDefault();


    const promptElement =
        document.getElementById("songPrompt");

    const genreElement =
        document.getElementById("genre");

    const moodElement =
        document.getElementById("mood");

    const lengthElement =
        document.getElementById("length");

    const button =
        document.getElementById("generateMusicBtn");

    const status =
        document.getElementById("generationStatus");


    if (
        !promptElement ||
        !genreElement ||
        !moodElement ||
        !lengthElement ||
        !button ||
        !status
    ) {

        alert(
            "GLOW Music Studio could not load correctly."
        );

        return;

    }


    const prompt =
        promptElement.value.trim();

    const genre =
        genreElement.value;

    const mood =
        moodElement.value;

    const length =
        Number(lengthElement.value);


    if (!prompt) {

        alert(
            "Please describe the song you want to create."
        );

        return;

    }


    /* =========================
       START GENERATION
       ========================= */

    button.disabled = true;

    button.textContent =
        "🎵 Creating Your Song...";


    status.classList.add("active");


    status.innerHTML = `

        <div class="loading-ring"></div>

        <strong>
            GLOW AI is creating your song...
        </strong>

        <p
            style="
                margin-top:8px;
                color:#888895;
                font-size:13px;
                line-height:1.6;
            "
        >
            Your music is being generated.
            This may take a little while.
        </p>

    `;


    /* =========================
       AI MUSIC PROMPT
       ========================= */

    const finalPrompt = `

Create a complete professional ${genre} song.

Mood:
${mood}

Song idea:
${prompt}

Create an original musical production with:

- appropriate drums
- bass
- melody
- instruments
- rhythm
- arrangement
- professional production
- suitable vocals
- original lyrics when vocals are appropriate

The song should sound polished,
creative, emotional and engaging.

Make the production suitable for
a professional music release.

`;


    try {


        /* =========================
           SEND REQUEST TO BACKEND
           ========================= */

        const response =
            await fetch(
                "/api/music",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        prompt:
                            finalPrompt,

                        music_length_ms:
                            length * 1000

                    })

                }
            );


        /* =========================
           READ SERVER RESPONSE
           ========================= */

        let data;

        try {

            data =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                "The music server returned an invalid response."
            );

        }


        /* =========================
           CHECK RESULT
           ========================= */

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(

                data.error ||
                `Music generation failed. Server status: ${response.status}`

            );

        }


        if (!data.audio) {

            throw new Error(
                "The music engine returned no audio."
            );

        }


        /* =========================
           SUCCESS
           ========================= */

        status.innerHTML = `

            <div
                style="
                    font-size:34px;
                    margin-bottom:8px;
                "
            >
                🎉
            </div>


            <strong
                style="
                    font-size:17px;
                "
            >
                Your song is ready!
            </strong>


            <p
                style="
                    margin-top:10px;
                    color:#888895;
                    font-size:13px;
                "
            >
                ${escapeHTML(genre)}
                •
                ${escapeHTML(mood)}
                •
                ${length} seconds
            </p>


            <audio
                controls
                preload="metadata"
                style="
                    width:100%;
                    margin-top:18px;
                    border-radius:12px;
                "
                src="${data.audio}"
            ></audio>


            <a
                href="${data.audio}"
                download="GLOW-AI-Song.mp3"
                style="
                    display:block;
                    margin-top:15px;
                    padding:14px;
                    border-radius:12px;
                    text-align:center;
                    text-decoration:none;
                    color:white;
                    background:linear-gradient(
                        135deg,
                        #8b5cf6,
                        #ec4899
                    );
                    font-weight:700;
                "
            >
                ⬇️ Download Song
            </a>

        `;


        console.log(
            "GLOW MUSIC SUCCESS:",
            data
        );


    } catch (error) {


        /* =========================
           ERROR
           ========================= */

        console.error(
            "GLOW MUSIC ERROR:",
            error
        );


        status.innerHTML = `

            <div
                style="
                    font-size:32px;
                    margin-bottom:8px;
                "
            >
                ❌
            </div>


            <strong>
                Music generation failed
            </strong>


            <p
                style="
                    margin-top:10px;
                    color:#ff8b8b;
                    font-size:13px;
                    line-height:1.7;
                "
            >
                ${escapeHTML(
                    error.message ||
                    "Something went wrong."
                )}
            </p>


            <button
                type="button"
                onclick="generateMusicAgain()"
                style="
                    width:100%;
                    margin-top:15px;
                    padding:13px;
                    border:none;
                    border-radius:12px;
                    cursor:pointer;
                    color:white;
                    background:#272733;
                    font-weight:700;
                "
            >
                🔄 Try Again
            </button>

        `;

    } finally {


        button.disabled = false;

        button.textContent =
            "🎵 Generate AI Song";

    }

}


/* =========================================================
   TRY MUSIC AGAIN
   ========================================================= */

function generateMusicAgain() {

    const form =
        document.querySelector(
            ".music-form"
        );

    if (form) {

        const event =
            new Event(
                "submit",
                {
                    bubbles: true,
                    cancelable: true
                }
            );

        form.dispatchEvent(event);

    }

}


/* =========================================================
   VIDEO
