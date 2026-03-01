import {http, dailyKey, AbortController} from '../libs/httpClient.js';
import logger from "../libs/logger.js";

const ENDPOINT = 'login/';

export const loginAndGetDjangoApp = async (userName, password) => {
    const controller = new AbortController();
    const HARD_TIMEOUT_MS = Number(process.env.HARD_TIMEOUT_MS || 15000);
    const hardTimeout = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);
    const idempotencyKey = dailyKey('login');
    try {
        logger.info('Enviando solicitud de inicio de sesión')
        const data = {
            cerrar_sesion: true,
            password: password,
            username: userName
        }
        const response = await http.post(ENDPOINT, data, {signal: controller.signal, idempotencyKey})
        logger.info({
            endpoint: ENDPOINT,
            status: response.status,
            result_sample: response.data
        }, 'Inicio de sesión finalizado');
        if (response.data.hasOwnProperty("access_token")) {
            return response.data.access_token
        }
        return null
    } catch (error) {
        logger.error({
            endpoint: ENDPOINT,
            reason: error.message,
            aborted: error.name === 'AbortError'
        }, 'Proceso de inicio de sesión fallido');

        return null
    } finally {
        clearTimeout(hardTimeout);
    }
}