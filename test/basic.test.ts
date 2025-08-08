import Flare, { flare } from '../src';

const EVENT_NAME = 'EVENT_NAME';
const PAYLOAD = 'PAYLOAD';

test('basic', () => {
    flare.catch(EVENT_NAME, (p) => {
        expect(p).toBe(PAYLOAD);
    });

    flare.fire(EVENT_NAME, PAYLOAD);
});
