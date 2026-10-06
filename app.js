/* =========================================================
   GLOW AI STUDIO 2027
   Frontend Controller
   FAL Music + Image + Video
   ========================================================= */

"use strict";

/* =========================
   GLOBAL STATE
========================= */

let currentUser = null;
let currentPlan = null;
let currentUsage = null;
let currentGeneration = null;

const API = "/api";

/* =========================
   BASIC HELPERS
========================= */

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function apiRequest(url, options = {}) {
    const response = await fetch(API + url, {
        credentials: "include",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
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

function showMessage(message, type = "info") {
    alert(message);
}

/* =========================
   MODAL HELPERS
========================= */

function closeModal(id) {
    const modal = $(id);

    if (modal) {
        modal.classList.remove("active");
    }
}

function openModal(id) {
    const modal = $(id);

    if (modal) {
        modal.classList.add("active");
    }
}

function closeAllModals() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.remove("active");
    });
}

/* =========================
   STUDIO MODAL
========================= */

function openStudio(type) {
    const modal = $("studioModal");

    if (!modal) {
        console.error("studioModal not found");
        return;
    }

    const title = $("studioModalTitle");
    const content = $("studioModalContent");

    if (!content) return;

    if (type === "music") {
        if (title) title.textContent = "AI Music Studio";

        content.innerHTML = `
            <div class="studio-modal-header">
                <div>
                    <div class="studio-modal-badge">FAL • ACE-STEP</div>
                    <h2>Create AI Music</h2>
                    <p>Describe the music you want GLOW to create.</p>
                </div>
            </div>

            <form class="music-form" id="musicForm">

                <div class="form-group">
                    <label for="musicPrompt">Music Prompt</label>

                    <textarea
                        id="musicPrompt"
                        rows="5"
                        placeholder="Example: Energetic Nigerian Afrobeats song with powerful drums, catchy melody and futuristic atmosphere..."
                        required
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="musicGenre">Genre</label>

                    <select id="musicGenre">
                        <option value="Afrobeat">Afrobeat</option>
                        <option value="Afropop">Afropop</option>
                        <option value="Amapiano">Amapiano</option>
                        <option value="Hip Hop">Hip Hop</option>
                        <option value="R&B">R&B</option>
                        <option value="Pop">Pop</option>
                        <option value="Electronic">Electronic</option>
                        <option value="Gospel">Gospel</option>
                        <option value="Cinematic">Cinematic</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="musicMood">Mood</label>

                    <select id="musicMood">
                        <option value="Energetic">Energetic</option>
                        <option value="Happy">Happy</option>
                        <option value="Romantic">Romantic</option>
                        <option value="Emotional">Emotional</option>
                        <option value="Dark">Dark</option>
                        <option value="Chill">Chill</option>
                        <option value="Epic">Epic</option>
                        <option value="Inspirational">Inspirational</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="musicDuration">Duration</label>

                    <select id="musicDuration">
                        <option value="60">1 minute</option>
                        <option value="90">1 minute 30 seconds</option>
                        <option value="120">2 minutes</option>
                    </select>
                </div>

                <button
                    type="submit"
                    class="generate-btn"
                    id="musicGenerateBtn"
                >
                    🎵 Generate Music
                </button>

                <div
                    class="generation-status"
                    id="musicStatus"
                    style="display:none;"
                ></div>

                <div id="musicResult"></div>

            </form>
        `;

        $("musicForm").addEventListener("submit", generateMusic);

        openModal("studioModal");
        return;
    }

    if (type === "image") {
        if (title) title.textContent = "AI Image Studio";

        content.innerHTML = `
            <div class="studio-modal-header">
                <div>
                    <div class="studio-modal-badge">FAL • FLUX SCHNELL</div>
                    <h2>Create AI Images</h2>
                    <p>Generate pictures from your imagination.</p>
                </div>
            </div>

            <form class="music-form" id="imageForm">

                <div class="form-group">
                    <label for="imagePrompt">Describe Your Image</label>

                    <textarea
                        id="imagePrompt"
                        rows="5"
                        placeholder="Example: A futuristic African city at night, glowing skyscrapers, cinematic lighting, ultra detailed..."
                        required
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="imageSize">Image Size</label>

                    <select id="imageSize">
                        <option value="square_hd">Square</option>
                        <option value="landscape_16_9">Landscape 16:9</option>
                        <option value="portrait_16_9">Portrait 9:16</option>
                        <option value="landscape_4_3">Landscape 4:3</option>
                        <option value="portrait_4_3">Portrait 3:4</option>
                    </select>
                </div>

                <button
                    type="submit"
                    class="generate-btn"
                    id="imageGenerateBtn"
                >
                    🖼️ Generate Image
                </button>

                <div
                    class="generation-status"
                    id="imageStatus"
                    style="display:none;"
                ></div>

                <div id="imageResult"></div>

            </form>
        `;

        $("imageForm").addEventListener("submit", generateImage);

        openModal("studioModal");
        return;
    }

    if (type === "video") {
        if (title) title.textContent = "AI Video Studio";

        content.innerHTML = `
            <div class="studio-modal-header">
                <div>
                    <div class="studio-modal-badge">FAL • MINIMAX H3 MAX TURBO</div>
                    <h2>Create AI Video</h2>
                    <p>Turn your ideas into cinematic AI video.</p>
                </div>
            </div>

            <form class="music-form" id="videoForm">

                <div class="form-group">
                    <label for="videoPrompt">Describe Your Video</label>

                    <textarea
                        id="videoPrompt"
                        rows="6"
                        placeholder="Example: A cinematic football stadium at night, a young Nigerian footballer dribbling past defenders and scoring a powerful goal..."
                        required
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="videoDuration">Duration</label>

                    <select id="videoDuration">
                        <option value="6">6 seconds</option>
                        <option value="8">8 seconds</option>
                        <option value="10">10 seconds</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="videoResolution">Resolution</label>

                    <select id="videoResolution">
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="videoAspect">Aspect Ratio</label>

                    <select id="videoAspect">
                        <option value="16:9">16:9 Landscape</option>
                        <option value="9:16">9:16 Portrait</option>
                        <option value="1:1">1:1 Square</option>
                    </select>
                </div>

                <button
                    type="submit"
                    class="generate-btn"
                    id="videoGenerateBtn"
                >
                    🎬 Generate Video
                </button>

                <div
                    class="generation-status"
                    id="videoStatus"
                    style="display:none;"
                ></div>

                <div id="videoResult"></div>

            </form>
        `;

        $("videoForm").addEventListener("submit", generateVideo);

        openModal("studioModal");
        return;
    }
}

