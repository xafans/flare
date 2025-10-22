import { flare } from '../src';

test('observe', () => {
    const PAYLOAD = 'PAYLOAD';
    const EVENT_NAME = 'EVENT_NAME';

    flare.observe({
        id: 'ID',
        fn: (context, arg) => {
            console.log('context:', context);
            console.log('arg:', arg);
            expect(context.event).toBe(EVENT_NAME);
            expect(context.payload).toBe(PAYLOAD);
        }
    });

    flare.fire(EVENT_NAME, PAYLOAD);
});
