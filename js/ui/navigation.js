// js/ui/navigation.js
import { showNotification, scrollToElement, getTopOffset } from '../utils/dom.js';

let currentSectionId = 'dashboard';
let sectionCallbacks = {};

/**
 * Register a callback to run when a section becomes active
 * @param {string} sectionId - e.g., 'workout'
 * @param {Function} callback - function to call on activation
 */
export function onSectionActivate(sectionId, callback) {
    if (!sectionCallbacks[sectionId]) sectionCallbacks[sectionId] = [];
    sectionCallbacks[sectionId].push(callback);
}

/**
 * Show a specific section by ID
 * @param {string} sectionId - dashboard, workout, library, history, progress, recovery, settings
 * @param {boolean} updateUrl - whether to push state (default false)
 */
export function showSection(sectionId, updateUrl = false) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSectionId = sectionId;
    } else {
        console.warn(`Section ${sectionId}-section not found`);
        return;
    }
    
    // Update active nav links (both top and bottom nav)
    document.querySelectorAll('[data-section]').forEach(link => {
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update bottom nav if present
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        const itemSection = item.dataset.section;
        if (itemSection === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Trigger registered callbacks
    if (sectionCallbacks[sectionId]) {
        sectionCallbacks[sectionId].forEach(cb => {
            try { cb(); } catch(e) { console.error(e); }
        });
    }
    
    // Optionally update URL hash
    if (updateUrl) {
        window.location.hash = sectionId;
    }
    
    // Scroll to top of section with offset
    setTimeout(() => {
        const offset = getTopOffset();
        const elementPosition = targetSection.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
        });
    }, 50);
}

/**
 * Initialize navigation from URL hash or default
 */
export function initNavigation() {
    const hash = window.location.hash.slice(1);
    const validSections = ['dashboard', 'workout', 'library', 'history', 'progress', 'recovery', 'settings'];
    if (hash && validSections.includes(hash)) {
        showSection(hash, false);
    } else {
        showSection('dashboard', false);
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash.slice(1);
        if (validSections.includes(newHash)) {
            showSection(newHash, false);
        }
    });
}

/**
 * Render the bottom navigation bar (visible only on computers)
 */
export function renderBottomNav() {
    const existing = document.querySelector('.bottom-nav');
    if (existing) existing.remove();
    
    const bottomNav = document.createElement('div');
    bottomNav.className = 'bottom-nav';
    bottomNav.innerHTML = `
        <div class="bottom-nav-menu">
            <a href="#" class="bottom-nav-item" data-section="dashboard">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </a>
            <a href="#" class="bottom-nav-item" data-section="workout">
                <i class="fas fa-dumbbell"></i>
                <span>Workout</span>
            </a>
            <a href="#" class="bottom-nav-item" data-section="library">
                <i class="fas fa-book"></i>
                <span>Library</span>
            </a>
            <a href="#" class="bottom-nav-item" data-section="history">
                <i class="fas fa-history"></i>
                <span>History</span>
            </a>
            <a href="#" class="bottom-nav-item" data-section="progress">
                <i class="fas fa-chart-line"></i>
                <span>Progress</span>
            </a>
            <a href="#" class="bottom-nav-item" data-section="recovery">
                <i class="fas fa-heartbeat"></i>
                <span>Recovery</span>
            </a>
            <a href="#" class="bottom-nav-item" data-section="settings">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </a>
        </div>
    `;
    document.body.appendChild(bottomNav);
    
    // Attach click handlers
    bottomNav.querySelectorAll('.bottom-nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) showSection(section, true);
        });
    });
}

/**
 * Update resume button visibility in both top and bottom nav
 * @param {boolean} hasSavedWorkout - whether a saved workout exists
 */
export function updateResumeButtons(hasSavedWorkout) {
    const topResume = document.getElementById('resumeWorkoutBtn');
    const topRegen = document.getElementById('regenerateWorkoutBtn');
    const bottomResume = document.querySelector('.bottom-nav-item[data-section="resume"]');
    const bottomRegen = document.querySelector('.bottom-nav-item[data-section="regenerate"]');
    
    if (topResume) topResume.style.display = hasSavedWorkout ? 'inline-flex' : 'none';
    if (topRegen) topRegen.style.display = hasSavedWorkout ? 'none' : 'inline-flex';
    // Bottom nav buttons would need to be created dynamically – simplified here
}