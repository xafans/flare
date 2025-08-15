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

test('event type', () => {
    const flare = new Flare<TestEvents>();

    flare.catch('TEST_EVENT', (payload) => {
        expect(payload).toEqual({ testId: '123' });
    });

    flare.fire('TEST_EVENT', { testId: '123' });
});
