// js/ui/workoutUI.js
import { getUserProfile, getOneRM, setOneRM, promptForOneRM, getBodyweight } from '../core/user.js';
import { getUnit, formatWeight, roundWeight, convertWeight } from '../core/units.js';
import { loadCurrentWorkout, saveCurrentWorkout, loadWorkouts, saveWorkout } from '../core/storage.js';
import { estimate1RM, calculateRIR, rirToColorClass, getIntensity } from '../utils/math.js';
import { showNotification, showLoading, scrollToElement, createThickSlider } from '../utils/dom.js';
import { showSection } from './navigation.js';

let currentWorkout = null;
let expandedExercises = new Set(); // track which exercise panels are open

/**
 * Render the workout section
 * @param {Object} appState - Global app state
 */
export async function renderWorkout(appState) {
    const container = document.getElementById('workout-section');
    if (!container) return;
    
    currentWorkout = await loadCurrentWorkout();
    
    if (!currentWorkout || !currentWorkout.exercises || currentWorkout.exercises.length === 0) {
        container.innerHTML = `
            <div class="card empty-workout">
                <i class="fas fa-dumbbell" style="font-size: 3rem; color: var(--gray-400);"></i>
                <h3>No Workout Scheduled</h3>
                <p>Generate a workout to get started.</p>
                <button class="btn btn-primary" id="generateWorkoutBtn">Generate Workout</button>
            </div>
        `;
        document.getElementById('generateWorkoutBtn')?.addEventListener('click', () => {
            import('../workout/generator.js').then(mod => mod.generateWorkout()).then(() => renderWorkout(appState));
        });
        return;
    }
    
    // Render workout header
    let html = `
        <div class="card">
            <div class="workout-header">
                <h2>${currentWorkout.name || 'Today\'s Workout'}</h2>
                <div class="workout-meta">
                    <span>${currentWorkout.exercises.length} exercises</span>
                    <span>Est. ${estimateTotalTime(currentWorkout.exercises)} min</span>
                </div>
            </div>
            <div class="exercise-list" id="exerciseList">
    `;
    
    // Render each exercise
    for (let i = 0; i < currentWorkout.exercises.length; i++) {
        const ex = currentWorkout.exercises[i];
        const isExpanded = expandedExercises.has(i);
        const oneRM = getOneRM(ex.id);
        const prescription = await generatePrescriptionForExercise(ex, oneRM);
        
        // Store prescription back to exercise object for later logging
        ex.prescribed = prescription;
        
        const lastLog = getLastLogForExercise(ex.id);
        const rirColor = rirToColorClass(prescription.estimatedRIR);
        
        html += `
            <div class="exercise-item" data-exercise-index="${i}" data-exercise-id="${ex.id}">
                <div class="exercise-header" data-toggle="${i}">
                    <div class="exercise-title">
                        <i class="fas fa-dumbbell"></i>
                        ${ex.name}
                        <span class="search-cta" data-search="${ex.id}">
                            <i class="fas fa-search"></i> How to do
                        </span>
                    </div>
                    <div class="exercise-header-right">
                        <span class="rir-light ${rirColor}"></span>
                        <i class="fas fa-chevron-down ${isExpanded ? 'rotate' : ''}"></i>
                    </div>
                </div>
                <div class="exercise-prescription" id="prescription_${i}" style="${isExpanded ? '' : 'display: none;'}">
                    <div class="prescription-row">
                        <div class="prescription-weight">
                            ${formatWeight(prescription.weight, null, 1)} × ${prescription.reps} reps
                        </div>
                        <div class="prescription-sets">
                            ${prescription.sets} sets
                        </div>
                        <div class="prescription-rest">
                            Rest: ${prescription.restSecs} sec
                        </div>
                    </div>
                    <div class="prescription-notes">
                        ${prescription.notes || 'Aim to hit the target reps. Increase weight when you exceed the upper range.'}
                    </div>
                    ${lastLog ? `<div class="last-log">Last: ${lastLog.weight} ${getUnit()} × ${lastLog.reps} reps (RPE ${lastLog.rpe})</div>` : ''}
                    <div class="set-logging-panel" id="logging_${i}" style="margin-top: 16px;">
                        <!-- Dynamic set logging UI will be injected here -->
                    </div>
                </div>
            </div>
        `;
    }
    
    html += `
            </div>
            <div class="workout-actions">
                <button class="btn btn-success" id="completeWorkoutBtn">Complete Workout</button>
                <button class="btn btn-outline" id="regenerateWorkoutBtn">Regenerate</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Attach event listeners
    attachExerciseToggleListeners();
    attachSearchListeners();
    attachRegenerateListener();
    attachCompleteListener();
    
    // Build logging UI for each exercise (after DOM is ready)
    for (let i = 0; i < currentWorkout.exercises.length; i++) {
        buildLoggingUI(i, currentWorkout.exercises[i]);
    }
}

function attachExerciseToggleListeners() {
    document.querySelectorAll('.exercise-header[data-toggle]').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.closest('.search-cta')) return;
            const index = parseInt(header.dataset.toggle);
            const prescriptionDiv = document.getElementById(`prescription_${index}`);
            const chevron = header.querySelector('.fa-chevron-down');
            if (prescriptionDiv) {
                const isHidden = prescriptionDiv.style.display === 'none';
                prescriptionDiv.style.display = isHidden ? 'block' : 'none';
                if (chevron) chevron.classList.toggle('rotate', isHidden);
                if (isHidden) expandedExercises.add(index);
                else expandedExercises.delete(index);
            }
        });
    });
}

function attachSearchListeners() {
    document.querySelectorAll('.search-cta').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const exerciseId = btn.dataset.search;
            const exercise = findExerciseById(exerciseId);
            if (exercise && exercise.instructions) {
                alert(exercise.instructions.join('\n'));
            } else {
                window.open(`https://www.google.com/search?q=${exerciseId}+exercise+form`, '_blank');
            }
        });
    });
}

