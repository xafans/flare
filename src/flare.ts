import {
    FlareCatchOptions,
    FlareFireOptions,
    FlareFirePriority,
    FlareFireStrategy,
    FlareHandler,
    FlareInterceptor,
    FlareMiddleware,
    FlareObservationSource,
    FlareObservationType,
    FlareObserver,
} from './types';

export class Flare<E extends Record<string, any>> {
    private handlerOptionsStore: {
        [K in keyof E]?: Set<HandlerOptionsPair<E, K>>;
    } = {};

    private interceptors: FlareInterceptor<E>[] = [];
    private middlewares: FlareMiddleware<E>[] = [];
    private observers: FlareObserver<E, any>[] = [];

    in(interceptor: FlareInterceptor<E>): void {
        this.interceptors.push(interceptor);
    }

    use(middleware: FlareMiddleware<E>): void {
        this.middlewares.push(middleware);
    }

    async fire<K extends keyof E>(
        event: K,
        payload: E[K],
        options: FlareFireOptions = {},
    ): Promise<string | void> {
        this.handleObservers(event, payload, FlareObservationType.Info, undefined, FlareObservationSource.Flare, undefined);

        const beforeResult = this.handleBeforeInterceptors(event, payload);
        if (beforeResult) return beforeResult;

        const { stopped, newPayload, stoppedMiddleware } = await this.handleMiddlewares(event, payload);

        if (stopped) {
            const message = `Event "${String(event)}" was stopped by middleware${stoppedMiddleware ? ` (${stoppedMiddleware.id})` : ''}.`;
            this.handleObservers(event, payload, FlareObservationType.Warning, stoppedMiddleware?.id, FlareObservationSource.Middleware, message);
            return Promise.resolve(message);
        }

        const handlerOptionsSet = this.handlerOptionsStore[event];

        if (!handlerOptionsSet) {
            const message = `No handlers found for event "${String(event)}".`;
            this.handleObservers(event, payload, FlareObservationType.Warning, undefined, FlareObservationSource.Flare, message);
            return Promise.resolve(message);
        }

        await this.handleExecute(event, newPayload, options, handlerOptionsSet);

        this.handleAfterInterceptors(event, newPayload);
    }

    catch<K extends keyof E>(
        event: K,
        handler: FlareHandler<E[K]>,
        options: FlareCatchOptions<E, K> = {}
    ): () => void {
        if (!this.handlerOptionsStore[event]) {
            this.handlerOptionsStore[event] = new Set();
        }

        this.handlerOptionsStore[event].add({
            handler,
            options
        })

        return () => this.release(event, handler);
    }

    observe<K extends keyof E>(observer: FlareObserver<E, K>): void {
        this.observers.push(observer);
    }

    release<K extends keyof E>(
        event: K,
        handler: FlareHandler<E[K]>,
    ): void {
        const handlerOptionsSet = this.handlerOptionsStore[event];
        if (!handlerOptionsSet) return;

        for (const handlerOptions of handlerOptionsSet) {
            if (handlerOptions.handler === handler) {
                handlerOptionsSet.delete(handlerOptions);
                break;
            }
        }
    }

    releaseAll(): void {
        for (const event in this.handlerOptionsStore) {
            if (!Object.prototype.hasOwnProperty.call(this.handlerOptionsStore, event)) continue;
            this.handlerOptionsStore[event]?.clear();
        }
        this.handlerOptionsStore = {};
    }

    // ==================== handle methods ====================

    private handleBeforeInterceptors<K extends keyof E>(event: K, payload: E[K]) {
        for (const interceptor of this.interceptors) {
            try {
                const shouldContinue = interceptor.before?.(event, payload);
                if (shouldContinue === false) {
                    const message = `Event "${String(event)}" was cancelled by interceptor${interceptor.id ? ` (${interceptor.id})` : ""}.`;
                    this.handleObservers(event, payload, FlareObservationType.Warning, interceptor.id, FlareObservationSource.Interceptor, message);
                    return Promise.resolve(message);
                }
            } catch (error) {
                this.handleObservers(event, payload, FlareObservationType.Error, interceptor.id, FlareObservationSource.Interceptor, error);
                // the event flow should continue even if an interceptor fails!
            }
        }
    }

