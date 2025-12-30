import { getRandomQuote, isVipName, getWeatherCities, getWeatherEmoji } from '../data/data.js';
import { getSetting, subscribe, SETTING_TEAM_NAME, SETTING_STATHAM_MODE, toggleStathamMode } from './settings/settings.js';

function updateTeamName() {
    const teamName = getSetting(SETTING_TEAM_NAME, 'Bulba Daily');
    document.title = teamName;

    const headerTitle = document.querySelector('.title');
    if (headerTitle) {
        headerTitle.textContent = teamName;
    }

    const footerText = document.querySelector('.footer p');
    if (footerText) {
        footerText.textContent = `© 2025 ${teamName}`;
    }
}

function setNewYearTheme() {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    // Новогодняя тема: декабрь или 1 января
    const isNewYearSeason = month === 11 || (month === 0 && day === 1);

    const body = document.body;
    if (isNewYearSeason) {
        body.classList.add('new-year-theme');
    } else {
        body.classList.remove('new-year-theme');
    }
}

function getRandomQuoteFromData(isStathamMode = false) {
    return getRandomQuote(isStathamMode);
}

function displayDailyQuote() {
    const isStathamMode = getSetting(SETTING_STATHAM_MODE, false);
    const quoteContainer = document.querySelector('.quote-container');
    const quoteTitle = quoteContainer.querySelector('.section-title');

    if (quoteContainer) {
        quoteContainer.classList.toggle('statham-mode', isStathamMode);
    }
    if (quoteTitle) {
        quoteTitle.textContent = isStathamMode ? 'Пацанская мудрость' : 'Цитата дня';
    }

    const quote = getRandomQuoteFromData(isStathamMode);
    document.getElementById('daily-quote').textContent = quote.text;
    document.getElementById('quote-author').textContent = `— ${quote.author}`;
}

async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return response;
            }
            console.warn(`Попытка ${i + 1}/${retries}: Неудачный ответ от сервера (статус: ${response.status})`);
        } catch (error) {
            console.warn(`Попытка ${i + 1}/${retries}: Ошибка сети.`, error.message);
        }
        // Ждем перед следующей попыткой
        if (i < retries - 1) {
            await new Promise(res => setTimeout(res, delay));
        }
    }
    // Если все попытки провалились, выбрасываем ошибку
    throw new Error(`Не удалось загрузить данные после ${retries} попыток.`);
}

async function loadDataFromAPI() {
    try {
        const targetUrl = "https://my-calend.ru/holidays";
        const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${targetUrl}`;

        const response = await fetchWithRetry(proxyUrl);
        const html = await response.text();

        if (!html) {
            console.error('Не удалось получить данные: ответ от прокси пустой.');
            return null;
        }

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
        console.error('Ошибка загрузки данных:', error.message);
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
            if (isVipName(name)) {
                div.classList.add('vip-name');
            }
            div.textContent = name;
            namesList.appendChild(div);
        });
    } else {
        namesList.innerHTML = '<div class="name-item">Имена не найдены</div>';
    }
}

function getExtraHolidays() {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();

    const extraHolidays = [];

    if (today.getDay() === 5) {
        extraHolidays.push({ name: "Пятница! Заряжаем батарейки на выходные!", isExtra: true });
    }

    if (month === 11 && day === 31) {
        extraHolidays.push({ name: "🎄 С наступающим Новым годом!!! 🎉", isExtra: true });
    }

    return extraHolidays;
}

function displayHolidays(holidays) {
    const holidaysList = document.getElementById('holidays-list');
    const extraHolidays = getExtraHolidays();
    const allHolidays = [...extraHolidays, ...holidays.map(h => ({ name: h, isExtra: false }))];

    if (allHolidays && allHolidays.length > 0) {
        holidaysList.innerHTML = '';
        allHolidays.forEach(holiday => {
            const li = document.createElement('li');
            li.className = 'holiday-item';
            if (holiday.isExtra) {
                li.classList.add('extra-holiday-item');
            }
            li.textContent = holiday.name;
            holidaysList.appendChild(li);
        });
    } else {
        holidaysList.innerHTML = '<li class="holiday-item">Праздники не найдены</li>';
    }
}

async function loadWeatherForCities() {
    const cities = getWeatherCities();
    const weatherContainer = document.querySelector('.weather-list');

    // Показываем индикатор загрузки
    weatherContainer.innerHTML = '<div class="loading">Загрузка погоды...</div>';

    const weatherPromises = cities.map(city =>
        fetchWeather(city.displayName, city.lat, city.lon)
    );

    const weatherResults = await Promise.all(weatherPromises);

    weatherContainer.innerHTML = '';

    cities.forEach((city, index) => {
        const weatherData = weatherResults[index];
        if (weatherData) {
            displayWeatherCard(city, weatherData);
        }
    });
}

async function fetchWeather(cityName, latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&timezone=auto`;

    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(`Ошибка загрузки погоды для ${cityName}:`, error);
        return null;
    }
}