function attachRegenerateListener() {
    document.getElementById('regenerateWorkoutBtn')?.addEventListener('click', async () => {
        showLoading(true);
        const { generateWorkout } = await import('../workout/generator.js');
        await generateWorkout();
        await renderWorkout({});
        showLoading(false);
        showNotification('New workout generated', 'success');
    });
}

function attachCompleteListener() {
    document.getElementById('completeWorkoutBtn')?.addEventListener('click', async () => {
        if (!currentWorkout) return;
        // Check if all exercises have logs
        const unlogged = currentWorkout.exercises.filter(ex => !ex.loggedSets || ex.loggedSets.length === 0);
        if (unlogged.length > 0) {
            if (!confirm(`You have ${unlogged.length} unlogged exercises. Complete anyway?`)) return;
        }
        await finalizeWorkout();
    });
}

async function generatePrescriptionForExercise(exercise, oneRM) {
    const user = getUserProfile();
    const unit = getUnit();
    let weight = 0;
    let reps = 10;
    let sets = 3;
    let restSecs = 90;
    
    if (oneRM && oneRM.weight > 0) {
        // Use 1RM to calculate weight based on goal
        const intensityMap = {
            strength: 0.80,
            hypertrophy: 0.70,
            endurance: 0.60,
            longevity: 0.65,
            balanced: 0.70
        };
        const intensity = intensityMap[user.goal] || 0.70;
        weight = oneRM.weight * intensity;
        weight = roundWeight(weight, unit);
        
        // Reps based on goal
        const repsMap = {
            strength: 5,
            hypertrophy: 10,
            endurance: 15,
            longevity: 12,
            balanced: 8
        };
        reps = repsMap[user.goal] || 8;
        
        // Sets based on experience
        const setsMap = { beginner: 3, intermediate: 4, advanced: 5 };
        sets = setsMap[user.experience] || 3;
        
        // Rest based on technical difficulty
        const techMult = exercise.skillFactor ? (exercise.skillFactor < 0.6 ? 1.5 : 1.2) : 1.2;
        restSecs = Math.round(90 * techMult);
        
        // Estimate RIR for display
        const rirData = calculateRIR(weight, reps, oneRM.weight, 1, user.experience);
        const estimatedRIR = rirData.mean;
        
        return { weight, reps, sets, restSecs, estimatedRIR, notes: `Based on your 1RM of ${formatWeight(oneRM.weight)}` };
    } else {
        // No 1RM – prompt user
        const userWeight = getBodyweight();
        // Default guess: bodyweight * strengthIndex (if available)
        let guessWeight = userWeight;
        if (exercise.strengthIndex) guessWeight = userWeight * exercise.strengthIndex;
        weight = roundWeight(guessWeight * 0.7, unit);
        reps = 10;
        sets = 3;
        restSecs = 90;
        return { weight, reps, sets, restSecs, estimatedRIR: 3, notes: `⚠️ No 1RM found. Log your first set to calibrate.` };
    }
}

function getLastLogForExercise(exerciseId) {
    const storageKey = `pro_exercise_${exerciseId}`;
    const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (history.length === 0) return null;
    const last = history[history.length - 1];
    return {
        weight: last.weight,
        reps: last.reps,
        rpe: last.rpe,
        date: last.date
    };
}

