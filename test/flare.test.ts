import Flare from '../src';

describe('Flare class', () => {
    let flare: Flare<Record<string, any>>;

    beforeEach(() => {
        flare = new Flare();
    });

    it('calls the handler with the correct payload when an event is fired after registration', () => {});

    it('calls the handler only once when registered with once: true, and removes it afterward', () => {});

    it('removes the handler when the function returned by catch is called, so it is not called on subsequent events', () => {});

    it('calls all handlers registered for an event with the correct payload when the event is fired', () => {});

    it('does nothing (no errors) when firing an event with no registered handlers', () => {});

    it('prevents a released handler from being called, while leaving other handlers for the event intact', () => {});

    it('does nothing (no errors) when releasing a handler that was never registered', () => {});

    it('does not call any handlers after releaseAll has been called and an event is fired', () => {});
});
