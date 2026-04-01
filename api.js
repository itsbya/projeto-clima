/**
 * @fileoverview SkyCast - Motor de Previsão e Inteligência Climática.
 * Este arquivo gerencia a integração com a Open-Meteo API, implementa cache local
 * para otimização de performance e manipula o DOM para atualizações dinâmicas.
 * 
 * @author SkyCast Engineering Team
 * @version 2.1.0
 */

/**
 * @constant {Object} WEATHER_DICTIONARY
 * @description Mapeamento de códigos WMO para descrições amigáveis e ícones do Weather Icons.
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

/** @constant {number} CACHE_EXPIRATION_MS Tempo de vida do cache (30 minutos) */
const CACHE_EXPIRATION_MS = 30 * 60 * 1000;

/**
 * Gerencia o armazenamento persistente local para evitar requisições redundantes à API.
 * 
 * @namespace CacheService
 */
const CacheService = {
    /**
     * Salva os dados no LocalStorage com um timestamp de expiração.
     * @param {string} key - Identificador único (nome da cidade).
     * @param {Object} data - Objeto de dados meteorológicos.
     */
    set: (key, data) => {
        const entry = { timestamp: Date.now(), data };
        localStorage.setItem(`weather_${key.toLowerCase()}`, JSON.stringify(entry));
    },

    /**
     * Recupera dados do cache se forem válidos e não expirados.
     * @param {string} key - Identificador único da cidade.
     * @returns {Object|null} Retorna os dados ou null se expirado/inexistente.
     */
    get: (key) => {
        const raw = localStorage.getItem(`weather_${key.toLowerCase()}`);
        if (!raw) return null;
        try {
            const entry = JSON.parse(raw);
            if (Date.now() - entry.timestamp > CACHE_EXPIRATION_MS) {
                localStorage.removeItem(`weather_${key.toLowerCase()}`);
                return null;
            }
            return entry.data;
        } catch (e) {
            return null;
        }
    }
};

/**
 * Orquestra a busca de coordenadas e dados climáticos de uma localização.
 * Implementa estratégia de Cache-First para otimização de banda.
 *
 * @async
 * @param {string} cityName - Termo de busca fornecido pelo usuário.
 * @returns {Promise<Object>} Dados formatados prontos para a UI.
 * @throws {Error} Se a cidade não for encontrada ou houver falha crítica na API.
 */
