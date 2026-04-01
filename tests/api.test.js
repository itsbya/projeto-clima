import { jest } from '@jest/globals';
import { fetchSkyData } from '../api.js';

// Setup mock for global fetch
global.fetch = jest.fn();

describe('Testes Básicos da API de Clima', () => {
    beforeEach(() => {
        // Limpa os mocks antes de cada teste
        jest.clearAllMocks();
    });

    test('1. Nome de cidade válido retorna dados meteorológicos.', async () => {
        // Mock API de geolocalização e API de clima
        global.fetch
            .mockResolvedValueOnce({
                json: async () => ({
                    results: [{ latitude: -23.55, longitude: -46.63, name: 'São Paulo', country: 'Brazil' }]
                })
            })
            .mockResolvedValueOnce({
                json: async () => ({
                    current: {
                        is_day: 1,
                        weather_code: 0,
                        temperature_2m: 25.4,
                        relative_humidity_2m: 60,
                        precipitation: 0,
                        wind_speed_10m: 10
                    },
                    daily: {
                        temperature_2m_max: [30],
                        temperature_2m_min: [20]
                    }
                })
            });

        const result = await fetchSkyData('São Paulo');

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result).toMatchObject({
            temp: 25,
            high: 30,
            low: 20,
            location: 'São Paulo, Brazil',
            status: 'Céu limpo'
        });
    });

    test('2. Nome de cidade inexistente lança exceção tratada.', async () => {
        // Mock API de geolocalização retornando vazio
        global.fetch.mockResolvedValueOnce({
            json: async () => ({
                results: []
            })
        });

        await expect(fetchSkyData('CidadeInvalida')).rejects.toThrow('NOT_FOUND');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('3. Entrada vazia retorna erro de validação.', async () => {
        global.fetch.mockResolvedValueOnce({
            json: async () => ({
                error: true,
                reason: "name must be set"
            })
        });

        await expect(fetchSkyData('')).rejects.toThrow('NOT_FOUND');
    });

    test('4. Falha da API gera resposta adequada (timeout ou erro).', async () => {
        // Simulando um erro de rede no fetch inicial
        global.fetch.mockRejectedValueOnce(new Error('Network response was not ok'));

        await expect(fetchSkyData('Curitiba')).rejects.toThrow('Network response was not ok');
    });
});

describe('Casos Extremos da API de Clima', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Limite de requisições da API excedido.', async () => {
        // Simulação de retorno da geocoding API com limite de requisições
        global.fetch.mockResolvedValueOnce({
            json: async () => ({
                error: true,
                reason: "Daily API call limit exceeded."
            })
        });

        await expect(fetchSkyData('Paris')).rejects.toThrow('NOT_FOUND');
    });

    test('Conexão de rede lenta/instável.', async () => {
        // Simular lentidão rejeitando após um pequeno delay
        global.fetch.mockImplementationOnce(() => 
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout da requisição')), 100))
        );

        await expect(fetchSkyData('Londres')).rejects.toThrow('Timeout da requisição');
    });

    test('Mudança inesperada no formato da resposta JSON.', async () => {
        // Simulação em que a API retorna JSON inválido (o campo "current" está faltando)
        global.fetch
            .mockResolvedValueOnce({
                json: async () => ({
                    results: [{ latitude: 1, longitude: 1, name: 'Roma', country: 'Italy' }]
                })
            })
            .mockResolvedValueOnce({
                json: async () => ({
                    // Falta "current" para causar  erro no "formatWeatherData"
                    daily_data: {}
                })
            });

        // Espera-se que a função dispare um erro manipulando dados formatados incorretamente (TypeError)
        await expect(fetchSkyData('Roma')).rejects.toThrow(TypeError);
    });
});
