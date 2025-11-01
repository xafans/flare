import Flare, { FlareObservationSource, FlareObservationType } from '../src';

type Events = {
    send: { message: string };
};

describe('Middlewares', () => {
    let flare: Flare<Events>;
    let mockObserver: jest.Mock;
    const payload = { message: 'hello' };

    beforeEach(() => {
        flare = new Flare<Events>();
        mockObserver = jest.fn();
        flare.observe({ fn: mockObserver });
    });

    describe('middleware execution order', () => {
        it('should execute middlewares in registration order', async () => {
            const calls: string[] = [];

            flare.use({
                id: 'm1',
                fn: async (ctx, next) => {
                    calls.push(`before:${ctx.event}:m1`);
                    await next();
                    calls.push(`after:m1`);
                },
            });

            flare.use({
                id: 'm2',
                fn: async (ctx, next) => {
                    calls.push(`before:${ctx.event}:m2`);
                    await next();
                    calls.push(`after:m2`);
                },
            });

            const handler = jest.fn(() => {
                calls.push('handler');
            });
            flare.catch('send', handler);

            await flare.fire('send', payload);

            expect(calls).toEqual([
                'before:send:m1',
                'before:send:m2',
                'after:m2',
                'after:m1',
                'handler',
            ]);
        });
    });

    describe('middleware stop() and set()', () => {
        it('should stop event propagation when stop() is called', async () => {
            const m1 = jest.fn((ctx, next) => {
                ctx.stop();
            });
            const m2 = jest.fn();
            flare.use({ id: 'stopper', fn: m1 });
            flare.use({ id: 'later', fn: m2 });

            const handler = jest.fn();
            flare.catch('send', handler);

            const result = await flare.fire('send', payload);

            expect(result).toContain('stopped by middleware');
            expect(result).toContain('stopper');
            expect(handler).not.toHaveBeenCalled();
            expect(m2).not.toHaveBeenCalled();

            expect(mockObserver).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Warning,
                    source: FlareObservationSource.Middleware,
                    sourceId: 'stopper',
                }),
                expect.stringContaining('stopped'),
            );
        });

        it('should allow middleware to modify payload via set()', async () => {
            flare.use({
                id: 'setter',
                fn: async (ctx, next) => {
                    ctx.set({ message: 'changed' });
                    await next();
                },
            });

            const handler = jest.fn();
            flare.catch('send', handler);

            await flare.fire('send', payload);

            expect(handler).toHaveBeenCalledWith({ message: 'changed' });
        });
    });

    describe('middleware errors', () => {
        it('should continue event flow but notify observers if middleware throws', async () => {
            const erroring = {
                id: 'erroring',
                fn: jest.fn(async () => {
                    throw new Error('boom');
                }),
            };
            flare.use(erroring);

            const handler = jest.fn();
            flare.catch('send', handler);

            await expect(flare.fire('send', payload)).rejects.toThrow('boom');

            // handler should not have been called because execution chain failed
            expect(handler).not.toHaveBeenCalled();

            // observer should be notified
            expect(mockObserver).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Error,
                    source: FlareObservationSource.Middleware,
                    sourceId: erroring.id,
                }),
                expect.any(Error),
            );
        });
    });

    describe('middleware async and chaining', () => {
        it('should properly handle async middleware', async () => {
            const order: string[] = [];

            flare.use({
                id: 'async1',
                fn: async (ctx, next) => {
                    order.push('start1');
                    await new Promise((r) => setTimeout(r, 10));
                    await next();
                    order.push('end1');
                },
            });

            flare.use({
                id: 'async2',
                fn: async (ctx, next) => {
                    order.push('start2');
                    await new Promise((r) => setTimeout(r, 10));
                    await next();
                    order.push('end2');
                },
            });

            flare.catch('send', () => {order.push('handler')});

            await flare.fire('send', payload);

            expect(order).toEqual([
                'start1',
                'start2',
                'handler',
                'end2',
                'end1',
            ]);
        });
    });

    describe('no middleware scenario', () => {
        it('should skip middleware logic if none are registered', async () => {
            const handler = jest.fn();
            flare.catch('send', handler);

            await flare.fire('send', payload);

            expect(handler).toHaveBeenCalledWith(payload);
            // Info observer should still trigger once for fire()
            expect(mockObserver).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Info,
                    source: FlareObservationSource.Flare,
                }),
                undefined,
            );
        });
    });
});
