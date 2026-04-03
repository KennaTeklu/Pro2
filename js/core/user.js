// js/core/user.js
import { UNIT, getUnit, setUnit, convertWeight, roundWeight } from './units.js';
import { showNotification } from '../utils/dom.js';

export const DEFAULT_USER = {
    name: "Athlete",
    birthDate: null,
    gender: "male",
    weight: 75,        // kg
    height: 175,       // cm
    experience: "intermediate",
    goal: "hypertrophy",
    unit: UNIT.kg,
    createdAt: null,
    updatedAt: null,
    // 1RM storage: { exerciseId: { weight, reps, date, unit } }
    oneRM: {},
    // training history summary (cached)
    aggregates: {
        totalWorkouts: 0,
        totalVolume: 0,
        streakDays: 0
    },
    settings: {
        theme: "blue",
        autoHideBottomNav: false,
        muscleCoupling: true
    }
};

export function getUserProfile() {
    const saved = localStorage.getItem('pro_user');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            // Migrate old unit field if missing
            if (!user.unit) user.unit = UNIT.kg;
            if (!user.oneRM) user.oneRM = {};
            if (!user.settings) user.settings = DEFAULT_USER.settings;
            return user;
        } catch(e) {}
    }
    // First launch – create default user
    const newUser = JSON.parse(JSON.stringify(DEFAULT_USER));
    newUser.createdAt = new Date().toISOString();
    newUser.updatedAt = new Date().toISOString();
    return newUser;
}

export async function saveUser(user) {
    user.updatedAt = new Date().toISOString();
    localStorage.setItem('pro_user', JSON.stringify(user));
    // Also sync to Dexie (if needed)
    const { saveUserToDB } = await import('./storage.js');
    await saveUserToDB(user);
    // Apply unit globally
    setUnit(user.unit);
    return user;
}

export function updateUser(updates) {
    const user = getUserProfile();
    Object.assign(user, updates);
    return saveUser(user);
}

// ----- 1RM management -----
export function getOneRM(exerciseId) {
    const user = getUserProfile();
    const entry = user.oneRM[exerciseId];
    if (!entry) return null;
    // Convert to current unit if needed
    const currentUnit = getUnit();
    if (entry.unit !== currentUnit) {
        const converted = convertWeight(entry.weight, entry.unit, currentUnit);
        return { weight: converted, reps: entry.reps, unit: currentUnit };
    }
    return { weight: entry.weight, reps: entry.reps, unit: entry.unit };
}

export function setOneRM(exerciseId, weight, reps, unit = null) {
    const user = getUserProfile();
    const usedUnit = unit || getUnit();
    user.oneRM[exerciseId] = {
        weight: roundWeight(weight, usedUnit),
        reps: reps,
        unit: usedUnit,
        date: new Date().toISOString()
    };
    saveUser(user);
    showNotification(`1RM for ${exerciseId} saved: ${weight} ${usedUnit} × ${reps} reps`, 'success');
}

// Prompt user for 1RM on first encounter with an exercise
export async function promptForOneRM(exerciseId, exerciseName) {
    const existing = getOneRM(exerciseId);
    if (existing) return existing;

    const unit = getUnit();
    const user = getUserProfile();
    const defaultWeight = user.weight * 1.5; // heuristic: 1.5× bodyweight for squat
    const roundedDefault = roundWeight(defaultWeight, unit);
    
    const weightInput = prompt(
        `Enter your 1‑Rep Max for ${exerciseName} (in ${unit}).\n` +
        `If unknown, enter a weight you can lift for 5‑8 reps and we'll estimate.\n` +
        `⚠️ Do not attempt a true 1RM without a spotter.`,
        roundedDefault
    );
    if (!weightInput) return null;
    
    let weight = parseFloat(weightInput);
    if (isNaN(weight)) return null;
    
    // If user gave a submaximal weight, ask for reps
    let reps = 1;
    if (weight < defaultWeight * 0.8) {
        const repsInput = prompt(`How many reps can you do with ${weight} ${unit}? (1‑15)`, "5");
        if (repsInput) reps = parseInt(repsInput);
        if (isNaN(reps) || reps < 1) reps = 1;
    }
    
    // Estimate 1RM if reps > 1
    let finalWeight = weight;
    if (reps > 1) {
        const { estimate1RM } = await import('../utils/math.js');
        finalWeight = estimate1RM(weight, reps, unit);
        if (confirm(`Estimated 1RM: ${finalWeight.toFixed(1)} ${unit}. Use this?`)) {
            weight = finalWeight;
            reps = 1;
        }
    }
    
    setOneRM(exerciseId, weight, reps);
    return getOneRM(exerciseId);
}

// Get bodyweight in current unit
export function getBodyweight() {
    const user = getUserProfile();
    const currentUnit = getUnit();
    if (user.unit === currentUnit) return user.weight;
    return convertWeight(user.weight, user.unit, currentUnit);
}

// Update bodyweight (with date tracking)
export function setBodyweight(weight, unit = null) {
    const user = getUserProfile();
    const usedUnit = unit || getUnit();
    user.weight = weight;
    user.unit = usedUnit;
    if (!user.weightHistory) user.weightHistory = [];
    user.weightHistory.push({ weight, unit: usedUnit, date: new Date().toISOString() });
    if (user.weightHistory.length > 100) user.weightHistory.shift();
    saveUser(user);
}