/* =========================
   PLAN ACCESS
========================= */

function getLimit(type) {
    if (!currentPlan) return 0;

    if (type === "image") {
        return Number(currentPlan.image_limit || 0);
    }

    if (type === "music") {
        return Number(currentPlan.music_limit || 0);
    }

    if (type === "video") {
        return Number(currentPlan.video_limit || 0);
    }

    return 0;
}

function getUsed(type) {
    if (!currentUsage) return 0;

    if (type === "image") {
        return Number(currentUsage.image_used || 0);
    }

    if (type === "music") {
        return Number(currentUsage.music_used || 0);
    }

    if (type === "video") {
        return Number(currentUsage.video_used || 0);
    }

    return 0;
}

function canGenerate(type) {
    if (!currentUser) {
        showMessage("Please create an account or sign in first.");
        openAccount();
        return false;
    }

    if (!currentPlan) {
        showMessage("Your plan information is still loading. Please try again.");
        return false;
    }

    const limit = getLimit(type);
    const used = getUsed(type);

    if (limit <= 0) {
        showMessage(
            `Your ${currentPlan.name || currentPlan.plan || "Free"} plan does not include ${type} generation.`
        );
        return false;
    }

    if (used >= limit) {
        showMessage(
            `You have used all ${limit} ${type} generation(s) included in your plan.`
        );
        return false;
    }

    return true;
}

/* =========================
   MUSIC GENERATION
========================= */

