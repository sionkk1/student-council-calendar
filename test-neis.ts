import { fetchNeisSchedule } from './lib/neis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    try {
        const events = await fetchNeisSchedule('2026');
        console.log(`Fetched ${events.length} events for 2026`);
        if (events.length > 0) {
            console.log(events[0]);
        }
    } catch (err) {
        console.error(err);
    }
}
run();
