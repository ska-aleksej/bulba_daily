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

/**
 * Вычисляет количество дней до следующего дня рождения
 * @param {Object} person - Объект с полями name, day, month
 * @param {Date} today - Текущая дата
 * @returns {Object} Объект с полями: person, days (количество дней), isToday
 */
function getDaysUntilBirthday(person, today) {
    // Создаем дату дня рождения в этом году
    let birthdayDate = new Date(today.getFullYear(), person.month, person.day);
    let isToday = false;

    // Сбрасываем время у today для корректного сравнения
    const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Если день рождения в этом году уже прошел, берем следующий год
    if (birthdayDate < todayNoTime) {
        birthdayDate = new Date(today.getFullYear() + 1, person.month, person.day);
    }

    // Проверяем, сегодня ли день рождения
    if (birthdayDate.getTime() === todayNoTime.getTime()) {
        isToday = true;
    }

    // Считаем разницу в днях
    const diffTime = birthdayDate - todayNoTime;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { person, days, isToday };
}

/**
 * Форматирует дату дня рождения
 * @param {number} day - День
 * @param {number} month - Месяц (0-11)
 * @returns {string} Форматированная дата (например, "15 января")
 */
function formatDate(day, month) {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return `${day} ${months[month]}`;
}

/**
 * Форматирует количество дней
 * @param {number} days - Количество дней
 * @param {boolean} isToday - Сегодня ли день рождения
 * @returns {string} Отформатированный текст
 */
function formatDaysText(days, isToday) {
    if (isToday) {
        return '🎂';
    }

    if (days === 1) {
        return '1 день';
    }

    const lastTwo = days % 100;
    const lastOne = days % 10;

    if (lastTwo >= 11 && lastTwo <= 14) {
        return `${days} дней`;
    }

    if (lastOne === 1) {
        return `${days} день`;
    } else if (lastOne >= 2 && lastOne <= 4) {
        return `${days} дня`;
    } else {
        return `${days} дней`;
    }
}

/**
 * Возвращает класс для цвета количества дней
 * @param {number} days - Количество дней
 * @param {boolean} isToday - Сегодня ли день рождения
 * @returns {string} CSS класс
 */
function getDaysCountClass(days, isToday) {
    if (isToday) {
        return '';
    }
    if (days <= 3) {
        return 'urgent';
    }
    if (days <= 7) {
        return 'soon';
    }
    return '';
}

/**
 * Рендерит список дней рождения в указанный контейнер
 * @param {HTMLElement} container - Контейнер для вставки списка
 */
function renderBirthdayList(container) {
    if (!container) {
        console.error('Контейнер для списка дней рождения не найден');
        return;
    }

    const birthdays = getBirthdays();
    const today = new Date();

    // Вычисляем дни до дня рождения для каждого человека
    const birthdaysWithDays = birthdays.map(person =>
        getDaysUntilBirthday(person, today)
    );

    // Сортируем: сначала сегодня, потом по возрастанию дней
    birthdaysWithDays.sort((a, b) => {
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        return a.days - b.days;
    });

    // Генерируем HTML
    let html = '';

    for (const item of birthdaysWithDays) {
        const { person, days, isToday } = item;
        const firstLetter = person.name.charAt(0).toUpperCase();
        const daysCountClass = getDaysCountClass(days, isToday);
        const dateText = formatDate(person.day, person.month);

        // Класс для сегодняшнего дня
        const todayClass = isToday ? 'today' : '';

        // Контент для правой части
        let daysContent;
        if (isToday) {
            daysContent = '<span class="today-badge">Сегодня!</span>';
        } else {
            const daysText = formatDaysText(days, isToday);
            daysContent = `
                <div class="days-count ${daysCountClass}">${daysText}</div>
                <div class="days-label">осталось</div>
            `;
        }

        html += `
            <div class="birthday-list-item ${todayClass}">
                <div class="birthday-avatar">${firstLetter}</div>
                <div class="birthday-info">
                    <div class="birthday-name">${person.name}</div>
                    <div class="birthday-date">${dateText}</div>
                </div>
                <div class="birthday-days">
                    ${daysContent}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

export { renderBirthdayList };
