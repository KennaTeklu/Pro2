// js/ui/library.js
import { exerciseLibrary, getExerciseById, getAllExercises } from '../data/exerciseLibrary.js';
import { getAllMuscleGroups, getMuscleDisplayName } from '../data/muscleDatabase.js';
import { getUnit, formatWeight } from '../core/units.js';
import { getOneRM } from '../core/user.js';
import { showNotification, showModal, closeModal } from '../utils/dom.js';

let currentGrouping = 'muscleGroup';
let collapsedGroups = {};
let searchTerm = '';

/**
 * Render the library section
 * @param {Object} appState - Global app state
 */
export async function renderLibrary(appState) {
    const container = document.getElementById('library-section');
    if (!container) return;
    
    const allExercises = getAllExercises();
    const filtered = filterExercises(allExercises, searchTerm);
    const grouped = groupExercises(filtered, currentGrouping);
    const sortedKeys = sortGroupKeys(Object.keys(grouped), currentGrouping);
    
    container.innerHTML = `
        <div class="card">
            <div class="library-header">
                <h2 class="section-title">Exercise Library</h2>
                <div class="library-controls">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="librarySearch" placeholder="Search exercises or muscles..." value="${escapeHtml(searchTerm)}">
                    </div>
                    <select id="groupBySelect">
                        <option value="muscleGroup" ${currentGrouping === 'muscleGroup' ? 'selected' : ''}>Group by Muscle</option>
                        <option value="equipment" ${currentGrouping === 'equipment' ? 'selected' : ''}>Group by Equipment</option>
                        <option value="difficulty" ${currentGrouping === 'difficulty' ? 'selected' : ''}>Group by Difficulty</option>
                    </select>
                    <div class="library-actions">
                        <button class="btn btn-sm btn-outline" id="expandAllGroups">Expand All</button>
                        <button class="btn btn-sm btn-outline" id="collapseAllGroups">Collapse All</button>
                    </div>
                </div>
            </div>
            <div id="libraryGrid" class="library-grid">
                ${renderGroups(grouped, sortedKeys)}
            </div>
            <div class="library-count">${filtered.length} exercises</div>
        </div>
    `;
    
    // Attach event listeners
    document.getElementById('librarySearch')?.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        renderLibrary(appState);
    });
    document.getElementById('groupBySelect')?.addEventListener('change', (e) => {
        currentGrouping = e.target.value;
        collapsedGroups = {};
        renderLibrary(appState);
    });
    document.getElementById('expandAllGroups')?.addEventListener('click', () => {
        collapsedGroups = {};
        renderLibrary(appState);
    });
    document.getElementById('collapseAllGroups')?.addEventListener('click', () => {
        const groups = document.querySelectorAll('.library-group-header h3');
        groups.forEach(header => {
            const key = header.textContent.split(' (')[0];
            collapsedGroups[key] = true;
        });
        renderLibrary(appState);
    });
    
    // Attach group toggle listeners after render
    attachGroupToggleListeners();
}

function filterExercises(exercises, term) {
    if (!term) return exercises;
    const lowerTerm = term.toLowerCase();
    return exercises.filter(ex => 
        ex.name.toLowerCase().includes(lowerTerm) ||
        (ex.muscles && ex.muscles.some(m => m.toLowerCase().includes(lowerTerm))) ||
        (ex.equipment && ex.equipment.toLowerCase().includes(lowerTerm))
    );
}

