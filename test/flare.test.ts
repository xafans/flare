import Flare from '../src';

const EVENT_NAME = 'EVENT_NAME';
const PAYLOAD = 'PAYLOAD';

describe('Flare class', () => {
    let flare: Flare<Record<string, any>>;

    beforeEach(() => {
        flare = new Flare();
    });

    it('calls the handler with the correct payload when an event is fired after registration', () => {
        // Arrange
        const handler = jest.fn();
        flare.catch(EVENT_NAME, handler);

        // Act
        flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler).toHaveBeenCalledWith(PAYLOAD);
    });

    it('calls the handler only once when registered with once: true, and removes it afterward', () => {
        // Arrange
        const handler = jest.fn();
        flare.catch(EVENT_NAME, handler, { once: true });

        // Act
        flare.fire(EVENT_NAME, PAYLOAD);
        flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('removes the handler when the function returned by catch is called, so it is not called on subsequent events', () => {
        // Arrange
        const handler = jest.fn();
        const release = flare.catch(EVENT_NAME, handler);

        // Act
        flare.fire(EVENT_NAME, PAYLOAD);
        release();
        flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('calls all handlers registered for an event with the correct payload when the event is fired', () => {
        // Arrange
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        flare.catch(EVENT_NAME, handler1);
        flare.catch(EVENT_NAME, handler2);

        // Act
        flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler1).toHaveBeenCalledWith(PAYLOAD);
        expect(handler2).toHaveBeenCalledWith(PAYLOAD);
    });

    it('does nothing (no errors) when firing an event with no registered handlers', () => {
        // Arrange
        // (no setup needed)

        // Act & Assert
        expect(() => flare.fire(EVENT_NAME, PAYLOAD)).not.toThrow();
    });

    it('prevents a released handler from being called, while leaving other handlers for the event intact', () => {
        // Arrange
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        const releaseHandler1 = flare.catch(EVENT_NAME, handler1);
        flare.catch(EVENT_NAME, handler2);

        // Act
        releaseHandler1();
        flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler1).not.toHaveBeenCalled();
        expect(handler2).toHaveBeenCalledWith(PAYLOAD);
    });

    it('does nothing (no errors) when releasing a handler that was never registered', () => {
        // Arrange
        const handler = jest.fn();

        // Act & Assert
        expect(() => flare.release(EVENT_NAME, handler)).not.toThrow();
    });

    it('does not call any handlers after releaseAll has been called and an event is fired', () => {
        // Arrange
        const handler = jest.fn();
        flare.catch(EVENT_NAME, handler);

        // Act
        flare.releaseAll();
        flare.fire(EVENT_NAME, PAYLOAD);

        // Assert
        expect(handler).not.toHaveBeenCalled();
    });
});
