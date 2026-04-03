// js/core/theme.js
const THEMES = {
    blue: {
        primary: '#2563eb',
        secondary: '#7c3aed',
        accent: '#3b82f6'
    },
    green: {
        primary: '#059669',
        secondary: '#10b981',
        accent: '#34d399'
    },
    purple: {
        primary: '#7c3aed',
        secondary: '#8b5cf6',
        accent: '#a78bfa'
    },
    dark: {
        primary: '#60a5fa',
        secondary: '#a78bfa',
        accent: '#818cf8'
    }
};

let currentTheme = 'blue';

/**
 * Initialize theme from localStorage or default
 */
export function initTheme() {
    const saved = localStorage.getItem('pro_theme');
    if (saved && THEMES[saved]) {
        currentTheme = saved;
    } else {
        // Check system preference for dark mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            currentTheme = 'dark';
        }
    }
    applyTheme(currentTheme);
}

/**
 * Get current theme name
 * @returns {string}
 */
export function getTheme() {
    return currentTheme;
}

/**
 * Set and apply a theme
 * @param {string} themeName - blue, green, purple, dark
 */
export function setTheme(themeName) {
    if (!THEMES[themeName]) return;
    currentTheme = themeName;
    localStorage.setItem('pro_theme', themeName);
    applyTheme(themeName);
}

/**
 * Apply theme CSS variables to document root
 * @param {string} themeName
 */
function applyTheme(themeName) {
    const theme = THEMES[themeName];
    const root = document.documentElement;
    
    if (themeName === 'dark') {
        // Dark mode overrides
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--secondary', theme.secondary);
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--light', '#1e293b');
        root.style.setProperty('--dark', '#f8fafc');
        root.style.setProperty('--gray-50', '#0f172a');
        root.style.setProperty('--gray-100', '#1e293b');
        root.style.setProperty('--gray-200', '#334155');
        root.style.setProperty('--gray-300', '#475569');
        root.style.setProperty('--gray-400', '#64748b');
        root.style.setProperty('--gray-500', '#94a3b8');
        root.style.setProperty('--gray-600', '#cbd5e1');
        root.style.setProperty('--gray-700', '#e2e8f0');
        root.style.setProperty('--gray-800', '#f1f5f9');
        root.style.setProperty('--gray-900', '#f8fafc');
    } else {
        // Light theme defaults
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--secondary', theme.secondary);
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--light', '#f8fafc');
        root.style.setProperty('--dark', '#0f172a');
        root.style.setProperty('--gray-50', '#f8fafc');
        root.style.setProperty('--gray-100', '#f1f5f9');
        root.style.setProperty('--gray-200', '#e2e8f0');
        root.style.setProperty('--gray-300', '#cbd5e1');
        root.style.setProperty('--gray-400', '#94a3b8');
        root.style.setProperty('--gray-500', '#64748b');
        root.style.setProperty('--gray-600', '#475569');
        root.style.setProperty('--gray-700', '#334155');
        root.style.setProperty('--gray-800', '#1e293b');
        root.style.setProperty('--gray-900', '#0f172a');
    }
    
    // Add data-theme attribute for additional CSS hooks
    document.documentElement.setAttribute('data-theme', themeName);
}

/**
 * Toggle between light and dark (convenience)
 */
export function toggleDarkMode() {
    if (currentTheme === 'dark') {
        setTheme('blue');
    } else {
        setTheme('dark');
    }
}

/**
 * Get all available theme names
 * @returns {string[]}
 */
export function getAvailableThemes() {
    return Object.keys(THEMES);
}