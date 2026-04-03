// js/ui/history.js
import { loadWorkouts, deleteWorkout } from '../core/storage.js';
import { formatDate, formatVolume } from '../utils/date.js';
import { formatWeight, getUnit } from '../core/units.js';
import { showNotification } from '../utils/dom.js';

let currentHistoryFilter = 'all';
let workoutsCache = [];

/**
 * Render the history section
 * @param {Object} appState - Global app state
 */
export async function renderHistory(appState) {
    const container = document.getElementById('history-section');
    if (!container) return;
    
    workoutsCache = await loadWorkouts();
    const filtered = filterWorkouts(workoutsCache);
    
    container.innerHTML = `
        <div class="card">
            <h2 class="section-title">Workout History</h2>
            <div class="tabs">
                <button class="tab ${currentHistoryFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
                <button class="tab ${currentHistoryFilter === 'week' ? 'active' : ''}" data-filter="week">This Week</button>
                <button class="tab ${currentHistoryFilter === 'month' ? 'active' : ''}" data-filter="month">This Month</button>
                <button class="tab ${currentHistoryFilter === 'year' ? 'active' : ''}" data-filter="year">This Year</button>
                <button class="tab ${currentHistoryFilter === 'longevity' ? 'active' : ''}" data-filter="longevity">Longevity</button>
            </div>
            <div class="history-stats">
                <span>📊 Total workouts: ${filtered.length}</span>
                <span>📈 Total volume: ${formatVolume(calculateTotalVolume(filtered))}</span>
            </div>
            <div class="history-table-container">
                <table class="history-table">
                    <thead>
                        <tr><th></th><th>Date</th><th>Workout</th><th>Volume</th><th>RPE</th></tr>
                    </thead>
                    <tbody id="historyTableBody">
                        ${renderTableRows(filtered)}
                    </tbody>
                </table>
            </div>
            <div class="export-options">
                <button class="btn btn-outline" id="exportHistoryBtn"><i class="fas fa-file-csv"></i> Export CSV</button>
                <button class="btn btn-outline" id="printHistoryBtn"><i class="fas fa-print"></i> Print</button>
            </div>
        </div>
    `;
    
    // Attach filter listeners
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', async (e) => {
            currentHistoryFilter = tab.dataset.filter;
            await renderHistory(appState);
        });
    });
    
    document.getElementById('exportHistoryBtn')?.addEventListener('click', () => exportHistoryCSV(filtered));
    document.getElementById('printHistoryBtn')?.addEventListener('click', () => window.print());
    
    // Attach row toggle listeners after DOM update
    attachRowToggleListeners();
}

function filterWorkouts(workouts) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (currentHistoryFilter) {
        case 'week':
            const oneWeekAgo = new Date(startOfToday);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return workouts.filter(w => new Date(w.date) >= oneWeekAgo);
        case 'month':
            const oneMonthAgo = new Date(startOfToday);
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return workouts.filter(w => new Date(w.date) >= oneMonthAgo);
        case 'year':
            const oneYearAgo = new Date(startOfToday);
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            return workouts.filter(w => new Date(w.date) >= oneYearAgo);
        case 'longevity':
            return workouts.filter(w => w.type === 'longevity_day' || w.name?.toLowerCase().includes('longevity'));
        default:
            return workouts;
    }
}

function renderTableRows(workouts) {
    if (workouts.length === 0) {
        return `<tr><td colspan="5" style="text-align: center; padding: 40px;">No workouts found</td></tr>`;
    }
    
    // Sort newest first
    const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return sorted.map(workout => {
        const volume = workout.summary?.totalVolume || calculateWorkoutVolume(workout);
        const avgRPE = workout.summary?.averageRPE || calculateAverageRPE(workout);
        return `
            <tr class="history-row" data-workout-id="${workout.id}" data-workout='${JSON.stringify(workout).replace(/'/g, "&apos;")}'>
                <td class="toggle-cell"><i class="fas fa-chevron-right"></i></td>
                <td>${formatDate(workout.date)}</td>
                <td>${workout.name || workout.type || 'Workout'}</td>
                <td>${formatVolume(volume)}</td>
                <td>${avgRPE || '—'}</td>
            </tr>
            <tr class="history-detail" style="display: none;">
                <td colspan="5">
                    <div class="detail-content"></div>
                </td>
            </tr>
        `;
    }).join('');
}

