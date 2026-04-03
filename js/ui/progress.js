// js/ui/progress.js
import { loadWorkouts } from '../core/storage.js';
import { getUserProfile, getOneRM } from '../core/user.js';
import { getUnit, formatWeight } from '../core/units.js';
import { getVolumeLastDays, getAverageRPE } from '../utils/date.js';
import { calculateLongevityScore } from '../longevity/score.js';
import { showLongevityReport } from '../longevity/actionPlan.js';

let charts = {};

/**
 * Render the progress section
 * @param {Object} appState - Global app state
 */
export async function renderProgress(appState) {
    const container = document.getElementById('progress-section');
    if (!container) return;
    
    const workouts = await loadWorkouts();
    const user = getUserProfile();
    const longevityData = calculateLongevityScore();
    
    container.innerHTML = `
        <div class="card">
            <h2 class="section-title">Progress Analytics</h2>
            <div class="longevity-summary" onclick="showLongevityReport()" style="cursor: pointer;">
                <div class="longevity-card">
                    <div class="longevity-score">${longevityData.score}</div>
                    <div class="longevity-label">Longevity Score</div>
                    <div class="longevity-trend">${getTrendArrow(longevityData.score)}</div>
                </div>
                <div class="longevity-risks">
                    ${longevityData.risks.slice(0, 2).map(r => `<span class="badge badge-warning">${r.factor}</span>`).join('')}
                    ${longevityData.risks.length > 2 ? `<span class="badge">+${longevityData.risks.length-2}</span>` : ''}
                </div>
            </div>
        </div>
        <div class="charts-grid">
            <div class="card chart-card">
                <h3>Volume Over Time</h3>
                <canvas id="volumeProgressChart" height="200"></canvas>
            </div>
            <div class="card chart-card">
                <h3>Strength Progress (1RM)</h3>
                <canvas id="strengthProgressChart" height="200"></canvas>
            </div>
            <div class="card chart-card">
                <h3>Workout Frequency</h3>
                <canvas id="frequencyProgressChart" height="200"></canvas>
            </div>
            <div class="card chart-card">
                <h3>RPE Distribution</h3>
                <canvas id="rpeProgressChart" height="200"></canvas>
            </div>
        </div>
        <div class="card">
            <h3>Personal Records</h3>
            <div id="personalRecords" class="pr-grid"></div>
        </div>
    `;
    
    // Render charts
    renderVolumeChart(workouts);
    renderStrengthChart();
    renderFrequencyChart(workouts);
    renderRPEDistribution(workouts);
    renderPersonalRecords();
    
    // Attach longevity click handler (global function for onclick)
    window.showLongevityReport = showLongevityReport;
}

function getTrendArrow(score) {
    // This would compare to previous score; for now just placeholder
    if (score >= 80) return '↑ Excellent';
    if (score >= 60) return '→ Good';
    if (score >= 40) return '↓ Needs work';
    return '↓ High risk';
}

function renderVolumeChart(workouts) {
    const ctx = document.getElementById('volumeProgressChart')?.getContext('2d');
    if (!ctx) return;
    if (charts.volume) charts.volume.destroy();
    
    // Get last 8 workouts or less
    const last8 = workouts.slice(-8);
    const labels = last8.map((_, i) => `W${i+1}`);
    const volumes = last8.map(w => w.summary?.totalVolume || 0);
    
    charts.volume = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Volume (lbs)',
                data: volumes,
                borderColor: 'var(--primary)',
                backgroundColor: 'rgba(37,99,235,0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } }
        }
    });
}

async function renderStrengthChart() {
    const ctx = document.getElementById('strengthProgressChart')?.getContext('2d');
    if (!ctx) return;
    if (charts.strength) charts.strength.destroy();
    
    // Get key exercises and their 1RM history
    const keyExercises = ['squat', 'bench_press', 'deadlift', 'overhead_press'];
    const datasets = [];
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
    
    for (let i = 0; i < keyExercises.length; i++) {
        const exId = keyExercises[i];
        const history = JSON.parse(localStorage.getItem(`pro_exercise_${exId}`) || '[]');
        if (history.length < 2) continue;
        
        // Get last 10 entries, sort by date
        const sorted = history.slice(-10).sort((a,b) => new Date(a.date) - new Date(b.date));
        const points = sorted.map(entry => ({
            x: new Date(entry.date),
            y: estimate1RM(entry.weight, entry.reps)
        }));
        
        datasets.push({
            label: exId.replace('_', ' ').toUpperCase(),
            data: points,
            borderColor: colors[i],
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 3
        });
    }
    
    if (datasets.length === 0) {
        ctx.fillStyle = 'var(--gray-500)';
        ctx.font = '14px Inter';
        ctx.fillText('No strength data yet', 50, 100);
        return;
    }
    
    charts.strength = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { type: 'time', time: { unit: 'month' }, title: { display: true, text: 'Date' } },
                y: { title: { display: true, text: `Estimated 1RM (${getUnit()})` } }
            }
        }
    });
}

