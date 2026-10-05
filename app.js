/* =========================================================
   GLOW AI STUDIO 2027
   MUSIC + VIDEO STUDIO
   PIXAZO MUSIC CONNECTION
   ========================================================= */


/* =========================================================
   GLOBAL ELEMENTS
   ========================================================= */

let studioModal = null;
let modalContent = null;


/* =========================================================
   OPEN STUDIO
   ========================================================= */

window.openStudio = function (type) {

    studioModal = document.getElementById("studioModal");
    modalContent = document.getElementById("modalContent");

    if (!studioModal || !modalContent) {

        console.error(
            "GLOW ERROR: studioModal or modalContent was not found."
        );

        return;
    }


    /* =====================================================
       MUSIC STUDIO
    ===================================================== */

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
                    Turn your idea into an
                    AI-generated song with
                    vocals, lyrics, instruments,
                    beats and professional production.
                </p>

            </div>


            <form
                class="music-form"
                id="musicForm"
            >

                <div class="form-group">

                    <label for="songPrompt">
                        Describe your song
                    </label>

                    <span class="form-hint">
                        Tell GLOW about the story,
                        sound, instruments, vocals
                        and feeling you want.
                    </span>

                    <textarea
                        id="songPrompt"
                        placeholder="Example: Create an energetic modern Afrobeat song about chasing your dreams and becoming successful..."
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
                            <option>Peaceful</option>
                            <option>Epic</option>

                        </select>

                    </div>

                </div>


                <button
                    type="submit"
                    class="primary-btn"
                    id="generateMusicBtn"
                >
                    🎵 Generate Music
                </button>


                <div
                    id="musicStatus"
                    class="music-status"
                ></div>

                <div
                    id="musicResult"
                    class="music-result"
                ></div>

            </form>

        `;


        /* =================================================
           MUSIC FORM
        ================================================= */

        const musicForm =
            document.getElementById("musicForm");


        if (musicForm) {

            musicForm.addEventListener(
                "submit",
                handleMusicGeneration
            );

        }

    }


    /* =====================================================
       VIDEO STUDIO
    ===================================================== */

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
                    Transform your imagination into
                    cinematic AI video scenes,
                    characters and stories.
                </p>

            </div>


            <form
                class="video-form"
                id="videoForm"
            >

                <div class="form-group">

                    <label for="videoPrompt">
                        Describe your video
                    </label>

                    <span class="form-hint">
                        Describe the characters,
                        environment, action,
                        camera and visual style.
                    </span>

                    <textarea
                        id="videoPrompt"
                        placeholder="Example: A cinematic football match in a futuristic stadium at night, realistic players, dramatic lighting and a huge crowd..."
                        required
                    ></textarea>

                </div>


                <div class="form-options">

                    <div class="select-box">

                        <label for="videoStyle">
                            Video Style
                        </label>

                        <select id="videoStyle">

                            <option>Cinematic</option>
                            <option>Realistic</option>
                            <option>Anime</option>
                            <option>Music Video</option>
                            <option>Documentary</option>
                            <option>Fantasy</option>
                            <option>Sci-Fi</option>

                        </select>

                    </div>


                    <div class="select-box">

                        <label for="videoLength">
                            Length
                        </label>

                        <select id="videoLength">

                            <option>5 seconds</option>
                            <option>10 seconds</option>
                            <option>15 seconds</option>
                            <option>30 seconds</option>

                        </select>

                    </div>

                </div>


                <button
                    type="submit"
                    class="primary-btn"
                >
                    🎬 Generate Video
                </button>

            </form>

        `;


        /* =================================================
           VIDEO FORM
        ================================================= */

        const videoForm =
            document.getElementById("videoForm");


        if (videoForm) {

            videoForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    const promptElement =
                        document.getElementById("videoPrompt");

                    const prompt =
                        promptElement
                            ? promptElement.value.trim()
                            : "";

                    if (!prompt) {

                        alert(
                            "Please describe the video you want to create."
                        );

                        return;
                    }


                    alert(
                        "🎬 GLOW VIDEO\n\n" +
                        "Your video request has been received."
                    );

                }
            );

        }

    }


    /* =====================================================
       SHOW MODAL
    ===================================================== */

    studioModal.classList.add("active");

    document.body.classList.add("modal-open");

};


/* =========================================================
   MUSIC GENERATION
   ========================================================= */