function displayWeatherCard(city, weatherData) {
    const card = document.createElement('div');
    card.className = 'weather-card';
    card.style.backgroundImage = `url('${city.bgImage}')`;

    const temp = Math.round(weatherData.current.temperature_2m);
    const weatherCode = weatherData.current.weather_code;
    const weatherEmoji = getWeatherEmoji(weatherCode);

    card.innerHTML = `
        <div class="weather-card-content">
            <div class="city-header">
                <h3>${city.displayName}</h3>
            </div>
            <div class="weather-block">
                <div class="weather-emoji">${weatherEmoji}</div>
                <div class="temperature">${temp}°C</div>
            </div>
            <div class="feels-like">Ощущается: ${Math.round(weatherData.current.apparent_temperature)}°C</div>
            <div class="weather-details">
                <span>💨 ${Math.round(weatherData.current.wind_speed_10m)} км/ч</span>
                <span>💧 ${weatherData.current.relative_humidity_2m}%</span>
            </div>
        </div>
    `;

    document.querySelector('.weather-list').appendChild(card);
}

function padZero(num) {
    return num.toString().padStart(2, '0');
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

function updateTimer(timerId, timeLeft) {
    const timerContainer = document.querySelector(`[data-timer-id="${timerId}"]`);
    if (!timerContainer) return;

    // Проверка на специальные состояния (выходные и т.д.)
    if (timeLeft.isWeekend || timeLeft.isExpired) {
        handleSpecialState(timerContainer, timeLeft);
        return;
    }

    // Обновляем значения
    timerContainer.querySelector('[data-unit="days"]').textContent = padZero(timeLeft.days);
    timerContainer.querySelector('[data-unit="hours"]').textContent = padZero(timeLeft.hours);
    timerContainer.querySelector('[data-unit="minutes"]').textContent = padZero(timeLeft.minutes);
    timerContainer.querySelector('[data-unit="seconds"]').textContent = padZero(timeLeft.seconds);

    // Обновляем склонения
    const labels = timerContainer.querySelectorAll('.timer-unit-label');
    labels[0].textContent = pluralize(timeLeft.days, 'день', 'дня', 'дней');
    labels[1].textContent = pluralize(timeLeft.hours, 'час', 'часа', 'часов');
    labels[2].textContent = pluralize(timeLeft.minutes, 'минута', 'минуты', 'минут');
    labels[3].textContent = pluralize(timeLeft.seconds, 'секунда', 'секунды', 'секунд');
}

function handleSpecialState(timerContainer, timeLeft) {
    const timerElement = timerContainer.querySelector('.timer');

    if (timeLeft.isWeekend) {
        timerElement.innerHTML = '<span style="font-size: 1.1rem;">🎉 Выходные!</span>';
        timerContainer.classList.add('weekend-mode');
    } else if (timeLeft.isExpired) {
        timerElement.innerHTML = '<span style="font-size: 1.1rem;">🎊 С Новым Годом!</span>';
        timerContainer.classList.add('expired-mode');
    }
}

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

function calculateTimeToNewYear() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const newYear = new Date(currentYear + 1, 0, 1, 0, 0, 0);

    const timeDiff = newYear.getTime() - now.getTime();

    if (timeDiff <= 0) {
        return { isExpired: true };
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
}

function updateAllTimers() {
    updateTimer('friday', calculateTimeToFriday());
    updateTimer('new-year', calculateTimeToNewYear());
}

async function initApp() {
    setNewYearTheme(); // Устанавливаем новогоднюю тему
    updateTeamName();
    subscribe(SETTING_TEAM_NAME, updateTeamName);

    updateAllTimers();
    setInterval(updateAllTimers, 1000);

    displayDailyQuote();
    subscribe(SETTING_STATHAM_MODE, displayDailyQuote);

    loadWeatherForCities();

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

    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        heroImage.addEventListener('click', (event) => {
            if (event.ctrlKey || event.metaKey) {
                toggleStathamMode();
            } else {
                displayDailyQuote();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initApp);