function renderFrequencyChart(workouts) {
    const ctx = document.getElementById('frequencyProgressChart')?.getContext('2d');
    if (!ctx) return;
    if (charts.frequency) charts.frequency.destroy();
    
    // Group by week for last 8 weeks
    const weeks = [];
    const counts = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (now.getDay() + 7*i));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weeks.push(weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        let count = 0;
        for (const w of workouts) {
            const wDate = new Date(w.date);
            if (wDate >= weekStart && wDate <= weekEnd) count++;
        }
        counts.push(count);
    }
    
    charts.frequency = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeks,
            datasets: [{
                label: 'Workouts per week',
                data: counts,
                backgroundColor: 'var(--primary)',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: { y: { beginAtZero: true, stepSize: 1 } }
        }
    });
}

function renderRPEDistribution(workouts) {
    const ctx = document.getElementById('rpeProgressChart')?.getContext('2d');
    if (!ctx) return;
    if (charts.rpe) charts.rpe.destroy();
    
    const rpeCounts = Array(10).fill(0);
    for (const workout of workouts) {
        if (workout.exercises) {
            for (const ex of workout.exercises) {
                if (ex.loggedSets) {
                    for (const set of ex.loggedSets) {
                        if (set.rpe >= 1 && set.rpe <= 10) rpeCounts[set.rpe-1]++;
                    }
                } else if (ex.actual && ex.actual.rpe) {
                    const rpe = ex.actual.rpe;
                    if (rpe >= 1 && rpe <= 10) rpeCounts[rpe-1]++;
                }
            }
        }
    }
    
    const colors = rpeCounts.map((_, i) => {
        if (i+1 <= 4) return '#10b981';
        if (i+1 <= 6) return '#f59e0b';
        return '#ef4444';
    });
    
    charts.rpe = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1','2','3','4','5','6','7','8','9','10'],
            datasets: [{
                label: 'Number of sets',
                data: rpeCounts,
                backgroundColor: colors,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: { y: { beginAtZero: true, stepSize: 1, title: { display: true, text: 'Sets' } } }
        }
    });
}

function renderPersonalRecords() {
    const container = document.getElementById('personalRecords');
    if (!container) return;
    
    const keyExercises = ['squat', 'bench_press', 'deadlift', 'overhead_press', 'pull_up'];
    const records = [];
    
    for (const exId of keyExercises) {
        const history = JSON.parse(localStorage.getItem(`pro_exercise_${exId}`) || '[]');
        if (history.length === 0) continue;
        
        let bestWeight = 0;
        let bestReps = 0;
        let best1RM = 0;
        for (const entry of history) {
            if (entry.weight > bestWeight) bestWeight = entry.weight;
            if (entry.reps > bestReps) bestReps = entry.reps;
            const oneRM = estimate1RM(entry.weight, entry.reps);
            if (oneRM > best1RM) best1RM = oneRM;
        }
        records.push({
            name: exId.replace('_', ' ').toUpperCase(),
            bestWeight: formatWeight(bestWeight),
            best1RM: formatWeight(best1RM),
            bestReps: bestReps
        });
    }
    
    if (records.length === 0) {
        container.innerHTML = '<p class="empty-state">No personal records yet. Log your workouts!</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="pr-table">
            ${records.map(r => `
                <div class="pr-row">
                    <span class="pr-name">${r.name}</span>
                    <span class="pr-weight">🏋️ ${r.bestWeight}</span>
                    <span class="pr-1rm">📊 1RM: ${r.best1RM}</span>
                    <span class="pr-reps">🔁 ${r.bestReps} reps</span>
                </div>
            `).join('')}
        </div>
    `;
}

function estimate1RM(weight, reps) {
    if (!weight || !reps) return 0;
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
}