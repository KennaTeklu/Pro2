// js/longevity/score.js
import { getUserProfile, getBodyweight, getOneRM } from '../core/user.js';
import { getUnit, convertWeight } from '../core/units.js';
import { getOverallReadiness } from '../workout/fatigue.js';
import { getAllMuscleGroups, muscleDatabase } from '../data/muscleDatabase.js';

/**
 * Calculate grip strength score (0-100)
 */
function calculateGripStrengthScore() {
    const user = getUserProfile();
    const bodyweight = getBodyweight();
    const unit = getUnit();
    
    // Key grip exercises
    const gripExercises = ['deadlift', 'farmer_walk', 'pull_up', 'wrist_curl'];
    let bestScore = 50; // neutral default
    
    for (const exId of gripExercises) {
        const oneRM = getOneRM(exId);
        if (oneRM && oneRM.weight > 0) {
            let ratio = oneRM.weight / bodyweight;
            if (exId === 'deadlift') ratio = ratio * 0.7; // deadlift not pure grip
            let score = 0;
            if (ratio >= 2.0) score = 100;
            else if (ratio >= 1.5) score = 80;
            else if (ratio >= 1.2) score = 65;
            else if (ratio >= 1.0) score = 50;
            else if (ratio >= 0.7) score = 30;
            else score = 20;
            if (score > bestScore) bestScore = score;
        }
    }
    return bestScore;
}

/**
 * Calculate balance score based on unilateral exercises and ankle training
 */
function calculateBalanceScore() {
    const workouts = JSON.parse(localStorage.getItem('pro_workouts') || '[]');
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const balanceExercises = ['single_leg_rdl', 'bulgarian_split_squat', 'lunge', 'pistol_squat'];
    const ankleMuscles = ['tibialis', 'peroneus_tertius', 'foot_intrinsics'];
    
    let balanceSessions = 0;
    let ankleSessions = 0;
    let lastBalanceDate = null;
    
    for (const workout of workouts) {
        const wDate = new Date(workout.date);
        if (wDate < sixtyDaysAgo) continue;
        
        let hasBalance = false;
        let hasAnkle = false;
        if (workout.exercises) {
            for (const ex of workout.exercises) {
                if (balanceExercises.includes(ex.id)) hasBalance = true;
                if (ex.muscleGroup && ex.muscleGroup.some(m => ankleMuscles.includes(m))) hasAnkle = true;
            }
        }
        if (hasBalance) {
            balanceSessions++;
            if (!lastBalanceDate || wDate > lastBalanceDate) lastBalanceDate = wDate;
        }
        if (hasAnkle) ankleSessions++;
    }
    
    // Frequency score (target 8 sessions in 60 days)
    const freqScore = Math.min(100, (balanceSessions / 8) * 100);
    // Recency score (0-100)
    let recencyScore = 0;
    if (lastBalanceDate) {
        const daysSince = (new Date() - lastBalanceDate) / (1000 * 60 * 60 * 24);
        if (daysSince <= 7) recencyScore = 100;
        else if (daysSince <= 14) recencyScore = 80;
        else if (daysSince <= 30) recencyScore = 60;
        else if (daysSince <= 60) recencyScore = 40;
        else recencyScore = 20;
    }
    // Ankle score
    const ankleScore = Math.min(100, (ankleSessions / 4) * 100);
    
    return Math.round((freqScore * 0.4) + (recencyScore * 0.3) + (ankleScore * 0.3));
}

/**
 * Calculate joint mobility score (how often longevity muscles are trained)
 */
function calculateJointMobilityScore() {
    const workouts = JSON.parse(localStorage.getItem('pro_workouts') || '[]');
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const longevityMuscles = muscleDatabase.longevity.map(m => m.name);
    const muscleSessionCount = {};
    longevityMuscles.forEach(m => muscleSessionCount[m] = 0);
    
    for (const workout of workouts) {
        const wDate = new Date(workout.date);
        if (wDate < sixtyDaysAgo) continue;
        if (workout.exercises) {
            for (const ex of workout.exercises) {
                if (ex.muscleGroup) {
                    for (const mg of ex.muscleGroup) {
                        if (muscleSessionCount.hasOwnProperty(mg)) {
                            muscleSessionCount[mg]++;
                        }
                    }
                }
            }
        }
    }
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const muscle of longevityMuscles) {
        const muscleData = muscleDatabase.longevity.find(m => m.name === muscle);
        const weight = muscleData?.agingRisk === 'high' ? 2.0 : muscleData?.agingRisk === 'medium' ? 1.5 : 1.0;
        const sessions = Math.min(muscleSessionCount[muscle], 4);
        const score = (sessions / 4) * 100;
        totalWeightedScore += score * weight;
        totalWeight += weight;
    }
    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 50;
}

