// js/longevity/actionPlan.js
import { getUserProfile } from '../core/user.js';
import { calculateLongevityScore } from './score.js';
import { showNotification } from '../utils/dom.js';
import { showSection } from '../ui/navigation.js';

/**
 * Generate a personalized action plan based on longevity score breakdown
 * @returns {Object} Action plan with daily, weekly, and monthly recommendations
 */
export function generateActionPlan() {
    const scoreData = calculateLongevityScore();
    const scores = scoreData.breakdown;
    const lowAreas = [];
    
    if (scores.gripStrength < 60) lowAreas.push({ area: 'gripStrength', name: 'Grip Strength', priority: 'high' });
    if (scores.balance < 60) lowAreas.push({ area: 'balance', name: 'Balance', priority: 'high' });
    if (scores.jointMobility < 50) lowAreas.push({ area: 'jointMobility', name: 'Joint Mobility', priority: 'high' });
    if (scores.posture < 60) lowAreas.push({ area: 'posture', name: 'Posture', priority: 'medium' });
    if (scores.muscleBalance < 70) lowAreas.push({ area: 'muscleBalance', name: 'Push/Pull Balance', priority: 'medium' });
    if (scores.consistency < 60) lowAreas.push({ area: 'consistency', name: 'Consistency', priority: 'high' });
    if (scores.variety < 50) lowAreas.push({ area: 'variety', name: 'Exercise Variety', priority: 'medium' });
    
    const plan = {
        daily: [],
        weekly: [],
        monthly: [],
        quickWins: []
    };
    
    for (const area of lowAreas) {
        switch (area.area) {
            case 'gripStrength':
                plan.daily.push("🔩 **Dead hangs**: Hang from a pull-up bar for 30-60 seconds, 3 times per day.");
                plan.weekly.push("🏋️ **Farmer's walks**: 3 sets of 30-60 seconds with heavy dumbbells, 2x/week.");
                plan.quickWins.push("Use a grip trainer while watching TV or working.");
                break;
            case 'balance':
                plan.daily.push("🦩 **Single-leg stands**: 30 seconds each leg, 3 times per day (near a wall for safety).");
                plan.weekly.push("🧘 **Balance drills**: Add lunges, single-leg RDLs, or yoga tree pose to 2 workouts/week.");
                plan.quickWins.push("Stand on one leg while brushing your teeth.");
                break;
            case 'jointMobility':
                plan.daily.push("🦵 **Ankle circles & toe yoga**: 2 minutes each morning.");
                plan.daily.push("🦾 **Neck nods & rotations**: 10 reps each direction, twice daily.");
                plan.weekly.push("🏃 **Tibialis raises**: 3x15 reps with a band or light dumbbell, 3x/week.");
                plan.quickWins.push("Set a timer every hour to roll your ankles and stretch your neck.");
                break;
            case 'posture':
                plan.daily.push("📱 **Chin tucks**: 10 reps, several times per day (undo 'text neck').");
                plan.weekly.push("🔄 **Face pulls**: 3x15-20 reps with a cable or band, 2x/week.");
                plan.quickWins.push("Adjust your screen height to eye level.");
                break;
            case 'muscleBalance':
                plan.weekly.push("⚖️ For every pushing exercise (bench, press), do one pulling exercise (rows, face pulls).");
                plan.weekly.push("📊 Track your push/pull volume ratio – aim for 1:1.");
                plan.quickWins.push("Add one set of rows after every bench press session.");
                break;
            case 'consistency':
                plan.weekly.push("📅 Schedule 3 fixed workout days (e.g., Mon/Wed/Fri) and stick to them for 4 weeks.");
                plan.monthly.push("🎯 Set a monthly goal: e.g., 'complete 12 workouts this month'.");
                plan.quickWins.push("Use the app's 'Generate Workout' feature to remove friction.");
                break;
            case 'variety':
                plan.weekly.push("🌱 Add one 'forgotten' muscle group per week (e.g., neck, tibialis, rotator cuff).");
                plan.weekly.push("🔄 Rotate exercises every 3-4 weeks to hit different joint angles.");
                plan.quickWins.push("Try the 'Longevity Workout' split from the app.");
                break;
        }
    }
    
    // Default recommendations if everything is good
    if (lowAreas.length === 0) {
        plan.daily.push("✅ Maintain your routine – you're doing great!");
        plan.weekly.push("🏆 Challenge yourself with a new PR or skill move.");
        plan.monthly.push("📈 Reassess your longevity score in 4-6 weeks.");
    }
    
    // Remove duplicates and limit
    plan.daily = [...new Set(plan.daily)].slice(0, 5);
    plan.weekly = [...new Set(plan.weekly)].slice(0, 5);
    plan.monthly = [...new Set(plan.monthly)].slice(0, 3);
    plan.quickWins = [...new Set(plan.quickWins)].slice(0, 3);
    
    return plan;
}

