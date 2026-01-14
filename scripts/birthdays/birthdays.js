import { getBirthdays } from '../../data/data.js';

/**
 * Возвращает информацию о ближайшем дне рождения
 * @returns {Object} Объект с полями: days (число дней), isToday (true если сегодня), name (имя)
 */
function getNearestBirthday() {
    const birthdays = getBirthdays();
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();

    let nearest = null;
    let minDays = Infinity;

    for (const person of birthdays) {
        // Создаем дату дня рождения в этом году
        let birthdayDate = new Date(today.getFullYear(), person.month, person.day);

        // Если день рождения в этом году уже прошел, берем следующий год
        if (birthdayDate < today.setHours(0, 0, 0, 0)) {
            birthdayDate = new Date(today.getFullYear() + 1, person.month, person.day);
        }

        // Считаем разницу в днях
        const diffTime = birthdayDate - new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < minDays) {
            minDays = diffDays;
            nearest = {
                days: diffDays,
                isToday: diffDays === 0,
                name: person.name
            };
        }
    }

    return nearest;
}

/**
 * Возвращает текст для виджета дней рождения
 * @returns {string} Текст вида "сегодня" или "через X дней"
 */
function getBirthdayText() {
    const nearest = getNearestBirthday();

    if (nearest.isToday) {
        return 'сегодня';
    } else if (nearest.days === 1) {
        return 'завтра';
    } else {
        return `через ${nearest.days} ${getDaysText(nearest.days)}`;
    }
}

/**
 * Возвращает правильную форму слова "день"
 * @param {number} days - количество дней
 * @returns {string} "день", "дня" или "дней"
 */
function getDaysText(days) {
    const lastTwo = days % 100;
    const lastOne = days % 10;

    if (lastTwo >= 11 && lastTwo <= 14) {
        return 'дней';
    }

    if (lastOne === 1) {
        return 'день';
    } else if (lastOne >= 2 && lastOne <= 4) {
        return 'дня';
    } else {
        return 'дней';
    }
}

export { getNearestBirthday, getBirthdayText };
