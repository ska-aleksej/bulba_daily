// Функция для расчета времени до пятницы вечером (18:00)
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

// Обновление таймера
function updateTimer() {
    const timeLeft = calculateTimeToFriday();
    const timerContainer = document.querySelector('.timer-container');
    const timerElement = document.getElementById('countdown-timer');
    
    // Если пятница уже прошла (после 18:00)
    if (timeLeft.isWeekend) {
        timerElement.innerHTML = '<span style="font-size: 1.1rem;">🎉 Выходные!</span>';
        timerElement.style.fontWeight = '600';
        timerElement.style.color = 'white';
        timerContainer.classList.add('weekend-mode');
        return;
    }
    
    // Обычный режим таймера
    timerContainer.classList.remove('weekend-mode');
    timerElement.style.fontWeight = '700';
    timerElement.style.color = 'white';
    
    document.getElementById('days').textContent = timeLeft.days;
    document.getElementById('hours').textContent = timeLeft.hours;
    document.getElementById('minutes').textContent = timeLeft.minutes;
    document.getElementById('seconds').textContent = timeLeft.seconds;
}

// Используем данные из data.js
// Функция для получения случайной цитаты (использует данные из data.js)
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

// Функция для отображения цитаты дня
function displayDailyQuote() {
    const quote = getRandomQuoteFromData();
    document.getElementById('daily-quote').textContent = quote.text;
    document.getElementById('quote-author').textContent = `— ${quote.author}`;
}

// Функция для загрузки данных с внешнего сайта (праздники и имена одновременно)
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

// Функция для отображения именин
function displayNames(names) {
    const namesList = document.getElementById('names-list');

    if (names && names.length > 0) {
        // Используем переданные имена
        namesList.innerHTML = '';
        names.forEach(name => {
            const div = document.createElement('div');
            div.className = 'name-item';
            div.textContent = name;
            namesList.appendChild(div);
        });
    } else {
        // Если имена не найдены
        namesList.innerHTML = '<div class="name-item">Имена не найдены</div>';
    }
}

// Функция для отображения праздников
function displayHolidays(holidays) {
    const holidaysList = document.getElementById('holidays-list');
    
    if (holidays && holidays.length > 0) {
        // Используем переданные праздники
        holidaysList.innerHTML = '';
        holidays.forEach(holiday => {
            const li = document.createElement('li');
            li.className = 'holiday-item';
            li.textContent = holiday;
            holidaysList.appendChild(li);
        });
    } else {
        // Если праздники не найдены
        holidaysList.innerHTML = '<li class="holiday-item">Праздники не найдены</li>';
    }
}

// Инициализация приложения
async function initApp() {
    // Обновляем таймер каждую секунду
    updateTimer();
    setInterval(updateTimer, 1000);

    // Отображаем цитату дня
    displayDailyQuote();

    // Показываем индикаторы загрузки
    document.getElementById('holidays-list').innerHTML = '<li class="holiday-item loading">Загрузка праздников...</li>';
    document.getElementById('names-list').innerHTML = '<div class="name-item loading">Загрузка именин...</div>';

    try {
        // Загружаем данные один раз
        const data = await loadDataFromAPI();
        
        if (data) {
            // Отображаем праздники и имена
            displayHolidays(data.holidays);
            displayNames(data.names);
        } else {
            // В случае ошибки показываем сообщения
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
