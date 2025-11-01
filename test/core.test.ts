import Flare, {
    FlareFirePriority,
    FlareFireStrategy,
} from '../src';

type Events = {
    add: { value: number };
    remove: { value: number };
};

describe('Flare - Base features (no middlewares, interceptors, observers)', () => {
    let flare: Flare<Events>;

    beforeEach(() => {
        flare = new Flare<Events>();
    });

    describe('handler registration and execution', () => {
        it('should register and execute a handler via catch()', async () => {
            const handler = jest.fn();
            flare.catch('add', handler);

            await flare.fire('add', { value: 1 });

            expect(handler).toHaveBeenCalledWith({ value: 1 });
        });

        it('should return warning message if no handler is found for event', async () => {
            const result = await flare.fire('remove', { value: 10 });

            expect(typeof result).toBe('string');
            expect(result).toContain('No handlers found for event "remove"');
        });

        it('should allow multiple handlers for same event', async () => {
            const h1 = jest.fn();
            const h2 = jest.fn();

            flare.catch('add', h1);
            flare.catch('add', h2);

            await flare.fire('add', { value: 10 });

            expect(h1).toHaveBeenCalled();
            expect(h2).toHaveBeenCalled();
        });

        it('should respect handler priority (high first)', async () => {
            const callOrder: string[] = [];

            flare.catch('add', () => { callOrder.push('low') }, { priority: FlareFirePriority.Low });
            flare.catch('add', () => { callOrder.push('high') }, { priority: FlareFirePriority.High });

            await flare.fire('add', { value: 10 });

            expect(callOrder).toEqual(['high', 'low']);
        });

        it('should skip handler when "when" condition returns false', async () => {
            const handler = jest.fn();

            flare.catch('add', handler, {
                when: (payload) => payload.value > 10,
            });

            await flare.fire('add', { value: 5 });

            expect(handler).not.toHaveBeenCalled();
        });

        it('should remove "once" handlers automatically after first run', async () => {
            const handler = jest.fn();

            flare.catch('add', handler, { once: true });

            await flare.fire('add', { value: 1 });
            await flare.fire('add', { value: 2 });

            expect(handler).toHaveBeenCalledTimes(1);
        });
    });

    describe('handler release and releaseAll', () => {
        it('should remove a specific handler with release()', async () => {
            const handler = jest.fn();
            flare.catch('add', handler);

            flare.release('add', handler);
            await flare.fire('add', { value: 1 });

            expect(handler).not.toHaveBeenCalled();
        });

        it('should remove all handlers via releaseAll()', async () => {
            const h1 = jest.fn();
            const h2 = jest.fn();

            flare.catch('add', h1);
            flare.catch('remove', h2);

            flare.releaseAll();

            await flare.fire('add', { value: 1 });
            await flare.fire('remove', { value: 1 });

            expect(h1).not.toHaveBeenCalled();
            expect(h2).not.toHaveBeenCalled();
        });

        it('should not throw if release() is called for non-existing handler', () => {
            expect(() => flare.release('add', jest.fn())).not.toThrow();
        });
    });

    describe('handler execution strategies', () => {
        it('should execute handlers in parallel by default', async () => {
            const order: string[] = [];

            flare.catch('add', async () => {
                await new Promise(r => setTimeout(r, 20));
                order.push('first');
            });

            flare.catch('add', async () => {
                order.push('second');
            });

            await flare.fire('add', { value: 5 });
            expect(order).toContain('second');
            expect(order).toContain('first');
        });

        it('should execute handlers sequentially when strategy=Sequential', async () => {
            const order: string[] = [];

            flare.catch('add', async () => {
                order.push('first');
            }, { priority: 1 });

            flare.catch('add', async () => {
                order.push('second');
            }, { priority: 0 });

            await flare.fire('add', { value: 1 }, { strategy: FlareFireStrategy.Serial });

            expect(order).toEqual(['first', 'second']);
        });

        it('should respect haltOnError when true (Sequential strategy)', async () => {
            const order: string[] = [];

            flare.catch('add', async () => {
                order.push('first');
                throw new Error('fail');
            });

            flare.catch('add', async () => {
                order.push('second');
            });

            await flare.fire('add', { value: 5 }, {
                strategy: FlareFireStrategy.Serial,
                haltOnError: true,
            });

            expect(order).toEqual(['first']); // second should not execute
        });

        it('should continue when haltOnError=false (Sequential strategy)', async () => {
            const order: string[] = [];

            flare.catch('add', async () => {
                order.push('first');
                throw new Error('fail');
            });

            flare.catch('add', async () => {
                order.push('second');
            });

            await flare.fire('add', { value: 5 }, {
                strategy: FlareFireStrategy.Serial,
                haltOnError: false,
            });

            expect(order).toEqual(['first', 'second']);
        });

        it('should timeout handlers that exceed given timeout', async () => {
            const slowHandler = jest.fn(async () => {
                await new Promise(r => setTimeout(r, 50));
            });

            flare.catch('add', slowHandler);

            await expect(
                flare.fire('add', { value: 2 }, { timeout: 10 })
            ).resolves.not.toThrow();

            expect(slowHandler).toHaveBeenCalled();
        });
    });

    describe('return values and message correctness', () => {
        it('should resolve to undefined when event runs successfully', async () => {
            flare.catch('add', jest.fn());
            const result = await flare.fire('add', { value: 1 });

            expect(result).toBeUndefined();
        });

        it('should resolve with descriptive message when stopped by no handler', async () => {
            const result = await flare.fire('remove', { value: 0 });
            expect(result).toContain('No handlers found');
        });
    });
});