function groupExercises(exercises, grouping) {
    const groups = {};
    for (const ex of exercises) {
        let key;
        switch (grouping) {
            case 'equipment':
                key = ex.equipment || 'Other';
                break;
            case 'difficulty':
                key = ex.skillFactor ? (ex.skillFactor < 0.5 ? 'Hard' : ex.skillFactor < 0.7 ? 'Medium' : 'Easy') : 'Medium';
                break;
            case 'muscleGroup':
            default:
                key = ex.primaryMuscle ? getMuscleDisplayName(ex.primaryMuscle) : (ex.muscles?.[0] || 'Other');
                break;
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(ex);
    }
    return groups;
}

function sortGroupKeys(keys, grouping) {
    if (grouping === 'difficulty') {
        const order = { 'Easy': 0, 'Medium': 1, 'Hard': 2 };
        return keys.sort((a, b) => (order[a] || 3) - (order[b] || 3));
    }
    return keys.sort();
}

function renderGroups(groups, sortedKeys) {
    if (sortedKeys.length === 0) {
        return `<div class="empty-state"><i class="fas fa-dumbbell"></i><h3>No exercises match</h3></div>`;
    }
    
    let html = '';
    for (const key of sortedKeys) {
        const exercises = groups[key];
        const isCollapsed = collapsedGroups[key] || false;
        const groupId = `group-${key.replace(/\s+/g, '_')}`;
        
        html += `
            <div class="library-group">
                <div class="library-group-header ${isCollapsed ? 'collapsed' : ''}" data-group-key="${escapeHtml(key)}">
                    <i class="fas fa-chevron-down group-toggle"></i>
                    <h3>${escapeHtml(key)} (${exercises.length})</h3>
                </div>
                <div class="library-group-content" id="${groupId}" style="${isCollapsed ? 'display: none;' : ''}">
                    <div class="exercise-cards">
                        ${exercises.map(ex => renderExerciseCard(ex)).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    return html;
}

function renderExerciseCard(ex) {
    const exerciseId = ex.name.toLowerCase().replace(/\s/g, '_');
    const oneRM = getOneRM(exerciseId);
    const oneRMDisplay = oneRM ? formatWeight(oneRM.weight) : '—';
    const difficultyBadge = getDifficultyBadge(ex.skillFactor);
    const musclesHtml = (ex.muscles || []).map(m => 
        `<span class="muscle-tag clickable" data-muscle="${m}">${getMuscleDisplayName(m)}</span>`
    ).join('');
    
    return `
        <div class="exercise-card" data-exercise-id="${exerciseId}">
            <div class="exercise-card-header">
                <h4>${escapeHtml(ex.name)}</h4>
                ${difficultyBadge}
            </div>
            <div class="exercise-card-muscles">${musclesHtml}</div>
            <div class="exercise-card-details">
                <span><i class="fas fa-dumbbell"></i> ${ex.defaultSets}×${ex.defaultReps}</span>
                <span><i class="fas fa-tools"></i> ${ex.equipment || 'Bodyweight'}</span>
                <span><i class="fas fa-chart-line"></i> 1RM: ${oneRMDisplay}</span>
            </div>
            <div class="exercise-card-actions">
                <button class="btn btn-sm btn-outline search-exercise-btn" data-exercise-id="${exerciseId}" data-exercise-name="${escapeHtml(ex.name)}">
                    <i class="fas fa-search"></i> How to do
                </button>
                <button class="btn btn-sm btn-primary add-to-workout-btn" data-exercise-id="${exerciseId}">
                    <i class="fas fa-plus"></i> Add to Workout
                </button>
            </div>
        </div>
    `;
}

function getDifficultyBadge(skillFactor) {
    if (!skillFactor) return '<span class="badge badge-info">Medium</span>';
    if (skillFactor < 0.5) return '<span class="badge badge-danger">Hard</span>';
    if (skillFactor < 0.7) return '<span class="badge badge-warning">Medium</span>';
    return '<span class="badge badge-success">Easy</span>';
}

function attachGroupToggleListeners() {
    document.querySelectorAll('.library-group-header').forEach(header => {
        header.removeEventListener('click', header._toggleListener);
        const listener = () => {
            const key = header.dataset.groupKey;
            const content = header.nextElementSibling;
            if (content) {
                const isCollapsed = content.style.display === 'none';
                content.style.display = isCollapsed ? 'flex' : 'none';
                header.classList.toggle('collapsed', !isCollapsed);
                collapsedGroups[key] = !isCollapsed;
            }
        };
        header.addEventListener('click', listener);
        header._toggleListener = listener;
    });
    
    // Muscle tag click – show muscle image/info
    document.querySelectorAll('.muscle-tag.clickable').forEach(tag => {
        tag.removeEventListener('click', tag._muscleListener);
        const muscleName = tag.dataset.muscle;
        const listener = (e) => {
            e.stopPropagation();
            showMuscleInfo(muscleName);
        };
        tag.addEventListener('click', listener);
        tag._muscleListener = listener;
    });
    
    // Search exercise button
    document.querySelectorAll('.search-exercise-btn').forEach(btn => {
        btn.removeEventListener('click', btn._searchListener);
        const exId = btn.dataset.exerciseId;
        const exName = btn.dataset.exerciseName;
        const listener = () => showExerciseSearch(exId, exName);
        btn.addEventListener('click', listener);
        btn._searchListener = listener;
    });
    
    // Add to workout button
    document.querySelectorAll('.add-to-workout-btn').forEach(btn => {
        btn.removeEventListener('click', btn._addListener);
        const exId = btn.dataset.exerciseId;
        const listener = () => addExerciseToCurrentWorkout(exId);
        btn.addEventListener('click', listener);
        btn._addListener = listener;
    });
}

function showExerciseSearch(exerciseId, exerciseName) {
    const exercise = getExerciseById(exerciseId);
    const instructions = exercise?.instructions || ['No instructions available.'];
    
    const modalContent = `
        <div class="exercise-search-modal">
            <h3>${escapeHtml(exerciseName)}</h3>
            <div class="exercise-instructions">
                <strong>How to perform:</strong>
                <ul>${instructions.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
            </div>
            <div class="search-links">
                <a href="https://www.google.com/search?q=${encodeURIComponent(exerciseName + ' exercise form')}" target="_blank" class="btn btn-sm btn-outline">
                    <i class="fab fa-google"></i> Google Search
                </a>
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' how to')}" target="_blank" class="btn btn-sm btn-outline">
                    <i class="fab fa-youtube"></i> YouTube
                </a>
            </div>
            <button class="btn btn-primary close-modal-btn">Close</button>
        </div>
    `;
    
    showModalDialog(modalContent);
}

function showMuscleInfo(muscleName) {
    const displayName = getMuscleDisplayName(muscleName);
    const modalContent = `
        <div class="muscle-info-modal">
            <h3>${escapeHtml(displayName)}</h3>
            <p>Search for anatomy images and exercises targeting this muscle.</p>
            <div class="search-links">
                <a href="https://www.google.com/search?q=${encodeURIComponent(muscleName + ' muscle anatomy')}" target="_blank" class="btn btn-sm btn-outline">
                    <i class="fab fa-google"></i> Google Images
                </a>
                <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(muscleName)}" target="_blank" class="btn btn-sm btn-outline">
                    <i class="fab fa-wikipedia-w"></i> Wikipedia
                </a>
            </div>
            <button class="btn btn-primary close-modal-btn">Close</button>
        </div>
    `;
    showModalDialog(modalContent);
}

function showModalDialog(html) {
    let modal = document.getElementById('dynamicModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dynamicModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content"><span class="modal-close">&times;</span><div id="dynamicModalBody"></div></div>`;
        document.body.appendChild(modal);
        modal.querySelector('.modal-close').addEventListener('click', () => closeModal('dynamicModal'));
    }
    const body = document.getElementById('dynamicModalBody');
    if (body) body.innerHTML = html;
    showModal('dynamicModal');
    
    // Attach close button inside content
    const closeBtn = document.querySelector('#dynamicModalBody .close-modal-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal('dynamicModal'));
}

