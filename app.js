"use strict";

/* =========================================================
   GLOW AI STUDIO 2027
   DASHBOARD APP
   ========================================================= */

const API_BASE = "/api";

let currentUser = null;
let currentPlan = null;
let currentUsage = null;

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
   API
   ========================================================= */

async function apiRequest(url, options = {}) {
    const config = {
        credentials: "include",
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
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
   MESSAGE
   ========================================================= */

function showMessage(message, type = "info") {
    let box = $("glowMessage");

    if (!box) {
        box = document.createElement("div");
        box.id = "glowMessage";

        box.style.position = "fixed";
        box.style.left = "50%";
        box.style.bottom = "25px";
        box.style.transform = "translateX(-50%)";
        box.style.zIndex = "99999";
        box.style.padding = "14px 20px";
        box.style.borderRadius = "14px";
        box.style.background = "#17152b";
        box.style.color = "#fff";
        box.style.border = "1px solid rgba(255,255,255,.15)";
        box.style.boxShadow = "0 15px 40px rgba(0,0,0,.4)";
        box.style.fontSize = "14px";
        box.style.maxWidth = "90%";
        box.style.textAlign = "center";

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
        box.remove();
    }, 4000);
}

/* =========================================================
   MODALS
   ========================================================= */

function closeModal() {
    const modal = $("studioModal");

    if (modal) {
        modal.classList.remove("show");
        modal.style.display = "none";
    }
}

function closeAllModals() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.remove("show");
        modal.style.display = "none";
    });

    closeModal();
}

function openModal() {
    const modal = $("studioModal");

    if (!modal) {
        showMessage("Studio window is missing from dashboard.html", "error");
        return;
    }

    modal.style.display = "flex";

    requestAnimationFrame(() => {
        modal.classList.add("show");
    });
}

/* =========================================================
   STUDIO BUTTONS
   ========================================================= */

function openStudio(type) {

    const title = $("studioModalTitle");
    const content = $("studioModalContent");

    if (!title || !content) {
        showMessage(
            "Studio popup is missing. Please check dashboard.html.",
            "error"
        );
        return;
    }

    let html = "";

    if (type === "music") {

        title.textContent = "🎵 GLOW MUSIC";

        html = `
            <form id="musicGenerationForm" class="generation-form">

                <label>
                    Describe your music
                </label>

                <textarea
                    id="musicPrompt"
                    placeholder="Example: Create an emotional Afrobeat song about chasing dreams..."
                    required
                ></textarea>

                <label>
                    Genre
                </label>

                <select id="musicGenre">
                    <option value="Afrobeats">Afrobeats</option>
                    <option value="Pop">Pop</option>
                    <option value="Hip Hop">Hip Hop</option>
                    <option value="R&B">R&B</option>
                    <option value="Amapiano">Amapiano</option>
                    <option value="Gospel">Gospel</option>
                    <option value="Electronic">Electronic</option>
                </select>

                <label>
                    Mood
                </label>

                <select id="musicMood">
                    <option value="Energetic">Energetic</option>
                    <option value="Happy">Happy</option>
                    <option value="Emotional">Emotional</option>
                    <option value="Romantic">Romantic</option>
                    <option value="Dark">Dark</option>
                    <option value="Chill">Chill</option>
                </select>

                <label>
                    Duration
                </label>

                <select id="musicDuration">
                    <option value="15">15 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="45">45 seconds</option>
                    <option value="60">60 seconds</option>
                </select>

                <button type="submit" class="primary-btn">
                    🎵 Generate Music
                </button>

            </form>
        `;

    } else if (type === "video") {

        title.textContent = "🎬 GLOW VIDEO";

        html = `
            <form id="videoGenerationForm" class="generation-form">

                <label>
                    Describe your video
                </label>

                <textarea
                    id="videoPrompt"
                    placeholder="Example: A futuristic African city at night with glowing lights..."
                    required
                ></textarea>

                <label>
                    Duration
                </label>

                <select id="videoDuration">
                    <option value="5">5 seconds</option>
                    <option value="10">10 seconds</option>
                </select>

                <button type="submit" class="primary-btn">
                    🎬 Generate Video
                </button>

            </form>
        `;

    } else if (type === "image") {

        title.textContent = "🖼️ GLOW IMAGE";

        html = `
            <form id="imageGenerationForm" class="generation-form">

                <label>
                    Describe your image
                </label>

                <textarea
                    id="
