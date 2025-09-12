import cron from 'node-cron';
import {inactivacionAutomaticaPedidos} from "./jobs/inactivacionAutomaticaPedidos.js";
const TZ = 'America/Bogota';

cron.schedule('*/1 * * * *', async () => {
    try { await inactivacionAutomaticaPedidos(); } catch {}
}, { timezone: TZ });
console.log('iniciando cron')