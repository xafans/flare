import Flare from '../src';

const EVENT_NAME = 'EVENT_NAME';
const PAYLOAD = 'PAYLOAD';

describe('Flare class', () => {
    let flare: Flare<Record<string, any>>;

    beforeEach(() => {
        flare = new Flare();
    });

    test('basic fire and catch', () => {
        // Arrange
        const handler = jest.fn();
        flare.catch(EVENT_NAME, handler);

        // Act
        flare.fire(EVENT_NAME, PAYLOAD).then(() => {
            // Assert
            expect(handler).toHaveBeenCalledWith(PAYLOAD);
        });
    });

    test('fires with once: true option', async () => {
        // Arrange
        const handler = jest.fn();
        flare.catch(EVENT_NAME, handler, { once: true });

        // Act
        await flare.fire(EVENT_NAME, PAYLOAD);
        await flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('fires and catch multiple handlers event', async () => {
        // Arrange
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        flare.catch(EVENT_NAME, handler1);
        flare.catch(EVENT_NAME, handler2);

        // Act
        await flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler1).toHaveBeenCalledWith(PAYLOAD);
        expect(handler2).toHaveBeenCalledWith(PAYLOAD);
    });

    test('release', async () => {
        // Arrange
        const handler = jest.fn();
        flare.catch(EVENT_NAME, handler);

        // Act
        flare.release(EVENT_NAME, handler);
        await flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler).not.toHaveBeenCalled();
    });

    test('callback of catch', async () => {
        // Arrange
        const handler = jest.fn();
        const release = flare.catch(EVENT_NAME, handler);

        // Act
        await flare.fire(EVENT_NAME, PAYLOAD);
        release();
        await flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('releaseAll', async () => {
        // Arrange
        const handler = jest.fn();
        flare.catch(EVENT_NAME, handler);

        // Act
        flare.releaseAll();
        await flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler).not.toHaveBeenCalled();
    });

    it('fires an event with no registered handlers and does nothing (no errors)', () => {
        // Arrange
        // (no setup needed)

        // Act & Assert
        expect(async () => await flare.fire(EVENT_NAME, PAYLOAD)).not.toThrow();
    });

    it('skips released handler but call others when event fires', async () => {
        // Arrange
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        const releaseHandler1 = flare.catch(EVENT_NAME, handler1);
        flare.catch(EVENT_NAME, handler2);

        // Act
        releaseHandler1();
        await flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler1).not.toHaveBeenCalled();
        expect(handler2).toHaveBeenCalledWith(PAYLOAD);
    });

    it('releases an unregistered handler and does nothing (no errors)', () => {
        // Arrange
        const handler = jest.fn();

        // Act & Assert
        expect(() => flare.release(EVENT_NAME, handler)).not.toThrow();
    });
});
