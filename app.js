"use strict";

/* =========================================================
   GLOW AI STUDIO 2027
   COMPLETE DASHBOARD APP.JS
   ========================================================= */

const API_BASE = "/api";

let currentUser = null;
let currentPlan = null;
let currentUsage = null;
let generationTimer = null;

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(url, options = {}) {
    const config = {
        credentials: "include",
        ...options,
        headers: {
            ...(options.body &&
            !(options.body instanceof FormData)
                ? { "Content-Type": "application/json" }
                : {}),
            ...(options.headers || {})
        }
    };

    const response = await fetch(API_BASE + url, config);

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
            `Request failed (${response.status})`
        );
    }

    return data;
}

/* =========================================================
   MESSAGE SYSTEM
   ========================================================= */

function showMessage(message, type = "info") {
    let box = $("glowMessage");

    if (!box) {
        box = document.createElement("div");
        box.id = "glowMessage";

        Object.assign(box.style, {
            position: "fixed",
            left: "50%",
            bottom: "25px",
            transform: "translateX(-50%)",
            zIndex: "99999",
            padding: "14px 20px",
            borderRadius: "14px",
            background: "#17152b",
            color: "#fff",
            border: "1px solid rgba(255,255,255,.15)",
            boxShadow: "0 15px 40px rgba(0,0,0,.4)",
            fontSize: "14px",
            maxWidth: "90%",
            textAlign: "center"
        });

        document.body.appendChild(box);
    }

    box.textContent = message;

    if (type === "error") {
        box.style.borderColor = "#ff4f81";
    } else if (type === "success") {
        box.style.borderColor = "#55ffd6";
    } else {
        box.style.borderColor = "#9d7cff";
    }

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {
        if (box.parentNode) {
            box.remove();
        }
    }, 4500);
}

/* =========================================================
   MODALS
   ========================================================= */

function openModal() {
    const modal = $("studioModal");

    if (!modal) {
        showMessage("Studio window is missing.", "error");
        return;
    }

    modal.style.display = "flex";

    requestAnimationFrame(() => {
        modal.classList.add("show");
    });
}

function closeModal() {
    const modal = $("studioModal");

    if (!modal) return;

    modal.classList.remove("show");
    modal.style.display = "none";
}

function closeAllModals() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.remove("show");
        modal.style.display = "none";
    });
}

/* =========================================================
   OPEN STUDIO
   ========================================================= */

