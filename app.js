/* =========================================================
   GLOW AI STUDIO 2027
   FULL APP.JS
   MUSIC + VIDEO STUDIOS
   ========================================================= */


/* =========================================================
   GLOBAL STUDIO FUNCTION
   ========================================================= */

function openStudio(type) {

    console.log("GLOW: opening studio:", type);


    const modal =
        document.getElementById("studioModal");

    const content =
        document.getElementById("modalContent");


    if (!modal) {

        alert(
            "GLOW ERROR: Studio popup was not found."
        );

        console.error(
            "studioModal not found"
        );

        return;
    }


    if (!content) {

        alert(
            "GLOW ERROR: Popup content was not found."
        );

        console.error(
            "modalContent not found"
        );

        return;
    }


    /* =====================================================
       MUSIC STUDIO
    ===================================================== */

    if (type === "music") {

        content.innerHTML = `

            <div class="studio-modal-header">

                <span class="studio-modal-badge">
                    🎵 GLOW MUSIC
                </span>

                <h2>
                    Create Your Music
                </h2>

                <p>
                    Turn your idea into an original
                    AI-generated song with vocals,
                    lyrics, instruments, rhythm
                    and professional production.
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
                        Tell GLOW what you want the
                        song to sound and feel like.
                    </span>


                    <textarea
                        id="songPrompt"
                        placeholder="Example: Create an energetic modern Afrobeat song about chasing dreams, overcoming struggles and becoming successful. Use powerful African drums, deep warm bass, catchy guitar, beautiful piano and inspiring vocals..."
                        required
                    ></textarea>

                </div>



                <div class="form-options">


                    <div class="select-box">

                        <label for="genre">
                            Genre
                        </label>

                        <select id="genre">

                            <option>
                                Afrobeat
                            </option>

                            <option>
                                Afropop
                            </option>

                            <option>
                                Amapiano
                            </option>

                            <option>
                                Hip-Hop
                            </option>

                            <option>
                                R&B
                            </option>

                            <option>
                                Pop
                            </option>

                            <option>
                                Reggae
                            </option>

                            <option>
                                Dancehall
                            </option>

                            <option>
                                Gospel
                            </option>

                            <option>
                                Rock
                            </option>

                            <option>
                                Electronic
                            </option>

                        </select>

                    </div>



                    <div class="select-box">

                        <label for="mood">
                            Mood
                        </label>

                        <select id="mood">

                            <option>
                                Energetic
                            </option>

                            <option>
                                Happy
                            </option>

                            <option>
                                Romantic
                            </option>

                            <option>
                                Emotional
                            </option>

                            <option>
                                Motivational
                            </option>

                            <option>
                                Sad
                            </option>

                            <option>
                                Dark
                            </option>

                            <option>
                                Chill
                            </option>

                            <option>
                                Epic
                            </option>

                        </select>

                    </div>



                    <div class="select-box">

                        <label for="length">
                            Song Length
                        </label>

                        <select id="length">

                            <option value="30">
                                30 seconds
                            </option>

                            <option
                                value="60"
                                selected
                            >
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
                ></div>


            </form>

        `;


        const musicForm =
            document.getElementById(
                "musicForm"
            );


        if (musicForm) {

            musicForm.addEventListener(
                "submit",
                generateMusic
            );

        }

    }



    /* =====================================================
       VIDEO STUDIO
    ===================================================== */

    if (type === "video") {

        content.innerHTML = `

            <div class="studio-modal-header">

                <span class="studio-modal-badge">
                    🎬 GLOW VIDEO
                </span>

                <h2>
                    Create Your Video
                </h2>

                <p>
                    Turn your story and imagination
                    into cinematic AI video.
                </p>

            </div>


            <form
                class="music-form"
                id="videoForm"
            >


                <div class="form-group">

                    <label for="videoPrompt">
                        Describe your video
                    </label>

                    <span class="form-hint">
                        Describe the characters,
                        location, action, story
                        and visual style.
                    </span>


                    <textarea
                        id="videoPrompt"
                        placeholder="Example: A young Nigerian footballer starts playing on a small neighborhood pitch, trains every day, faces rejection and eventually becomes a world-famous football star. Cinematic stadium scenes, emotional journey, realistic human characters..."
                        required
                    ></textarea>

                </div>



                <div class="form-options">


                    <div class="select-box">

                        <label for="videoStyle">
                            Visual Style
                        </label>

                        <select id="videoStyle">

                            <option>
                                Cinematic
                            </option>

                            <option>
                                Realistic
                            </option>

                            <option>
                                Music Video
                            </option>

                            <option>
                                Documentary
                            </option>

                            <option>
                                Anime
                            </option>

                        </select>

                    </div>



                    <div class="select-box">

                        <label for="videoMood">
                            Mood
                        </label>

                        <select id="videoMood">

                            <option>
                                Epic
                            </option>

                            <option>
                                Emotional
                            </option>

                            <option>
                                Inspirational
                            </option>

                            <option>
                                Happy
                            </option>

                            <option>
                                Dark
                            </option>

                        </select>

                    </div>



                    <div class="select-box">

                        <label for="videoLength">
                            Duration
                        </label>

                        <select id="videoLength">

                            <option>
                                5 seconds
                            </option>

                            <option>
                                10 seconds
                            </option>

                            <option>
                                15 seconds
                            </option>

                            <option>
                                30 seconds
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
                ></div>


            </form>

        `;


        const videoForm =
            document.getElementById(
                "videoForm"
            );


        if (videoForm) {

            videoForm.addEventListener(
                "submit",
                generateVideo
            );

        }

    }


    /* =====================================================
       SHOW MODAL
    ===================================================== */

    modal.classList.add("active");

    document.body.style.overflow = "hidden";


    console.log(
        "GLOW: studio opened successfully"
    );

}



