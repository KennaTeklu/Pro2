// js/ui/recovery.js
import { getUserProfile } from '../core/user.js';
import { getAllMuscleGroups, getMuscleDisplayName } from '../data/muscleDatabase.js';
import { getOverallReadiness, getMuscleRecovery, getSystemicRecoveryFactor, resetFatigue } from '../workout/fatigue.js';
import { showNotification, showModal, closeModal } from '../utils/dom.js';
import { showSection } from './navigation.js';

/**
 * Render the recovery section
 * @param {Object} appState - Global app state
 */
export async function renderRecovery(appState) {
    const container = document.getElementById('recovery-section');
    if (!container) return;
    
    const user = getUserProfile();
    const useCoupling = user.settings?.muscleCoupling ?? true;
    const overallReadiness = getOverallReadiness();
    const systemicFactor = getSystemicRecoveryFactor();
    
    // Group muscles by category
    const majorMuscles = getAllMuscleGroups().filter(m => m.category === 'lower' || m.category === 'upper' || m.category === 'arms' || m.category === 'core');
    const longevityMuscles = getAllMuscleGroups().filter(m => m.category === 'longevity');
    const handsFeetMuscles = getAllMuscleGroups().filter(m => m.category === 'hands' || m.category === 'feet');
    
    container.innerHTML = `
        <div class="card">
            <h2 class="section-title">Recovery & Readiness</h2>
            <div class="readiness-dashboard">
                <div class="readiness-gauge">
                    <div class="readiness-circle" style="background: conic-gradient(${getReadinessColor(overallReadiness)} 0deg ${overallReadiness * 3.6}deg, var(--gray-200) 0deg);">
                        <span>${overallReadiness}</span>
                    </div>
                    <div class="readiness-label">Overall Readiness</div>
                </div>
                <div class="systemic-status">
                    <div class="systemic-bar">
                        <div class="systemic-fill" style="width: ${systemicFactor * 100}%; background: ${getReadinessColor(systemicFactor * 100)};"></div>
                    </div>
                    <div>Systemic Recovery: ${Math.round(systemicFactor * 100)}%</div>
                </div>
            </div>
            <div class="recovery-actions">
                <button class="btn btn-sm btn-outline" id="refreshRecoveryBtn">Refresh</button>
                <button class="btn btn-sm btn-outline" id="resetFatigueBtn" style="color: var(--danger);">Reset Fatigue (Admin)</button>
            </div>
        </div>
        
        <div class="card">
            <h3>Major Muscle Groups</h3>
            <div id="majorRecoveryList" class="recovery-list"></div>
        </div>
        
        <div class="card">
            <h3>Longevity & Joint Muscles</h3>
            <div id="longevityRecoveryList" class="recovery-list"></div>
        </div>
        
        <div class="card">
            <h3>Hands & Feet</h3>
            <div id="handsFeetRecoveryList" class="recovery-list"></div>
        </div>
        
        <div class="card">
            <h3>Recovery Recommendations</h3>
            <div id="recoveryRecommendations" class="recommendations-list"></div>
            <button class="btn btn-primary" id="generateRecoveryWorkoutBtn">Generate Recovery Workout</button>
        </div>
    `;
    
    // Render muscle lists
    renderMuscleList('majorRecoveryList', majorMuscles, useCoupling);
    renderMuscleList('longevityRecoveryList', longevityMuscles, useCoupling);
    renderMuscleList('handsFeetRecoveryList', handsFeetMuscles, useCoupling);
    
    // Render recommendations
    renderRecommendations(overallReadiness);
    
    // Attach event listeners
    document.getElementById('refreshRecoveryBtn')?.addEventListener('click', () => renderRecovery(appState));
    document.getElementById('resetFatigueBtn')?.addEventListener('click', () => {
        if (confirm('Reset all fatigue data? This will mark all muscles as fully recovered.')) {
            resetFatigue();
            renderRecovery(appState);
            showNotification('Fatigue reset', 'info');
        }
    });
    document.getElementById('generateRecoveryWorkoutBtn')?.addEventListener('click', async () => {
        const { generateWorkout } = await import('../workout/generator.js');
        await generateWorkout();
        showSection('workout');
        showNotification('Recovery-focused workout generated', 'success');
    });
}

function renderMuscleList(containerId, muscles, useCoupling) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Sort by recovery percentage (lowest first – most needed attention)
    const musclesWithRecovery = muscles.map(m => ({
        ...m,
        recovery: getMuscleRecovery(m.name, useCoupling)
    })).sort((a, b) => a.recovery - b.recovery);
    
    container.innerHTML = musclesWithRecovery.map(m => `
        <div class="recovery-item">
            <div class="recovery-info">
                <span class="recovery-name">${getMuscleDisplayName(m.name)}</span>
                <span class="recovery-percent">${Math.round(m.recovery)}%</span>
            </div>
            <div class="recovery-bar-container">
                <div class="recovery-bar">
                    <div class="recovery-fill" style="width: ${m.recovery}%; background: ${getRecoveryColor(m.recovery)};"></div>
                </div>
            </div>
            <div class="recovery-status-text">${getRecoveryStatus(m.recovery)}</div>
        </div>
    `).join('');
}

function renderRecommendations(overallReadiness) {
    const container = document.getElementById('recoveryRecommendations');
    if (!container) return;
    
    const recommendations = [];
    
    if (overallReadiness >= 80) {
        recommendations.push("✅ You're fully recovered! Great time for a PR attempt or heavy workout.");
    } else if (overallReadiness >= 60) {
        recommendations.push("👍 Good recovery. You can train hard, but listen to your body.");
    } else if (overallReadiness >= 40) {
        recommendations.push("⚠️ Moderate fatigue. Consider a lighter workout or focus on technique.");
    } else {
        recommendations.push("🔴 High fatigue. Take a rest day or do only light recovery work.");
    }
    
    // Add specific muscle recommendations (top 3 most fatigued)
    const allMuscles = getAllMuscleGroups();
    const useCoupling = getUserProfile().settings?.muscleCoupling ?? true;
    const fatigued = allMuscles
        .map(m => ({ name: m.name, recovery: getMuscleRecovery(m.name, useCoupling) }))
        .filter(m => m.recovery < 50)
        .sort((a, b) => a.recovery - b.recovery)
        .slice(0, 3);
    
    if (fatigued.length > 0) {
        recommendations.push("💪 Most fatigued muscles: " + fatigued.map(m => getMuscleDisplayName(m.name)).join(', '));
        recommendations.push("🛌 Prioritize rest or active recovery for these areas.");
    }
    
    // Add systemic recovery tip
    const systemic = getSystemicRecoveryFactor();
    if (systemic < 0.5) {
        recommendations.push("😴 Your overall training load is high. Consider a deload week.");
    }
    
    // Add sleep/hydration reminder
    recommendations.push("💧 Stay hydrated and aim for 7-9 hours of sleep for optimal recovery.");
    
    container.innerHTML = `<ul>${recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`;
}

function getRecoveryColor(recoveryPercent) {
    if (recoveryPercent >= 80) return 'var(--success)';
    if (recoveryPercent >= 50) return 'var(--warning)';
    return 'var(--danger)';
}

function getReadinessColor(readiness) {
    if (readiness >= 80) return 'var(--success)';
    if (readiness >= 50) return 'var(--warning)';
    return 'var(--danger)';
}

function getRecoveryStatus(recoveryPercent) {
    if (recoveryPercent >= 80) return 'Ready';
    if (recoveryPercent >= 50) return 'Recovering';
    return 'Fatigued';
}