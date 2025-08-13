import Flare from '../src';

export type TestEvents = {
    USER_LOGGED_IN: { userId: string };
    USER_LOGGED_OUT: undefined;
    NOTIFICATION_RECEIVED: {
        message: string;
        severity: 'info' | 'warning' | 'error';
    };
};

const flare = new Flare<TestEvents>();

test('basic', () => {
    flare.catch('USER_LOGGED_IN', (payload) => {
        expect(payload).toEqual({ userId: '123' });
    });

    flare.fire('USER_LOGGED_IN', { userId: '123' });
});
