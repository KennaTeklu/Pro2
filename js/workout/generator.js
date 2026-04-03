// js/workout/generator.js
import { getUserProfile, getOneRM, getBodyweight } from '../core/user.js';
import { getUnit, formatWeight } from '../core/units.js';
import { loadWorkouts, saveCurrentWorkout } from '../core/storage.js';
import { showNotification, showLoading } from '../utils/dom.js';
import { exerciseLibrary, getExerciseById } from '../data/exerciseLibrary.js';
import { muscleDatabase } from '../data/muscleDatabase.js';
import { workoutSplits } from '../data/workoutSplits.js';

/**
 * Generate a complete workout based on user profile, history, and recovery status
 * @returns {Promise<Object>} The generated workout object
 */
export async function generateWorkout() {
    showLoading(true);
    
    const user = getUserProfile();
    const workouts = await loadWorkouts();
    const lastWorkout = workouts.length > 0 ? workouts[workouts.length - 1] : null;
    
    // Determine split type (rotation or based on recovery)
    let split = selectSplit(lastWorkout, user);
    
    // Get target muscle groups from split
    let targetMuscles = [...split.focus];
    
    // Add overdue muscles (neglected beyond 1.5× rest days)
    const overdue = getOverdueMuscles();
    overdue.forEach(m => {
        if (!targetMuscles.includes(m)) targetMuscles.push(m);
    });
    
    // Limit to 6-8 exercises total
    if (targetMuscles.length > 8) targetMuscles = targetMuscles.slice(0, 8);
    if (targetMuscles.length < 4) targetMuscles.push('core', 'forearms'); // filler
    
    // Generate exercises for each target muscle
    const exercises = [];
    for (const muscle of targetMuscles) {
        const exercise = await selectExerciseForMuscle(muscle);
        if (exercise) {
            exercises.push(exercise);
        }
    }
    
    // Ensure at least 4 exercises
    if (exercises.length < 4) {
        const fallback = ['squat', 'bench_press', 'pull_up', 'deadlift'];
        for (const fallbackId of fallback) {
            if (exercises.length >= 6) break;
            const ex = getExerciseById(fallbackId);
            if (ex && !exercises.some(e => e.id === fallbackId)) {
                exercises.push(ex);
            }
        }
    }
    
    // Build workout object
    const workout = {
        id: `wo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        date: new Date().toISOString(),
        name: split.name,
        type: split.id,
        exercises: exercises,
        isDeload: shouldDeload(user, workouts)
    };
    
    // Save to storage
    await saveCurrentWorkout(workout);
    
    showLoading(false);
    showNotification(`Workout generated: ${workout.name}`, 'success');
    return workout;
}

/**
 * Select a split based on last workout and user preference
 */
function selectSplit(lastWorkout, user) {
    const splits = workoutSplits.splits;
    if (!lastWorkout) return splits[0];
    
    // Find last split index
    const lastIndex = splits.findIndex(s => s.id === lastWorkout.type);
    if (lastIndex === -1) return splits[0];
    
    // Rotate to next split (cyclic)
    const nextIndex = (lastIndex + 1) % splits.length;
    let selected = splits[nextIndex];
    
    // If user is highly fatigued, prefer longevity or full body light
    const fatigue = calculateFatigueLevel();
    if (fatigue > 70 && selected.id !== 'longevity_day') {
        const longevitySplit = splits.find(s => s.id === 'longevity_day');
        if (longevitySplit) selected = longevitySplit;
    }
    
    return selected;
}

/**
 * Calculate overall fatigue level (0-100) based on recent workouts
 */
function calculateFatigueLevel() {
    // Placeholder – will integrate with fatigue.js later
    return 30;
}

/**
 * Determine if deload week is needed
 */
function shouldDeload(user, workouts) {
    if (workouts.length < 8) return false;
    const last8 = workouts.slice(-8);
    const intensityScore = last8.reduce((sum, w) => {
        if (w.summary && w.summary.averageRPE) {
            return sum + parseFloat(w.summary.averageRPE);
        }
        return sum + 5;
    }, 0) / 8;
    return intensityScore > 7.5; // consistently high RPE
}

/**
 * Identify muscles that haven't been trained in > 1.5× recommended rest days
 */
function getOverdueMuscles() {
    const overdue = [];
    const now = new Date();
    
    for (const muscle of muscleDatabase.major) {
        const lastTrained = localStorage.getItem(`last_trained_${muscle.name}`);
        if (!lastTrained) {
            overdue.push(muscle.name);
            continue;
        }
        const lastDate = new Date(lastTrained);
        const daysSince = (now - lastDate) / (1000 * 60 * 60 * 24);
        const threshold = muscle.restDays * 1.5;
        if (daysSince > threshold) {
            overdue.push(muscle.name);
        }
    }
    // Limit to 3 overdue muscles to keep workout manageable
    return overdue.slice(0, 3);
}

/**
 * Select an exercise for a given muscle group, respecting rotation and 1RM availability
 */
async function selectExerciseForMuscle(muscleGroup) {
    // Map muscle name to library section key
    const sectionMap = {
        quads: 'quads',
        hamstrings: 'hamstrings',
        glutes: 'glutes',
        chest: 'chest',
        back: 'back_lats',
        lats: 'back_lats',
        shoulders: 'shoulders_anterior',
        biceps: 'biceps',
        triceps: 'triceps',
        calves: 'calves',
        core: 'core_abs',
        forearms: 'forearms',
        traps: 'traps',
        rear_delts: 'rhomboids_reardelts'
    };
    
    const section = sectionMap[muscleGroup] || muscleGroup;
    let candidates = exerciseLibrary[section];
    if (!candidates || candidates.length === 0) return null;
    
    // Filter exercises that target the requested muscle
    candidates = candidates.filter(ex => ex.muscles && ex.muscles.includes(muscleGroup));
    if (candidates.length === 0) candidates = exerciseLibrary[section] || [];
    if (candidates.length === 0) return null;
    
    // Rotation: avoid repeating the same exercise within last 3 workouts
    const recentExercises = getRecentExerciseIds(3);
    candidates = candidates.filter(ex => {
        const exId = ex.name.toLowerCase().replace(/\s/g, '_');
        return !recentExercises.includes(exId);
    });
    
    if (candidates.length === 0) candidates = exerciseLibrary[section] || [];
    
    // Weighted random: prefer exercises with higher strengthIndex (more effective)
    let totalWeight = 0;
    for (const ex of candidates) {
        const weight = ex.strengthIndex || 1.0;
        totalWeight += weight;
    }
    let rand = Math.random() * totalWeight;
    let selected = candidates[0];
    for (const ex of candidates) {
        const w = ex.strengthIndex || 1.0;
        if (rand < w) {
            selected = ex;
            break;
        }
        rand -= w;
    }
    
    // Create exercise object with ID
    const exerciseId = selected.name.toLowerCase().replace(/\s/g, '_');
    const exercise = {
        id: exerciseId,
        name: selected.name,
        muscleGroup: selected.muscles || [muscleGroup],
        equipment: selected.equipment,
        instructions: selected.instructions || ['No instructions available.'],
        skillFactor: selected.skillFactor || 0.7,
        strengthIndex: selected.strengthIndex || 1.0,
        defaultSets: selected.defaultSets,
        defaultReps: selected.defaultReps
    };
    
    // Check if user has a 1RM for this exercise
    const oneRM = getOneRM(exerciseId);
    if (!oneRM) {
        // Will prompt during workout rendering
        exercise.needsOneRM = true;
    }
    
    return exercise;
}

/**
 * Get IDs of exercises performed in last N workouts (for rotation)
 */
function getRecentExerciseIds(count) {
    const workouts = JSON.parse(localStorage.getItem('pro_workouts') || '[]');
    const recent = workouts.slice(-count);
    const ids = new Set();
    for (const w of recent) {
        if (w.exercises) {
            w.exercises.forEach(ex => ids.add(ex.id));
        }
    }
    return Array.from(ids);
}