import axios from "axios";
import axiosRetry from "axios-retry";
import {v4 as uuidv4} from 'uuid';
import logger from './logger.js';

const BASE_URL = process.env.DJANGO_BASE_URL || 'http://localhost:8000/api/';
const TIMEOUT_MS = Number(process.env.AXIOS_TIMEOUT_MS || 8000);
const RETRIES = Number(process.env.AXIOS_RETRIES || 3);

export const http = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT_MS,
});


axiosRetry(http, {
    retries: RETRIES,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        const networkOrIdempotent = axiosRetry.isNetworkOrIdempotentRequestError(error);
        const isTimeout = error.code === 'ECONNABORTED';
        const is5xx = error.response && error.response.status >= 500;
        return networkOrIdempotent || isTimeout || is5xx;
    },
});

http.interceptors.request.use((config) => {
    const correlationId = uuidv4();
    config.headers['X-Correlation-Id'] = correlationId;

    if (config.idempotencyKey) {
        config.headers['Idempotency-Key'] = config.idempotencyKey;
    }

    config.metadata = {start: Date.now(), correlationId};

    logger.info({
        type: 'http_request',
        method: config.method?.toUpperCase(),
        url: `${config.baseURL || ''}${config.url}`,
        timeout_ms: config.timeout,
        correlation_id: correlationId
    }, 'HTTP request started');

    return config;
});

http.interceptors.response.use((response) => {
    const {config, status} = response;
    const duration = Date.now() - (config.metadata?.start || Date.now());

    logger.info({
        type: 'http_response',
        method: config.method?.toUpperCase(),
        url: `${config.baseURL || ''}${config.url}`,
        status,
        duration_ms: duration,
        correlation_id: config.metadata?.correlationId
    }, 'HTTP request completed');

    return response;
}, (error) => {
    const config = error.config || {};
    const duration = Date.now() - (config.metadata?.start || Date.now());
    const status = error.response?.status;

    const safeHeaders = {...(config.headers || {})};
    if (safeHeaders.Authorization) safeHeaders.Authorization = 'REDACTED';

    logger.error({
        type: 'http_error',
        method: config.method?.toUpperCase(),
        url: config.baseURL ? `${config.baseURL}${config.url}` : config.url,
        status,
        code: error.code,
        error_data: error,
        duration_ms: duration,
        correlation_id: config.metadata?.correlationId,
        headers: safeHeaders,
    }, 'HTTP request failed');

    return Promise.reject(error);
});

export function dailyKey(prefix) {
    const d = new Date().toISOString().slice(0, 10);
    return `${prefix}-${d}`;
}

export const AbortController = globalThis.AbortController;

