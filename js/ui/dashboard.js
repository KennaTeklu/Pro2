// js/ui/dashboard.js
import { getUserProfile, getBodyweight } from '../core/user.js';
import { getUnit, formatWeight } from '../core/units.js';
import { loadWorkouts, loadCurrentWorkout } from '../core/storage.js';
import { calculateStreak, calculateTotalVolume, getLast7DaysVolume } from '../utils/date.js';
import { showSection } from './navigation.js';
import { showNotification } from '../utils/dom.js';

let dashboardCharts = {};

/**
 * Render the dashboard section
 * @param {Object} appState - Global app state
 */
export async function renderDashboard(appState) {
    const container = document.getElementById('dashboard-section');
    if (!container) return;
    
    const user = getUserProfile();
    const workouts = await loadWorkouts();
    const currentWorkout = await loadCurrentWorkout();
    const unit = getUnit();
    const bodyweight = getBodyweight();
    const streak = calculateStreak(workouts);
    const totalWorkouts = workouts.length;
    const totalVolume = calculateTotalVolume(workouts);
    const last7DaysVolume = getLast7DaysVolume(workouts);
    
    // Calculate overall strength progress (simplified)
    const strengthProgress = calculateStrengthProgress();
    
    // Get longevity score (from separate module)
    let longevityScore = 16; // default
    try {
        const { calculateLongevityScore } = await import('../longevity/score.js');
        const scoreData = calculateLongevityScore();
        longevityScore = scoreData.score;
    } catch(e) {}
    
    container.innerHTML = `
        <div class="card">
            <div class="user-welcome">
                <h2>Welcome back, ${user.name || 'Athlete'}!</h2>
                <div class="streak-badge">🔥 ${streak} day streak</div>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${totalWorkouts}</div>
                    <div class="stat-label">Workouts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${streak}</div>
                    <div class="stat-label">Streak</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatVolume(totalVolume)}</div>
                    <div class="stat-label">Total Volume</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${strengthProgress}%</div>
                    <div class="stat-label">Strength</div>
                </div>
                <div class="stat-card" id="longevityStatCard">
                    <div class="stat-value">${longevityScore}</div>
                    <div class="stat-label">Longevity</div>
                    <i class="fas fa-heartbeat"></i>
                </div>
            </div>
            <div class="readiness-gauge" id="readinessGauge">
                <div class="readiness-circle">
                    <span>--</span>
                </div>
                <div class="readiness-label">Readiness</div>
            </div>
            <div class="workout-preview" id="dashboardWorkoutPreview">
                ${renderWorkoutPreview(currentWorkout)}
            </div>
            <div class="quick-actions">
                <button class="btn btn-primary" id="startWorkoutBtn">Start Workout</button>
                <button class="btn btn-outline" id="viewRecoveryBtn">View Recovery</button>
            </div>
        </div>
        <div class="card">
            <h3 class="section-title">Progress Overview</h3>
            <div class="chart-container">
                <canvas id="dashboardVolumeChart" height="200"></canvas>
            </div>
        </div>
        <div class="card">
            <div class="next-workout">
                <h3>Next Workout</h3>
                <div class="next-workout-date" id="nextWorkoutDate">Calculating...</div>
            </div>
        </div>
    `;
    
    // Attach event listeners
    document.getElementById('startWorkoutBtn')?.addEventListener('click', () => {
        if (currentWorkout) {
            showSection('workout');
        } else {
            showNotification('Generate a workout first from the Workout tab', 'info');
        }
    });
    document.getElementById('viewRecoveryBtn')?.addEventListener('click', () => showSection('recovery'));
    document.getElementById('longevityStatCard')?.addEventListener('click', () => {
        import('../longevity/actionPlan.js').then(mod => mod.showLongevityReport());
    });
    
    // Render chart
    renderVolumeChart(workouts);
    
    // Update readiness gauge
    updateReadinessGauge();
    
    // Update next workout date
    updateNextWorkoutDate(currentWorkout);
}

function renderWorkoutPreview(workout) {
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
        return `
            <div class="empty-workout">
                <i class="fas fa-dumbbell"></i>
                <p>No workout scheduled</p>
                <button class="btn btn-sm" id="generateWorkoutFromDashboard">Generate</button>
            </div>
        `;
    }
    const exerciseCount = workout.exercises.length;
    const muscleGroups = new Set();
    workout.exercises.forEach(ex => {
        if (ex.muscleGroup) ex.muscleGroup.forEach(m => muscleGroups.add(m));
    });
    const muscleList = Array.from(muscleGroups).slice(0, 3).join(', ');
    return `
        <div class="workout-meta">
            <div><strong>${workout.name || 'Workout'}</strong></div>
            <div>${exerciseCount} exercises</div>
            <div>${muscleList}${muscleGroups.size > 3 ? ` +${muscleGroups.size - 3}` : ''}</div>
        </div>
        <button class="btn btn-success" id="resumeWorkoutBtn">Resume Workout</button>
    `;
}

function renderVolumeChart(workouts) {
    const ctx = document.getElementById('dashboardVolumeChart')?.getContext('2d');
    if (!ctx) return;
    if (dashboardCharts.volume) dashboardCharts.volume.destroy();
    
    const last6Workouts = workouts.slice(-6);
    const labels = last6Workouts.map((_, i) => `W${i+1}`);
    const volumes = last6Workouts.map(w => w.summary?.totalVolume || 0);
    
    dashboardCharts.volume = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Volume',
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

async function updateReadinessGauge() {
    const gauge = document.getElementById('readinessGauge');
    if (!gauge) return;
    try {
        const { getOverallReadiness } = await import('../workout/fatigue.js');
        const recovery = await getOverallRecovery();
        const percent = Math.min(100, Math.max(0, Math.round(recovery * 100)));
        const circle = gauge.querySelector('.readiness-circle');
        if (circle) {
            let color;
            if (percent >= 80) color = '#10b981';
            else if (percent >= 50) color = '#f59e0b';
            else color = '#ef4444';
            circle.style.background = `conic-gradient(${color} 0deg ${percent * 3.6}deg, #e2e8f0 0deg)`;
            const span = circle.querySelector('span');
            if (span) span.textContent = percent;
        }
    } catch(e) {}
}

function updateNextWorkoutDate(currentWorkout) {
    const container = document.getElementById('nextWorkoutDate');
    if (!container) return;
    if (!currentWorkout) {
        container.textContent = 'Generate a workout to see next session';
        return;
    }
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 2); // default rest 2 days
    container.textContent = nextDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function calculateStrengthProgress() {
    // Placeholder: return mock progress based on workouts count
    const workouts = JSON.parse(localStorage.getItem('pro_workouts') || '[]');
    if (workouts.length === 0) return 0;
    return Math.min(100, Math.floor(workouts.length * 5));
}

function formatVolume(volume) {
    if (volume >= 1000000) return (volume / 1000000).toFixed(1) + 'M';
    if (volume >= 1000) return (volume / 1000).toFixed(1) + 'K';
    return volume.toString();
}