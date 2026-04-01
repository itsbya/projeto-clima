/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { fetchSkyData } from '../api.js';

// Setup mock for global fetch
global.fetch = jest.fn();

describe('Testes de Engenharia - SkyCast Engine', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    test('1. Fluxo completo de busca com geocoding enriquecido.', async () => {
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: [{ 
                        latitude: -23.55, 
                        longitude: -46.63, 
                        name: 'São Paulo', 
                        country: 'Brasil',
                        admin1: 'Estado de São Paulo',
                        admin2: 'Sampa'
                    }]
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

        expect(result.temp).toBe(25);
        expect(result.location).toContain('São Paulo');
        expect(result.location).toContain('Brasil');
        expect(result.status).toBe('Céu limpo');
        
        // Verifica se salvou no cache
        expect(localStorage.getItem('weather_são paulo')).not.toBeNull();
    });

    test('2. Validação de Cache (Cache-First).', async () => {
        const fakeData = { temp: 99, location: 'Cache City' };
        localStorage.setItem('weather_testecity', JSON.stringify({
            timestamp: Date.now(),
            data: fakeData
        }));

        const result = await fetchSkyData('TesteCity');
        
        expect(result).toEqual(fakeData);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('3. Tratamento de Erro: Cidade não encontrada.', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [] })
        });

        await expect(fetchSkyData('Atlantida')).rejects.toThrow('NOT_FOUND');
    });

    test('4. Tratamento de Erro: Falha na API Geocoding (429).', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 429
        });

        await expect(fetchSkyData('Paris')).rejects.toThrow('GEO_ERROR_429');
    });

    test('5. Tratamento de Erro: Falha na API Weather (500).', async () => {
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ results: [{ latitude: 1, longitude: 1, name: 'X', country: 'Y' }] })
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 500
            });

        await expect(fetchSkyData('ErroCity')).rejects.toThrow('WEATHER_ERROR_500');
    });
});