async function addExerciseToCurrentWorkout(exerciseId) {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) {
        showNotification('Exercise not found', 'error');
        return;
    }
    
    // Load current workout
    const { loadCurrentWorkout, saveCurrentWorkout } = await import('../core/storage.js');
    let currentWorkout = await loadCurrentWorkout();
    
    if (!currentWorkout) {
        currentWorkout = {
            id: `wo_${Date.now()}`,
            date: new Date().toISOString(),
            name: 'Custom Workout',
            type: 'custom',
            exercises: []
        };
    }
    
    // Check if already in workout
    if (currentWorkout.exercises.some(ex => ex.id === exerciseId)) {
        showNotification(`${exercise.name} already in workout`, 'warning');
        return;
    }
    
    // Create exercise object
    const newExercise = {
        id: exerciseId,
        name: exercise.name,
        muscleGroup: exercise.muscles || [],
        equipment: exercise.equipment,
        instructions: exercise.instructions,
        skillFactor: exercise.skillFactor,
        strengthIndex: exercise.strengthIndex,
        loggedSets: []
    };
    
    currentWorkout.exercises.push(newExercise);
    await saveCurrentWorkout(currentWorkout);
    showNotification(`${exercise.name} added to workout`, 'success');
    
    // Optionally switch to workout section
    const { showSection } = await import('./navigation.js');
    if (confirm('Go to workout section now?')) {
        showSection('workout');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}