/* =========================================================
   CLOSE STUDIO
   ========================================================= */

function closeStudio() {

    const modal =
        document.getElementById(
            "studioModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "active"
    );


    document.body.style.overflow = "";


}



/* =========================================================
   CLOSE OUTSIDE MODAL
   ========================================================= */

function closeStudioOutside(event) {

    const modal =
        document.getElementById(
            "studioModal"
        );


    if (
        modal &&
        event.target === modal
    ) {

        closeStudio();

    }

}



/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeStudio();

        }

    }
);



/* =========================================================
   MUSIC GENERATION
   ========================================================= */

async function generateMusic(event) {

    event.preventDefault();


    const promptElement =
        document.getElementById(
            "songPrompt"
        );


    const genreElement =
        document.getElementById(
            "genre"
        );


    const moodElement =
        document.getElementById(
            "mood"
        );


    const lengthElement =
        document.getElementById(
            "length"
        );


    const button =
        document.getElementById(
            "generateMusicBtn"
        );


    const status =
        document.getElementById(
            "generationStatus"
        );


    if (
        !promptElement ||
        !button ||
        !status
    ) {

        console.error(
            "GLOW: Music form elements missing."
        );

        return;

    }


    const prompt =
        promptElement.value.trim();


    const genre =
        genreElement
            ? genreElement.value
            : "Afrobeat";


    const mood =
        moodElement
            ? moodElement.value
            : "Energetic";


    const length =
        lengthElement
            ? Number(
                lengthElement.value
            )
            : 30;


    if (!prompt) {

        alert(
            "Please describe the song you want to create."
        );

        return;

    }


    /* =====================================================
       LOADING
    ===================================================== */

    button.disabled = true;

    button.textContent =
        "🎵 Sending to GLOW AI...";


    status.classList.add(
        "active"
    );


    status.innerHTML = `

        <div class="loading-ring"></div>

        <strong>
            GLOW AI is creating your song...
        </strong>

        <p
            style="
                margin-top:10px;
                color:#888895;
                font-size:13px;
                line-height:1.6;
            "
        >
            Sending your idea to the
            GLOW AI music engine...
        </p>

    `;


    /* =====================================================
       FINAL AI PROMPT
    ===================================================== */

    const finalPrompt = `

Create a complete professional
${genre} song.

Genre:
${genre}

Mood:
${mood}

Song idea:
${prompt}

Create an original song with:

- professional drums
- bass
- melody
- rhythm
- instruments
- arrangement
- vocals
- original lyrics
- catchy chorus
- professional production

Make the song emotional,
engaging and memorable.

Make it sound like a professionally
produced commercial music release.

Do not copy any existing song,
artist recording or copyrighted lyrics.

`;


    try {


        /* =================================================
           SEND TO OUR RENDER BACKEND
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

                    body:
                        JSON.stringify({

                            prompt:
                                finalPrompt,

                            music_length_ms:
                                length * 1000

                        })

                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch(error) {

            throw new Error(
                "The GLOW server returned an invalid response."
            );

        }


        if (
            !response.ok ||
            !data.success
        ) {

            let message =
                data.error ||
                "Music generation request failed.";


            if (
                data.details &&
                typeof data.details === "object"
            ) {

                const detailText =
                    data.details.message ||
                    data.details.error;


                if (detailText) {

                    message +=
                        " " +
                        detailText;

                }

            }


            throw new Error(
                message
            );

        }


        const requestId =
            data.request_id;


        if (!requestId) {

            throw new Error(
                "GLOW received no music request ID."
            );

        }


        console.log(
            "GLOW music request:",
            requestId
        );


        /* =================================================
           START POLLING
        ================================================= */

        status.innerHTML = `

            <div class="loading-ring"></div>

            <strong>
                🎵 Creating your song...
            </strong>

            <p
                id="musicProgress"
                style="
                    margin-top:10px;
                    color:#888895;
                    font-size:12px;
                "
            >
                Request accepted.
                Waiting for AI music generation...
            </p>

        `;


        await waitForMusic(
            requestId,
            status,
            genre,
            mood,
            length
        );


    } catch(error) {


        console.error(
            "GLOW MUSIC ERROR:",
            error
        );


        status.innerHTML = `

            <div
                style="
                    font-size:32px;
                    margin-bottom:10px;
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
                    error.message
                )}
            </p>


            <button
                type="button"
                class="card-btn"
                onclick="openStudio('music')"
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
   POLL MUSIC STATUS
   ========================================================= */

async function waitForMusic(
    requestId,
    status,
    genre,
    mood,
    length
) {


    const maximumAttempts =
        120;


    for (
        let attempt = 1;
        attempt <= maximumAttempts;
        attempt++
    ) {


        const response =
            await fetch(
                "/api/music/status/" +
                encodeURIComponent(
                    requestId
                )
            );


        let data;


        try {

            data =
                await response.json();

        } catch(error) {

            throw new Error(
                "The music status response was invalid."
            );

        }


        console.log(
            "GLOW music status:",
            data
        );


        if (
            !response.ok ||
            data.success === false
        ) {

            throw new Error(
                data.error ||
                "Unable to check music generation status."
            );

        }


        const currentStatus =
            String(
                data.status ||
                "PROCESSING"
            ).toUpperCase();


        const progress =
            document.getElementById(
                "musicProgress"
            );


        if (progress) {

            progress.textContent =
                "Status: " +
                currentStatus +
                " • Check " +
                attempt +
                "/" +
                maximumAttempts;

        }


        /* ================================================
           COMPLETED
        ================================================= */

        if (
            currentStatus ===
            "COMPLETED"
        ) {


            if (!data.audio) {

                throw new Error(
                    "The song finished generating, but no audio URL was returned."
                );

            }


            status.innerHTML = `

                <div
                    style="
                        font-size:38px;
                        margin-bottom:10px;
                    "
                >
                    🎉
                </div>


                <strong
                    style="
                        font-size:18px;
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
                        margin-top:20px;
                    "
                    src="${escapeHTML(
                        data.audio
                    )}"
                ></audio>


                <a
                    href="${escapeHTML(
                        data.audio
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    download="GLOW-AI-Song.mp3"
                    style="
                        display:block;
                        margin-top:16px;
                        padding:14px;
                        border-radius:13px;
                        text-align:center;
                        text-decoration:none;
                        color:white;
                        background:
                            linear-gradient(
                                135deg,
                                #7c3aed,
                                #ec4899
                            );
                        font-weight:bold;
                    "
                >
                    ⬇️ Download Song
                </a>

            `;


            return;

        }


        /* ================================================
           FAILED
        ================================================= */

        if (
            currentStatus === "FAILED" ||
            currentStatus === "ERROR"
        ) {


            throw new Error(
                data.error ||
                "Pixazo could not generate the song."
            );

        }


        /* ================================================
           WAIT 5 SECONDS
        ================================================= */

        await sleep(5000);

    }


    throw new Error(
        "Music generation is taking too long. Please try again."
    );

}



/* =========================================================
   VIDEO GENERATION
   ========================================================= */

async function generateVideo(event) {

    event.preventDefault();


    const promptElement =
        document.getElementById(
            "videoPrompt"
        );


    const styleElement =
        document.getElementById(
            "videoStyle"
        );


    const moodElement =
        document.getElementById(
            "videoMood"
        );


    const lengthElement =
        document.getElementById(
            "videoLength"
        );


    const button =
        document.getElementById(
            "generateVideoBtn"
        );


    const status =
        document.getElementById(
            "videoGenerationStatus"
        );


    if (
        !promptElement ||
        !button ||
        !status
    ) {

        return;

    }


    const prompt =
        promptElement.value.trim();


    const style =
        styleElement
            ? styleElement.value
            : "Cinematic";


    const mood =
        moodElement
            ? moodElement.value
            : "Epic";


    const duration =
        lengthElement
            ? lengthElement.value
            : "5 seconds";


    if (!prompt) {

        alert(
            "Please describe the video you want to create."
        );

        return;

    }


    button.disabled = true;

    button.textContent =
        "🎬 Preparing Video...";


    status.classList.add(
        "active"
    );


    status.innerHTML = `

        <div class="loading-ring"></div>

        <strong>
            GLOW Video Studio
        </strong>

        <p
            style="
                margin-top:10px;
                color:#888895;
                font-size:13px;
                line-height:1.7;
            "
        >
            Your video request has been prepared.
        </p>

    `;


    /*
       Video API connection will be added
       after the music engine is confirmed
       working.
    */


    setTimeout(
        function() {

            status.innerHTML = `

                <div
                    style="
                        font-size:35px;
                        margin-bottom:10px;
                    "
                >
                    🎬
                </div>


                <strong>
                    Video Studio Ready
                </strong>


                <p
                    style="
                        margin-top:10px;
                        color:#888895;
                        font-size:13px;
                        line-height:1.7;
                    "
                >
                    ${escapeHTML(style)}
                    •
                    ${escapeHTML(mood)}
                    •
                    ${escapeHTML(duration)}
                </p>


                <p
                    style="
                        margin-top:10px;
                        color:#888895;
                        font-size:13px;
                        line-height:1.7;
                    "
                >
                    Your video engine will be
                    connected to the AI video API next.
                </p>

            `;


            button.disabled = false;

            button.textContent =
                "🎬 Generate AI Video";


        },
        1000
    );

}



/* =========================================================
   SLEEP
   ========================================================= */

function sleep(milliseconds) {

    return new Promise(
        function(resolve) {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}



/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}



/* =========================================================
   STARTUP
   ========================================================= */

console.log(
    "✨ GLOW AI STUDIO 2027 loaded"
);

console.log(
    "🎵 Music Studio ready"
);

console.log(
    "🎬 Video Studio ready"
);