function openStudio(type) {
    const title = $("studioModalTitle");
    const content = $("studioModalContent");

    if (!title || !content) {
        showMessage(
            "Studio popup is missing from dashboard.html.",
            "error"
        );
        return;
    }

    let html = "";

    /* -----------------------------------------------------
       MUSIC
       ----------------------------------------------------- */

    if (type === "music") {

        title.textContent = "🎵 GLOW MUSIC";

        html = `
            <form id="musicGenerationForm" class="generation-form">

                <label>Describe your music</label>

                <textarea
                    id="musicPrompt"
                    placeholder="Example: Create an emotional Afrobeats song about chasing dreams..."
                    required
                ></textarea>

                <label>Genre</label>

                <select id="musicGenre">
                    <option value="Afrobeats">Afrobeats</option>
                    <option value="Pop">Pop</option>
                    <option value="Hip Hop">Hip Hop</option>
                    <option value="R&B">R&B</option>
                    <option value="Amapiano">Amapiano</option>
                    <option value="Gospel">Gospel</option>
                    <option value="Electronic">Electronic</option>
                </select>

                <label>Mood</label>

                <select id="musicMood">
                    <option value="Energetic">Energetic</option>
                    <option value="Happy">Happy</option>
                    <option value="Emotional">Emotional</option>
                    <option value="Romantic">Romantic</option>
                    <option value="Dark">Dark</option>
                    <option value="Chill">Chill</option>
                </select>

                <label>Duration</label>

                <select id="musicDuration">
                    <option value="15">15 seconds</option>
                    <option value="30">30 seconds</option>
                </select>

                <button type="submit" class="primary-btn">
                    🎵 Generate Music
                </button>

            </form>
        `;

    /* -----------------------------------------------------
       VIDEO
       ----------------------------------------------------- */

    } else if (type === "video") {

        title.textContent = "🎬 GLOW VIDEO";

        html = `
            <form id="videoGenerationForm" class="generation-form">

                <label>Describe your video</label>

                <textarea
                    id="videoPrompt"
                    placeholder="Example: A futuristic African city at night with glowing lights..."
                    required
                ></textarea>

                <label>Duration</label>

                <select id="videoDuration">
                    <option value="5">5 seconds</option>
                    <option value="10">10 seconds</option>
                    <option value="15">15 seconds</option>
                    <option value
                    ="30">30 seconds</option>
                                  </select>

                <button type="submit" class="primary-btn">
                    🎬 Generate Video
                </button>

            </form>
        `;

    /* -----------------------------------------------------
       IMAGE
       ----------------------------------------------------- */

    } else if (type === "image") {

        title.textContent = "🖼️ GLOW IMAGE";

        html = `
            <form id="imageGenerationForm" class="generation-form">

                <label>Describe your image</label>

                <textarea
                    id="imagePrompt"
                    placeholder="Example: A beautiful futuristic Lagos city at sunset..."
                    required
                ></textarea>

                <label>Image Size</label>

                <select id="imageSize">
                    <option value="square_hd">Square</option>
                    <option value="landscape_4_3">Landscape</option>
                    <option value="portrait_4_3">Portrait</option>
                    <option value="landscape_16_9">Widescreen</option>
                    <option value="portrait_16_9">Vertical</option>
                </select>

                <button type="submit" class="primary-btn">
                    🖼️ Generate Image
                </button>

            </form>

            <button
                type="button"
                class="secondary-btn"
                onclick="showGlowImageEdit()"
            >
                ✏️ Edit an Image
            </button>
        `;

    } else {

        showMessage("Unknown studio selected.", "error");
        return;
    }

    content.innerHTML = html;

    openModal();

    const musicForm = $("musicGenerationForm");

    if (musicForm) {
        musicForm.addEventListener(
            "submit",
            generateMusic
        );
    }

    const videoForm = $("videoGenerationForm");

    if (videoForm) {
        videoForm.addEventListener(
            "submit",
            generateVideo
        );
    }

    const imageForm = $("imageGenerationForm");

    if (imageForm) {
        imageForm.addEventListener(
            "submit",
            generateImage
        );
    }
}

/* =========================================================
   DASHBOARD COMPATIBILITY
   ========================================================= */

function openGlowStudio(type) {
    openStudio(type);
}

function closeGlowStudio() {
    closeModal();
}

/* =========================================================
   MUSIC GENERATION
   ========================================================= */

async function generateMusic(event) {

    event.preventDefault();

    const button =
        event.submitter ||
        document.querySelector(
            "#musicGenerationForm button[type='submit']"
        );

    const prompt =
        $("musicPrompt")?.value.trim();

    const genre =
        $("musicGenre")?.value || "Afrobeats";

    const mood =
        $("musicMood")?.value || "Energetic";

    const duration =
        Number(
            $("musicDuration")?.value || 30
        );

    if (!prompt) {
        showMessage(
            "Please describe the music you want.",
            "error"
        );
        return;
    }

    setButtonLoading(
        button,
        "Creating music..."
    );

    try {

        const data =
            await apiRequest("/music", {
                method: "POST",
                body: JSON.stringify({
                    prompt: prompt,
                    genre: genre,
                    mood: mood,
                    duration: duration
                })
            });

        showMessage(
            data.message ||
            "Music generation started.",
            "success"
        );

        handleGenerationResponse(
            data,
            "music"
        );

    } catch (error) {

        showMessage(
            error.message ||
            "Music generation failed.",
            "error"
        );

        restoreButton(
            button,
            "🎵 Generate Music"
        );
    }
}

/* =========================================================
   VIDEO GENERATION
   ========================================================= */

async function generateVideo(event) {

    event.preventDefault();

    const button =
        event.submitter ||
        document.querySelector(
            "#videoGenerationForm button[type='submit']"
        );

    const prompt =
        $("videoPrompt")?.value.trim();

    const duration =
        Number(
            $("videoDuration")?.value || 10
        );

    if (!prompt) {
        showMessage(
            "Please describe the video you want.",
            "error"
        );
        return;
    }

    setButtonLoading(
        button,
        "Creating video..."
    );

    try {

        const data =
            await apiRequest("/video", {
                method: "POST",
                body: JSON.stringify({
                    prompt: prompt,
                    duration: duration
                })
            });

        showMessage(
            data.message ||
            "Video generation started.",
            "success"
        );

        handleGenerationResponse(
            data,
            "video"
        );

    } catch (error) {

        showMessage(
            error.message ||
            "Video generation failed.",
            "error"
        );

        restoreButton(
            button,
            "🎬 Generate Video"
        );
    }
}

