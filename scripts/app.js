function calculateTimeToFriday() {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 5 = пятница
    const currentHour = now.getHours();
    
    // Проверяем, если сегодня пятница и время после 18:00
    if (currentDay === 5 && currentHour >= 18) {
        return { isWeekend: true };
    }
    
    // Создаем дату ближайшей пятницы в 18:00
    const friday = new Date(now);
    
    // Если сегодня пятница и время меньше 18:00, берем сегодняшнюю пятницу
    if (currentDay === 5 && currentHour < 18) {
        friday.setHours(18, 0, 0, 0);
    } else {
        // Иначе берем следующую пятницу
        let daysUntilFriday;
        if (currentDay <= 5) {
            // Если сегодня понедельник-пятница
            daysUntilFriday = 5 - currentDay;
        } else {
            // Если сегодня суббота или воскресенье
            daysUntilFriday = 5 + (7 - currentDay);
        }
        
        friday.setDate(now.getDate() + daysUntilFriday);
        friday.setHours(18, 0, 0, 0);
    }
    
    const timeDiff = friday.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}

function updateTimer() {
    const timeLeft = calculateTimeToFriday();
    const timerContainer = document.querySelector('.timer-container');
    const timerElement = document.getElementById('countdown-timer');
    
    // Если уже выходной
    if (timeLeft.isWeekend) {
        timerElement.innerHTML = '<span style="font-size: 1.1rem;">🎉 Выходные!</span>';
        timerContainer.classList.add('weekend-mode');
        return;
    }
    
    // Обычный режим таймера
    timerContainer.classList.remove('weekend-mode');
    
    document.getElementById('days').textContent = padZero(timeLeft.days);
    document.getElementById('hours').textContent = padZero(timeLeft.hours);
    document.getElementById('minutes').textContent = padZero(timeLeft.minutes);
    document.getElementById('seconds').textContent = padZero(timeLeft.seconds);

    // Обновляем подписи с правильным склонением
    document.querySelector('#days').nextElementSibling.textContent =
        pluralize(timeLeft.days, 'день', 'дня', 'дней');
    document.querySelector('#hours').nextElementSibling.textContent =
        pluralize(timeLeft.hours, 'час', 'часа', 'часов');
    document.querySelector('#minutes').nextElementSibling.textContent =
        pluralize(timeLeft.minutes, 'минута', 'минуты', 'минут');
    document.querySelector('#seconds').nextElementSibling.textContent =
        pluralize(timeLeft.seconds, 'секунда', 'секунды', 'секунд');
}

function pluralize(number, one, few, many) {
    const mod10 = number % 10;
    const mod100 = number % 100;

    if (mod10 === 1 && mod100 !== 11) {
        return one;
    } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return few;
    } else {
        return many;
    }
}

function getRandomQuoteFromData() {
    if (typeof getRandomQuote !== 'undefined') {
        return getRandomQuote();
    }
    // Fallback если data.js не загружен
    return {
        text: "Жизнь — это то, что происходит с тобой, пока ты строишь планы.",
        author: "Джон Леннон"
    };
}

function displayDailyQuote() {
    const quote = getRandomQuoteFromData();
    document.getElementById('daily-quote').textContent = quote.text;
    document.getElementById('quote-author').textContent = `— ${quote.author}`;
}

async function loadDataFromAPI() {
    try {
        const url = encodeURIComponent("https://my-calend.ru/holidays");
        const proxy = `https://api.allorigins.win/get?url=${url}`;

        const response = await fetch(proxy);
        const data = await response.json();

        if (!data.contents) {
            throw new Error('Не удалось получить данные');
        }

        const html = data.contents;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Извлекаем праздники из секции holidays-items
        const links = [...doc.querySelectorAll(".holidays-items a")];
        const listItems = [...doc.querySelectorAll(".holidays-items li")];
        
        const linkHolidays = links.map(a => a.textContent.trim()).filter(h => h.length > 0);
        const spanHolidays = listItems.map(li => {
            const firstSpan = li.querySelector('span');
            return firstSpan ? firstSpan.textContent.trim() : '';
        }).filter(h => h.length > 0);
        
        const holidays = [...linkHolidays, ...spanHolidays];

        // Извлекаем имена из секции holidays-name-days
        const nameLinks = [...doc.querySelectorAll(".holidays-name-days a")];
        const names = nameLinks.map(a => a.textContent.trim()).filter(name => name.length > 0);

        return { holidays, names };
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return null;
    }
}

function displayNames(names) {
    const namesList = document.getElementById('names-list');

    if (names && names.length > 0) {
        namesList.innerHTML = '';
        names.forEach(name => {
            const div = document.createElement('div');
            div.className = 'name-item';
            div.textContent = name;
            namesList.appendChild(div);
        });
    } else {
        namesList.innerHTML = '<div class="name-item">Имена не найдены</div>';
    }
}

function displayHolidays(holidays) {
    const holidaysList = document.getElementById('holidays-list');
    
    if (holidays && holidays.length > 0) {
        holidaysList.innerHTML = '';
        holidays.forEach(holiday => {
            const li = document.createElement('li');
            li.className = 'holiday-item';
            li.textContent = holiday;
            holidaysList.appendChild(li);
        });
    } else {
        holidaysList.innerHTML = '<li class="holiday-item">Праздники не найдены</li>';
    }
}

async function initApp() {
    updateTimer();
    setInterval(updateTimer, 1000);

    displayDailyQuote();

    // Показываем индикаторы загрузки
    document.getElementById('holidays-list').innerHTML = '<li class="holiday-item loading">Загрузка праздников...</li>';
    document.getElementById('names-list').innerHTML = '<div class="name-item loading">Загрузка именин...</div>';

    try {
        const data = await loadDataFromAPI();
        
        if (data) {
            displayHolidays(data.holidays);
            displayNames(data.names);
        } else {
            document.getElementById('holidays-list').innerHTML = '<li class="holiday-item">Ошибка загрузки праздников</li>';
            document.getElementById('names-list').innerHTML = '<div class="name-item">Ошибка загрузки именин</div>';
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        document.getElementById('holidays-list').innerHTML = '<li class="holiday-item">Ошибка загрузки праздников</li>';
        document.getElementById('names-list').innerHTML = '<div class="name-item">Ошибка загрузки именин</div>';
    }
}

// Запускаем приложение когда DOM загружен
document.addEventListener('DOMContentLoaded', initApp);
