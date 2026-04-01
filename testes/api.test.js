import { fetchWeather } from '../api.js';

// 1. Mock do Fetch Global
global.fetch = jest.fn();

describe('SkyCast - Weather Engine Tests', () => {

    beforeEach(() => {
        fetch.mockClear();
    });

    test('Deve retornar dados meteorológicos para uma cidade válida', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ current_weather: { temperature: 25, weathercode: 0 } })
        });

        const data = await fetchWeather('Rio de Janeiro');
        expect(data.temperature).toBe(25);
    });

    test('Deve lançar erro para entrada vazia', async () => {
        await expect(fetchWeather('')).rejects.toThrow('Entrada inválida');
    });

    test('Deve tratar erro de limite de requisições (429)', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 429
        });

        await expect(fetchWeather('London')).rejects.toThrow('Limite excedido');
    });

    test('Deve lidar com mudança inesperada no formato do JSON', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ dado_errado: {} }) // Simula API mudando o nome das chaves
        });

        await expect(fetchWeather('Paris')).rejects.toThrow('Erro no formato dos dados');
    });
});