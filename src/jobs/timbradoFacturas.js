import logger from '../libs/logger.js';
import {http, dailyKey, AbortController} from '../libs/httpClient.js';
import {loginAndGetDjangoApp} from "../utils/Auth.js";

const ENDPOINT = 'cdi/factura/timbrarFacturas/';

export const timbrarFacturasAlegra = async () => {
    const controller = new AbortController();
    const HARD_TIMEOUT_MS = Number(process.env.HARD_TIMEOUT_MS || 15000);
    const hardTimeout = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);
    const idempotencyKey = dailyKey('timbrado-facturas');
    const userNameFact = process.env.USERNAME_TIMBRADO;
    const passwordFact = process.env.PASSWORD_TIMBRADO;
    console.log(userNameFact, passwordFact)
    if (!userNameFact || !passwordFact) {
        logger.error('No se encuentran las credenciales para timbrar facturas');
        return;
    }
    try {
        logger.info('Iniciando timbrado de facturas');
        const token = await loginAndGetDjangoApp(userNameFact, passwordFact);
        if (!token) {
            logger.error('No se pudo obtener el token para timbrar facturas');
            return;
        }
        const config = {
            signal: controller.signal,
            idempotencyKey,
            headers: {Authorization: `Token ${token}`}
        }


        const response = await http.post(ENDPOINT, {}, config);

        logger.info({
            endpoint: ENDPOINT,
            status: response.status,
            result_sample: response.data,
        }, 'Proceso de timbrado de facturas finalizado');

        return response.data;
    } catch (error) {
        logger.error({
            endpoint: ENDPOINT,
            reason: error?.response?.data?.msg || error.message,
            aborted: error.name === 'AbortError'
        }, 'Proceso de inactivación fallo');

        throw error;
    } finally {
        clearTimeout(hardTimeout);
    }
};