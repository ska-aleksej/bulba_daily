import { isVipName, getWeatherCities, getWeatherEmoji, getBirthdays } from '../data/data.js';
import { getSetting, subscribe, SETTING_TEAM_NAME } from './settings/settings.js';

function updateTeamName() {
    const teamName = getSetting(SETTING_TEAM_NAME, 'Bulba Daily');
    document.title = teamName;

    const headerTitle = document.querySelector('.title');
    if (headerTitle) {
        headerTitle.textContent = teamName;
    }
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

    if (month === 11 && day === 31) {
        extraHolidays.push({ name: "🎄 С наступающим Новым годом!!! 🎉", isExtra: true });
    }

    const birthdays = getBirthdays();
    birthdays.forEach(birthday => {
        if (birthday.month === month && birthday.day === day) {
            extraHolidays.push({ name: `🎂 День рождения: ${birthday.name}!`, isExtra: true });
        }
    });

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

async function initApp() {
    updateTeamName();
    subscribe(SETTING_TEAM_NAME, updateTeamName);

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
}

document.addEventListener('DOMContentLoaded', initApp);