    private handleAfterInterceptors<K extends keyof E>(event: K, payload: E[K]) {
        for (const interceptor of this.interceptors) {
            try {
                interceptor.after?.(event, payload);
            } catch (error) {
                this.handleObservers(event, payload, FlareObservationType.Error, interceptor.id, FlareObservationSource.Interceptor, error);
                // the event flow should continue even if an interceptor fails!
            }
        }
    }

    private async handleMiddlewares<K extends keyof E>(event: K, payload: E[K])
        : Promise<{ stopped: boolean, newPayload: E[K], stoppedMiddleware?: FlareMiddleware<E> }> {
        const middlewares = this.middlewares;

        const dis = this;
        let stopped = false;
        let newPayload = payload;
        let stoppedMiddleware: FlareMiddleware<E> | undefined = undefined;

        if (middlewares.length === 0) return { stopped, newPayload };

        const stop = () => { stopped = true; };
        const set = (p: E[K]) => { newPayload = p; };

        await executeMiddleware(0);

        return { stopped, newPayload, stoppedMiddleware };

        async function executeMiddleware(index: number): Promise<void> {
            if (stopped) return;
            if (index >= middlewares.length) return Promise.resolve();

            const middleware = middlewares[index];
            const context = { event, payload: newPayload, stop, set };
            const next = async () => await executeMiddleware(index + 1);
            try {
                await middleware.fn(context, next);
                if (stopped) {
                    stoppedMiddleware = middlewares[index];
                }
            } catch (error) {
                dis.handleObservers(event, payload, FlareObservationType.Error, middleware.id, FlareObservationSource.Middleware, error);
                // the event flow should continue if a middleware fails!
                return Promise.reject(error);
            }
        }
    }

    private async handleExecute<K extends keyof E>(
        event: K,
        payload: E[K],
        fireOptions: FlareFireOptions,
        handlerOptionsSet: Set<HandlerOptionsPair<E, K>>
    ) {
        const { strategy = FlareFireStrategy.Parallel, timeout, haltOnError = false } = fireOptions;

        // Sort handlers by priority (higher priority first)
        const sortedHandlersBaseOnPriority = Array.from(handlerOptionsSet).sort(
            (a, b) => (b.options.priority ?? FlareFirePriority.Low) - (a.options.priority ?? FlareFirePriority.Low)
        );

        if (strategy === FlareFireStrategy.Parallel) {
            await Promise.allSettled(
                sortedHandlersBaseOnPriority.map(async (handlerOptions) => {
                    try {
                        await this.execute(event, payload, timeout, handlerOptions);
                    } catch (error) {
                        this.handleObservers(event, payload, FlareObservationType.Error, undefined, FlareObservationSource.Handler, error);
                        if (haltOnError) throw error;
                    }
                })
            );
        } else {
            for (const handlerOptions of sortedHandlersBaseOnPriority) {
                try {
                    await this.execute(event, payload, timeout, handlerOptions);
                } catch (error) {
                    this.handleObservers(event, payload, FlareObservationType.Error, undefined, FlareObservationSource.Handler, error);
                    if (haltOnError) break;
                }
            }
        }
    }

    private async handleObservers<T, K extends keyof E>(
        event: K,
        payload: E[K],
        type: FlareObservationType,
        sourceId: string | undefined,
        source: FlareObservationSource,
        arg?: T
    ) {
        for (const observer of this.observers) {
            try {
                const context = {
                    event,
                    payload,
                    timestamp: Date.now(),
                    type,
                    sourceId,
                    source,
                };
                observer.fn(context, arg);
            } catch (error) {
                // The throwing observer should not break others
            }
        }
    }

    // ==================== internal methods ====================

    private async execute<K extends keyof E>(
        event: K,
        payload: E[K],
        timeout: number | undefined,
        handlerOptions: HandlerOptionsPair<E, K>
    ): Promise<void> {
        const shouldRun = !handlerOptions.options.when || handlerOptions.options.when(payload);
        if (!shouldRun) return;

        try {
            if (!timeout) return handlerOptions.handler(payload);

            const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('FlareHandler timeout')), timeout));
            return Promise.race([handlerOptions.handler(payload), timeoutPromise]);
        } finally {
            if (handlerOptions.options.once) {
                this.handlerOptionsStore[event]?.delete(handlerOptions);
            }
        }
    };
}

interface HandlerOptionsPair<E, K extends keyof E> {
    handler: FlareHandler<E[K]>;
    options: FlareCatchOptions<E, K>;
};
