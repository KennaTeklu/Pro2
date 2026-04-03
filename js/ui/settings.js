// js/ui/settings.js
import { getUserProfile, saveUser, updateUser, setBodyweight, getBodyweight } from '../core/user.js';
import { UNIT, getUnit, setUnit } from '../core/units.js';
import { exportAllData, importAllData } from '../core/storage.js';
import { setTheme, getTheme } from '../core/theme.js';
import { showNotification, showLoading, showModal, closeModal } from '../utils/dom.js';
import { resetFatigue } from '../workout/fatigue.js';

/**
 * Render the settings section
 * @param {Object} appState - Global app state
 */
export async function renderSettings(appState) {
    const container = document.getElementById('settings-section');
    if (!container) return;
    
    const user = getUserProfile();
    const currentUnit = getUnit();
    const currentTheme = getTheme();
    const bodyweight = getBodyweight();
    
    container.innerHTML = `
        <div class="card">
            <h2 class="section-title">Settings</h2>
            
            <div class="settings-group">
                <h3>Profile</h3>
                <div class="settings-row">
                    <label>Name</label>
                    <input type="text" id="settingsName" value="${escapeHtml(user.name || '')}" placeholder="Your name">
                </div>
                <div class="settings-row">
                    <label>Birth Date</label>
                    <input type="date" id="settingsBirthDate" value="${user.birthDate || ''}">
                </div>
                <div class="settings-row">
                    <label>Gender</label>
                    <select id="settingsGender">
                        <option value="male" ${user.gender === 'male' ? 'selected' : ''}>Male</option>
                        <option value="female" ${user.gender === 'female' ? 'selected' : ''}>Female</option>
                        <option value="other" ${user.gender === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="settings-row">
                    <label>Body Weight (${currentUnit})</label>
                    <input type="number" id="settingsWeight" value="${bodyweight}" step="0.5" placeholder="Weight">
                </div>
                <div class="settings-row">
                    <label>Height (cm)</label>
                    <input type="number" id="settingsHeight" value="${user.height || ''}" placeholder="Height in cm">
                </div>
                <div class="settings-row">
                    <label>Experience Level</label>
                    <select id="settingsExperience">
                        <option value="beginner" ${user.experience === 'beginner' ? 'selected' : ''}>Beginner</option>
                        <option value="intermediate" ${user.experience === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                        <option value="advanced" ${user.experience === 'advanced' ? 'selected' : ''}>Advanced</option>
                    </select>
                </div>
                <div class="settings-row">
                    <label>Training Goal</label>
                    <select id="settingsGoal">
                        <option value="strength" ${user.goal === 'strength' ? 'selected' : ''}>Strength</option>
                        <option value="hypertrophy" ${user.goal === 'hypertrophy' ? 'selected' : ''}>Hypertrophy</option>
                        <option value="endurance" ${user.goal === 'endurance' ? 'selected' : ''}>Endurance</option>
                        <option value="longevity" ${user.goal === 'longevity' ? 'selected' : ''}>Longevity</option>
                        <option value="balanced" ${user.goal === 'balanced' ? 'selected' : ''}>Balanced</option>
                    </select>
                </div>
            </div>
            
            <div class="settings-group">
                <h3>Units & Appearance</h3>
                <div class="settings-row">
                    <label>Weight Unit</label>
                    <div class="unit-toggle-settings">
                        <button class="unit-option ${currentUnit === UNIT.lbs ? 'active' : ''}" data-unit="${UNIT.lbs}">lbs</button>
                        <button class="unit-option ${currentUnit === UNIT.kg ? 'active' : ''}" data-unit="${UNIT.kg}">kg</button>
                    </div>
                </div>
                <div class="settings-row">
                    <label>Theme</label>
                    <div class="theme-toggle-settings">
                        <button class="theme-option ${currentTheme === 'blue' ? 'active' : ''}" data-theme="blue">Blue</button>
                        <button class="theme-option ${currentTheme === 'green' ? 'active' : ''}" data-theme="green">Green</button>
                        <button class="theme-option ${currentTheme === 'purple' ? 'active' : ''}" data-theme="purple">Purple</button>
                        <button class="theme-option ${currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">Dark</button>
                    </div>
                </div>
                <div class="settings-row">
                    <label>Muscle Coupling (advanced)</label>
                    <label class="switch">
                        <input type="checkbox" id="muscleCouplingToggle" ${user.settings?.muscleCoupling !== false ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            
            <div class="settings-group">
                <h3>Data Management</h3>
                <div class="settings-buttons">
                    <button class="btn btn-outline" id="exportDataBtn">Export All Data</button>
                    <button class="btn btn-outline" id="importDataBtn">Import Data</button>
                    <button class="btn btn-danger" id="resetDataBtn">Reset All Data</button>
                </div>
            </div>
            
            <div class="settings-group">
                <h3>About</h3>
                <p>Pro App v2.0.0 – Adaptive Training & Longevity Platform</p>
                <p>Built for strength, health, and long-term wellbeing.</p>
            </div>
            
            <div class="settings-actions">
                <button class="btn btn-primary" id="saveSettingsBtn">Save Settings</button>
            </div>
        </div>
    `;
    
    // Attach event listeners
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => saveSettings());
    document.querySelectorAll('.unit-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const unit = btn.dataset.unit;
            setUnit(unit);
            renderSettings(appState);
            showNotification(`Unit changed to ${unit}`, 'info');
        });
    });
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
            renderSettings(appState);
            showNotification(`Theme changed to ${theme}`, 'success');
        });
    });
    document.getElementById('exportDataBtn')?.addEventListener('click', () => exportData());
    document.getElementById('importDataBtn')?.addEventListener('click', () => showImportModal());
    document.getElementById('resetDataBtn')?.addEventListener('click', () => resetAllData());
    document.getElementById('muscleCouplingToggle')?.addEventListener('change', (e) => {
        const user = getUserProfile();
        if (!user.settings) user.settings = {};
        user.settings.muscleCoupling = e.target.checked;
        saveUser(user);
        showNotification(`Muscle coupling ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });
}

async function saveSettings() {
    const name = document.getElementById('settingsName')?.value || '';
    const birthDate = document.getElementById('settingsBirthDate')?.value || null;
    const gender = document.getElementById('settingsGender')?.value || 'male';
    const weight = parseFloat(document.getElementById('settingsWeight')?.value);
    const height = parseFloat(document.getElementById('settingsHeight')?.value);
    const experience = document.getElementById('settingsExperience')?.value || 'intermediate';
    const goal = document.getElementById('settingsGoal')?.value || 'balanced';
    
    const updates = { name, birthDate, gender, experience, goal };
    if (!isNaN(weight) && weight > 0) updates.weight = weight;
    if (!isNaN(height) && height > 0) updates.height = height;
    
    await updateUser(updates);
    
    // Also update bodyweight separately if changed
    if (!isNaN(weight) && weight > 0) {
        setBodyweight(weight);
    }
    
    showNotification('Settings saved', 'success');
    // Re-render settings to reflect changes
    renderSettings({});
}

async function exportData() {
    showLoading(true);
    try {
        const data = await exportAllData();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pro-app-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Data exported', 'success');
    } catch (err) {
        showNotification('Export failed: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
}

function showImportModal() {
    const modalHtml = `
        <div class="import-modal">
            <h3>Import Data</h3>
            <p>This will replace all existing data. Make sure you have a backup.</p>
            <input type="file" id="importFileInput" accept=".json">
            <div class="modal-buttons">
                <button class="btn btn-primary" id="confirmImportBtn">Import</button>
                <button class="btn btn-outline" id="cancelImportBtn">Cancel</button>
            </div>
        </div>
    `;
    
    let modal = document.getElementById('importModalDialog');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'importModalDialog';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content"><span class="modal-close">&times;</span><div id="importModalBody"></div></div>`;
        document.body.appendChild(modal);
        modal.querySelector('.modal-close').addEventListener('click', () => closeModal('importModalDialog'));
    }
    const body = document.getElementById('importModalBody');
    if (body) body.innerHTML = modalHtml;
    showModal('importModalDialog');
    
    document.getElementById('confirmImportBtn')?.addEventListener('click', async () => {
        const fileInput = document.getElementById('importFileInput');
        if (!fileInput.files.length) {
            showNotification('Select a file first', 'warning');
            return;
        }
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await importAllData(data);
                showNotification('Data imported successfully. Reloading...', 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (err) {
                showNotification('Invalid file: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        closeModal('importModalDialog');
    });
    document.getElementById('cancelImportBtn')?.addEventListener('click', () => closeModal('importModalDialog'));
}

async function resetAllData() {
    if (!confirm('⚠️ This will delete ALL your data (workouts, profile, 1RMs). This cannot be undone. Continue?')) return;
    if (!confirm('⚠️ FINAL WARNING: All progress will be lost. Type "RESET" to confirm.')) return;
    const confirmation = prompt('Type "RESET" to confirm:');
    if (confirmation !== 'RESET') {
        showNotification('Reset cancelled', 'info');
        return;
    }
    
    showLoading(true);
    try {
        // Clear all storage
        localStorage.clear();
        // Reset Dexie (will be reinitialized on reload)
        const { db } = await import('../core/storage.js');
        await db.delete();
        // Reset fatigue
        resetFatigue();
        showNotification('All data cleared. Reloading...', 'success');
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        showNotification('Reset failed: ' + err.message, 'error');
        showLoading(false);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}