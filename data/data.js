const vipNames = [
    "Алексей", "Станислав", "Юрий", "Олег", "Леонид", "Николай", "Дарья", "Антон"
];

const birthdays = [
    { name: "Лёша", day: 23, month: 2 },
    { name: "Олег", day: 16, month: 0 },
    { name: "Стас", day: 21, month: 9 },
    { name: "Юра", day: 21, month: 8 },
    { name: "Лёня", day: 30, month: 5 },
    { name: "Коля", day: 21, month: 7 },
    { name: "Даша", day: 18, month: 9 },
    { name: "Антон", day: 9, month: 5 },
];

function isVipName(text) {
    return vipNames.includes(text);
}

const weatherCities = [
    {
        displayName: "Познань",
        lat: 52.4064,
        lon: 16.9252,
        bgImage: "images/cities/poznan-bg.jpg"
    },
    {
        displayName: "Минск",
        lat: 53.9006,
        lon: 27.5590,
        bgImage: "images/cities/minsk-bg.jpg"
    },
    {
        displayName: "Омск",
        lat: 54.9737,
        lon: 73.4005,
        bgImage: "images/cities/omsk-bg.jpg"
    }
];

function getWeatherCities() {
    return weatherCities;
}

// Коды погоды Open-Meteo: https://open-meteo.com/en/docs
const weatherCodes = {
    0: '☀️',      // Clear sky
    1: '🌤️',     // Mainly clear
    2: '⛅',     // Partly cloudy
    3: '☁️',     // Overcast
    45: '🌫️',   // Fog
    48: '🌫️',   // Depositing rime fog
    51: '🌦️',   // Light drizzle
    53: '🌦️',   // Moderate drizzle
    55: '🌧️',   // Dense drizzle
    61: '🌧️',   // Slight rain
    63: '🌧️',   // Moderate rain
    65: '🌧️',   // Heavy rain
    71: '🌨️',   // Slight snow
    73: '🌨️',   // Moderate snow
    75: '❄️',    // Heavy snow
    77: '🌨️',   // Snow grains
    80: '🌦️',   // Slight rain showers
    81: '🌧️',   // Moderate rain showers
    82: '⛈️',    // Violent rain showers
    85: '🌨️',   // Slight snow showers
    86: '❄️',    // Heavy snow showers
    95: '⛈️',    // Thunderstorm
    96: '⛈️',    // Thunderstorm with slight hail
    99: '⛈️'     // Thunderstorm with heavy hail
};

function getWeatherEmoji(code) {
    return weatherCodes[code] || '🌡️';
}

function getBirthdays() {
    return birthdays;
}

export { isVipName, getWeatherCities, getWeatherEmoji, getBirthdays };
