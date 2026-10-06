/* =====================================================
   GLOW AI STUDIO 2027
   MAIN APPLICATION
===================================================== */

let currentUser = null;
let currentStudio = null;


/* =====================================================
   BASIC HELPERS
===================================================== */

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


async function api(url, options = {}) {

    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            "Something went wrong."
        );
    }

    return data;
}


/* =====================================================
   STUDIO MODAL
===================================================== */

function openStudio(type) {

    currentStudio = type;

    const modal = document.getElementById("studioModal");
    const content = document.getElementById("modalContent");

    if (!modal || !content) {
        return;
    }


    /* ================================================
       MUSIC
    ================================================= */

    if (type === "music") {

        content.innerHTML = `

            <div class="studio-modal-header">

                <div class="studio-modal-badge">
                    🎵 GLOW MUSIC
                </div>

                <h2>
                    AI Music Studio
                </h2>

                <p>
                    Turn your imagination into an original song.
                </p>

            </div>


            <form
                class="music-form"
                onsubmit="generateMusic(event)"
            >

                <div class="form-group">

                    <label>
                        Describe your song
                    </label>

                    <textarea
                        id="musicPrompt"
                        rows="5"
                        placeholder="Example: A powerful Nigerian Afrobeat song about success, love and never giving up..."
                        required
                    ></textarea>

                    <div class="form-hint">
                        Describe the story, feeling, instruments,
                        vocals and sound you want.
                    </div>

                </div>


                <div class="form-options">

                    <div class="form-group">

                        <label>
                            Genre
                        </label>

                        <select
                            id="musicGenre"
                            class="select-box"
                        >

                            <option value="Afrobeat">
                                Afrobeat
                            </option>

                            <option value="Afropop">
                                Afropop
                            </option>

                            <option value="Amapiano">
                                Amapiano
                            </option>

                            <option value="Hip-Hop">
                                Hip-Hop
                            </option>

                            <option value="R&B">
                                R&B
                            </option>

                            <option value="Pop">
                                Pop
                            </option>

                            <option value="Gospel">
                                Gospel
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Mood
                        </label>

                        <select
                            id="musicMood"
                            class="select-box"
                        >

                            <option value="Energetic">
                                Energetic
                            </option>

                            <option value="Happy">
                                Happy
                            </option>

                            <option value="Romantic">
                                Romantic
                            </option>

                            <option value="Emotional">
                                Emotional
                            </option>

                            <option value="Dark">
                                Dark
                            </option>

                            <option value="Inspirational">
                                Inspirational
                            </option>

                        </select>

                    </div>

                </div>


                <div class="form-group">

                    <label>
                        Song Length
                    </label>

                    <select
                        id="musicLength"
                        class="select-box"
                    >

                        <option value="60000">
                            1 minute
                        </option>

                        <option value="120000">
                            2 minutes
                        </option>

                        <option value="180000" selected>
                            3 minutes
                        </option>

                        <option value="240000">
                            4 minutes
                        </option>

                        <option value="300000">
                            5 minutes
                        </option>

                    </select>

                </div>


                <button
                    type="submit"
                    class="generate-btn"
                >
                    🎵 Generate Music
                </button>


                <div
                    id="musicStatus"
                    class="generation-status"
                ></div>

            </form>

        `;

        modal.classList.add("active");

        return;
    }


    /* ================================================
       VIDEO
    ================================================= */

    if (type === "video") {

        content.innerHTML = `

            <div class="studio-modal-header">

                <div class="studio-modal-badge">
                    🎬 GLOW VIDEO
                </div>

                <h2>
                    AI Video Studio
                </h2>

                <p>
                    Transform your story into cinematic visuals.
                </p>

            </div>


            <form
                class="music-form"
                onsubmit="generateVideo(event)"
            >

                <div class="form-group">

                    <label>
                        Describe your video
                    </label>

                    <textarea
                        id="videoPrompt"
                        rows="6"
                        placeholder="Example: A young Nigerian artist walking through Lagos at night, cinematic lighting, realistic characters, dramatic camera movement..."
                        required
                    ></textarea>

                </div>


                <div class="form-options">

                    <div class="form-group">

                        <label>
                            Visual Style
                        </label>

                        <select
                            id="videoStyle"
                            class="select-box"
                        >

                            <option value="Cinematic">
                                Cinematic
                            </option>

                            <option value="Realistic">
                                Realistic
                            </option>

                            <option value="Music Video">
                                Music Video
                            </option>

                            <option value="Anime">
                                Anime
                            </option>

                            <option value="Fantasy">
                                Fantasy
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Mood
                        </label>

                        <select
                            id="videoMood"
                            class="select-box"
                        >

                            <option value="Epic">
                                Epic
                            </option>

                            <option value="Happy">
                                Happy
                            </option>

                            <option value="Dramatic">
                                Dramatic
                            </option>

                            <option value="Emotional">
                                Emotional
                            </option>

                            <option value="Dark">
                                Dark
                            </option>

                        </select>

                    </div>

                </div>


                <div class="form-group">

                    <label>
                        Duration
                    </label>

                    <select
                        id="videoDuration"
                        class="select-box"
                    >

                        <option value="5">
                            5 seconds
                        </option>

                        <option value="10">
                            10 seconds
                        </option>

                        <option value="15">
                            15 seconds
                        </option>

                        <option value="30">
                            30 seconds
                        </option>

                    </select>

                </div>


                <button
                    type="submit"
                    class="generate-btn"
                >
                    🎬 Generate Video
                </button>


                <div
                    id="videoStatus"
                    class="generation-status"
                ></div>

            </form>

        `;

        modal.classList.add("active");

        return;
    }


    /* ================================================
       IMAGE
    ================================================= */

    if (type === "image") {

        content.innerHTML = `

            <div class="studio-modal-header">

                <div class="studio-modal-badge">
                    🖼️ GLOW IMAGE
                </div>

                <h2>
                    AI Picture Studio
                </h2>

                <p>
                    Create or transform images with AI.
                </p>

            </div>


            <form
                class="music-form"
                onsubmit="generateImage(event)"
            >

                <div class="form-group">

                    <label>
                        Upload Picture
                    </label>

                    <input
                        type="file"
                        id="imageFile"
                        accept="image/*"
                    >

                    <div class="form-hint">
                        Upload a picture if you want GLOW
                        to edit or transform it.
                    </div>

                </div>


                <div class="form-group">

                    <label>
                        What should GLOW create?
                    </label>

                    <textarea
                        id="imagePrompt"
                        rows="5"
                        placeholder="Example: Replace the background with a beautiful Lagos skyline at sunset..."
                        required
                    ></textarea>

                </div>


                <div class="form-group">

                    <label>
                        Image Mode
                    </label>

                    <select
                        id="imageMode"
                        class="select-box"
                    >

                        <option value="create">
                            Create New Image
                        </option>

                        <option value="edit">
                            Edit Uploaded Picture
                        </option>

                        <option value="background">
                            Replace Background
                        </option>

                        <option value="enhance">
                            Enhance Picture
                        </option>

                        <option value="remove">
                            Remove Object
                        </option>

                    </select>

                </div>


                <button
                    type="submit"
                    class="generate-btn"
                >
                    🖼️ Generate Image
                </button>


                <div
                    id="imageStatus"
                    class="generation-status"
                ></div>

            </form>

        `;

        modal.classList.add("active");

        return;
    }
}