async function handleMusicGeneration(event) {

    event.preventDefault();


    const promptElement =
        document.getElementById("songPrompt");

    const genreElement =
        document.getElementById("genre");

    const moodElement =
        document.getElementById("mood");

    const button =
        document.getElementById("generateMusicBtn");

    const status =
        document.getElementById("musicStatus");

    const result =
        document.getElementById("musicResult");


    if (!promptElement || !button || !status || !result) {

        console.error(
            "GLOW MUSIC ERROR: Music form elements missing."
        );

        return;

    }


    const prompt =
        promptElement.value.trim();


    if (!prompt) {

        alert(
            "Please describe the song you want to create."
        );

        return;

    }


    const genre =
        genreElement
            ? genreElement.value
            : "Afrobeat";


    const mood =
        moodElement
            ? moodElement.value
            : "Energetic";


    /* =====================================================
       COMBINE USER PROMPT + MUSIC SETTINGS
    ===================================================== */

    const fullPrompt =
        `${prompt}. Genre: ${genre}. Mood: ${mood}. Professional music production, clear vocals, strong instrumentation and polished studio-quality sound.`;


    /* =====================================================
       LOCK BUTTON
    ===================================================== */

    button.disabled = true;

    button.textContent =
        "⏳ Starting Music Generation...";


    status.innerHTML = `
        <p>
            🎵 GLOW is sending your idea to the AI music engine...
        </p>
    `;

    result.innerHTML = "";


    try {

        /* =================================================
           SEND TO OUR FLASK BACKEND
        ================================================= */

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
                            fullPrompt,

                        music_length_ms:
                            60000

                    })

                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                "The server returned an invalid response."
            );

        }


        if (!response.ok || !data.success) {

            const message =
                data.error ||
                "Music generation request failed.";

            throw new Error(message);

        }


        if (!data.request_id) {

            throw new Error(
                "Pixazo did not return a request ID."
            );

        }


        /* =================================================
           START POLLING
        ================================================= */

        status.innerHTML = `
            <p>
                🎵 Music request accepted.
            </p>

            <p>
                ⏳ GLOW is generating your song...
            </p>
        `;


        button.textContent =
            "⏳ Generating Music...";


        await pollMusicStatus(
            data.request_id,
            status,
            result
        );


    } catch (error) {

        console.error(
            "GLOW MUSIC ERROR:",
            error
        );


        status.innerHTML = `
            <p>
                ❌ Music generation failed.
            </p>
        `;


        result.innerHTML = `
            <div class="music-error">
                ${escapeHtml(
                    error.message ||
                    "Something went wrong."
                )}
            </div>
        `;

    } finally {

        button.disabled = false;

        button.textContent =
            "🎵 Generate Music";

    }

}


/* =========================================================
   POLL PIXAZO MUSIC STATUS
   ========================================================= */

async function pollMusicStatus(
    requestId,
    statusElement,
    resultElement
) {

    const maxAttempts =
        40;

    const delayMs =
        5000;


    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {

        try {

            const response =
                await fetch(
                    `/api/music/status/${encodeURIComponent(requestId)}`
                );


            let data;


            try {

                data =
                    await response.json();

            } catch (jsonError) {

                throw new Error(
                    "Invalid status response from server."
                );

            }


            if (!response.ok || !data.success) {

                throw new Error(
                    data.error ||
                    "Could not check music generation status."
                );

            }


            const currentStatus =
                String(
                    data.status ||
                    "PROCESSING"
                ).toUpperCase();


            /* =============================================
               COMPLETED
            ============================================= */

            if (
                currentStatus ===
                "COMPLETED"
            ) {

                if (!data.audio) {

                    throw new Error(
                        "Music was completed but no audio URL was returned."
                    );

                }


                statusElement.innerHTML = `
                    <p>
                        ✅ Your music is ready!
                    </p>
                `;


                resultElement.innerHTML = `

                    <div class="generated-music">

                        <h3>
                            🎵 Your GLOW Creation
                        </h3>

                        <audio
                            controls
                            preload="metadata"
                            src="${escapeHtml(data.audio)}"
                        >
                        </audio>

                        <a
                            href="${escapeHtml(data.audio)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="primary-btn"
                        >
                            🎧 Open Audio
                        </a>

                    </div>

                `;


                return;

            }


            /* =============================================
               FAILED
            ============================================= */

            if (
                currentStatus === "FAILED" ||
                currentStatus === "ERROR"
            ) {

                throw new Error(
                    data.error ||
                    "Pixazo could not generate the music."
                );

            }


            /* =============================================
               STILL PROCESSING
            ============================================= */

            const progressText =
                currentStatus === "QUEUED"
                    ? "waiting in the music queue"
                    : "creating your song";


            statusElement.innerHTML = `
                <p>
                    🎵 GLOW is ${progressText}...
                </p>

                <p>
                    ⏳ Please wait...
                </p>
            `;


            if (
                attempt <
                maxAttempts
            ) {

                await sleep(
                    delayMs
                );

            }

        } catch (error) {

            console.error(
                "GLOW MUSIC STATUS ERROR:",
                error
            );

            throw error;

        }

    }


    throw new Error(
        "Music generation is taking longer than expected. Please try again."
    );

}


/* =========================================================
   SLEEP
   ========================================================= */

function sleep(milliseconds) {

    return new Promise(
        function (resolve) {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}


/* =========================================================
   SAFE HTML TEXT
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   CLOSE STUDIO
   ========================================================= */

window.closeStudio = function () {

    studioModal =
        document.getElementById("studioModal");

    if (!studioModal) {

        return;

    }


    studioModal.classList.remove("active");

    document.body.classList.remove("modal-open");

};


/* =========================================================
   CLOSE WHEN CLICKING OUTSIDE
   ========================================================= */

window.closeStudioOutside = function (event) {

    if (
        event.target &&
        event.target.id === "studioModal"
    ) {

        closeStudio();

    }

};


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
