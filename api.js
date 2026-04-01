/**
 * SkyCast - Weather Engine
 * Refatoração focada em modularidade e novos seletores de interface.
 */

// Mapeamento de códigos climáticos (mantido por necessidade técnica)
const WEATHER_DICTIONARY = {
    0: { desc: 'Céu limpo', iconDay: 'wi-day-sunny', iconNight: 'wi-night-clear' },
    3: { desc: 'Nublado', iconDay: 'wi-cloudy', iconNight: 'wi-cloudy' },
    // ... os outros códigos seguem aqui (removidos para brevidade, mantenha os seus originais)
    95: { desc: 'Tempestade', iconDay: 'wi-day-thunderstorm', iconNight: 'wi-night-alt-thunderstorm' }
};

/**
 * Motor de busca de dados climáticos
 */
async function fetchSkyData(cityName) {
    // 1. Geocodificação
    const geoUri = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`;
    const geoFetch = await fetch(geoUri);
    const geoResult = await geoFetch.json();

    if (!geoResult.results?.length) throw new Error('NOT_FOUND');

    const { latitude, longitude, name, country } = geoResult.results[0];

    // 2. Previsão
    const weatherUri = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const weatherFetch = await fetch(weatherUri);
    const weatherResult = await weatherFetch.json();

    return formatWeatherData(weatherResult, name, country);
}

/**
 * Limpeza e formatação dos dados para a UI
 */
function formatWeatherData(raw, city, country) {
    const current = raw.current;
    const isDay = current.is_day === 1;
    const code = current.weather_code;
    const info = WEATHER_DICTIONARY[code] || { desc: 'Desconhecido', iconDay: 'wi-na', iconNight: 'wi-na' };

    return {
        temp: Math.round(current.temperature_2m),
        high: Math.round(raw.daily.temperature_2m_max[0]),
        low: Math.round(raw.daily.temperature_2m_min[0]),
        humidity: current.relative_humidity_2m,
        rain: current.precipitation,
        wind: raw.current.wind_speed_10m || 0, // depende da sua API call
        location: `${city}, ${country}`,
        status: info.desc,
        icon: `wi ${isDay ? info.iconDay : info.iconNight}`,
        nightMode: !isDay,
        date: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())
    };
}

/**
 * Gerenciador de Interface (DOM)
 */
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Seletores
        const nodes = {
            form: document.getElementById('form-city-query'),
            input: document.getElementById('input-city-name'),
            searchView: document.getElementById('view-search'),
            resultsView: document.getElementById('view-results'),
            error: document.getElementById('feedback-error'),
            btnSearch: document.getElementById('btn-execute-search'),
            btnReset: document.getElementById('btn-return-home'),
            body: document.getElementById('view-root'),
            
            // Labels de saída
            temp: document.getElementById('label-temp-now'),
            city: document.getElementById('label-city-full'),
            desc: document.getElementById('label-weather-desc'),
            date: document.getElementById('label-current-date'),
            icon: document.getElementById('icon-weather-state'),
            max: document.getElementById('val-temp-max'),
            min: document.getElementById('val-temp-min'),
            hum: document.getElementById('val-humidity'),
            wind: document.getElementById('val-wind'),
            precip: document.getElementById('val-precip')
        };

        // Evento de Busca
        nodes.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const city = nodes.input.value.trim();
            
            nodes.error.classList.add('ui-alert--hidden');
            nodes.btnSearch.textContent = 'Aguarde...';
            nodes.btnSearch.disabled = true;

            try {
                const data = await fetchSkyData(city);
                updateUI(data);
            } catch (err) {
                nodes.error.classList.remove('ui-alert--hidden');
            } finally {
                nodes.btnSearch.textContent = 'Buscar';
                nodes.btnSearch.disabled = false;
            }
        });

        // Evento de Reset
        nodes.btnReset.addEventListener('click', () => {
            nodes.resultsView.classList.add('app-card--hidden');
            nodes.searchView.classList.remove('app-card--hidden');
            nodes.body.classList.remove('night-mode');
            nodes.input.value = '';
        });

        function updateUI(data) {
            nodes.temp.textContent = data.temp;
            nodes.city.textContent = data.location;
            nodes.desc.textContent = data.status;
            nodes.date.textContent = data.date;
            nodes.icon.className = data.icon;
            nodes.max.textContent = `${data.high}º`;
            nodes.min.textContent = `${data.low}º`;
            nodes.hum.textContent = `${data.humidity}%`;
            nodes.precip.textContent = `${data.rain} mm`;
            
            if (data.nightMode) nodes.body.classList.add('night-mode');
            else nodes.body.classList.remove('night-mode');

            nodes.searchView.classList.add('app-card--hidden');
            nodes.resultsView.classList.remove('app-card--hidden');
        }
    });
}