/* =========================================================
   IMAGE GENERATION
   ========================================================= */

async function generateImage(event) {

    event.preventDefault();

    const button =
        event.submitter ||
        document.querySelector(
            "#imageGenerationForm button[type='submit']"
        );

    const prompt =
        $("imagePrompt")?.value.trim();

    const imageSize =
        $("imageSize")?.value ||
        "square_hd";

    if (!prompt) {
        showMessage(
            "Please describe the image you want.",
            "error"
        );
        return;
    }

    setButtonLoading(
        button,
        "Creating image..."
    );

    try {

        const data =
            await apiRequest("/image", {
                method: "POST",
                body: JSON.stringify({
                    prompt: prompt,
                    image_size: imageSize
                })
            });

        showMessage(
            data.message ||
            "Image generation started.",
            "success"
        );

        handleGenerationResponse(
            data,
            "image"
        );

    } catch (error) {

        showMessage(
            error.message ||
            "Image generation failed.",
            "error"
        );

        restoreButton(
            button,
            "🖼️ Generate Image"
        );
    }
}

/* =========================================================
   IMAGE EDIT
   ========================================================= */

function showGlowImageEdit() {

    const title =
        $("studioModalTitle");

    const content =
        $("studioModalContent");

    if (!title || !content) {

        showMessage(
            "Studio window is missing.",
            "error"
        );

        return;
    }

    title.textContent =
        "✏️ GLOW IMAGE EDITOR";

    content.innerHTML = `
        <form
            id="imageEditForm"
            class="generation-form"
        >

            <label>Select an image</label>

            <input
                type="file"
                id="editImage"
                accept="image/png,image/jpeg,image/webp"
                required
            >

            <label>
                Describe the changes
            </label>

            <textarea
                id="editPrompt"
                placeholder="Example: Change the background to a futuristic Lagos skyline..."
                required
            ></textarea>

            <button
                type="submit"
                class="primary-btn"
            >
                ✨ Edit Image
            </button>

        </form>

        <button
            type="button"
            class="secondary-btn"
            onclick="openStudio('image')"
        >
            ← Back to Image Creation
        </button>
    `;

    const form =
        $("imageEditForm");

    if (form) {

        form.addEventListener(
            "submit",
            generateImageEdit
        );
    }
}

/* =========================================================
   IMAGE EDIT REQUEST
   ========================================================= */

async function generateImageEdit(event) {

    event.preventDefault();

    const button =
        event.submitter;

    const fileInput =
        $("editImage");

    const promptInput =
        $("editPrompt");

    if (
        !fileInput ||
        !fileInput.files ||
        !fileInput.files.length
    ) {

        showMessage(
            "Please select an image.",
            "error"
        );

        return;
    }

    const prompt =
        promptInput?.value.trim();

    if (!prompt) {

        showMessage(
            "Please describe the changes.",
            "error"
        );

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "image",
        fileInput.files[0]
    );

    formData.append(
        "prompt",
        prompt
    );

    setButtonLoading(
        button,
        "Editing image..."
    );

    try {

        const data =
            await apiRequest(
                "/image/edit",
                {
                    method: "POST",
                    body: formData
                }
            );

        showMessage(
            data.message ||
            "Image editing started.",
            "success"
        );

        handleGenerationResponse(
            data,
            "image_edit"
        );

    } catch (error) {

        showMessage(
            error.message ||
            "Image editing failed.",
            "error"
        );

        restoreButton(
            button,
            "✨ Edit Image"
        );
    }
}

/* =========================================================
   GENERATION RESPONSE
   ========================================================= */

function handleGenerationResponse(
    data,
    type
) {

    const requestId =
        data.request_id ||
        data.requestId ||
        data.id;

    if (requestId) {

        showGenerationProgress(type);

        pollGeneration(
            requestId,
            type
        );

        return;
    }

    const result =
        data.result ||
        data;

    const directUrl =
        result.url ||
        result.media_url ||
        result.audio_url ||
        result.video_url ||
        result.image_url ||
        result.output_url;

    if (directUrl) {

        showGenerationResult(
            data,
            type
        );

        refreshGlowCreations(false);

        return;
    }

    showMessage(
        "Generation request was accepted.",
        "success"
    );
}

