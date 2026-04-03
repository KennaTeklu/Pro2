// js/utils/dom.js
let notificationTimeout = null;

/**
 * Show a modal by ID
 */
export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

/**
 * Close a modal by ID
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

/**
 * Show a toast notification
 * @param {string} message - Text to display
 * @param {string} type - 'success', 'warning', 'error', 'info'
 * @param {number} duration - milliseconds
 */
export function showNotification(message, type = 'success', duration = 4000) {
    // Remove existing notification if any
    const existing = document.getElementById('global-notification');
    if (existing) existing.remove();
    if (notificationTimeout) clearTimeout(notificationTimeout);
    
    const colors = {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4'
    };
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const notif = document.createElement('div');
    notif.id = 'global-notification';
    notif.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: white;
        color: var(--gray-800);
        padding: 14px 24px;
        border-radius: 50px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        font-weight: 600;
        transition: transform 0.3s ease;
        border-left: 5px solid ${colors[type]};
        max-width: 90vw;
        pointer-events: none;
    `;
    notif.innerHTML = `
        <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 1.2rem;"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notif);
    
    // Animate in
    setTimeout(() => {
        notif.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Auto hide
    notificationTimeout = setTimeout(() => {
        notif.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => {
            if (notif.parentNode) notif.remove();
        }, 300);
    }, duration);
}

/**
 * Show loading overlay
 */
export function showLoading(show = true) {
    let loader = document.getElementById('global-loader');
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 20000;
                flex-direction: column;
                gap: 16px;
            `;
            loader.innerHTML = `
                <div class="spinner" style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="color: white; font-weight: 600;">Loading...</div>
            `;
            const style = document.createElement('style');
            style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    } else {
        if (loader) loader.style.display = 'none';
    }
}

/**
 * Smooth scroll to an element with offset (for fixed navbar)
 */
export function scrollToElement(element, offset = 80) {
    if (!element) return;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
    });
}

/**
 * Get the current top offset based on device (for navbar height)
 */
export function getTopOffset() {
    // If on computer with hidden navbar, return small offset
    if (document.body.classList.contains('device-computer')) return 20;
    return 80; // mobile navbar height + padding
}

/**
 * Detect if device is a computer (not mobile/tablet)
 */
export function isComputerDevice() {
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|tablet|ipad|iphone|android|blackberry|windows phone|iemobile/i.test(ua);
    const isWindows = ua.includes('windows');
    const isMac = ua.includes('macintosh') || ua.includes('mac os');
    const isLinux = ua.includes('linux') && !ua.includes('android');
    return (isWindows || isMac || isLinux) && !isMobile;
}

/**
 * Apply device class to body for conditional styling
 */
export function applyDeviceClass() {
    if (isComputerDevice()) {
        document.body.classList.add('device-computer');
    } else {
        document.body.classList.remove('device-computer');
    }
}

/**
 * Create a thick slider element (for sweaty gym hands)
 */
export function createThickSlider(min, max, value, step = 1, onChange) {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    slider.className = 'slider-thick';
    if (onChange) slider.addEventListener('input', (e) => onChange(parseFloat(e.target.value)));
    return slider;
}