/**
 * Calculate posture score (neck, rhomboids, rear delts)
 */
function calculatePostureScore() {
    const workouts = JSON.parse(localStorage.getItem('pro_workouts') || '[]');
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const postureMuscles = ['neck', 'rhomboids', 'rear_delts', 'traps'];
    const muscleSessions = { neck: 0, rhomboids: 0, rear_delts: 0, traps: 0 };
    
    for (const workout of workouts) {
        const wDate = new Date(workout.date);
        if (wDate < sixtyDaysAgo) continue;
        if (workout.exercises) {
            for (const ex of workout.exercises) {
                if (ex.muscleGroup) {
                    for (const mg of ex.muscleGroup) {
                        if (muscleSessions.hasOwnProperty(mg)) muscleSessions[mg]++;
                    }
                }
            }
        }
    }
    
    let total = 0;
    for (const muscle of postureMuscles) {
        const sessions = Math.min(muscleSessions[muscle], 6);
        total += (sessions / 6) * 100;
    }
    return Math.round(total / postureMuscles.length);
}

/**
 * Calculate muscle balance score (push/pull ratio)
 */
function calculateMuscleBalanceScore() {
    const workouts = JSON.parse(localStorage.getItem('pro_workouts') || '[]');
    const pushMuscles = ['chest', 'triceps', 'front_delts'];
    const pullMuscles = ['back', 'biceps', 'rear_delts', 'lats'];
    
    let pushVolume = 0;
    let pullVolume = 0;
    
    for (const workout of workouts) {
        if (workout.exercises) {
            for (const ex of workout.exercises) {
                if (ex.loggedSets && ex.loggedSets.length) {
                    for (const set of ex.loggedSets) {
                        const volume = set.weight * set.reps;
                        if (ex.muscleGroup) {
                            if (ex.muscleGroup.some(m => pushMuscles.includes(m))) pushVolume += volume;
                            if (ex.muscleGroup.some(m => pullMuscles.includes(m))) pullVolume += volume;
                        }
                    }
                }
            }
        }
    }
    
    if (pushVolume === 0 && pullVolume === 0) return 50;
    const ratio = Math.min(pushVolume, pullVolume) / Math.max(pushVolume, pullVolume);
    return Math.round(ratio * 100);
}

/**
 * Calculate consistency score (streak and frequency)
 */
function calculateConsistencyScore() {
    const workouts = JSON.parse(localStorage.getItem('pro_workouts') || '[]');
    if (workouts.length === 0) return 0;
    
    // Average workouts per week over last 8 weeks
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    let weeklyCounts = [];
    for (let i = 0; i < 8; i++) {
        const weekStart = new Date(eightWeeksAgo);
        weekStart.setDate(eightWeeksAgo.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        let count = 0;
        for (const w of workouts) {
            const wDate = new Date(w.date);
            if (wDate >= weekStart && wDate <= weekEnd) count++;
        }
        weeklyCounts.push(count);
    }
    const avgWeekly = weeklyCounts.reduce((a,b) => a+b, 0) / 8;
    let freqScore = 0;
    if (avgWeekly >= 3.5) freqScore = 40;
    else if (avgWeekly >= 2.5) freqScore = 30;
    else if (avgWeekly >= 1.5) freqScore = 20;
    else if (avgWeekly >= 0.5) freqScore = 10;
    
    // Streak bonus
    let streak = 0;
    let currentStreak = 0;
    for (let i = workouts.length - 1; i >= 0; i--) {
        const wDate = new Date(workouts[i].date);
        const daysSinceLast = i === workouts.length - 1 ? 0 : (new Date(workouts[i+1].date) - wDate) / (1000*60*60*24);
        if (daysSinceLast <= 3) currentStreak++;
        else break;
    }
    streak = currentStreak;
    let streakScore = 0;
    if (streak >= 30) streakScore = 30;
    else if (streak >= 14) streakScore = 25;
    else if (streak >= 7) streakScore = 20;
    else if (streak >= 3) streakScore = 10;
    else if (streak >= 1) streakScore = 5;
    
    return Math.min(100, freqScore + streakScore);
}

/**
 * Calculate trend score (strength improvement over last 3 months)
 */
function calculateTrendScore() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const keyExercises = ['squat', 'deadlift', 'bench_press', 'overhead_press'];
    let improvements = [];
    
    for (const exId of keyExercises) {
        const storageKey = `pro_exercise_${exId}`;
        const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (history.length < 2) continue;
        
        const recent = history.filter(h => new Date(h.date) >= threeMonthsAgo);
        if (recent.length < 2) continue;
        
        const oldest = recent[0];
        const newest = recent[recent.length - 1];
        const oldest1RM = estimate1RMFromLog(oldest);
        const newest1RM = estimate1RMFromLog(newest);
        if (oldest1RM > 0) {
            const improvement = (newest1RM - oldest1RM) / oldest1RM;
            improvements.push(improvement);
        }
    }
    
    if (improvements.length === 0) return 50;
    const avgImprovement = improvements.reduce((a,b) => a+b, 0) / improvements.length;
    // Convert to 0-100: 0% = 50, +10% = 75, -10% = 25
    let score = 50 + (avgImprovement * 250);
    return Math.min(100, Math.max(0, Math.round(score)));
}

