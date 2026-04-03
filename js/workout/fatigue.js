// js/workout/fatigue.js
import { getUserProfile } from '../core/user.js';
import { getMuscleRestDays, getAllMuscleGroups } from '../data/muscleDatabase.js';

// Default decay rates (fast and slow) per muscle group (hours⁻¹)
const DEFAULT_DECAY = { fast: 0.10, slow: 0.010 };

const MUSCLE_DECAY = {
    quads:         { fast: 0.10, slow: 0.012 },
    hamstrings:    { fast: 0.09, slow: 0.010 },
    glutes:        { fast: 0.08, slow: 0.009 },
    chest:         { fast: 0.12, slow: 0.008 },
    back:          { fast: 0.10, slow: 0.011 },
    shoulders:     { fast: 0.11, slow: 0.010 },
    biceps:        { fast: 0.13, slow: 0.007 },
    triceps:       { fast: 0.13, slow: 0.007 },
    calves:        { fast: 0.06, slow: 0.015 },
    core:          { fast: 0.09, slow: 0.010 },
    forearms:      { fast: 0.12, slow: 0.008 },
    traps:         { fast: 0.10, slow: 0.010 },
    lats:          { fast: 0.10, slow: 0.010 },
    neck:          { fast: 0.08, slow: 0.012 }
};

// Static coupling matrix (fraction of fatigue transferred between synergistic muscles)
const STATIC_COUPLING = {
    quads: { glutes: 0.05, hamstrings: 0.02 },
    glutes: { quads: 0.05, hamstrings: 0.03 },
    hamstrings: { glutes: 0.03, quads: 0.02 },
    chest: { shoulders: 0.04, triceps: 0.02 },
    shoulders: { chest: 0.04, triceps: 0.03 },
    back: { lats: 0.05, biceps: 0.02 },
    lats: { back: 0.05, biceps: 0.02 }
};

// In-memory fatigue state
let muscleFatigue = {}; // { muscle: { fast, slow, lastUpdate } }
let lastDecayTimestamp = null;

/**
 * Initialize fatigue tracking for all muscles
 */
export function initFatigueTracking() {
    const allMuscles = getAllMuscleGroups();
    for (const muscle of allMuscles) {
        if (!muscleFatigue[muscle.name]) {
            muscleFatigue[muscle.name] = { fast: 0, slow: 0, lastUpdate: null };
        }
    }
    if (!lastDecayTimestamp) {
        lastDecayTimestamp = new Date().toISOString();
    }
    loadFatigueFromStorage();
}

/**
 * Save fatigue state to localStorage
 */
function saveFatigueToStorage() {
    const state = {
        muscleFatigue,
        lastDecayTimestamp
    };
    localStorage.setItem('pro_fatigue', JSON.stringify(state));
}

/**
 * Load fatigue state from localStorage
 */
function loadFatigueFromStorage() {
    const saved = localStorage.getItem('pro_fatigue');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            muscleFatigue = state.muscleFatigue || {};
            lastDecayTimestamp = state.lastDecayTimestamp || new Date().toISOString();
        } catch(e) {}
    }
}

/**
 * Apply exponential decay to all muscles based on hours passed
 * @param {number} hours - Hours elapsed since last decay
 */
function decayFatigue(hours) {
    if (hours <= 0) return;
    
    for (const muscle in muscleFatigue) {
        const f = muscleFatigue[muscle];
        if (!f || (f.fast === 0 && f.slow === 0)) continue;
        
        const decay = MUSCLE_DECAY[muscle] || DEFAULT_DECAY;
        const df = Math.exp(-decay.fast * hours);
        const ds = Math.exp(-decay.slow * hours);
        
        f.fast *= df;
        f.slow *= ds;
        
        // Clamp to zero if negligible
        if (f.fast < 0.01) f.fast = 0;
        if (f.slow < 0.01) f.slow = 0;
    }
}

/**
 * Apply decay since last recorded timestamp (call before any fatigue read)
 */
export function applyFatigueDecay() {
    const now = new Date();
    const last = lastDecayTimestamp ? new Date(lastDecayTimestamp) : now;
    const hoursDiff = (now - last) / (1000 * 60 * 60);
    
    if (hoursDiff >= 0.1) {
        decayFatigue(hoursDiff);
        lastDecayTimestamp = now.toISOString();
        saveFatigueToStorage();
    }
}

/**
 * Get coupled fatigue for a muscle (includes synergistic transfer)
 * @param {string} muscle - Muscle name
 * @param {boolean} useCoupling - Whether to include coupling (user setting)
 * @returns {number} Total fatigue (0-1 scale, but can exceed 1 temporarily)
 */