/* =========================================================
   GENERATION PROGRESS
   ========================================================= */

function showGenerationProgress(type) {

    const content =
        $("studioModalContent");

    if (!content) return;

    const names = {
        music: "music",
        video: "video",
        image: "image",
        image_edit: "image"
    };

    const name =
        names[type] ||
        "creation";

    content.innerHTML = `
        <div
            class="generation-progress"
            style="
                text-align:center;
                padding:30px 10px;
            "
        >

            <div
                style="
                    font-size:52px;
                    margin-bottom:15px;
                "
            >
                ✨
            </div>

            <h3>
                GLOW is creating your
                ${escapeHTML(name)}
            </h3>

            <p>
                Your creation is being processed
                by the AI engine.
            </p>

            <div
                style="
                    width:100%;
                    height:8px;
                    background:rgba(255,255,255,.08);
                    border-radius:20px;
                    overflow:hidden;
                    margin-top:22px;
                "
            >

                <div
                    style="
                        width:35%;
                        height:100%;
                        border-radius:20px;
                        background:linear-gradient(
                            90deg,
                            #9d7cff,
                            #ff4f81,
                            #55ffd6
                        );
                        animation:glowProgress 1.5s infinite;
                    "
                ></div>

            </div>

            <p
                style="
                    opacity:.65;
                    margin-top:15px;
                    font-size:13px;
                "
            >
                Please keep this page open.
            </p>

        </div>
    `;
}

/* =========================================================
   POLL GENERATION
   ========================================================= */

function pollGeneration(
    requestId,
    type
) {

    if (generationTimer) {
        clearTimeout(generationTimer);
    }

    let attempts = 0;

    const maxAttempts = 120;

    async function checkStatus() {

        attempts++;

        try {

            const data =
                await apiRequest(
                    `/generation/status/${encodeURIComponent(requestId)}`
                );

            const result =
                data.result ||
                data;

            const status =
                String(
                    data.status ||
                    result.status ||
                    data.state ||
                    ""
                ).toLowerCase();

            const finishedUrl =
                result.url ||
                result.media_url ||
                result.audio_url ||
                result.video_url ||
                result.image_url ||
                result.output_url;

            if (
                status === "completed" ||
                status === "complete" ||
                status === "succeeded" ||
                status === "success" ||
                finishedUrl
            ) {

                showGenerationResult(
                    data,
                    type
                );

                refreshGlowCreations(false);

                return;
            }

            if (
                status === "failed" ||
                status === "error" ||
                status === "cancelled" ||
                status === "canceled"
            ) {

                showMessage(
                    data.error ||
                    data.message ||
                    "Generation failed.",
                    "error"
                );

                closeModal();

                refreshGlowCreations(false);

                return;
            }

            if (
                attempts >= maxAttempts
            ) {

                showMessage(
                    "Generation is taking longer than expected. Check My Creations shortly.",
                    "info"
                );

                closeModal();

                refreshGlowCreations(false);

                return;
            }

            generationTimer =
                setTimeout(
                    checkStatus,
                    3000
                );

        } catch (error) {

            if (
                attempts >= maxAttempts
            ) {

                showMessage(
                    "Could not check generation status.",
                    "error"
                );

                closeModal();

                return;
            }

            generationTimer =
                setTimeout(
                    checkStatus,
                    4000
                );
        }
    }

    checkStatus();
}

/* =========================================================
   SHOW RESULT
   ========================================================= */

