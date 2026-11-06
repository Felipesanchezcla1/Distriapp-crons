export function describirErrorHttp(err, objetoPuro = false) {
    if (!err?.isAxiosError) return err?.stack ?? String(err);

    const {config = {}, response} = err;
    const metodo = config.method?.toUpperCase() ?? '?';
    const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
    const correlationId = config.headers?.['X-Correlation-Id'];
    const prefijo = `${metodo} ${url}${correlationId ? ` [cid ${correlationId}]` : ''}`;

    if (!response) return `${prefijo} sin respuesta: ${err.code ?? ''} ${err.message}`;

    if (objetoPuro) {
        return response.data;
    } else {
        const cuerpo = typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data);

        return `${prefijo} -> ${response.status} ${cuerpo?.slice(0, 1000)}`;
    }

}