/* =====================================================
   CLOSE STUDIO
===================================================== */

function closeStudio() {

    const modal = document.getElementById("studioModal");

    if (modal) {
        modal.classList.remove("active");
    }
}


function closeStudioOutside(event) {

    if (
        event.target &&
        event.target.id === "studioModal"
    ) {
        closeStudio();
    }
}


/* =====================================================
   MUSIC GENERATION
===================================================== */

async function generateMusic(event) {

    event.preventDefault();

    const status =
        document.getElementById("musicStatus");

    const prompt =
        document.getElementById("musicPrompt").value.trim();

    const genre =
        document.getElementById("musicGenre").value;

    const mood =
        document.getElementById("musicMood").value;

    const length =
        Number(
            document.getElementById("musicLength").value
        );


    if (!prompt) {
        status.textContent =
            "Please describe the song you want.";
        return;
    }


    status.innerHTML = `
        <div class="loading-ring"></div>
        <p>
            GLOW is creating your music...
        </p>
    `;


    try {

        const finalPrompt =
            `${genre}, ${mood}. ${prompt}`;


        const result = await api(
            "/api/music",
            {
                method: "POST",

                body: JSON.stringify({
                    prompt: finalPrompt,
                    music_length_ms: length
                })
            }
        );


        if (!result.request_id) {

            status.innerHTML = `
                <p>
                    Music request was received.
                </p>
            `;

            return;
        }


        status.innerHTML = `
            <div class="loading-ring"></div>
            <p>
                Music generation started...
            </p>
        `;


        pollMusicStatus(
            result.request_id,
            status
        );

    } catch (error) {

        status.innerHTML = `
            <p>
                ❌ ${escapeHTML(error.message)}
            </p>
        `;

    }
}


