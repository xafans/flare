import Flare, { flare } from '../src';

const EVENT_NAME = 'EVENT_NAME';
const PAYLOAD = 'PAYLOAD';

export type TestEvents = {
    USER_LOGGED_IN: { userId: string };
    USER_LOGGED_OUT: undefined;
    NOTIFICATION_RECEIVED: {
        message: string;
        severity: 'info' | 'warning' | 'error';
    };
};

test('basic', () => {
    flare.catch(EVENT_NAME, (p) => {
        expect(p).toBe(PAYLOAD);
    });

    flare.fire(EVENT_NAME, PAYLOAD);
});

test('event type', () => {
    const flare = new Flare<TestEvents>();
    flare.catch('USER_LOGGED_IN', (payload) => {
        expect(payload).toEqual({ userId: '123' });
    });

    flare.fire('USER_LOGGED_IN', { userId: '123' });
});
