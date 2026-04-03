// js/utils/date.js
/**
 * Calculate current workout streak (consecutive weeks with at least one workout)
 * @param {Array} workouts - Array of workout objects with date property
 * @returns {number} Current streak in weeks
 */
export function calculateStreak(workouts) {
    if (!workouts || workouts.length === 0) return 0;
    
    // Sort workouts by date (newest first)
    const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Get the start of the current week (Sunday)
    const startOfCurrentWeek = new Date(currentDate);
    startOfCurrentWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Check if there's a workout in the current week
    const hasWorkoutThisWeek = sorted.some(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate >= startOfCurrentWeek;
    });
    
    if (!hasWorkoutThisWeek) return 0;
    
    streak = 1;
    let checkDate = new Date(startOfCurrentWeek);
    checkDate.setDate(checkDate.getDate() - 7); // move to previous week
    
    // Count consecutive previous weeks with at least one workout
    for (let i = 1; i < 52; i++) { // max 52 weeks
        const weekStart = new Date(checkDate);
        const weekEnd = new Date(checkDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const hasWorkout = sorted.some(w => {
            const wDate = new Date(w.date);
            return wDate >= weekStart && wDate <= weekEnd;
        });
        
        if (hasWorkout) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 7);
        } else {
            break;
        }
    }
    
    return streak;
}

/**
 * Calculate total volume (weight × reps) across all workouts
 * @param {Array} workouts - Array of workout objects
 * @returns {number} Total volume
 */
export function calculateTotalVolume(workouts) {
    let total = 0;
    for (const workout of workouts) {
        if (workout.summary && workout.summary.totalVolume) {
            total += workout.summary.totalVolume;
        } else if (workout.exercises) {
            for (const ex of workout.exercises) {
                if (ex.loggedSets && ex.loggedSets.length) {
                    for (const set of ex.loggedSets) {
                        total += set.weight * set.reps;
                    }
                }
            }
        }
    }
    return total;
}

/**
 * Get total volume from last N days
 * @param {Array} workouts - Array of workout objects
 * @param {number} days - Number of days to look back
 * @returns {number} Volume in the period
 */
export function getVolumeLastDays(workouts, days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    let volume = 0;
    for (const workout of workouts) {
        const workoutDate = new Date(workout.date);
        if (workoutDate >= cutoff) {
            if (workout.summary && workout.summary.totalVolume) {
                volume += workout.summary.totalVolume;
            }
        }
    }
    return volume;
}

/**
 * Get last 7 days volume (convenience)
 */
export function getLast7DaysVolume(workouts) {
    return getVolumeLastDays(workouts, 7);
}

/**
 * Get average RPE from last N workouts
 * @param {Array} workouts - Array of workout objects
 * @param {number} count - Number of recent workouts to consider
 * @returns {number} Average RPE (0 if none)
 */
export function getAverageRPE(workouts, count = 5) {
    const recent = workouts.slice(-count);
    let totalRPE = 0;
    let rpeCount = 0;
    for (const workout of recent) {
        if (workout.summary && workout.summary.averageRPE) {
            totalRPE += parseFloat(workout.summary.averageRPE);
            rpeCount++;
        } else if (workout.exercises) {
            for (const ex of workout.exercises) {
                if (ex.loggedSets && ex.loggedSets.length) {
                    for (const set of ex.loggedSets) {
                        totalRPE += set.rpe;
                        rpeCount++;
                    }
                }
            }
        }
    }
    return rpeCount > 0 ? totalRPE / rpeCount : 0;
}

/**
 * Group workouts by week (starting Sunday)
 * @param {Array} workouts - Array of workout objects
 * @returns {Object} Object with week keys (YYYY-WW) and workout arrays
 */
export function groupWorkoutsByWeek(workouts) {
    const groups = {};
    for (const workout of workouts) {
        const date = new Date(workout.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart - new Date(weekStart.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))}`;
        if (!groups[weekKey]) groups[weekKey] = [];
        groups[weekKey].push(workout);
    }
    return groups;
}

/**
 * Calculate days since last workout
 * @param {Array} workouts - Array of workout objects
 * @returns {number} Days since last workout (Infinity if none)
 */
export function daysSinceLastWorkout(workouts) {
    if (!workouts || workouts.length === 0) return Infinity;
    const lastWorkout = workouts.reduce((latest, w) => {
        const wDate = new Date(w.date);
        return wDate > latest ? wDate : latest;
    }, new Date(0));
    const now = new Date();
    return Math.floor((now - lastWorkout) / (1000 * 60 * 60 * 24));
}

/**
 * Check if a workout date is within the last N days
 * @param {string|Date} workoutDate - Date of workout
 * @param {number} days - Number of days
 * @returns {boolean}
 */
export function isWithinLastDays(workoutDate, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const wDate = new Date(workoutDate);
    return wDate >= cutoff;
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export function formatDate(date, includeTime = false) {
    const d = new Date(date);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return d.toLocaleDateString('en-US', options);
}