function attachRowToggleListeners() {
    document.querySelectorAll('.history-row').forEach(row => {
        row.addEventListener('click', (e) => {
            const detailRow = row.nextElementSibling;
            const icon = row.querySelector('.toggle-cell i');
            if (detailRow && detailRow.classList.contains('history-detail')) {
                const isVisible = detailRow.style.display !== 'none';
                if (isVisible) {
                    detailRow.style.display = 'none';
                    icon.className = 'fas fa-chevron-right';
                } else {
                    // Close any other open details
                    document.querySelectorAll('.history-detail').forEach(d => d.style.display = 'none');
                    document.querySelectorAll('.history-row .toggle-cell i').forEach(i => i.className = 'fas fa-chevron-right');
                    
                    detailRow.style.display = 'table-row';
                    icon.className = 'fas fa-chevron-down';
                    
                    // Populate detail content
                    const workout = JSON.parse(row.dataset.workout);
                    const detailContent = detailRow.querySelector('.detail-content');
                    if (detailContent) {
                        detailContent.innerHTML = renderWorkoutDetail(workout);
                    }
                }
            }
        });
    });
}

function renderWorkoutDetail(workout) {
    let exercisesHtml = '';
    if (workout.exercises && workout.exercises.length) {
        exercisesHtml = '<ul>';
        for (const ex of workout.exercises) {
            let setsHtml = '';
            if (ex.loggedSets && ex.loggedSets.length) {
                setsHtml = ex.loggedSets.map(set => 
                    `<div class="set-detail">Set ${set.setNumber}: ${formatWeight(set.weight)} × ${set.reps} reps, RPE ${set.rpe}${set.rir ? ` (RIR ${set.rir.toFixed(1)})` : ''}</div>`
                ).join('');
            } else if (ex.actual) {
                setsHtml = `<div>Logged: ${formatWeight(ex.actual.weight)} × ${ex.actual.reps} reps, RPE ${ex.actual.rpe}</div>`;
            } else {
                setsHtml = '<em>Not logged</em>';
            }
            exercisesHtml += `
                <li>
                    <strong>${ex.name}</strong>
                    <div class="exercise-detail-sets">${setsHtml}</div>
                </li>
            `;
        }
        exercisesHtml += '</ul>';
    } else {
        exercisesHtml = '<p>No exercise details</p>';
    }
    
    const notes = workout.notes || workout.summary?.notes || 'No notes';
    
    return `
        <div class="workout-detail">
            <div class="detail-row"><strong>Date:</strong> ${new Date(workout.date).toLocaleString()}</div>
            <div class="detail-row"><strong>Type:</strong> ${workout.name || workout.type}</div>
            <div class="detail-row"><strong>Duration:</strong> ${workout.duration || '—'} min</div>
            <div class="detail-row"><strong>Exercises:</strong></div>
            <div class="detail-exercises">${exercisesHtml}</div>
            <div class="detail-row"><strong>Notes:</strong> ${notes}</div>
            <button class="btn btn-sm btn-danger delete-workout-btn" data-id="${workout.id}" style="margin-top: 12px;">Delete Workout</button>
        </div>
    `;
}

function calculateWorkoutVolume(workout) {
    let total = 0;
    if (workout.exercises) {
        for (const ex of workout.exercises) {
            if (ex.loggedSets) {
                for (const set of ex.loggedSets) {
                    total += set.weight * set.reps;
                }
            } else if (ex.actual && ex.actual.weight && ex.actual.reps) {
                total += ex.actual.weight * ex.actual.reps * (ex.actual.sets || 1);
            }
        }
    }
    return total;
}

function calculateAverageRPE(workout) {
    let totalRPE = 0;
    let count = 0;
    if (workout.exercises) {
        for (const ex of workout.exercises) {
            if (ex.loggedSets) {
                for (const set of ex.loggedSets) {
                    totalRPE += set.rpe;
                    count++;
                }
            } else if (ex.actual && ex.actual.rpe) {
                totalRPE += ex.actual.rpe;
                count++;
            }
        }
    }
    return count > 0 ? (totalRPE / count).toFixed(1) : null;
}

function calculateTotalVolume(workouts) {
    return workouts.reduce((sum, w) => sum + (w.summary?.totalVolume || calculateWorkoutVolume(w)), 0);
}

async function exportHistoryCSV(workouts) {
    const headers = ['Date', 'Workout', 'Exercises', 'Total Volume', 'Average RPE', 'Notes'];
    const rows = workouts.map(w => {
        const volume = w.summary?.totalVolume || calculateWorkoutVolume(w);
        const avgRPE = w.summary?.averageRPE || calculateAverageRPE(w);
        const exerciseNames = w.exercises?.map(ex => ex.name).join('; ') || '';
        return [
            new Date(w.date).toLocaleString(),
            w.name || w.type,
            exerciseNames,
            volume,
            avgRPE,
            w.notes || ''
        ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('History exported as CSV', 'success');
}

// Global delete handler (event delegation)
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-workout-btn')) {
        const id = e.target.dataset.id;
        if (confirm('Delete this workout permanently?')) {
            await deleteWorkout(id);
            showNotification('Workout deleted', 'info');
            // Re-render history
            const appState = { currentSection: 'history' };
            await renderHistory(appState);
        }
    }
});