function estimate1RMFromLog(log) {
    if (!log.weight || !log.reps) return 0;
    return log.weight * (1 + log.reps / 30);
}

/**
 * Calculate variety score (how many different longevity muscles trained recently)
 */
function calculateVarietyScore() {
    const workouts = JSON.parse(localStorage.getItem('pro_workouts') || '[]');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const longevityMuscles = muscleDatabase.longevity.map(m => m.name);
    const trained = new Set();
    
    for (const workout of workouts) {
        const wDate = new Date(workout.date);
        if (wDate < thirtyDaysAgo) continue;
        if (workout.exercises) {
            for (const ex of workout.exercises) {
                if (ex.muscleGroup) {
                    for (const mg of ex.muscleGroup) {
                        if (longevityMuscles.includes(mg)) trained.add(mg);
                    }
                }
            }
        }
    }
    
    const percentage = (trained.size / longevityMuscles.length) * 100;
    return Math.min(100, Math.round(percentage * 1.5));
}

/**
 * Main function: calculate overall longevity score (0-100)
 * @returns {Object} Score, breakdown, risks, recommendations
 */
export function calculateLongevityScore() {
    const scores = {
        gripStrength: calculateGripStrengthScore(),
        balance: calculateBalanceScore(),
        jointMobility: calculateJointMobilityScore(),
        posture: calculatePostureScore(),
        muscleBalance: calculateMuscleBalanceScore(),
        consistency: calculateConsistencyScore(),
        trend: calculateTrendScore(),
        variety: calculateVarietyScore()
    };
    
    // Weighted average (age-based weights could be added later)
    const weights = {
        gripStrength: 0.12,
        balance: 0.15,
        jointMobility: 0.18,
        posture: 0.12,
        muscleBalance: 0.08,
        consistency: 0.10,
        trend: 0.10,
        variety: 0.15
    };
    
    let total = 0;
    for (const [key, weight] of Object.entries(weights)) {
        total += (scores[key] || 50) * weight;
    }
    const finalScore = Math.round(total);
    
    // Simple risk assessment (placeholder, full version in risks.js)
    const risks = [];
    if (scores.gripStrength < 50) risks.push({ factor: "Grip Strength", severity: "Medium" });
    if (scores.balance < 50) risks.push({ factor: "Balance", severity: "High" });
    if (scores.jointMobility < 40) risks.push({ factor: "Joint Mobility", severity: "High" });
    
    return {
        score: finalScore,
        breakdown: scores,
        risks: risks,
        recommendations: generateRecommendations(scores)
    };
}

function generateRecommendations(scores) {
    const recs = [];
    if (scores.gripStrength < 60) recs.push("Add dead hangs or farmer's walks 2x/week to improve grip.");
    if (scores.balance < 60) recs.push("Incorporate single-leg exercises and ankle stability work.");
    if (scores.jointMobility < 50) recs.push("Do daily mobility drills for neck, hips, and ankles.");
    if (scores.posture < 60) recs.push("Add face pulls and rows to counteract forward posture.");
    if (scores.muscleBalance < 70) recs.push("Balance pushing with pulling exercises (1:1 ratio).");
    if (scores.consistency < 60) recs.push("Aim for at least 3 workouts per week to build consistency.");
    if (scores.trend < 40) recs.push("Your strength is declining. Consider a structured progressive overload plan.");
    if (scores.variety < 50) recs.push("Train more joint-health muscles (neck, tibialis, rotator cuff).");
    return recs.slice(0, 5);
}