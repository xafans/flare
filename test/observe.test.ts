import Flare, {
    FlareObservationSource,
    FlareObservationType,
} from '../src';

type Events = {
    save: { data: string };
    delete: { id: number };
};

describe('Observation system', () => {
    let flare: Flare<Events>;
    let observerFn: jest.Mock;
    const payload = { data: 'abc' };

    beforeEach(() => {
        flare = new Flare<Events>();
        observerFn = jest.fn();
        flare.observe({ fn: observerFn });
    });

    describe('basic observation behavior', () => {
        it('should call observer on normal event fire with Info type', async () => {
            const handler = jest.fn();
            flare.catch('save', handler);

            await flare.fire('save', payload);

            expect(observerFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: 'save',
                    payload,
                    type: FlareObservationType.Info,
                    source: FlareObservationSource.Flare,
                }),
                undefined
            );
        });

        it('should include timestamp and source info', async () => {
            flare.catch('save', jest.fn());
            await flare.fire('save', payload);

            const [ctx] = observerFn.mock.calls[0];
            expect(typeof ctx.timestamp).toBe('number');
            expect(ctx.source).toBe(FlareObservationSource.Flare);
        });

        it('should not block event flow if observer throws error', async () => {
            const badObserver = jest.fn(() => { throw new Error('bad'); });
            flare.observe({ fn: badObserver });

            const handler = jest.fn();
            flare.catch('save', handler);

            await expect(flare.fire('save', payload)).resolves.toBeUndefined();
            expect(handler).toHaveBeenCalled();
            // The throwing observer should not break others
            expect(observerFn).toHaveBeenCalled();
        });
    });

    describe('observation from other sources', () => {
        it('should record Warning observation when event stopped by middleware', async () => {
            flare.use({
                id: 'blocker',
                fn: (ctx) => ctx.stop(),
            });
            flare.catch('save', jest.fn());

            await flare.fire('save', payload);

            expect(observerFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Warning,
                    source: FlareObservationSource.Middleware,
                    sourceId: 'blocker',
                }),
                expect.stringContaining('stopped')
            );
        });

        it('should record Warning observation when event cancelled by interceptor', async () => {
            flare.in({
                id: 'breaker',
                before: () => false,
            });
            flare.catch('save', jest.fn());

            await flare.fire('save', payload);

            expect(observerFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Warning,
                    source: FlareObservationSource.Interceptor,
                    sourceId: 'breaker',
                }),
                expect.stringContaining('cancelled')
            );
        });

        it('should record Error observation when interceptor throws', async () => {
            flare.in({
                id: 'faulty',
                before: () => { throw new Error('boom'); },
            });
            flare.catch('save', jest.fn());

            await flare.fire('save', payload);

            expect(observerFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Error,
                    source: FlareObservationSource.Interceptor,
                    sourceId: 'faulty',
                }),
                expect.any(Error)
            );
        });

        it('should record Error observation when middleware throws', async () => {
            flare.use({
                id: 'm1',
                fn: async () => {
                    throw new Error('mw fail');
                },
            });
            flare.catch('save', jest.fn());

            await expect(flare.fire('save', payload)).rejects.toThrow('mw fail');

            expect(observerFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Error,
                    source: FlareObservationSource.Middleware,
                    sourceId: 'm1',
                }),
                expect.any(Error)
            );
        });
    });

    describe('observation during handler execution', () => {
        it('should record Error observation when handler throws synchronously', async () => {
            const errorHandler = jest.fn(() => { throw new Error('handler fail'); });
            flare.catch('save', errorHandler);

            await flare.fire('save', payload);

            expect(observerFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Error,
                    source: FlareObservationSource.Handler,
                }),
                expect.any(Error)
            );
        });

        it('should record Error observation when handler rejects asynchronously', async () => {
            const asyncFailHandler = jest.fn(async () => {
                return Promise.reject(new Error('async fail'));
            });
            flare.catch('save', asyncFailHandler);

            await flare.fire('save', payload);

            expect(observerFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Error,
                    source: FlareObservationSource.Handler,
                }),
                expect.any(Error)
            );
        });
    });

    describe('observer management', () => {
        it('should allow multiple observers to receive the same events', async () => {
            const obs2 = jest.fn();
            flare.observe({ fn: obs2 });

            flare.catch('save', jest.fn());
            await flare.fire('save', payload);

            expect(observerFn).toHaveBeenCalled();
            expect(obs2).toHaveBeenCalled();
        });

        it('should allow dynamic observation of different event types', async () => {
            const obsA = jest.fn();
            const obsB = jest.fn();

            flare.observe({ fn: obsA });
            flare.observe({ fn: obsB });

            flare.catch('save', jest.fn());
            flare.catch('delete', jest.fn());

            await flare.fire('save', { data: 'ok' });
            await flare.fire('delete', { id: 7 });

            expect(obsA).toHaveBeenCalledWith(
                expect.objectContaining({ event: 'save' }),
                undefined
            );
            expect(obsB).toHaveBeenCalledWith(
                expect.objectContaining({ event: 'delete' }),
                undefined
            );
        });
    });
});

