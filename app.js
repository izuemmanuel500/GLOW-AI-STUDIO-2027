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

    if (
        value === null ||
        value === undefined
    ) {
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


    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }


    if (!response.ok) {

        const error = new Error(
            data.error ||
            data.message ||
            `Request failed (${response.status})`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }


    return data;
}


/* ============================================================
   MESSAGE
============================================================ */

function showMessage(message) {
    alert(message);
}


/* ============================================================
   MODALS
============================================================ */

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.remove("active");
    modal.classList.remove("show");
    modal.style.display = "";
}


function closeAllModals() {

    document
        .querySelectorAll(".modal")
        .forEach(modal => {

            modal.classList.remove("active");
            modal.classList.remove("show");
            modal.style.display = "";

        });
}


function openModal(id) {

    closeAllModals();

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.add("active");
    modal.classList.add("show");
    modal.style.display = "flex";
}


/* ============================================================
   STUDIO MODAL
============================================================ */

function openStudio(type) {

    const modal =
        document.getElementById("studioModal");

    if (!modal) {
        return;
    }


    let title = "";
    let badge = "";
    let form = "";


    /* ================= MUSIC ================= */

    if (type === "music") {

        title = "GLOW MUSIC STUDIO";

        badge = `
            <div class="studio-engine-badge">
                🎵 AI MUSIC
            </div>
        `;


        form = `