function findExerciseById(id) {
    // This will be imported from exerciseLibrary.js later
    // For now, search in currentWorkout exercises
    if (currentWorkout) {
        return currentWorkout.exercises.find(ex => ex.id === id);
    }
    return null;
}

function estimateTotalTime(exercises) {
    let total = 0;
    exercises.forEach(ex => {
        const sets = ex.prescribed?.sets || 3;
        const rest = ex.prescribed?.restSecs || 90;
        total += sets * (rest + 30); // 30 sec per set
    });
    return Math.round(total / 60);
}

async function buildLoggingUI(index, exercise) {
    const container = document.getElementById(`logging_${index}`);
    if (!container) return;
    
    const prescribed = exercise.prescribed;
    if (!prescribed) return;
    
    // Create thick slider for weight adjustment (optional)
    const weightSlider = createThickSlider(
        prescribed.weight * 0.5,
        prescribed.weight * 1.5,
        prescribed.weight,
        2.5,
        (val) => {
            const display = container.querySelector('.current-weight-display');
            if (display) display.textContent = formatWeight(val);
            exercise.loggedWeight = val;
        }
    );
    
    // RPE selector (1-10) with color coding
    let rpeOptions = '';
    for (let i = 1; i <= 10; i++) {
        const hue = 120 - (i - 1) * 12;
        rpeOptions += `<option value="${i}" style="background: hsl(${hue}, 80%, 45%); color: white;">${i}</option>`;
    }
    
    container.innerHTML = `
        <div class="log-set-form">
            <div class="form-row">
                <label>Weight (${getUnit()}):</label>
                <div class="weight-control">
                    <span class="current-weight-display">${formatWeight(prescribed.weight)}</span>
                    <div class="slider-container">${weightSlider.outerHTML}</div>
                </div>
            </div>
            <div class="form-row">
                <label>Reps:</label>
                <input type="number" id="reps_${index}" class="reps-input" value="${prescribed.reps}" min="1" max="30" step="1">
            </div>
            <div class="form-row">
                <label>RPE:</label>
                <select id="rpe_${index}" class="rpe-select">${rpeOptions}</select>
            </div>
            <div class="form-row">
                <label>Notes:</label>
                <input type="text" id="notes_${index}" placeholder="Form, difficulty, etc.">
            </div>
            <button class="btn btn-sm btn-primary log-set-btn" data-index="${index}">Log Set</button>
        </div>
        <div class="logged-sets" id="loggedSets_${index}">
            <strong>Logged sets:</strong>
            <div class="sets-list"></div>
        </div>
    `;
    
    // Re-attach slider event after innerHTML replacement
    const newSlider = container.querySelector('.slider-thick');
    if (newSlider) {
        newSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const display = container.querySelector('.current-weight-display');
            if (display) display.textContent = formatWeight(val);
            exercise.loggedWeight = val;
        });
    }
    
    // Store logged sets for this exercise
    if (!exercise.loggedSets) exercise.loggedSets = [];
    
    const logBtn = container.querySelector('.log-set-btn');
    logBtn?.addEventListener('click', () => {
        const weight = exercise.loggedWeight || prescribed.weight;
        const repsInput = document.getElementById(`reps_${index}`);
        const rpeSelect = document.getElementById(`rpe_${index}`);
        const notesInput = document.getElementById(`notes_${index}`);
        
        const reps = parseInt(repsInput.value);
        const rpe = parseInt(rpeSelect.value);
        const notes = notesInput.value;
        
        if (isNaN(reps) || reps <= 0) {
            showNotification('Enter valid reps', 'error');
            return;
        }
        
        // Calculate RIR for this set
        const oneRM = getOneRM(exercise.id);
        let rirData = null;
        if (oneRM && oneRM.weight > 0) {
            rirData = calculateRIR(weight, reps, oneRM.weight, exercise.loggedSets.length + 1, getUserProfile().experience);
        }
        
        const setLog = {
            setNumber: exercise.loggedSets.length + 1,
            weight,
            reps,
            rpe,
            rir: rirData ? rirData.mean : null,
            notes,
            timestamp: new Date().toISOString()
        };
        
        exercise.loggedSets.push(setLog);
        
        // Update 1RM after each set (recursive)
        if (oneRM && oneRM.weight > 0) {
            const newEstimate = estimate1RM(weight, reps, getUnit());
            if (newEstimate > oneRM.weight) {
                setOneRM(exercise.id, newEstimate, 1);
                showNotification(`New 1RM estimated: ${formatWeight(newEstimate)}`, 'success');
            }
        } else if (!oneRM && exercise.loggedSets.length >= 1) {
            // First set ever – estimate 1RM and save
            const estimated = estimate1RM(weight, reps, getUnit());
            setOneRM(exercise.id, estimated, 1);
            showNotification(`1RM estimated: ${formatWeight(estimated)}`, 'info');
        }
        
        // Update the UI to show logged sets
        updateLoggedSetsDisplay(index, exercise);
        
        // Clear notes field
        if (notesInput) notesInput.value = '';
        
        showNotification(`Set ${setLog.setNumber} logged`, 'success');
        
        // Regenerate prescription for next set (optional: adjust weight recommendation)
        updatePrescriptionAfterSet(index, exercise);
    });
    
    updateLoggedSetsDisplay(index, exercise);
}

