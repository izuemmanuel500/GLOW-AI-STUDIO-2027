/* =========================================================
   GLOW AI STUDIO 2027
   PIXAZO MUSIC + VIDEO FRONTEND
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("✨ GLOW AI STUDIO 2027 loaded");


    const modal =
        document.getElementById("studioModal");

    const modalContent =
        document.getElementById("modalContent");


    /* =====================================================
       OPEN STUDIO
       ===================================================== */

    window.openStudio = function (type) {

        if (!modal || !modalContent) {

            console.error(
                "GLOW: Studio modal not found."
            );

            return;
        }


        /* =================================================
           MUSIC STUDIO
           ================================================= */

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
                            placeholder="Example: Create an energetic modern Afrobeat song about chasing your dreams and becoming successful. Use powerful African drums, deep warm bass, catchy guitar, beautiful piano and inspiring vocals..."
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
                                    Amapiano
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
                                    Sad
                                </option>

                                <option>
                                    Emotional
                                </option>

                                <option>
                                    Motivational
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
