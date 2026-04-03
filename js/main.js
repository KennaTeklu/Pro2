// js/main.js
import { loadUser, saveUser, getUserProfile } from './core/user.js';
import { initStorage } from './core/storage.js';
import { showSection } from './ui/navigation.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderWorkout } from './ui/workoutUI.js';
import { renderLibrary } from './ui/library.js';
import { renderHistory } from './ui/history.js';
import { renderProgress } from './ui/progress.js';
import { renderRecovery } from './ui/recovery.js';
import { renderSettings } from './ui/settings.js';

let appState = {
    currentSection: 'dashboard',
    user: null,
    currentWorkout: null,
    workouts: []
};

async function init() {
    await initStorage();
    appState.user = await loadUser();
    if (!appState.user) {
        // first launch: create default user with kg unit, no 1RMs yet
        appState.user = getUserProfile();
        await saveUser(appState.user);
    }
    renderApp();
    showSection(appState.currentSection);
    attachGlobalListeners();
}

function renderApp() {
    const root = document.getElementById('app');
    root.innerHTML = `
        <nav class="navbar">
            <div class="nav-brand">💪 Pro</div>
            <div class="nav-menu">
                <a href="#" data-section="dashboard">Dashboard</a>
                <a href="#" data-section="workout">Workout</a>
                <a href="#" data-section="library">Library</a>
                <a href="#" data-section="history">History</a>
                <a href="#" data-section="progress">Progress</a>
                <a href="#" data-section="recovery">Recovery</a>
                <a href="#" data-section="settings">Settings</a>
            </div>
            <div class="unit-toggle" id="globalUnitToggle"></div>
        </nav>
        <div class="container">
            <div id="dashboard-section" class="section"></div>
            <div id="workout-section" class="section"></div>
            <div id="library-section" class="section"></div>
            <div id="history-section" class="section"></div>
            <div id="progress-section" class="section"></div>
            <div id="recovery-section" class="section"></div>
            <div id="settings-section" class="section"></div>
        </div>
    `;
    // Delegate rendering to each UI module
    renderDashboard(appState);
    renderWorkout(appState);
    renderLibrary(appState);
    renderHistory(appState);
    renderProgress(appState);
    renderRecovery(appState);
    renderSettings(appState);
}

function attachGlobalListeners() {
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            appState.currentSection = section;
            showSection(section);
            // re‑render that section if needed
            if (section === 'workout') renderWorkout(appState);
            if (section === 'dashboard') renderDashboard(appState);
            if (section === 'library') renderLibrary(appState);
            if (section === 'history') renderHistory(appState);
            if (section === 'progress') renderProgress(appState);
            if (section === 'recovery') renderRecovery(appState);
            if (section === 'settings') renderSettings(appState);
        });
    });
}

init();