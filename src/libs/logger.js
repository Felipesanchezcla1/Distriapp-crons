import pino from 'pino';
import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.tz.setDefault('America/Bogota')
const destination = process.env.LOG_FILE_PATH; // "/app/logs/app.log"
let logger;
const options = {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: () => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        return `,"time":"${now}"`;
    },
    base: null
};
if (destination) {
    const transport = pino.transport({
        targets: [
            {target: 'pino/file', options: {destination}}
        ]
    });
    logger = pino(options, transport);
} else {
    logger = pino(options);
}

export default logger;