function showGenerationResult(
    data,
    type
) {

    const content =
        $("studioModalContent");

    if (!content) return;

    const result =
        data.result ||
        data;

    const url =
        result.url ||
        result.media_url ||
        result.audio_url ||
        result.video_url ||
        result.image_url ||
        result.output_url ||
        result.image?.url ||
        result.audio?.url ||
        result.video?.url;

    if (!url) {

        content.innerHTML = `
            <div
                style="
                    text-align:center;
                    padding:30px;
                "
            >

                <div style="font-size:50px;">
                    ✨
                </div>

                <h3>
                    Creation Complete
                </h3>

                <p>
                    Your creation has been completed.
                    Check My Creations.
                </p>

            </div>
        `;

        return;
    }

    let media = "";

    if (
        type === "music" ||
        type === "audio"
    ) {

        media = `
            <audio
                controls
                style="
                    width:100%;
                    margin-top:20px;
                "
            >
                <source
                    src="${escapeHTML(url)}"
                >
            </audio>
        `;

    } else if (
        type === "video"
    ) {

        media = `
            <video
                controls
                playsinline
                style="
                    width:100%;
                    max-height:500px;
                    border-radius:18px;
                    margin-top:20px;
                "
            >
                <source
                    src="${escapeHTML(url)}"
                >
            </video>
        `;

    } else {

        media = `
            <img
                src="${escapeHTML(url)}"
                alt="GLOW AI creation"
                style="
                    width:100%;
                    max-height:500px;
                    object-fit:contain;
                    border-radius:18px;
                    margin-top:20px;
                "
            >
        `;
    }

    content.innerHTML = `
        <div
            class="generation-result"
            style="
                text-align:center;
            "
        >

            <div
                style="
                    font-size:45px;
                    margin-bottom:10px;
                "
            >
                ✨
            </div>

            <h3>
                Creation Complete
            </h3>

            <p>
                Your GLOW creation is ready.
            </p>

            ${media}

            <div
                style="
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                    justify-content:center;
                    margin-top:20px;
                "
            >

                <a
                    href="${escapeHTML(url)}"
                    target="_blank"
                    rel="noopener"
                    class="primary-btn"
                    style="
                        text-decoration:none;
                        text-align:center;
                    "
                >
                    Open
                </a>

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="refreshGlowCreations(false)"
                >
                    Refresh Creations
                </button>

            </div>

        </div>
    `;

    showMessage(
        "Your creation is ready! ✨",
        "success"
    );
}

/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setButtonLoading(
    button,
    text
) {

    if (!button) return;

    button.dataset.originalText =
        button.innerHTML;

    button.disabled = true;

    button.innerHTML = `
        <span
            style="
                display:inline-flex;
                gap:8px;
                align-items:center;
            "
        >
            <span>⏳</span>
            <span>
                ${escapeHTML(text)}
            </span>
        </span>
    `;

    button.style.opacity = "0.7";
    button.style.pointerEvents = "none";
}

function restoreButton(
    button,
    text
) {

    if (!button) return;

    button.disabled = false;

    button.innerHTML =
        text ||
        button.dataset.originalText ||
        "Generate";

    button.style.opacity = "1";
    button.style.pointerEvents = "auto";
}

/* =========================================================
   USER
   ========================================================= */

async function loadGlowUser() {

    try {

        const data =
            await apiRequest(
                "/auth/me"
            );

        currentUser =
            data.user ||
            data;

        updateDashboardUser();

        return currentUser;

    } catch (error) {

        console.error(
            "User loading failed:",
            error
        );

        return null;
    }
}

async function refreshGlowUserData() {

    try {

        const userData =
            await apiRequest(
                "/auth/me"
            );

        currentUser =
            userData.user ||
            userData;

        try {

            const planData =
                await apiRequest(
                    "/plans"
                );

            currentPlan =
                planData.plan ||
                planData.plans ||
                planData;

        } catch (error) {

            currentPlan = null;
        }

        try {

            const usageData =
                await apiRequest(
                    "/usage"
                );

            currentUsage =
                usageData.usage ||
                usageData;

        } catch (error) {

            currentUsage = null;
        }

        updateDashboardUser();
        updateDashboardStats();

    } catch (error) {

        console.error(
            "Dashboard data error:",
            error
        );
    }
}

function updateDashboardUser() {

    if (!currentUser) return;

    const name =
        currentUser.profile_name ||
        currentUser.name ||
        currentUser.username ||
        currentUser.email ||
        "Creator";

    document
        .querySelectorAll(
            "[data-user-name], #userName, #welcomeName"
        )
        .forEach(element => {

            element.textContent =
                name;
        });

    document
        .querySelectorAll(
            "[data-user-email], #userEmail"
        )
        .forEach(element => {

            element.textContent =
                currentUser.email ||
                "";
        });
}

/* =========================================================
   STATS
   ========================================================= */