async function generateMusic(event) {
    event.preventDefault();

    if (!canGenerate("music")) return;

    const prompt = $("musicPrompt")?.value.trim();
    const genre = $("musicGenre")?.value || "Afrobeat";
    const mood = $("musicMood")?.value || "Energetic";
    const duration = Number($("musicDuration")?.value || 60);

    if (!prompt) {
        showMessage("Please describe the music you want.");
        return;
    }

    const button = $("musicGenerateBtn");
    const status = $("musicStatus");
    const result = $("musicResult");

    if (button) {
        button.disabled = true;
        button.textContent = "🎵 Creating Music...";
    }

    if (status) {
        status.style.display = "block";
        status.innerHTML = "⏳ Sending your idea to the AI music engine...";
    }

    if (result) {
        result.innerHTML = "";
    }

    try {
        const response = await apiRequest("/music", {
            method: "POST",
            body: JSON.stringify({
                prompt: prompt,
                genre: genre,
                mood: mood,
                duration: duration
            })
        });

        if (!response.request_id) {
            throw new Error("Music request ID was not returned.");
        }

        currentGeneration = response.request_id;

        await pollGeneration(
            response.request_id,
            "music",
            status,
            result,
            button
        );

    } catch (error) {
        console.error(error);

        if (status) {
            status.innerHTML = `❌ ${escapeHTML(error.message)}`;
        }

        if (button) {
            button.disabled = false;
            button.textContent = "🎵 Generate Music";
        }
    }
}

/* =========================
   IMAGE GENERATION
========================= */

async function generateImage(event) {
    event.preventDefault();

    if (!canGenerate("image")) return;

    const prompt = $("imagePrompt")?.value.trim();
    const imageSize = $("imageSize")?.value || "square_hd";

    if (!prompt) {
        showMessage("Please describe the image you want.");
        return;
    }

    const button = $("imageGenerateBtn");
    const status = $("imageStatus");
    const result = $("imageResult");

    if (button) {
        button.disabled = true;
        button.textContent = "🖼️ Creating Image...";
    }

    if (status) {
        status.style.display = "block";
        status.innerHTML = "⏳ Creating your AI image...";
    }

    if (result) {
        result.innerHTML = "";
    }

    try {
        const response = await apiRequest("/image", {
            method: "POST",
            body: JSON.stringify({
                prompt: prompt,
                image_size: imageSize
            })
        });

        if (!response.request_id) {
            throw new Error("Image request ID was not returned.");
        }

        currentGeneration = response.request_id;

        await pollGeneration(
            response.request_id,
            "image",
            status,
            result,
            button
        );

    } catch (error) {
        console.error(error);

        if (status) {
            status.innerHTML = `❌ ${escapeHTML(error.message)}`;
        }

        if (button) {
            button.disabled = false;
            button.textContent = "🖼️ Generate Image";
        }
    }
}

/* =========================
   VIDEO GENERATION
========================= */

async function generateVideo(event) {
    event.preventDefault();

    if (!canGenerate("video")) return;

    const prompt = $("videoPrompt")?.value.trim();
    const duration = Number($("videoDuration")?.value || 6);
    const resolution = $("videoResolution")?.value || "720p";
    const aspectRatio = $("videoAspect")?.value || "16:9";

    if (!prompt) {
        showMessage("Please describe the video you want.");
        return;
    }

    const button = $("videoGenerateBtn");
    const status = $("videoStatus");
    const result = $("videoResult");

    if (button) {
        button.disabled = true;
        button.textContent = "🎬 Creating Video...";
    }

    if (status) {
        status.style.display = "block";
        status.innerHTML = "⏳ Sending your idea to the AI video engine...";
    }

    if (result) {
        result.innerHTML = "";
    }

    try {
        const response = await apiRequest("/video", {
            method: "POST",
            body: JSON.stringify({
                prompt: prompt,
                duration: duration,
                resolution: resolution,
                aspect_ratio: aspectRatio
            })
        });

        if (!response.request_id) {
            throw new Error("Video request ID was not returned.");
        }

        currentGeneration = response.request_id;

        await pollGeneration(
            response.request_id,
            "video",
            status,
            result,
            button
        );

    } catch (error) {
        console.error(error);

        if (status) {
            status.innerHTML = `❌ ${escapeHTML(error.message)}`;
        }

        if (button) {
            button.disabled = false;
            button.textContent = "🎬 Generate Video";
        }
    }
}