export function getCoupledFatigue(muscle, useCoupling = true) {
    const f = muscleFatigue[muscle];
    if (!f) return 0;
    
    let total = f.fast + f.slow;
    
    if (useCoupling) {
        const couplings = STATIC_COUPLING[muscle];
        if (couplings) {
            for (const [synergist, coeff] of Object.entries(couplings)) {
                const synFat = muscleFatigue[synergist];
                if (synFat) {
                    total += coeff * (synFat.fast + synFat.slow);
                }
            }
        }
    }
    
    return Math.min(2.0, total); // Cap at 200% for practical purposes
}

/**
 * Update fatigue after performing a set
 * @param {string} muscle - Primary muscle worked
 * @param {number} stress - Stress value (0-1) derived from weight, reps, RPE
 * @param {number} rpe - Rate of perceived exertion (1-10)
 * @param {Date} timestamp - When the set was performed
 */
export function updateMuscleFatigue(muscle, stress, rpe, timestamp = new Date()) {
    applyFatigueDecay();
    
    if (!muscleFatigue[muscle]) {
        muscleFatigue[muscle] = { fast: 0, slow: 0, lastUpdate: null };
    }
    
    const f = muscleFatigue[muscle];
    const fastFrac = rpe > 7 ? 0.7 : 0.3;
    const slowFrac = 1 - fastFrac;
    const clampedStress = Math.min(1, Math.max(0, stress));
    
    if (f.lastUpdate === null) {
        f.fast = clampedStress * fastFrac;
        f.slow = clampedStress * slowFrac;
    } else {
        const last = new Date(f.lastUpdate);
        let dt = (timestamp - last) / (1000 * 60 * 60); // hours
        if (dt > 168) dt = 168;
        
        const decay = MUSCLE_DECAY[muscle] || DEFAULT_DECAY;
        const df = Math.exp(-decay.fast * dt);
        const ds = Math.exp(-decay.slow * dt);
        
        f.fast = f.fast * df + (clampedStress * fastFrac / decay.fast) * (1 - df);
        f.slow = f.slow * ds + (clampedStress * slowFrac / decay.slow) * (1 - ds);
    }
    
    f.lastUpdate = timestamp.toISOString();
    f.fast = Math.min(1, Math.max(0, f.fast));
    f.slow = Math.min(1, Math.max(0, f.slow));
    
    saveFatigueToStorage();
}

/**
 * Get recovery percentage (0-100) for a specific muscle
 * @param {string} muscle - Muscle name
 * @param {boolean} useCoupling - Whether to include coupling
 * @returns {number} Recovery percentage (100 = fully recovered)
 */
export function getMuscleRecovery(muscle, useCoupling = true) {
    applyFatigueDecay();
    const fatigue = getCoupledFatigue(muscle, useCoupling);
    // Fatigue is on a 0-1 scale (can exceed 1). Recovery = 100 - (fatigue * 100), but cap
    let recovery = 100 - (fatigue * 100);
    if (recovery < 0) recovery = 0;
    if (recovery > 100) recovery = 100;
    return recovery;
}

/**
 * Get overall systemic recovery factor (0-1) based on recent training load
 * @returns {number} 0 = completely fatigued, 1 = fully recovered
 */
export function getSystemicRecoveryFactor() {
    // Simplified: based on last 7 days volume relative to bodyweight
    const user = getUserProfile();
    const workouts = JSON.parse(localStorage.getItem('pro_workouts') || '[]');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let recentVolume = 0;
    for (const w of workouts) {
        const wDate = new Date(w.date);
        if (wDate >= sevenDaysAgo && w.summary?.totalVolume) {
            recentVolume += w.summary.totalVolume;
        }
    }
    
    const bodyweight = user.weight || 75;
    const volumePerKg = recentVolume / bodyweight;
    // Heuristic: volumePerKg > 5000 → high fatigue, < 1000 → low fatigue
    let factor = 1 - (volumePerKg / 5000);
    factor = Math.min(1, Math.max(0.3, factor));
    return factor;
}

/**
 * Get overall readiness (0-100) combining muscle and systemic factors
 * @returns {number} Readiness percentage
 */
export function getOverallReadiness() {
    const user = getUserProfile();
    const useCoupling = user.settings?.muscleCoupling ?? true;
    const allMuscles = getAllMuscleGroups();
    let totalRecovery = 0;
    for (const muscle of allMuscles) {
        totalRecovery += getMuscleRecovery(muscle.name, useCoupling);
    }
    const muscleAvg = allMuscles.length ? totalRecovery / allMuscles.length : 100;
    const systemic = getSystemicRecoveryFactor() * 100;
    // Weighted: 70% muscle, 30% systemic
    const readiness = (muscleAvg * 0.7) + (systemic * 0.3);
    return Math.round(readiness);
}

/**
 * Reset fatigue (for testing or new program)
 */
export function resetFatigue() {
    muscleFatigue = {};
    lastDecayTimestamp = new Date().toISOString();
    initFatigueTracking();
    saveFatigueToStorage();
}