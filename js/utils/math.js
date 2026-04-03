// js/utils/math.js
import { UNIT, convertWeight, getUnit, roundWeight } from '../core/units.js';

/**
 * Estimate 1RM from weight and reps using multiple formulas.
 * @param {number} weight - Weight lifted
 * @param {number} reps - Number of reps performed (1-15)
 * @param {string} unit - 'lbs' or 'kg'
 * @returns {number} Estimated 1RM in the same unit
 */
export function estimate1RM(weight, reps, unit = null) {
    if (reps <= 0) return weight;
    if (reps === 1) return weight;
    
    // Epley formula: works well for 1-10 reps
    const epley = weight * (1 + reps / 30);
    // Brzycki: better for low reps (1-5)
    const brzycki = reps <= 5 ? weight * 36 / (37 - reps) : epley;
    // Average the two for robustness
    let estimated = (epley + brzycki) / 2;
    
    // Apply unit rounding
    const u = unit || getUnit();
    return roundWeight(estimated, u);
}

/**
 * Calculate intensity (weight / 1RM)
 */
export function getIntensity(weight, oneRM) {
    if (!oneRM || oneRM <= 0) return 0.5;
    return Math.min(0.95, Math.max(0.4, weight / oneRM));
}

/**
 * ERF Model: Reps in Reserve based on intensity, reps performed, set number.
 * Implements the enhanced 2026 model with confidence intervals.
 */
export function calculateRIR(weight, reps, oneRM, setNumber = 1, experience = 'intermediate') {
    if (!oneRM || oneRM <= 0) return { mean: 3, sd: 1.5 };
    
    const intensity = getIntensity(weight, oneRM);
    
    // Anchor points for mean max reps at given intensity
    const anchors = [
        { intensity: 1.00, maxReps: 1 },
        { intensity: 0.95, maxReps: 2 },
        { intensity: 0.90, maxReps: 4 },
        { intensity: 0.85, maxReps: 6 },
        { intensity: 0.80, maxReps: 8 },
        { intensity: 0.75, maxReps: 10 },
        { intensity: 0.70, maxReps: 12 },
        { intensity: 0.65, maxReps: 15 },
        { intensity: 0.60, maxReps: 18 },
        { intensity: 0.55, maxReps: 20 }
    ];
    
    // Interpolate max reps
    let maxReps = anchors[anchors.length-1].maxReps;
    for (let i = 0; i < anchors.length - 1; i++) {
        if (intensity >= anchors[i+1].intensity && intensity <= anchors[i].intensity) {
            const t = (intensity - anchors[i+1].intensity) / (anchors[i].intensity - anchors[i+1].intensity);
            maxReps = anchors[i+1].maxReps + t * (anchors[i].maxReps - anchors[i+1].maxReps);
            break;
        }
    }
    
    // Base RIR
    let rirMean = Math.max(0, maxReps - reps);
    
    // Experience adjustment
    const expFactor = { beginner: 0.8, intermediate: 1.0, advanced: 1.2 };
    const mult = expFactor[experience] || 1.0;
    rirMean = rirMean * mult;
    
    // Set number effect: later sets have lower RIR (more fatigue)
    const setDecay = Math.min(0.5, (setNumber - 1) * 0.07);
    rirMean = rirMean * (1 - setDecay);
    
    // Standard deviation (increases with uncertainty)
    let rirSD = 1.2 + (rirMean * 0.2);
    if (reps < maxReps * 0.7) rirSD *= 1.3; // higher uncertainty when far from failure
    
    return {
        mean: Math.max(0, Math.min(10, rirMean)),
        sd: rirSD,
        lower: Math.max(0, rirMean - 1.645 * rirSD),
        upper: Math.min(10, rirMean + 1.645 * rirSD)
    };
}

/**
 * Convert RIR to traffic light color class
 */
export function rirToColorClass(rir) {
    if (rir >= 4) return 'rir-easy';
    if (rir >= 2) return 'rir-moderate';
    return 'rir-hard';
}

/**
 * Calculate progression potential (0-1) based on last set performance
 */
export function computeProgressionPotential(lastSetRIR, lastSetRPE, totalSets, experience) {
    // Base: if last set was hard (RIR <= 2), progression potential is high
    let potential = 0;
    if (lastSetRIR <= 1) potential = 0.9;
    else if (lastSetRIR <= 2) potential = 0.7;
    else if (lastSetRIR <= 3) potential = 0.4;
    else potential = 0.1;
    
    // RPE adjustment: higher RPE = more fatigue = lower potential
    if (lastSetRPE >= 9) potential *= 0.8;
    if (lastSetRPE <= 6) potential *= 1.2;
    
    // Experience: beginners progress faster
    const expMult = { beginner: 1.5, intermediate: 1.0, advanced: 0.7 };
    potential *= expMult[experience] || 1.0;
    
    // Cap
    return Math.min(1, Math.max(0, potential));
}

/**
 * Calculate next weight based on progression potential and target reps
 */
export function getNextWeight(currentWeight, oneRM, targetReps, potential, unit = null) {
    if (!oneRM || oneRM <= 0) return currentWeight;
    const intensity = getIntensity(currentWeight, oneRM);
    let increment = 0;
    
    // Linear progression: add 2.5-5 lbs (or 1.25-2.5 kg) depending on potential
    const baseIncrement = (getUnit() === UNIT.lbs) ? 2.5 : 1.25;
    increment = baseIncrement * (0.5 + potential);
    
    let newWeight = currentWeight + increment;
    // Cap at 95% of 1RM
    const maxWeight = oneRM * 0.95;
    if (newWeight > maxWeight) newWeight = maxWeight;
    
    const u = unit || getUnit();
    return roundWeight(newWeight, u);
}