export async function fetchSkyData(cityName) {
    if (!cityName || typeof cityName !== 'string') throw new Error('INVALID_INPUT');

    const cached = CacheService.get(cityName);
    if (cached) return cached;

    try {
        // Passo 1: Geocoding (Conversão de Nome -> Coordenadas e Detalhes)
        const geoUri = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`;
        const geoRes = await fetch(geoUri);
        if (!geoRes.ok) throw new Error(`GEO_ERROR_${geoRes.status}`);
        
        const geoData = await geoRes.json();
        if (!geoData.results?.length) throw new Error('NOT_FOUND');

        const { latitude, longitude, name, country, admin1, admin2 } = geoData.results[0];
        
        // Constrói string de localização rica (Ex: Bairro, Cidade, Estado - País)
        // Otimizado para evitar redundância caso name e admin2 sejam iguais
        const locationParts = [admin2, name, admin1].filter((val, idx, arr) => val && arr.indexOf(val) === idx);
        const fullLocation = locationParts.join(', ') + ` - ${country}`;

        // Passo 2: Forecast (Busca de dados em tempo real)
        const weatherUri = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,is_day,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
        const weatherRes = await fetch(weatherUri);
        if (!weatherRes.ok) throw new Error(`WEATHER_ERROR_${weatherRes.status}`);

        const weatherData = await weatherRes.json();
        const formatted = formatWeatherData(weatherData, fullLocation);
        
        CacheService.set(cityName, formatted);
        return formatted;
    } catch (error) {
        console.error('[Engine] Falha na orquestração:', error.message);
        throw error;
    }
}

/**
 * Converte a resposta bruta da API para o modelo canônico da aplicação.
 * 
 * @private
 * @param {Object} raw - Dados brutos do Open-Meteo.
 * @param {string} locationString - Nome formatado da localidade.
 * @returns {Object} DTO (Data Transfer Object) para a interface.
 */
function formatWeatherData(raw, locationString) {
    const current = raw.current;
    const info = WEATHER_DICTIONARY[current.weather_code] || { desc: 'Instável', iconDay: 'wi-day-cloudy' };
    const isDay = current.is_day === 1;

    const forecast = (raw.daily.time || []).slice(1, 6).map((time, i) => {
        const code = raw.daily.weather_code[i+1];
        const dayInfo = WEATHER_DICTIONARY[code] || { desc: 'Instável', iconDay: 'wi-day-cloudy' };
        const dateObj = new Date(time + 'T00:00:00');
        const dayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(dateObj);
        
        return {
            day: dayLabel.toUpperCase().replace('.', ''),
            high: Math.round(raw.daily.temperature_2m_max[i+1]),
            low: Math.round(raw.daily.temperature_2m_min[i+1]),
            icon: `wi ${dayInfo.iconDay}`
        };
    });

    return {
        temp: Math.round(current.temperature_2m),
        high: Math.round(raw.daily.temperature_2m_max[0]),
        low: Math.round(raw.daily.temperature_2m_min[0]),
        humidity: current.relative_humidity_2m,
        rain: current.precipitation,
        wind: Math.round(current.wind_speed_10m),
        location: locationString,
        status: info.desc,
        icon: `wi ${isDay ? info.iconDay : (info.iconNight || info.iconDay)}`,
        nightMode: !isDay,
        date: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date()),
        forecast
    };
}

/** 
 * Inicialização semântica da aplicação.
 */
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initApp);
}

/**
 * Inicializa a aplicação configurando todos os listeners e eventos interativos.
 */
function initApp() {
    const form = document.getElementById('form-city-query');
    const input = document.getElementById('input-city-name');
    const btnSearch = document.getElementById('btn-execute-search');

    if (!form || !input || !btnSearch) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = input.value.trim();
        if (!city) return;

        btnSearch.textContent = 'PROCESSANDO...';
        btnSearch.disabled = true;
        document.getElementById('feedback-error')?.classList.add('ui-alert--hidden');

        try {
            const data = await fetchSkyData(city);
            updateUI(data);
        } catch (err) {
            document.getElementById('feedback-error')?.classList.remove('ui-alert--hidden');
        } finally {
            btnSearch.textContent = 'BUSCAR';
            btnSearch.disabled = false;
        }
    });

    document.getElementById('btn-return-home')?.addEventListener('click', () => {
        document.getElementById('view-results')?.classList.add('app-card--hidden');
        document.getElementById('view-search')?.classList.remove('app-card--hidden');
        document.getElementById('view-root')?.classList.remove('night-mode');
        input.value = '';
    });
}

/**
 * Atualiza os elementos reativos do DOM com novos dados climáticos.
 * 
 * @param {Object} data - Objeto formatado retornado por fetchSkyData.
 */
function updateUI(data) {
    const setT = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setT('label-temp-now', data.temp);
    setT('label-city-full', data.location);
    setT('label-weather-desc', data.status);
    setT('label-current-date', data.date);
    
    const weatherIcon = document.getElementById('icon-weather-state');
    if (weatherIcon) weatherIcon.className = data.icon;

    setT('val-temp-max', `${data.high}º`);
    setT('val-temp-min', `${data.low}º`);
    setT('val-humidity', `${data.humidity}%`);
    setT('val-wind', `${data.wind} km/h`);
    setT('val-precip', `${data.rain} mm`);
    
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

    const viewRoot = document.getElementById('view-root');
    if (viewRoot) {
        data.nightMode ? viewRoot.classList.add('night-mode') : viewRoot.classList.remove('night-mode');
    }

    document.getElementById('view-search')?.classList.add('app-card--hidden');
    document.getElementById('view-results')?.classList.remove('app-card--hidden');
}
