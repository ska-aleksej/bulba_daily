const SETTINGS_PREFIX = 'bulba.daily.';
const SETTING_TEAM_NAME = 'team.name';

const subscribers = {};

function getSetting(key, defaultValue = null) {
    const storedValue = localStorage.getItem(`${SETTINGS_PREFIX}${key}`);
    if (storedValue === null) {
        return defaultValue;
    }

    try {
        return JSON.parse(storedValue);
    } catch (e) {
        return storedValue;
    }
}

function setSetting(key, value) {
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
    localStorage.setItem(`${SETTINGS_PREFIX}${key}`, valueToStore);

    // Уведомляем подписчиков
    if (subscribers[key]) {
        subscribers[key].forEach(callback => callback(value));
    }
}

function subscribe(key, callback) {
    if (!subscribers[key]) {
        subscribers[key] = [];
    }
    subscribers[key].push(callback);
}

export { getSetting, setSetting, subscribe, SETTING_TEAM_NAME };

// Временный глобальный доступ для отладки
window.setSetting = setSetting;
