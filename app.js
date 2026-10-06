"use strict";

/* ============================================================
   GLOW AI STUDIO 2027
   FRONTEND APP
   ============================================================ */

const API_BASE = "/api";

let currentUser = null;
let currentPlan = null;
let currentUsage = null;
let currentGeneration = null;


/* ============================================================
   BASIC HELPERS
   ============================================================ */

function $(selector) {
    return document.querySelector(selector);
}


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


/* ============================================================
   API REQUEST
   ============================================================ */

async function apiRequest(
    endpoint,
    options = {}
) {
    const config = {
        credentials: "include",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        config
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const error = new Error(
            data.error || `Request failed (${response.status})`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}


/* ============================================================
   MESSAGES
   ============================================================ */

function showMessage(message) {
    alert(message);
}


/* ============================================================
   MODALS
   ============================================================ */

function closeModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.remove("active");
        modal.classList.remove("show");
        modal.style.display = "";
    }
}


function closeAllModals() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.remove("active");
        modal.classList.remove("show");
        modal.style.display = "";
    });
}


function openModal(id) {
    closeAllModals();

    const modal = document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.add("active");
    modal.classList.add("show");
    modal.style.display = "flex";
}


/* ============================================================
   STUDIO
   ============================================================ */

function openStudio(type) {

    if (!currentUser) {
        openAccount();
        showLoginPanel();
        return;
    }

    const modal = document.getElementById("studioModal");

    if (!modal) {
        return;
    }

    const content =
        modal.querySelector(".modal-content") ||
        modal.querySelector(".modal-box") ||
        modal;

    let title = "";
    let badge = "";
    let form = "";

    if (type === "music") {

        title = "GLOW MUSIC STUDIO";

        badge = `
            <div class="studio-engine-badge">
                🎵 FAL ACE-STEP AI MUSIC
            </div>
        `;

        form = `
            <form id="musicGenerationForm">

                <label>
                    Music Prompt
                </label>

                <textarea
                    id="musicPrompt"
                    placeholder="Describe the song you want..."
                    required
                ></textarea>

                <label>
                    Genre
                </label>

                <select id="musicGenre">
                    <option value="">Auto</option>
                    <option>Afrobeats</option>
                    <option>Afropop</option>
                    <option>Amapiano</option>
                    <option>Hip Hop</option>
                    <option>R&B</option>
                    <option>Pop</option>
                    <option>Electronic</option>
                    <option>Gospel</option>
                    <option>Rock</option>
                    <option>Cinematic</option>
                </select>

                <label>
                    Mood
                </label>

                <select id="musicMood">
                    <option value="">Auto</option>
                    <option>Happy</option>
                    <option>Energetic</option>
                    <option>Romantic</option>
                    <option>Sad</option>
                    <option>Inspirational</option>
                    <option>Dark</option>
                    <option>Chill</option>
                </select>

                <label>
                    Duration
                </label>

                <select id="musicDuration">
                    <option value="15">15 seconds</option>
                    <option value="30" selected>30 seconds</option>
                    <option value="45">45 seconds</option>
                    <option value="60">60 seconds</option>
                </select>

                <button
                    type="submit"
                    class
