/**
 * @fileoverview SkyCast - API e Motor de Previsão do Tempo
 * Este arquivo lida com as requisições para a API Open-Meteo e manipula as atualizações do DOM para exibir os dados meteorológicos.
 */

/**
 * @constant {Object} WEATHER_DICTIONARY
 * @description Dicionário de mapeamento de códigos WMO da API Open-Meteo para descrições legíveis e classes de ícones.
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

/**
 * Busca os dados meteorológicos atuais e diários de uma cidade específica.
 *
 * @async
 * @param {string} cityName - O nome da cidade a ser buscada.
 * @returns {Promise<Object>} Um objeto contendo os dados meteorológicos formatados.
 * @throws {Error} Se o input for inválido, a cidade não for encontrada ou houver falha na rede.
 * @example
 * const dados = await fetchSkyData('São Paulo');
 * console.log(dados.temp); // Retorna a temperatura atual
 */
export async function fetchSkyData(cityName) {
    if (!cityName || typeof cityName !== 'string') {
        throw new Error('INVALID_INPUT');
    }

    try {
        const geoUri = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`;
        const geoFetch = await fetch(geoUri);
        
        if (!geoFetch.ok) {
            throw new Error(`GEO_API_ERROR: HTTP error ${geoFetch.status}`);
        }

        const geoResult = await geoFetch.json();

        if (!geoResult.results?.length) {
            throw new Error('NOT_FOUND');
        }

        const { latitude, longitude, name, country } = geoResult.results[0];

        const weatherUri = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,is_day,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
        const weatherFetch = await fetch(weatherUri);

        if (!weatherFetch.ok) {
            throw new Error(`WEATHER_API_ERROR: HTTP error ${weatherFetch.status}`);
        }

        const weatherResult = await weatherFetch.json();

        return formatWeatherData(weatherResult, name, country);
    } catch (error) {
        // O erro é propagado para ser tratado na camada de interface
        throw error;
    }
}

/**
 * Formata os dados brutos recebidos da API de clima para um formato amigável à interface.
 *
 * @param {Object} raw - Dados brutos retornados pela API Open-Meteo.
 * @param {string} city - Nome da cidade validado.
 * @param {string} country - País de origem da cidade.
 * @returns {Object} Objeto contendo dados meteorológicos como temperatura `temp`, `humidity`, `date` etc.
 */
function formatWeatherData(raw, city, country) {
    const current = raw.current;
    const isDay = current.is_day === 1;
    const info = WEATHER_DICTIONARY[current.weather_code] || { desc: 'Instável', iconDay: 'wi-day-cloudy', iconNight: 'wi-night-alt-cloudy' };

    const forecast = [];
    if (raw.daily && raw.daily.time) {
        for (let i = 1; i <= 5; i++) {
            if (raw.daily.time[i]) {
                const code = raw.daily.weather_code[i];
                const dayInfo = WEATHER_DICTIONARY[code] || { desc: 'Instável', iconDay: 'wi-day-cloudy', iconNight: 'wi-night-alt-cloudy' };
                const dateObj = new Date(raw.daily.time[i] + 'T00:00:00');
                const dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(dateObj).toUpperCase().replace('.', '');
                
                forecast.push({
                    day: dayName,
                    high: Math.round(raw.daily.temperature_2m_max[i]),
                    low: Math.round(raw.daily.temperature_2m_min[i]),
                    icon: `wi ${dayInfo.iconDay}`
                });
            }
        }
    }

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
        date: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date()),
        forecast
    };
}

// Inicialização da Interface
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initApp);
}

/**
 * Inicializa a aplicação configurando todos os listeners e eventos interativos.
 * É executado quando o DOM é carregado.
 */
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

/**
 * Atualiza a interface (DOM) exibindo os dados meteorológicos na tela.
 * Altera estado de visibilidade de componentes e o modo noturno, se aplicável.
 *
 * @param {Object} data - Objeto formatado de dados meteorológicos retornado por `formatWeatherData`.
 */
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
    
    const forecastContainer = document.getElementById('forecast-container');
    if (forecastContainer) {
        forecastContainer.innerHTML = '';
        data.forecast.forEach(item => {
            const el = document.createElement('div');
            el.className = 'forecast-item';
            el.innerHTML = `
                <span class="forecast-item__day">${item.day}</span>
                <i class="${item.icon}"></i>
                <div class="forecast-item__temps">
                    <span class="high">${item.high}º</span>
                    <span class="low">${item.low}º</span>
                </div>
            `;
            forecastContainer.appendChild(el);
        });
    }

    const body = document.getElementById('view-root');
    data.nightMode ? body.classList.add('night-mode') : body.classList.remove('night-mode');

    document.getElementById('view-search').classList.add('app-card--hidden');
    document.getElementById('view-results').classList.remove('app-card--hidden');
}