/* =====================================================
   MUSIC STATUS
===================================================== */

async function pollMusicStatus(
    requestId,
    statusElement
) {

    let attempts = 0;

    const maxAttempts = 120;


    const check = async () => {

        attempts++;


        if (attempts > maxAttempts) {

            statusElement.innerHTML = `
                <p>
                    Generation is taking longer than expected.
                    Please check your creations later.
                </p>
            `;

            return;
        }


        try {

            const result = await api(
                `/api/music/status/${encodeURIComponent(requestId)}`,
                {
                    method: "GET",
                    headers: {}
                }
            );


            const status =
                String(
                    result.status || ""
                ).toLowerCase();


            if (
                status === "completed" ||
                status === "complete" ||
                status === "succeeded" ||
                status === "success"
            ) {

                const audioUrl =
                    result.audio_url ||
                    result.media_url ||
                    result.url;


                if (audioUrl) {

                    statusElement.innerHTML = `

                        <p>
                            ✅ Your song is ready!
                        </p>

                        <audio
                            controls
                            style="width:100%;"
                            src="${escapeHTML(audioUrl)}"
                        ></audio>

                        <br>

                        <a
                            href="${escapeHTML(audioUrl)}"
                            target="_blank"
                            rel="noopener"
                        >
                            🎧 Open / Download Song
                        </a>

                    `;

                } else {

                    statusElement.innerHTML = `
                        <p>
                            ✅ Music generation completed.
                        </p>
                    `;
                }


                loadCreations();

                return;
            }


            if (
                status === "failed" ||
                status === "error" ||
                status === "cancelled"
            ) {

                statusElement.innerHTML = `
                    <p>
                        ❌ Music generation failed.
                    </p>
                `;

                return;
            }


            statusElement.innerHTML = `
                <div class="loading-ring"></div>
                <p>
                    GLOW is still creating your song...
                </p>
            `;


            setTimeout(
                check,
                5000
            );

        } catch (error) {

            statusElement.innerHTML = `
                <p>
                    Checking generation status...
                </p>
            `;

            setTimeout(
                check,
                5000
            );
        }
    };


    check();
}


/* =====================================================
   VIDEO GENERATION
===================================================== */

async function generateVideo(event) {

    event.preventDefault();

    const status =
        document.getElementById("videoStatus");

    const prompt =
        document.getElementById("videoPrompt").value.trim();

    const style =
        document.getElementById("videoStyle").value;

    const mood =
        document.getElementById("videoMood").value;

    const duration =
        document.getElementById("videoDuration").value;


    if (!prompt) {

        status.textContent =
            "Please describe your video.";

        return;
    }


    /*
       The backend video engine is not connected yet.
       We keep the interface ready so we can connect
       the actual AI video provider in the next stage.
    */

    status.innerHTML = `

        <p>
            🎬 Your video request is ready.
        </p>

        <p>
            Video engine connection will be added
            to the GLOW backend next.
        </p>

        <small>
            ${escapeHTML(style)}
            ·
            ${escapeHTML(mood)}
            ·
            ${escapeHTML(duration)} seconds
        </small>

    `;
}


/* =====================================================
   IMAGE GENERATION
===================================================== */

async function generateImage(event) {

    event.preventDefault();

    const status =
        document.getElementById("imageStatus");

    const prompt =
        document.getElementById("imagePrompt").value.trim();

    const mode =
        document.getElementById("imageMode").value;

    const fileInput =
        document.getElementById("imageFile");


    if (!prompt) {

        status.textContent =
            "Please describe what you want GLOW to create.";

        return;
    }


    /*
       Image UI is ready.
       The actual image AI provider will be connected
       through app.py rather than exposing an API key
       in the browser.
    */

    status.innerHTML = `

        <p>
            🖼️ Image request prepared.
        </p>

        <p>
            Image AI engine connection will be added
            to the GLOW backend next.
        </p>

        <small>
            Mode: ${escapeHTML(mode)}
        </small>

    `;


    if (
        fileInput &&
        fileInput.files &&
        fileInput.files.length > 0
    ) {

        status.innerHTML += `
            <p>
                📷 Picture selected:
                ${escapeHTML(fileInput.files[0].name)}
            </p>
        `;
    }
}


/* =====================================================
   ACCOUNT SYSTEM
===================================================== */

