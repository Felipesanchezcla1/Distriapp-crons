import cron from 'node-cron';
import {inactivacionAutomaticaPedidos} from "./jobs/inactivacionAutomaticaPedidos.js";
import {timbrarFacturasAlegra} from "./jobs/timbradoFacturas.js";

const TZ = 'America/Bogota';

cron.schedule('0 */11 * * *', async () => {
    try {
        await inactivacionAutomaticaPedidos();
    } catch {
    }
}, {timezone: TZ});

// cron.schedule('*/5 * * * *', async () => {
//     try {
//         await timbrarFacturasAlegra();
//     } catch {
//     }
// }, {timezone: TZ});
console.log('iniciando cron')