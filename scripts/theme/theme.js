import { getSetting, setSetting, SETTING_THEME } from '../settings/settings.js';

function initTheme() {
    const defaultTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const savedTheme = getSetting(SETTING_THEME, defaultTheme);
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    const body = document.body;

    if (theme === 'dark') {
        body.classList.add('dark');
    } else {
        body.classList.remove('dark');
    }
}

function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    setSetting(SETTING_THEME, newTheme);
    applyTheme(newTheme);
    updateThemeToggleIcon(newTheme);
}

function getCurrentTheme() {
    return document.body.classList.contains('dark') ? 'dark' : 'light';
}

function updateThemeToggleIcon(currentTheme) {
    const toggleElement = document.querySelector('.theme-toggle');
    if (!toggleElement) return;

    const iconElement = toggleElement.querySelector('.theme-icon');
    if (iconElement) {
        const iconSrc = currentTheme === 'dark' ? 'images/sun.svg' : 'images/moon.svg';
        iconElement.innerHTML = `<img src="${iconSrc}" alt="theme-icon" width="24" height="24">`;
    }
}

function renderThemeToggle() {
    const container = document.getElementById('theme-toggle-container');
    if (!container) {
        console.error('Контейнер для переключателя темы не найден');
        return;
    }

    const currentTheme = getCurrentTheme();
    const iconSrc = currentTheme === 'dark' ? 'images/sun.svg' : 'images/moon.svg';

    const toggleButton = document.createElement('button');
    toggleButton.className = 'theme-toggle';
    toggleButton.type = 'button';
    toggleButton.ariaLabel = 'Переключить тему';
    toggleButton.innerHTML = `<span class="theme-icon"><img src="${iconSrc}" alt="theme-icon" width="24" height="24"></span>`;

    toggleButton.addEventListener('click', toggleTheme);

    container.appendChild(toggleButton);
}

export { initTheme, toggleTheme, getCurrentTheme, renderThemeToggle };
