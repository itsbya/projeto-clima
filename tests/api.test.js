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
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: [{ latitude: -23.55, longitude: -46.63, name: 'São Paulo', country: 'Brazil' }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
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
                        time: ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04', '2026-04-05', '2026-04-06'],
                        weather_code: [0, 0, 1, 3, 61, 95],
                        temperature_2m_max: [30, 31, 32, 33, 34, 35],
                        temperature_2m_min: [20, 21, 22, 23, 24, 25]
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
            status: 'Céu limpo',
            forecast: [
                { high: 31, low: 21 },
                { high: 32, low: 22 },
                { high: 33, low: 23 },
                { high: 34, low: 24 },
                { high: 35, low: 25 }
            ]
        });
    });

    test('2. Nome de cidade inexistente lança exceção tratada.', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                results: []
            })
        });

        await expect(fetchSkyData('CidadeInvalida')).rejects.toThrow('NOT_FOUND');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('3. Entrada vazia retorna erro de validação.', async () => {
        await expect(fetchSkyData('')).rejects.toThrow('INVALID_INPUT');
    });

    test('4. Falha da API gera resposta adequada (erro de rede genérico).', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network Error'));

        await expect(fetchSkyData('Curitiba')).rejects.toThrow('Network Error');
    });
});

describe('Casos Extremos da API de Clima', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Limite de requisições da API excedido (erro HTTP 429).', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 429
        });

        await expect(fetchSkyData('Paris')).rejects.toThrow('GEO_API_ERROR: HTTP error 429');
    });

    test('Conexão de rede lenta/instável gerando timeout.', async () => {
        global.fetch.mockImplementationOnce(() => 
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout da requisição')), 50))
        );

        await expect(fetchSkyData('Londres')).rejects.toThrow('Timeout da requisição');
    });

    test('Mudança inesperada no formato da resposta JSON (lança TypeError no formatter).', async () => {
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: [{ latitude: 1, longitude: 1, name: 'Roma', country: 'Italy' }]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    daily_data: {} // Simulando ausência do objeto 'current' esperado
                })
            });

        await expect(fetchSkyData('Roma')).rejects.toThrow(TypeError);
    });
});