function openAccount(mode = "login") {

    const modal =
        document.getElementById("accountModal");

    const content =
        document.getElementById("accountContent");


    if (!modal || !content) {
        return;
    }


    if (mode === "signup") {

        content.innerHTML = `

            <div class="studio-modal-header">

                <div class="studio-modal-badge">
                    ✨ GLOW ACCOUNT
                </div>

                <h2>
                    Create Your Account
                </h2>

                <p>
                    Join GLOW AI STUDIO 2027.
                </p>

            </div>


            <form
                class="music-form"
                onsubmit="signup(event)"
            >

                <div class="form-group">

                    <label>
                        Username
                    </label>

                    <input
                        id="signupUsername"
                        type="text"
                        placeholder="Choose a username"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Email
                    </label>

                    <input
                        id="signupEmail"
                        type="email"
                        placeholder="Your email address"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Password
                    </label>

                    <input
                        id="signupPassword"
                        type="password"
                        placeholder="Create a password"
                        required
                    >

                </div>


                <button
                    type="submit"
                    class="generate-btn"
                >
                    ✨ Create Account
                </button>


                <div
                    id="accountStatus"
                    class="generation-status"
                ></div>


                <p>
                    Already have an account?
                    <button
                        type="button"
                        onclick="openAccount('login')"
                    >
                        Sign In
                    </button>
                </p>

            </form>

        `;

        modal.classList.add("active");

        return;
    }


    content.innerHTML = `

        <div class="studio-modal-header">

            <div class="studio-modal-badge">
                🔐 GLOW ACCOUNT
            </div>

            <h2>
                Welcome Back
            </h2>

            <p>
                Sign in to your GLOW account.
            </p>

        </div>


        <form
            class="music-form"
            onsubmit="login(event)"
        >

            <div class="form-group">

                <label>
                    Username
                </label>

                <input
                    id="loginUsername"
                    type="text"
                    placeholder="Your username"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Password
                </label>

                <input
                    id="loginPassword"
                    type="password"
                    placeholder="Your password"
                    required
                >

            </div>


            <button
                type="submit"
                class="generate-btn"
            >
                🔐 Sign In
            </button>


            <div
                id="accountStatus"
                class="generation-status"
            ></div>


            <p>
                Don't have an account?
                <button
                    type="button"
                    onclick="openAccount('signup')"
                >
                    Create Account
                </button>
            </p>

        </form>

    `;


    modal.classList.add("active");
}


/* =====================================================
   CLOSE ACCOUNT
===================================================== */

function closeAccount() {

    const modal =
        document.getElementById("accountModal");

    if (modal) {
        modal.classList.remove("active");
    }
}


function closeAccountOutside(event) {

    if (
        event.target &&
        event.target.id === "accountModal"
    ) {
        closeAccount();
    }
}


/* =====================================================
   SIGN UP
===================================================== */

async function signup(event) {

    event.preventDefault();


    const status =
        document.getElementById("accountStatus");


    const username =
        document
            .getElementById("signupUsername")
            .value
            .trim();


    const email =
        document
            .getElementById("signupEmail")
            .value
            .trim();


    const password =
        document
            .getElementById("signupPassword")
            .value;


    status.innerHTML = `
        <div class="loading-ring"></div>
        <p>
            Creating your GLOW account...
        </p>
    `;


    try {

        const result =
            await api(
                "/api/auth/signup",
                {
                    method: "POST",

                    body: JSON.stringify({
                        username,
                        email,
                        password
                    })
                }
            );


        currentUser =
            result.user || null;


        status.innerHTML = `
            <p>
                ✅ Account created successfully!
            </p>
        `;


        setTimeout(
            () => {
                closeAccount();
                updateAccountButton();
                loadCreations();
            },
            1000
        );


    } catch (error) {

        status.innerHTML = `
            <p>
                ❌ ${escapeHTML(error.message)}
            </p>
        `;

    }
}


/* =====================================================
   LOGIN
===================================================== */

