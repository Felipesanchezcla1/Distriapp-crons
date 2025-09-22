import logger from '../libs/logger.js';
import {http, dailyKey, AbortController} from '../libs/httpClient.js';

const ENDPOINT = 'cdi/pedido/inactivacionAutomaticaPedidos/';

export const inactivacionAutomaticaPedidos = async () => {
    const controller = new AbortController();
    const HARD_TIMEOUT_MS = Number(process.env.HARD_TIMEOUT_MS || 15000);
    const hardTimeout = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);
    const idempotencyKey = dailyKey('inactivacion-pedidos');

    try {
        logger.info('Iniciando inactivación de pedidos');

        const response = await http.post(ENDPOINT, {}, {signal: controller.signal, idempotencyKey});

        logger.info({
            endpoint: ENDPOINT,
            status: response.status,
            result_sample: response.data
        }, 'Proceso de inactivacion de pedidos finalizado');

        return response.data;
    } catch (error) {
        logger.error({
            endpoint: ENDPOINT,
            reason: error.message,
            aborted: error.name === 'AbortError'
        }, 'Proceso de inactivación fallo');

        throw error;
    } finally {
        clearTimeout(hardTimeout);
    }
};