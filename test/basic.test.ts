import Flare, { flare } from '../src';

test('basic', () => {
    const PAYLOAD = 'PAYLOAD';
    const EVENT_NAME = 'EVENT_NAME';

    flare.catch(EVENT_NAME, (p) => {
        expect(p).toBe(PAYLOAD);
    });

    flare.fire(EVENT_NAME, PAYLOAD);
});

// ==================== custom event type ====================

type TestEvents = {
    TEST_EVENT: { testId: string };
};

const TEST_PAYLOAD = { testId: '123' };
const TEST_EVENT_NAME: keyof TestEvents = 'TEST_EVENT';

test('event type', () => {
    const flare = new Flare<TestEvents>();

    flare.catch(TEST_EVENT_NAME, (payload) => {
        expect(payload).toEqual(TEST_PAYLOAD);
    });

    flare.fire(TEST_EVENT_NAME, TEST_PAYLOAD);
});