function updateLoggedSetsDisplay(index, exercise) {
    const container = document.getElementById(`loggedSets_${index}`);
    if (!container) return;
    const setsList = container.querySelector('.sets-list');
    if (!setsList) return;
    
    if (exercise.loggedSets.length === 0) {
        setsList.innerHTML = '<em>No sets logged yet</em>';
        return;
    }
    
    let html = '<ul style="margin-top: 8px;">';
    exercise.loggedSets.forEach(set => {
        const rirBadge = set.rir !== null ? `<span class="rir-light ${rirToColorClass(set.rir)}"></span>` : '';
        html += `<li>Set ${set.setNumber}: ${formatWeight(set.weight)} × ${set.reps} reps, RPE ${set.rpe} ${rirBadge} ${set.notes ? `— ${set.notes}` : ''}</li>`;
    });
    html += '</ul>';
    setsList.innerHTML = html;
}

function updatePrescriptionAfterSet(index, exercise) {
    // Optional: adjust next set's recommended weight based on RIR
    const lastSet = exercise.loggedSets[exercise.loggedSets.length - 1];
    if (!lastSet) return;
    
    const oneRM = getOneRM(exercise.id);
    if (!oneRM || oneRM.weight <= 0) return;
    
    const targetRIR = 2; // aim for 2 reps in reserve
    const lastRIR = lastSet.rir;
    if (lastRIR !== null && lastRIR < targetRIR) {
        // Too hard – reduce weight slightly for next set (or keep same)
        // For simplicity, we don't auto-adjust; user can use slider.
    } else if (lastRIR > targetRIR + 1) {
        // Too easy – suggest weight increase via notification
        showNotification(`Consider increasing weight by 2.5-5 ${getUnit()} on next set`, 'info');
    }
}

async function finalizeWorkout() {
    if (!currentWorkout) return;
    
    // Calculate summary
    let totalVolume = 0;
    let totalRPE = 0;
    let rpeCount = 0;
    
    currentWorkout.exercises.forEach(ex => {
        if (ex.loggedSets && ex.loggedSets.length) {
            ex.loggedSets.forEach(set => {
                totalVolume += set.weight * set.reps;
                totalRPE += set.rpe;
                rpeCount++;
            });
        }
    });
    
    currentWorkout.summary = {
        totalVolume,
        averageRPE: rpeCount > 0 ? (totalRPE / rpeCount).toFixed(1) : null,
        completedExercises: currentWorkout.exercises.filter(ex => ex.loggedSets?.length).length,
        dateCompleted: new Date().toISOString()
    };
    
    // Save to history
    await saveWorkout(currentWorkout);
    
    // Save exercise logs to localStorage (per exercise history)
    for (const ex of currentWorkout.exercises) {
        if (ex.loggedSets && ex.loggedSets.length) {
            const storageKey = `pro_exercise_${ex.id}`;
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const newLogs = ex.loggedSets.map(set => ({
                weight: set.weight,
                reps: set.reps,
                rpe: set.rpe,
                rir: set.rir,
                notes: set.notes,
                date: set.timestamp,
                workoutId: currentWorkout.id
            }));
            const combined = [...existing, ...newLogs];
            // Keep last 50 logs
            while (combined.length > 50) combined.shift();
            localStorage.setItem(storageKey, JSON.stringify(combined));
        }
    }
    
    // Clear current workout
    await saveCurrentWorkout(null);
    currentWorkout = null;
    expandedExercises.clear();
    
    showNotification('Workout completed!', 'success');
    showSection('dashboard');
    
    // Optionally generate next workout
    setTimeout(() => {
        if (confirm('Generate next workout?')) {
            import('../workout/generator.js').then(mod => mod.generateWorkout()).then(() => {
                showSection('workout');
            });
        }
    }, 500);
}