async function login(event) {

    event.preventDefault();


    const status =
        document.getElementById("accountStatus");


    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();


    const password =
        document
            .getElementById("loginPassword")
            .value;


    status.innerHTML = `
        <div class="loading-ring"></div>
        <p>
            Signing you in...
        </p>
    `;


    try {

        const result =
            await api(
                "/api/auth/login",
                {
                    method: "POST",

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );


        currentUser =
            result.user || null;


        status.innerHTML = `
            <p>
                ✅ Welcome to GLOW!
            </p>
        `;


        setTimeout(
            () => {
                closeAccount();
                updateAccountButton();
                loadCreations();
            },
            800
        );


    } catch (error) {

        status.innerHTML = `
            <p>
                ❌ ${escapeHTML(error.message)}
            </p>
        `;

    }
}


/* =====================================================
   LOAD CURRENT USER
===================================================== */

async function loadCurrentUser() {

    try {

        const result =
            await api(
                "/api/auth/me",
                {
                    method: "GET",
                    headers: {}
                }
            );


        currentUser =
            result.user || null;


    } catch (error) {

        currentUser = null;

    }


    updateAccountButton();
}


/* =====================================================
   ACCOUNT BUTTON
===================================================== */

function updateAccountButton() {

    const button =
        document.querySelector(".login-btn");


    if (!button) {
        return;
    }


    if (currentUser) {

        button.textContent =
            "👤 " +
            (
                currentUser.username ||
                "Account"
            );

        button.onclick =
            () => openProfile();

    } else {

        button.textContent =
            "Sign In";

        button.onclick =
            () => openAccount("login");

    }
}


/* =====================================================
   PROFILE
===================================================== */

async function openProfile() {

    const modal =
        document.getElementById("accountModal");

    const content =
        document.getElementById("accountContent");


    if (!modal || !content) {
        return;
    }


    try {

        const result =
            await api(
                "/api/profile",
                {
                    method: "GET",
                    headers: {}
                }
            );


        const user =
            result.user ||
            currentUser ||
            {};


        content.innerHTML = `

            <div class="studio-modal-header">

                <div class="studio-modal-badge">
                    👤 GLOW PROFILE
                </div>

                <h2>
                    ${escapeHTML(
                        user.profile_name ||
                        user.username ||
                        "GLOW Creator"
                    )}
                </h2>

                <p>
                    @${escapeHTML(
                        user.username || ""
                    )}
                </p>

            </div>


            <div class="music-form">

                <div class="form-group">

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        value="${escapeHTML(
                            user.email || ""
                        )}"
                        disabled
                    >

                </div>


                <div class="form-group">

                    <label>
                        Plan
                    </label>

                    <input
                        value="${escapeHTML(
                            user.plan || "free"
                        ).toUpperCase()}"
                        disabled
                    >

                </div>


                <div class="form-group">

                    <label>
                        AI Credits
                    </label>

                    <input
                        value="${escapeHTML(
                            user.credits ?? 0
                        )}"
                        disabled
                    >

                </div>


                <button
                    type="button"
                    class="generate-btn"
                    onclick="openSubscription()"
                >
                    💳 Manage Subscription
                </button>


                <button
                    type="button"
                    class="generate-btn"
                    onclick="logout()"
                >
                    🚪 Logout
                </button>

            </div>

        `;


        modal.classList.add("active");

    } catch (error) {

        openAccount("login");

    }
}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

    try {

        await api(
            "/api/auth/logout",
            {
                method: "POST",
                body: JSON.stringify({})
            }
        );

    } catch (error) {
        /* Continue clearing local state. */
    }


    currentUser = null;

    closeAccount();

    updateAccountButton();

    loadCreations();
}


/* =====================================================
   SUBSCRIPTIONS
===================================================== */

async function openSubscription(selectedPlan = "") {

    const modal =
        document.getElementById("accountModal");

    const content =
        document.getElementById("accountContent");


    if (!modal || !content) {
        return;
    }


    let plans = [];


    try {

        const result =
            await api(
                "/api/plans",
                {
                    method: "GET",
                    headers: {}
                }
            );


        plans =
            result.plans || [];

    } catch (error) {

        plans = [
            {
                id: "free",
                name: "Free",
                credits: 10
            },
            {
                id: "creator",
                name: "Creator",
                credits: 100
            },
            {
                id: "pro",
                name: "Pro",
                credits: 300
            },
            {
                id: "studio",
                name: "Studio",
                credits: 1000
            }
        ];

    }


    let cards = "";


    plans.forEach(
        plan => {

            const selected =
                String(plan.id).toLowerCase() ===
                String(selectedPlan).toLowerCase();


            cards += `

                <div class="studio-card">

                    <div class="card-icon">
                        ${
                            plan.id === "studio"
                                ? "👑"
                                : plan.id === "pro"
                                    ? "💎"
                                    : plan.id === "creator"
                                        ? "🚀"
                                        : "✨"
                        }
                    </div>


                    <div class="card-label">
                        GLOW ${escapeHTML(
                            plan.name || plan.id
                        )}
                    </div>


                    <h3>
                        ${escapeHTML(
                            plan.name || plan.id
                        )}
                    </h3>


                    <p>
                        ${
                            plan.credits !== undefined
                                ? escapeHTML(
                                    String(plan.credits)
                                ) +
                                  " AI credits"
                                : "AI creation access"
                        }
                    </p>


                    <button
                        type="button"
                        class="card-btn"
                        onclick="selectPlan('${escapeHTML(
                            plan.id
                        )}')"
                    >
                        ${
                            selected
                                ? "✓ Selected"
                                : "Choose Plan"
                        }
                    </button>

                </div>

            `;
        }
    );


    content.innerHTML = `

        <div class="studio-modal-header">

            <div class="studio-modal-badge">
                💳 GLOW MEMBERSHIP
            </div>

            <h2>
                Choose Your Plan
            </h2>

            <p>
                Weekly creative power for your GLOW account.
            </p>

        </div>


        <div class="studio-grid">

            ${cards}

        </div>


        <div
            id="subscriptionStatus"
            class="generation-status"
        ></div>

    `;


    modal.classList.add("active");
}


