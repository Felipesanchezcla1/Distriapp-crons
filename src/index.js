import cron from 'node-cron';
import {writeFileSync} from 'node:fs';
import {timbrarFacturasAlegra} from './jobs/timbradoFacturas.js';
import {describirErrorHttp} from "./utils/funciones.js";
// import { inactivacionAutomaticaPedidos } from './jobs/inactivacionAutomaticaPedidos.js';

const TZ = 'America/Bogota';
const enCurso = new Map(); // nombre del job -> promesa en ejecución
const tareas = [];

function latido() {
    try {
        writeFileSync('/tmp/heartbeat', String(Date.now()));
    } catch {
    }
}

function programar(nombre, expresion, job) {
    console.log(`expression de ${nombre}`, expresion)
    const tarea = cron.schedule(expresion, async () => {
        latido();
        if (enCurso.has(nombre)) {
            console.warn(`[${nombre}] la ejecución anterior sigue corriendo, me salto este turno`);
            return;
        }
        const inicio = Date.now();
        const ejecucion = Promise.resolve()
            .then(job)
            .then(() => console.log(`[${nombre}] ok en ${Date.now() - inicio} ms`))
            .catch((err) => console.error(`[${nombre}] error: ${describirErrorHttp(err)}`))
            .finally(() => enCurso.delete(nombre));
        enCurso.set(nombre, ejecucion);
        await ejecucion;
    }, {timezone: TZ});
    tareas.push(tarea);
}

programar('timbrado', process.env.CRON_TIMBRADO ?? '*/5 * * * *', timbrarFacturasAlegra);
// programar('inactivacion', process.env.CRON_INACTIVACION ?? '0 23 * * *', inactivacionAutomaticaPedidos);

let apagando = false;

async function apagar(senal) {
    if (apagando) return;
    apagando = true;
    console.log(`[scheduler] ${senal} recibido: paro las tareas y espero las que estén corriendo...`);
    tareas.forEach((t) => t.stop());
    await Promise.allSettled([...enCurso.values()]);
    console.log('[scheduler] listo, cerrando');
    process.exit(0);
}

process.on('SIGTERM', () => apagar('SIGTERM'));
process.on('SIGINT', () => apagar('SIGINT'));

latido();
console.log('[scheduler] iniciado');