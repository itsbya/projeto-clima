/**
 * SkyCast - Weather Engine
 */

const WEATHER_DICTIONARY = {
    0: { desc: 'Céu limpo', iconDay: 'wi-day-sunny', iconNight: 'wi-night-clear' },
    1: { desc: 'Principalmente limpo', iconDay: 'wi-day-cloudy', iconNight: 'wi-night-alt-cloudy' },
    2: { desc: 'Parcialmente nublado', iconDay: 'wi-day-cloudy', iconNight: 'wi-night-alt-cloudy' },
    3: { desc: 'Nublado', iconDay: 'wi-cloudy', iconNight: 'wi-cloudy' },
    45: { desc: 'Nevoeiro', iconDay: 'wi-day-fog', iconNight: 'wi-night-fog' },
    51: { desc: 'Drizzle leve', iconDay: 'wi-day-showers', iconNight: 'wi-night-alt-showers' },
    61: { desc: 'Chuva leve', iconDay: 'wi-day-rain', iconNight: 'wi-night-alt-rain' },
    80: { desc: 'Pancadas de chuva', iconDay: 'wi-day-showers', iconNight: 'wi-night-alt-showers' },
    95: { desc: 'Tempestade', iconDay: 'wi-day-thunderstorm', iconNight: 'wi-night-alt-thunderstorm' }
};

export async function fetchSkyData(cityName) {
    const geoUri = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`;
    const geoFetch = await fetch(geoUri);
    const geoResult = await geoFetch.json();

    if (!geoResult.results?.length) throw new Error('NOT_FOUND');

    const { latitude, longitude, name, country } = geoResult.results[0];

    const weatherUri = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,is_day,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const weatherFetch = await fetch(weatherUri);
    const weatherResult = await weatherFetch.json();

    return formatWeatherData(weatherResult, name, country);
}

function formatWeatherData(raw, city, country) {
    const current = raw.current;
    const isDay = current.is_day === 1;
    const info = WEATHER_DICTIONARY[current.weather_code] || { desc: 'Instável', iconDay: 'wi-day-cloudy', iconNight: 'wi-night-alt-cloudy' };

    return {
        temp: Math.round(current.temperature_2m),
        high: Math.round(raw.daily.temperature_2m_max[0]),
        low: Math.round(raw.daily.temperature_2m_min[0]),
        humidity: current.relative_humidity_2m,
        rain: current.precipitation,
        wind: Math.round(current.wind_speed_10m),
        location: `${city}, ${country}`,
        status: info.desc,
        icon: `wi ${isDay ? info.iconDay : info.iconNight}`,
        nightMode: !isDay,
        date: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())
    };
}

// Inicialização da Interface
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initApp);
}

function initApp() {
    const form = document.getElementById('form-city-query');
    const input = document.getElementById('input-city-name');
    const btnSearch = document.getElementById('btn-execute-search');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = input.value.trim();
        
        btnSearch.textContent = 'BUSCANDO...';
        btnSearch.disabled = true;
        document.getElementById('feedback-error').classList.add('ui-alert--hidden');

        try {
            const data = await fetchSkyData(city);
            updateUI(data);
        } catch (err) {
            document.getElementById('feedback-error').classList.remove('ui-alert--hidden');
        } finally {
            btnSearch.textContent = 'BUSCAR';
            btnSearch.disabled = false;
        }
    });

    document.getElementById('btn-return-home').addEventListener('click', () => {
        document.getElementById('view-results').classList.add('app-card--hidden');
        document.getElementById('view-search').classList.remove('app-card--hidden');
        document.getElementById('view-root').classList.remove('night-mode');
        input.value = '';
    });
}

function updateUI(data) {
    document.getElementById('label-temp-now').textContent = data.temp;
    document.getElementById('label-city-full').textContent = data.location;
    document.getElementById('label-weather-desc').textContent = data.status;
    document.getElementById('label-current-date').textContent = data.date;
    document.getElementById('icon-weather-state').className = data.icon;
    document.getElementById('val-temp-max').textContent = `${data.high}º`;
    document.getElementById('val-temp-min').textContent = `${data.low}º`;
    document.getElementById('val-humidity').textContent = `${data.humidity}%`;
    document.getElementById('val-wind').textContent = `${data.wind} km/h`;
    document.getElementById('val-precip').textContent = `${data.rain} mm`;
    
    const body = document.getElementById('view-root');
    data.nightMode ? body.classList.add('night-mode') : body.classList.remove('night-mode');

    document.getElementById('view-search').classList.add('app-card--hidden');
    document.getElementById('view-results').classList.remove('app-card--hidden');
}