function updateDashboardStats() {

    const usage =
        currentUsage || {};

    const imageUsed =
        usage.image_used ??
        usage.images_used ??
        0;

    const musicUsed =
        usage.music_used ??
        usage.music_used_count ??
        0;

    const videoUsed =
        usage.video_used ??
        usage.videos_used ??
        0;

    document
        .querySelectorAll(
            "#imageUsage,#imagesUsed,[data-image-usage]"
        )
        .forEach(element => {

            element.textContent =
                imageUsed;
        });

    document
        .querySelectorAll(
            "#musicUsage,#musicUsed,[data-music-usage]"
        )
        .forEach(element => {

            element.textContent =
                musicUsed;
        });

    document
        .querySelectorAll(
            "#videoUsage,#videoUsed,[data-video-usage]"
        )
        .forEach(element => {

            element.textContent =
                videoUsed;
        });
}

/* =========================================================
   CREATIONS
   ========================================================= */

async function refreshGlowCreations(
    showLoading = true
) {

    const container =
        $("creationsList") ||
        $("creationsGrid") ||
        $("myCreations");

    if (!container) return;

    if (showLoading) {

        container.innerHTML = `
            <div
                style="
                    padding:30px;
                    text-align:center;
                    opacity:.7;
                "
            >
                ⏳ Loading your creations...
            </div>
        `;
    }

    try {

        const data =
            await apiRequest(
                "/creations"
            );

        const creations =
            Array.isArray(data)
                ? data
                : (
                    data.creations ||
                    data.items ||
                    data.results ||
                    []
                );

        if (!creations.length) {

            container.innerHTML = `
                <div
                    style="
                        padding:35px;
                        text-align:center;
                        opacity:.65;
                    "
                >

                    <div style="font-size:40px;">
                        ✨
                    </div>

                    <h3>
                        No creations yet
                    </h3>

                    <p>
                        Your AI music, videos and
                        images will appear here.
                    </p>

                </div>
            `;

            return;
        }

        container.innerHTML =
            creations
                .map(
                    renderCreationCard
                )
                .join("");

    } catch (error) {

        console.error(
            "Creations error:",
            error
        );

        container.innerHTML = `
            <div
                style="
                    padding:25px;
                    text-align:center;
                "
            >

                <p>
                    Unable to load creations.
                </p>

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="refreshGlowCreations()"
                >
                    ↻ Try Again
                </button>

            </div>
        `;
    }
}

function renderCreationCard(item) {

    const type =
        item.type ||
        item.creation_type ||
        item.kind ||
        "creation";

    const url =
        item.url ||
        item.media_url ||
        item.output_url ||
        item.audio_url ||
        item.video_url ||
        item.image_url ||
        "";

    const prompt =
        item.prompt ||
        item.title ||
        "GLOW Creation";

    const created =
        item.created_at ||
        item.created ||
        "";

    let media = "";

    if (url) {

        if (
            type === "music" ||
            type === "audio"
        ) {

            media = `
                <audio
                    controls
                    style="width:100%;"
                >
                    <source
                        src="${escapeHTML(url)}"
                    >
                </audio>
            `;

        } else if (
            type === "video"
        ) {

            media = `
                <video
                    controls
                    playsinline
                    style="
                        width:100%;
                        border-radius:14px;
                        max-height:300px;
                    "
                >
                    <source
                        src="${escapeHTML(url)}"
                    >
                </video>
            `;

        } else {

            media = `
                <img
                    src="${escapeHTML(url)}"
                    alt="GLOW creation"
                    style="
                        width:100%;
                        border-radius:14px;
                        max-height:300px;
                        object-fit:cover;
                    "
                    loading="lazy"
                >
            `;
        }
    }

    return `
        <article
            class="creation-card"
            data-type="${escapeHTML(type)}"
        >

            <div
                class="creation-card-header"
            >

                <span>
                    ${escapeHTML(type)}
                </span>

                ${
                    created
                        ? `
                            <small>
                                ${escapeHTML(created)}
                            </small>
                        `
                        : ""
                }

            </div>

            <h4>
                ${escapeHTML(prompt)}
            </h4>

            ${
                media
                    ? `
                        <div
                            class="creation-media"
                        >
                            ${media}
                        </div>
                    `
                    : `
                        <div
                            style="
                                padding:25px;
                                text-align:center;
                                opacity:.65;
                            "
                        >
                            Processing...
                        </div>
                    `
            }

            ${
                url
                    ? `
                        <a
                            href="${escapeHTML(url)}"
                            target="_blank"
                            rel="noopener"
                            class="secondary-btn"
                            style="
                                display:inline-block;
                                text-decoration:none;
                                margin-top:12px;
                            "
                        >
                            Open Creation
                        </a>
                    `
                    : ""
            }

        </article>
    `;
}