/* =====================================================
   SELECT PLAN
===================================================== */

async function selectPlan(planId) {

    const status =
        document.getElementById(
            "subscriptionStatus"
        );


    if (!currentUser) {

        if (status) {

            status.innerHTML = `
                <p>
                    🔐 Please sign in before choosing
                    a subscription.
                </p>
            `;
        }

        setTimeout(
            () => openAccount("login"),
            1000
        );

        return;
    }


    /*
       Payment processing is not connected yet.
       We do NOT pretend a payment happened.

       The backend already contains subscription
       database structures. The real payment gateway
       will be connected in a later step.
    */

    if (status) {

        status.innerHTML = `

            <p>
                💳 ${escapeHTML(
                    planId
                ).toUpperCase()} selected.
            </p>

            <p>
                Payment activation will be connected
                next.
            </p>

        `;
    }
}


/* =====================================================
   CREATIONS
===================================================== */

async function loadCreations() {

    const container =
        document.getElementById(
            "creationsContainer"
        );


    if (!container) {
        return;
    }


    if (!currentUser) {

        container.innerHTML = `

            <div class="empty-icon">
                🔐
            </div>

            <h3>
                Sign in to view your creations
            </h3>

            <p>
                Your music, videos and images
                will be saved to your GLOW account.
            </p>

            <button
                type="button"
                class="card-btn"
                onclick="openAccount('login')"
            >
                🔐 Sign In
            </button>

        `;

        return;
    }


    try {

        const result =
            await api(
                "/api/creations",
                {
                    method: "GET",
                    headers: {}
                }
            );


        const creations =
            result.creations || [];


        if (!creations.length) {

            container.innerHTML = `

                <div class="empty-icon">
                    ✨
                </div>

                <h3>
                    Your creations will appear here
                </h3>

                <p>
                    Generate your first song, video
                    or image and it will be ready here.
                </p>

            `;

            return;
        }


        container.innerHTML = `

            <div>

                <h3>
                    Your Creations
                </h3>

                <p>
                    ${creations.length}
                    creation(s)
                </p>

            </div>

        `;


        creations.forEach(
            creation => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "studio-card";


                item.innerHTML = `

                    <div class="card-icon">
                        ${
                            creation.creation_type === "music"
                                ? "🎵"
                                : creation.creation_type === "video"
                                    ? "🎬"
                                    : "🖼️"
                        }
                    </div>


                    <div class="card-label">
                        GLOW ${escapeHTML(
                            creation.creation_type ||
                            "CREATION"
                        ).toUpperCase()}
                    </div>


                    <h3>
                        ${escapeHTML(
                            creation.status ||
                            "Creation"
                        )}
                    </h3>


                    <p>
                        ${escapeHTML(
                            creation.prompt ||
                            ""
                        )}
                    </p>

                `;


                container.appendChild(item);
            }
        );

    } catch (error) {

        container.innerHTML = `

            <div class="empty-icon">
                ✨
            </div>

            <h3>
                Your Creative World
            </h3>

            <p>
                Sign in and generate something
                amazing with GLOW.
            </p>

        `;

    }
}


/* =====================================================
   KEYBOARD
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeStudio();
            closeAccount();

        }

    }
);


/* =====================================================
   STARTUP
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadCurrentUser();

        loadCreations();

    }
);
