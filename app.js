/* =========================================================
   GLOW AI STUDIO 2027
   COMPLETE FRONTEND JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("GLOW AI STUDIO 2027 loaded");

    const modal = document.getElementById("studioModal");
    const modalContent = document.getElementById("modalContent");

    /* =====================================================
       OPEN STUDIO
       ===================================================== */

    window.openStudio = function (type) {

        console.log("Opening studio:", type);

        if (!modal || !modalContent) {
            console.error("Studio modal elements not found.");
            return;
        }

        /* ================= MUSIC ================= */

        if (type === "music") {

            modalContent.innerHTML = `

                <div class="studio-modal-header">

                    <span class="studio-modal-badge">
                        🎵 GLOW MUSIC STUDIO
                    </span>

                    <h2>Create Your Music</h2>

                    <p>
                        Turn your idea into an AI-generated
                        music project with rhythm, instruments,
                        vocals and professional production.
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
                            Tell GLOW about the story, sound,
                            instruments, vocals and feeling.
                        </span>

                        <textarea
                            id="songPrompt"
                            placeholder="Example: Create an energetic Afrobeat song about chasing dreams and becoming successful, with powerful African drums, warm bass, guitar, piano and inspiring vocals..."
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
                                Song Length
                            </label>

                            <select id="length">

                                <option value="30">
                                    30 seconds
                                </option>

                                <option value="60" selected>
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
                document.getElementById("musicForm");

            if (musicForm) {

                musicForm.addEventListener(
                    "submit",
                    generateMusic
                );

            }

        }


        /* ================= VIDEO ================= */

        else if (type === "video") {

            modalContent.innerHTML = `

                <div class="studio-modal-header">

                    <span class="studio-modal-badge">
                        🎬 GLOW VIDEO STUDIO
                    </span>

                    <h2>Create Your Video</h2>

                    <p>
                        Turn your imagination into a cinematic
                        video with characters, scenes, action,
                        music and story direction.
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
                            Describe your story, characters,
                            location, action and visual style.
                        </span>

                        <textarea
                            id="videoPrompt"
                            placeholder="Example: A young Nigerian footballer rises from a small neighborhood football pitch and becomes a world-famous player..."
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
                document.getElementById("videoForm");

            if (videoForm) {

                videoForm.addEventListener(
                    "submit",
                    generateVideo
                );

            }

        }


        modal.classList.add("active");

        document.body.style.overflow = "hidden";

    };


    /* =====================================================
       CLOSE MODAL
       ===================================================== */

    window.closeStudio = function () {

        if (!modal) return;

        modal.classList.remove("active");

        document.body.style.overflow = "";

    };


    window.closeStudioOutside = function (event) {

        if (event.target === modal) {

            window.closeStudio();

        }

    };


    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                window.closeStudio();

            }

        }
    );


    /* =====================================================
       AUTOMATIC BUTTON CONNECTION
       ===================================================== */

    const allButtons =
        document.querySelectorAll("button");

    allButtons.forEach(function (button) {

        const text =
            button.textContent
                .toLowerCase()
                .trim();


        /* MUSIC BUTTON */

        if (
            text.includes("create music") ||
            text.includes("🎵 create music")
        ) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.openStudio("music");

                }
            );

        }


        /* VIDEO BUTTON */

        if (
            text.includes("create video") ||
            text.includes("🎬 create video")
        ) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.openStudio("video");

                }
            );

        }

    });


    /* =====================================================
       MUSIC GENERATION
       ===================================================== */

    async function generateMusic(event) {

        event.preventDefault();


        const prompt =
            document.getElementById(
                "songPrompt"
            ).value.trim();


        const genre =
            document.getElementById(
                "genre"
            ).value;


        const mood =
            document.getElementById(
                "mood"
            ).value;


        const length =
            Number(
                document.getElementById(
                    "length"
                ).value
            );


        const button =
            document.getElementById(
                "generateMusicBtn"
            );


        const status =
            document.getElementById(
                "generationStatus"
            );


        if (!prompt) {

            alert(
                "Please describe the song you want to create."
            );

            return;

        }


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
                "
            >
                AI music generation is in progress.
                Please wait...
            </p>

        `;


        const finalPrompt = `

Create a complete professional ${genre} song.

Mood: ${mood}.

Song idea:

${prompt}

Create an original musical production with
appropriate drums, bass, melody, instruments,
rhythm, arrangement and professional production.

If vocals are appropriate, create original
vocals and lyrics that fit the song.

Make the result polished, emotional,
engaging and suitable for a professional
music release.

`;


        try {

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


            let data;

            try {

                data =
                    await response.json();

            } catch (error) {

                throw new Error(
                    "The server returned an invalid response."
                );

            }


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.error ||
                    "Music generation failed."
                );

            }


            if (!data.audio) {

                throw new Error(
                    "No audio was returned by the AI music engine."
                );

            }


            status.innerHTML = `

                <div
                    style="
                        font-size:34px;
                        margin-bottom:8px;
                    "
                >
                    🎉
                </div>


                <strong>
                    Your song is ready!
                </strong>


                <p
                    style="
                        margin-top:8px;
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


        } catch (error) {

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
                        error.message
                    )}
                </p>

            `;

        } finally {

            button.disabled = false;

            button.textContent =
                "🎵 Generate AI Song";

        }

    }


    /* =====================================================
       VIDEO GENERATION
       ===================================================== */

    async function generateVideo(event) {

        event.preventDefault();


        const prompt =
            document.getElementById(
                "videoPrompt"
            ).value.trim();


        const style =
            document.getElementById(
                "videoStyle"
            ).value;


        const mood =
            document.getElementById(
                "videoMood"
            ).value;


        const duration =
            document.getElementById(
                "videoLength"
            ).value;


        const button =
            document.getElementById(
                "generateVideoBtn"
            );


        const status =
            document.getElementById(
                "videoGenerationStatus"
            );


        if (!prompt) {

            alert(
                "Please describe the video you want to create."
            );

            return;

        }


        button.disabled = true;

        button.textContent =
            "🎬 Preparing Video...";


        status.classList.add("active");


        status.innerHTML = `

            <div class="loading-ring"></div>

            <strong>
                GLOW Video Studio is preparing your project...
            </strong>

            <p
                style="
                    margin-top:8px;
                    color:#888895;
                    font-size:13px;
                "
            >
                Your cinematic project is being prepared.
            </p>

        `;


        setTimeout(
            function () {

                status.innerHTML = `

                    <div
                        style="
                            font-size:32px;
                            margin-bottom:8px;
                        "
                    >
                        🎬
                    </div>


                    <strong>
                        Video project prepared
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
                        Your story is ready for the
                        GLOW AI Video Engine.
                    </p>

                `;


                button.disabled = false;

                button.textContent =
                    "🎬 Generate AI Video";

            },
            1200
        );

    }


    /* =====================================================
       SECURITY
       ===================================================== */

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


    console.log(
        "🎵 Music Studio button: READY"
    );

    console.log(
        "🎬 Video Studio button: READY"
    );

});
