import Flare from '../src';

const EVENT_NAME = 'EVENT_NAME';
const PAYLOAD = 'PAYLOAD';

describe('Flare class', () => {
    let flare: Flare<Record<string, any>>;

    const eventCases: [string, any][] = [
        ['USER_LOGGED_IN', { userId: '123' }],
        ['USER_LOGGED_OUT', undefined],
        [
            'NOTIFICATION_RECEIVED',
            { message: 'Something happened', severity: 'info' },
        ],
    ];

    beforeEach(() => {
        flare = new Flare<Record<string, any>>();
    });

    it.each(eventCases)(
        'calls handler with payload after event %s fires',
        (eventName, payload) => {
            // Arrange
            const handler = jest.fn();
            flare.catch(eventName, handler);

            // Act
            flare.fire(eventName, payload);

            // Assert
            expect(handler).toHaveBeenCalledWith(payload);
        },
    );

    it.each(eventCases)(
        'calls handler only once with once: true option after event %s fires',
        (eventName, payload) => {
            // Arrange
            const handler = jest.fn();
            flare.catch(eventName, handler, { once: true });

            // Act
            flare.fire(eventName, payload);
            flare.fire(eventName, payload);

            // Assert
            expect(handler).toHaveBeenCalledTimes(1);
        },
    );

    it.each(eventCases)(
        'removes handler after calling function from catch for event %s',
        (eventName, payload) => {
            // Arrange
            const handler = jest.fn();
            const release = flare.catch(eventName, handler);

            // Act
            flare.fire(eventName, payload);
            release();
            flare.fire(eventName, payload);

            // Assert
            expect(handler).toHaveBeenCalledTimes(1);
        },
    );

    it.each(eventCases)(
        'calls all registered handlers with payload after event %s fires',
        (eventName, payload) => {
            // Arrange
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            flare.catch(eventName, handler1);
            flare.catch(eventName, handler2);

            // Act
            flare.fire(eventName, payload);

            // Assert
            expect(handler1).toHaveBeenCalledWith(payload);
            expect(handler2).toHaveBeenCalledWith(payload);
        },
    );

    it.each(eventCases)(
        'fires an event with no registered handlers',
        (eventName, payload) => {
            // Arrange
            // (no setup needed)

            // Act & Assert
            expect(() => flare.fire(eventName, payload)).not.toThrow();
        },
    );

    it.each(eventCases)(
        'skips released handler but call others when event fires',
        (eventName, payload) => {
            // Arrange
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            const releaseHandler1 = flare.catch(eventName, handler1);
            flare.catch(eventName, handler2);

            // Act
            releaseHandler1();
            flare.fire(eventName, payload);

            // Assert
            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).toHaveBeenCalledWith(payload);
        },
    );

    it.each(eventCases)(
        'releases a registered handler',
        (eventName, payload) => {
            // Arrange
            const handler = jest.fn();
            flare.catch(eventName, handler);

            // Act
            flare.release(eventName, handler);
            flare.fire(eventName, payload);

            // Assert
            expect(handler).not.toHaveBeenCalled();
        },
    );

    it.each(eventCases)('releases an unregistered handler', (eventName) => {
        // Arrange
        const handler = jest.fn();

        // Act & Assert
        expect(() => flare.release(eventName, handler)).not.toThrow();
    });

    it.each(eventCases)('releases all handlers', (eventName, payload) => {
        // Arrange
        const handler = jest.fn();
        flare.catch(eventName, handler);

        // Act
        flare.releaseAll();
        flare.fire(eventName, payload);

        // Assert
        expect(handler).not.toHaveBeenCalled();
    });
});