/**
 * Show the action plan in a modal
 */
export function showLongevityReport() {
    const scoreData = calculateLongevityScore();
    const plan = generateActionPlan();
    
    // Build HTML
    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div class="score-circle" style="width: 100px; height: 100px; margin: 0 auto;">
                <div class="score-circle-inner">${scoreData.score}</div>
            </div>
            <h3>Longevity Score: ${scoreData.score}/100</h3>
            <p style="color: var(--gray-600);">${getScoreDescription(scoreData.score)}</p>
        </div>
        <div style="margin-bottom: 20px;">
            <h4>📉 Low Areas</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${Object.entries(scoreData.breakdown).filter(([k,v]) => v < 60).map(([k,v]) => `<span class="badge badge-warning">${k.replace(/([A-Z])/g, ' $1')}: ${v}</span>`).join('') || '<span>None – great job!</span>'}
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <h4>📅 Daily Actions</h4>
            <ul>${plan.daily.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
        <div style="margin-bottom: 20px;">
            <h4>📆 Weekly Actions</h4>
            <ul>${plan.weekly.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
        ${plan.monthly.length ? `<div style="margin-bottom: 20px;"><h4>📆 Monthly Actions</h4><ul>${plan.monthly.map(item => `<li>${item}</li>`).join('')}</ul></div>` : ''}
        ${plan.quickWins.length ? `<div style="margin-bottom: 20px;"><h4>⚡ Quick Wins</h4><ul>${plan.quickWins.map(item => `<li>${item}</li>`).join('')}</ul></div>` : ''}
        <div class="btn-group" style="margin-top: 20px;">
            <button class="btn btn-primary" id="longevityWorkoutBtn">Generate Longevity Workout</button>
            <button class="btn btn-outline" id="closeLongevityModal">Close</button>
        </div>
    `;
    
    // Create or reuse modal
    let modal = document.getElementById('longevityModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'longevityModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content"><span class="modal-close" onclick="closeModal('longevityModal')">&times;</span><div id="longevityReportContent"></div></div>`;
        document.body.appendChild(modal);
    }
    const content = document.getElementById('longevityReportContent');
    if (content) content.innerHTML = html;
    showModal('longevityModal');
    
    // Attach event listeners
    document.getElementById('longevityWorkoutBtn')?.addEventListener('click', () => {
        closeModal('longevityModal');
        import('../workout/generator.js').then(mod => {
            mod.generateWorkout().then(() => {
                showSection('workout');
                showNotification('Longevity workout generated', 'success');
            });
        });
    });
    document.getElementById('closeLongevityModal')?.addEventListener('click', () => closeModal('longevityModal'));
}

function getScoreDescription(score) {
    if (score >= 80) return "Excellent – you're aging well!";
    if (score >= 60) return "Good – a few areas to polish.";
    if (score >= 40) return "Needs attention – start with the daily actions.";
    return "High risk – prioritize the daily and weekly actions immediately.";
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}