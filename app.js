/* =========================================================
   GLOW AI STUDIO 2027
   MUSIC + VIDEO STUDIO
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
                >
                    🎵 Generate Music
                </button>

            </form>

        `;


        const musicForm =
            document.getElementById("musicForm");

        if (musicForm) {

            musicForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    const prompt =
                        document.getElementById("songPrompt").value.trim();

                    if (!prompt) {

                        alert(
                            "Please describe the song you want to create."
                        );

                        return;
                    }

                    alert(
                        "🎵 GLOW MUSIC\n\n" +
                        "Your music request has been received."
                    );

                }
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


        const videoForm =
            document.getElementById("videoForm");

        if (videoForm) {

            videoForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    const prompt =
                        document.getElementById("videoPrompt").value.trim();

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