/* =========================
   GENERATION POLLING
========================= */

async function pollGeneration(
    requestId,
    type,
    statusElement,
    resultElement,
    buttonElement
) {
    let attempts = 0;

    const maxAttempts = type === "video" ? 120 : 90;

    const interval = type === "video" ? 5000 : 3000;

    while (attempts < maxAttempts) {
        attempts++;

        try {
            const data = await apiRequest(
                `/generation/status/${encodeURIComponent(requestId)}`
            );

            const status = String(data.status || "").toLowerCase();

            if (
                status === "completed" ||
                status === "complete" ||
                status === "succeeded" ||
                status === "success"
            ) {
                if (statusElement) {
                    statusElement.innerHTML = "✅ Generation complete!";
                }

                displayGenerationResult(
                    type,
                    data,
                    resultElement
                );

                await refreshUsage();
                await loadCreations();

                if (buttonElement) {
                    buttonElement.disabled = false;

                    if (type === "music") {
                        buttonElement.textContent = "🎵 Generate Music";
                    } else if (type === "image") {
                        buttonElement.textContent = "🖼️ Generate Image";
                    } else {
                        buttonElement.textContent = "🎬 Generate Video";
                    }
                }

                return;
            }

            if (
                status === "failed" ||
                status === "error" ||
                status === "cancelled"
            ) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "The AI generation failed."
                );
            }

            if (statusElement) {
                const dots = ".".repeat((attempts % 3) + 1);

                statusElement.innerHTML =
                    `⏳ AI is creating your ${type}${dots}`;
            }

        } catch (error) {
            console.error("Polling error:", error);

            if (attempts >= maxAttempts) {
                if (statusElement) {
                    statusElement.innerHTML =
                        `❌ ${escapeHTML(error.message)}`;
                }

                if (buttonElement) {
                    buttonElement.disabled = false;
                }

                return;
            }
        }

        await sleep(interval);
    }

    if (statusElement) {
        statusElement.innerHTML =
            "⚠️ Generation is taking longer than expected. Check My Creations later.";
    }

    if (buttonElement) {
        buttonElement.disabled = false;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* =========================
   DISPLAY RESULTS
========================= */

function displayGenerationResult(type, data, container) {
    if (!container) return;

    const result = data.result || data.output || data;

    if (type === "music") {
        const audioUrl =
            data.audio_url ||
            result?.audio_url ||
            result?.audio?.url ||
            result?.audio?.src ||
            findMediaUrl(result, "audio");

        if (!audioUrl) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎵</div>
                    <p>Music was generated, but the audio URL was not returned.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="generation-result">
                <h3>🎵 Your Music Is Ready</h3>

                <audio
                    controls
                    style="width:100%; margin-top:15px;"
                    src="${escapeHTML(audioUrl)}"
                ></audio>

                <a
                    href="${escapeHTML(audioUrl)}"
                    target="_blank"
                    rel="noopener"
                    class="generate-btn"
                    style="display:block; text-align:center; margin-top:15px; text-decoration:none;"
                >
                    ⬇️ Open / Save Music
                </a>
            </div>
        `;

        return;
    }

    if (type === "image") {
        const imageUrl =
            data.image_url ||
            result?.image_url ||
            result?.images?.[0]?.url ||
            result?.image?.url ||
            findMediaUrl(result, "image");

        if (!imageUrl) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🖼️</div>
                    <p>Image was generated, but the image URL was not returned.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="generation-result">
                <h3>🖼️ Your Image Is Ready</h3>

                <img
                    src="${escapeHTML(imageUrl)}"
                    alt="Generated AI image"
                    style="width:100%; border-radius:16px; margin-top:15px;"
                >

                <a
                    href="${escapeHTML(imageUrl)}"
                    target="_blank"
                    rel="noopener"
                    class="generate-btn"
                    style="display:block; text-align:center; margin-top:15px; text-decoration:none;"
                >
                    ⬇️ Open / Save Image
                </a>
            </div>
        `;

        return;
    }

    if (type === "video") {
        const videoUrl =
            data.video_url ||
            result?.video_url ||
            result?.video?.url ||
            result?.videos?.[0]?.url ||
            findMediaUrl(result, "video");

        if (!videoUrl) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎬</div>
                    <p>Video was generated, but the video URL was not returned.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="generation-result">
                <h3>🎬 Your Video Is Ready</h3>

                <video
                    controls
                    playsinline
                    style="width:100%; border-radius:16px; margin-top:15px;"
                    src="${escapeHTML(videoUrl)}"
                ></video>

                <a
                    href="${escapeHTML(videoUrl)}"
                    target="_blank"
                    rel="noopener"
                    class="generate-btn"
                    style="display:block; text-align:center; margin-top:15px; text-decoration:none;"
                >
                    ⬇️ Open / Save Video
                </a>
            </div>
        `;

        return;
    }
}

/* =========================
   FIND MEDIA URL
========================= */

function findMediaUrl(value, type) {
    if (!value) return null;

    if (typeof value === "string") {
        if (
            value.startsWith("http://") ||
            value.startsWith("https://")
        ) {
            return value;
        }

        return null;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findMediaUrl(item, type);

            if (found) return found;
        }

        return null;
    }

    if (typeof value === "object") {
        const preferredKeys = [
            "url",
            `${type}_url`,
            "src",
            "audio_url",
            "video_url",
            "image_url"
        ];

        for (const key of preferredKeys) {
            if (typeof value[key] === "string") {
                if (
                    value[key].startsWith("http://") ||
                    value[key].startsWith("https://")
                ) {
                    return value[key];
                }
            }
        }

        for (const key of Object.keys(value)) {
            const found = findMediaUrl(value[key], type);

            if (found) return found;
        }
    }

    return null;
}

/* =========================
   ACCOUNT
========================= */

function openAccount() {
    const modal = $("accountModal");

    if (!modal) {
        console.error("accountModal not found");
        return;
    }

    const content = $("accountModalContent");

    if (!content) return;

    if (currentUser) {
        showProfilePanel();
    } else {
        showLoginPanel();
    }

    modal.classList.add("active");
}

function showLoginPanel() {
    const content = $("accountModalContent");

    if (!content) return;

    content.innerHTML = `
        <div class="studio-modal-header">
            <div>
                <div class="studio-modal-badge">GLOW ACCOUNT</div>
                <h2>Welcome Back</h2>
                <p>Sign in to continue creating.</p>
            </div>
        </div>

        <form id="loginForm" class="music-form">

            <div class="form-group">
                <label>Username or Email</label>

                <input
                    id="loginIdentity"
                    type="text"
                    placeholder="Username or email"
                    required
                >
            </div>

            <div class="form-group">
                <label>Password</label>

                <input
                    id="loginPassword"
                    type="password"
                    placeholder="Password"
                    required
                >
            </div>

            <button class="generate-btn" type="submit">
                Sign In
            </button>

            <p style="text-align:center; margin-top:15px;">
                Don't have an account?
                <button
                    type="button"
                    onclick="showSignupPanel()"
                    style="background:none;border:0;color:inherit;text-decoration:underline;cursor:pointer;"
                >
                    Sign Up
                </button>
            </p>

            <div id="loginStatus"></div>

        </form>
    `;

    $("loginForm").addEventListener("submit", loginUser);
}

function showSignupPanel() {
    const content = $("accountModalContent");

    if (!content) return;

    content.innerHTML = `
        <div class="studio-modal-header">
            <div>
                <div class="studio-modal-badge">GLOW ACCOUNT</div>
                <h2>Create Account</h2>
                <p>Join GLOW AI STUDIO 2027.</p>
            </div>
        </div>

        <form id="signupForm" class="music-form">

            <div class="form-group">
                <label>Username</label>

                <input
                    id="signupUsername"
                    type="text"
                    placeholder="Choose a username"
                    required
                >
            </div>

            <div class="form-group">
                <label>Email</label>

                <input
                    id="signupEmail"
                    type="email"
                    placeholder="you@example.com"
                    required
                >
            </div>

            <div class="form-group">
                <label>Password</label>

                <input
                    id="signupPassword"
                    type="password"
                    placeholder="Create a password"
                    minlength="6"
                    required
                >
            </div>

            <button class="generate-btn" type="submit">
                Create Account
            </button>

            <p style="text-align:center; margin-top:15px;">
                Already have an account?
                <button
                    type="button"
                    onclick="showLoginPanel()"
                    style="background:none;border:0;color:inherit;text-decoration:underline;cursor:pointer;"
                >
                    Sign In
                </button>
            </p>

            <div id="signupStatus"></div>

        </form>
    `;

    $("signupForm").addEventListener("submit", signupUser);
}

async function signupUser(event) {
    event.preventDefault();

    const username = $("signupUsername")?.value.trim();
    const email = $("signupEmail")?.value.trim();
    const password = $("signupPassword")?.value;

    const status = $("signupStatus");

    if (!username || !email || !password) return;

    if (status) {
        status.innerHTML = "Creating your account...";
    }

    try {
        const data = await apiRequest("/auth/signup", {
            method: "POST",
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        currentUser = data.user || data;

        await refreshAccountData();
        updateAccountButton();

        if (status) {
            status.innerHTML = "✅ Account created successfully.";
        }

        setTimeout(() => {
            showProfilePanel();
        }, 500);

    } catch (error) {
        if (status) {
            status.innerHTML =
                `❌ ${escapeHTML(error.message)}`;
        }
    }
}

async function loginUser(event) {
    event.preventDefault();

    const identity = $("loginIdentity")?.value.trim();
    const password = $("loginPassword")?.value;

    const status = $("loginStatus");

    if (!identity || !password) return;

    if (status) {
        status.innerHTML = "Signing in...";
    }

    try {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                identity,
                username: identity,
                email: identity,
                password
            })
        });

        currentUser = data.user || data;

        await refreshAccountData();
        updateAccountButton();

        if (status) {
            status.innerHTML = "✅ Signed in successfully.";
        }

        setTimeout(() => {
            showProfilePanel();
        }, 500);

    } catch (error) {
        if (status) {
            status.innerHTML =
                `❌ ${escapeHTML(error.message)}`;
        }
    }
}

function showProfilePanel() {
    const content = $("accountModalContent");

    if (!content) return;

    const username =
        currentUser?.username ||
        currentUser?.profile_name ||
        "GLOW User";

    const planName =
        currentPlan?.name ||
        currentPlan?.plan ||
        currentUser?.plan ||
        "Free";

    content.innerHTML = `
        <div class="studio-modal-header">
            <div>
                <div class="studio-modal-badge">GLOW PROFILE</div>
                <h2>${escapeHTML(username)}</h2>
                <p>Manage your GLOW AI STUDIO account.</p>
            </div>
        </div>

        <div class="music-form">

            <div class="form-group">
                <label>Current Plan</label>

                <div class="select-box">
                    ${escapeHTML(planName)}
                </div>
            </div>

            <div class="form-group">
                <label>Username</label>

                <div class="select-box">
                    ${escapeHTML(currentUser?.username || "")}
                </div>
            </div>

            <div class="form-group">
                <label>Email</label>

                <div class="select-box">
                    ${escapeHTML(currentUser?.email || "")}
                </div>
            </div>

            <button
                class="generate-btn"
                type="button"
                onclick="refreshAccountData()"
            >
                🔄 Refresh Account
            </button>

            <button
                class="generate-btn"
                type="button"
                onclick="logoutUser()"
                style="margin-top:10px;"
            >
                🚪 Sign Out
            </button>

        </div>
    `;
}

async function logoutUser() {
    try {
        await apiRequest("/auth/logout", {
            method: "POST"
        });
    } catch (error) {
        console.error(error);
    }

    currentUser = null;
    currentPlan = null;
    currentUsage = null;

    updateAccountButton();
    showLoginPanel();
}

/* =========================
   ACCOUNT DATA
========================= */

async function loadCurrentUser() {
    try {
        const data = await apiRequest("/auth/me");

        if (data && data.user) {
            currentUser = data.user;
        } else if (data && data.authenticated) {
            currentUser = data;
        } else {
            currentUser = null;
        }

        updateAccountButton();

        if (currentUser) {
            await refreshAccountData();
        }

    } catch (error) {
        console.log("No active session.");
        currentUser = null;
        updateAccountButton();
    }
}

async function refreshAccountData() {
    if (!currentUser) return;

    await Promise.all([
        loadSubscription(),
        refreshUsage()
    ]);
}

async function loadSubscription() {
    try {
        const data = await apiRequest("/subscription");

        currentPlan =
            data.plan ||
            data.subscription ||
            data;

    } catch (error) {
        console.error("Subscription error:", error);
    }
}

async function refreshUsage() {
    if (!currentUser) return;

    try {
        const data = await apiRequest("/usage");

        currentUsage =
            data.usage ||
            data;

    } catch (error) {
        console.error("Usage error:", error);
    }
}

function updateAccountButton() {
    const button = document.querySelector(".login-btn");

    if (!button) return;

    if (currentUser) {
        button.textContent =
            currentUser.username ||
            currentUser.profile_name ||
            "Account";
    } else {
        button.textContent = "Sign In";
    }
}

/* =========================
   CREATIONS
========================= */

async function loadCreations() {
    if (!currentUser) return;

    try {
        const data = await apiRequest("/creations");

        const creations =
            data.creations ||
            data.items ||
            [];

        renderCreations(creations);

    } catch (error) {
        console.error("Creations error:", error);
    }
}

function renderCreations(creations) {
    const container =
        $("creationsList") ||
        document.querySelector(".creations-list");

    if (!container) return;

    if (!creations.length) {
        return;
    }

    container.innerHTML = creations.map(item => {

        const type =
            item.creation_type ||
            item.type ||
            "creation";

        const prompt =
            item.prompt ||
            "Untitled creation";

        const url =
            item.media_url ||
            item.url ||
            "";

        let media = "";

        if (url && type === "image") {
            media = `
                <img
                    src="${escapeHTML(url)}"
                    alt="Creation"
                    style="width:100%;border-radius:14px;"
                >
            `;
        } else if (url && type === "video") {
            media = `
                <video
                    controls
                    playsinline
                    src="${escapeHTML(url)}"
                    style="width:100%;border-radius:14px;"
                ></video>
            `;
        } else if (url && type === "music") {
            media = `
                <audio
                    controls
                    src="${escapeHTML(url)}"
                    style="width:100%;"
                ></audio>
            `;
        }

        return `
            <div class="studio-card">
                <div class="card-icon">
                    ${type === "music" ? "🎵" :
                      type === "video" ? "🎬" : "🖼️"}
                </div>

                <div class="card-label">
                    ${escapeHTML(type)}
                </div>

                <p>
                    ${escapeHTML(prompt)}
                </p>

                ${media}
            </div>
        `;
    }).join("");
}

/* =========================
   CLOSE MODALS
========================= */

document.addEventListener("click", function(event) {

    if (event.target.classList.contains("modal")) {
        event.target.classList.remove("active");
    }

    if (event.target.classList.contains("close-btn")) {
        const modal = event.target.closest(".modal");

        if (modal) {
            modal.classList.remove("active");
        }
    }
});

document.addEventListener("keydown", function(event) {

    if (event.key === "Escape") {
        closeAllModals();
    }

});

/* =========================
   STARTUP
========================= */

async function initializeGlow() {

    console.log("GLOW AI STUDIO 2027 starting...");

    try {
        await loadCurrentUser();

        if (currentUser) {
            await loadCreations();
        }

        console.log("GLOW AI STUDIO 2027 ready.");

    } catch (error) {
        console.error(
            "GLOW startup error:",
            error
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    initializeGlow
);

/* =========================
   GLOBAL FUNCTIONS
========================= */

window.openStudio = openStudio;
window.openAccount = openAccount;
window.closeModal = closeModal;
window.showLoginPanel = showLoginPanel;
window.showSignupPanel = showSignupPanel;
window.logoutUser = logoutUser;
window.refreshAccountData = refreshAccountData;
