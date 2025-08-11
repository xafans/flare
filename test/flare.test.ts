import Flare from '../src';

describe('Flare class', () => {
    let flare: Flare<Record<string, any>>;

    beforeEach(() => {
        flare = new Flare();
    });

    it('When I register a handler for an event, and then fire that event, the handler should be called with the correct payload.', () => {});

    it('When a handler is registered with once: true, it should be called only the first time the event is fired, and automatically removed afterwards.', () => {});

    it('The function returned by catch should remove the handler so that firing the event afterward does not call it anymore.', () => {});

    it('When an event is fired with a payload, all handlers registered for that event should be called with that payload.', () => {});

    it('When an event is fired with no registered handlers, nothing should happen (no errors).', () => {});

    it('Releasing a specific handler should prevent it from being called, but leave other handlers for the same event untouched.', () => {});

    it('Releasing a handler that was never registered should do nothing (no errors)', () => {});

    it('After calling releaseAll, firing any event should not call any handlers.', () => {});
});
