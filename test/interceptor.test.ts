import Flare from '../src';
import { FlareObservationSource, FlareObservationType } from '../src';

type Events = {
    login: { user: string };
    logout: { user: string };
};

describe('Interceptors', () => {
    let flare: Flare<Events>;
    let mockObserver: jest.Mock;
    const payload = { user: 'alice' };

    beforeEach(() => {
        flare = new Flare<Events>();
        mockObserver = jest.fn();
        flare.observe({ fn: mockObserver });
    });

    describe('before interceptors', () => {
        it('should run before interceptors in order', async () => {
            const calls: string[] = [];

            flare.in({
                id: 'i1',
                before: (event, p) => {
                    calls.push(`b1:${event}`);
                },
            });
            flare.in({
                id: 'i2',
                before: (event, p) => {
                    calls.push(`b2:${event}`);
                },
            });

            flare.catch('login', jest.fn());

            await flare.fire('login', payload);

            expect(calls).toEqual(['b1:login', 'b2:login']);
        });

        it('should stop event when before interceptor returns false', async () => {
            const interceptor = {
                id: 'stopper',
                before: () => false,
            };
            flare.in(interceptor);

            const handler = jest.fn();
            flare.catch('login', handler);

            const result = await flare.fire('login', payload);

            expect(result).toContain('cancelled by interceptor');
            expect(result).toContain(interceptor.id);
            expect(handler).not.toHaveBeenCalled();
            expect(mockObserver).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Warning,
                    source: FlareObservationSource.Interceptor,
                    sourceId: interceptor.id,
                }),
                expect.stringContaining('cancelled'),
            );
        });

        it('should continue flow when before interceptor throws', async () => {
            const interceptor = {
                id: 'erroring',
                before: () => {
                    throw new Error('boom');
                },
            };
            flare.in(interceptor);

            const handler = jest.fn();
            flare.catch('login', handler);

            await flare.fire('login', payload);

            // Even if interceptor threw, handler still runs
            expect(handler).toHaveBeenCalled();
            expect(mockObserver).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Error,
                    source: FlareObservationSource.Interceptor,
                    sourceId: interceptor.id,
                }),
                expect.any(Error),
            );
        });
    });

    describe('after interceptors', () => {
        it('should call after interceptors after handlers execute', async () => {
            const afterMock = jest.fn();
            flare.in({ id: 'after1', after: afterMock });

            const handler = jest.fn();
            flare.catch('login', handler);

            await flare.fire('login', payload);

            expect(handler).toHaveBeenCalled();
            expect(afterMock).toHaveBeenCalledWith('login', payload);
        });

        it('should continue if after interceptor throws error', async () => {
            const afterMock1 = jest.fn(() => {
                throw new Error('oops');
            });
            const afterMock2 = jest.fn();

            flare.in({ id: 'after1', after: afterMock1 });
            flare.in({ id: 'after2', after: afterMock2 });

            const handler = jest.fn();
            flare.catch('login', handler);

            await flare.fire('login', payload);

            expect(afterMock2).toHaveBeenCalled();
            expect(mockObserver).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FlareObservationType.Error,
                    source: FlareObservationSource.Interceptor,
                    sourceId: 'after1',
                }),
                expect.any(Error),
            );
        });
    });

    describe('integration behavior', () => {
        it('should execute both before and after interceptors properly', async () => {
            const order: string[] = [];

            flare.in({
                id: 'b1',
                before: (e, p) => {
                    order.push('before1');
                },
                after: (e, p) => order.push('after1'),
            });

            flare.catch('login', () => {
                order.push('handler');
            });

            await flare.fire('login', payload);

            expect(order).toEqual(['before1', 'handler', 'after1']);
        });

        it('should record Info observation when event fires normally', async () => {
            flare.catch('login', jest.fn());

            await flare.fire('login', payload);

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