/* =========================================================
   ACCOUNT
   ========================================================= */

function openGlowAccount() {

    const modal =
        $("accountModal");

    const content =
        $("accountModalContent");

    if (!modal || !content) {

        showMessage(
            "Account window is missing.",
            "error"
        );

        return;
    }

    const user =
        currentUser || {};

    const name =
        user.profile_name ||
        user.name ||
        user.username ||
        "";

    const email =
        user.email ||
        "";

    content.innerHTML = `
        <div class="account-panel">

            <h3>
                👤 Manage Account
            </h3>

            <form
                id="profileForm"
                class="generation-form"
            >

                <label>
                    Profile Name
                </label>

                <input
                    id="profileName"
                    type="text"
                    value="${escapeHTML(name)}"
                    placeholder="Your name"
                >

                <label>
                    Email
                </label>

                <input
                    type="email"
                    value="${escapeHTML(email)}"
                    disabled
                >

                <button
                    type="submit"
                    class="primary-btn"
                >
                    Save Profile
                </button>

            </form>

            <div
                style="
                    margin-top:25px;
                    padding:18px;
                    border-radius:16px;
                    background:rgba(255,255,255,.04);
                "
            >

                <strong>
                    Current Plan
                </strong>

                <p>
                    ${escapeHTML(
                        user.plan ||
                        currentPlan?.name ||
                        "Free"
                    )}
                </p>

            </div>

        </div>
    `;

    modal.style.display =
        "flex";

    requestAnimationFrame(() => {

        modal.classList.add(
            "show"
        );
    });

    const profileForm =
        $("profileForm");

    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            saveProfile
        );
    }
}

function closeGlowAccount() {

    const modal =
        $("accountModal");

    if (!modal) return;

    modal.classList.remove(
        "show"
    );

    modal.style.display =
        "none";
}

async function saveProfile(event) {

    event.preventDefault();

    const profileName =
        $("profileName")?.value.trim();

    if (!profileName) {

        showMessage(
            "Please enter your profile name.",
            "error"
        );

        return;
    }

    const button =
        event.submitter;

    setButtonLoading(
        button,
        "Saving..."
    );

    try {

        const data =
            await apiRequest(
                "/profile",
                {
                    method: "POST",
                    body: JSON.stringify({
                        profile_name:
                            profileName,
                        name:
                            profileName
                    })
                }
            );

        currentUser =
            data.user ||
            data ||
            currentUser;

        showMessage(
            "Profile updated successfully.",
            "success"
        );

        updateDashboardUser();

        restoreButton(
            button,
            "Save Profile"
        );

    } catch (error) {

        showMessage(
            error.message ||
            "Could not update profile.",
            "error"
        );

        restoreButton(
            button,
            "Save Profile"
        );
    }
}

/* =========================================================
   LOGOUT
   ========================================================= */

async function glowLogout() {

    try {

        await apiRequest(
            "/auth/logout",
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.warn(
            "Logout request failed:",
            error
        );

    } finally {

        window.location.href =
            "/login.html";
    }
}

function logout() {
    glowLogout();
}

function refreshCreations() {
    refreshGlowCreations();
}

function openAccount() {
    openGlowAccount();
}

function closeAccount() {
    closeGlowAccount();
}

function generateGlowMusic(event) {
    return generateMusic(event);
}

function generateGlowVideo(event) {
    return generateVideo(event);
}

function generateGlowImage(event) {
    return generateImage(event);
}

/* =========================================================
   MODAL EVENTS
   ========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const studioModal =
            $("studioModal");

        const accountModal =
            $("accountModal");

        if (
            studioModal &&
            event.target === studioModal
        ) {

            closeModal();
        }

        if (
            accountModal &&
            event.target === accountModal
        ) {

            closeGlowAccount();
        }
    }
);

/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeAllModals();
            closeGlowAccount();
        }
    }
);

/* =========================================================
   START DASHBOARD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "GLOW AI STUDIO 2027 dashboard loaded."
        );

        await loadGlowUser();

        await refreshGlowUserData();

        await refreshGlowCreations(false);
    }
);
