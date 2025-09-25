import {
    FlareCatchOptions,
    FlareFireOptions,
    FlareFirePriority,
    FlareFireStrategy,
    FlareHandler,
    FlareInterceptor,
    FlareMiddleware,
} from './types';

export class Flare<E extends Record<string, any>> {
    private handlerOptionsStore: {
        [K in keyof E]?: Set<HandlerOptionsPair<E, K>>;
    } = {};

    private interceptors: FlareInterceptor<E>[] = [];
    private middlewares: FlareMiddleware<E>[] = [];

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
        const beforeResult = this.handleBeforeInterceptors(event, payload);
        if (beforeResult) return beforeResult;

        const { stopped, newPayload } = await this.handleMiddlewares(event, payload);
        if (stopped) {
            return Promise.resolve(`Event "${String(event)}" was stopped by middleware.`);
        }

        const handlerOptionsSet = this.handlerOptionsStore[event];
        if (!handlerOptionsSet) return Promise.resolve(`No handlers found for event "${String(event)}".`);

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
                    return Promise.resolve(`Event "${String(event)}" was cancelled by interceptor ${interceptor.id ? `(${interceptor.id})` : ""}.`);
                }
            } catch (error) {
                // TODO: handle interceptor exception
            }
        }
    }

    private handleAfterInterceptors<K extends keyof E>(event: K, payload: E[K]) {
        for (const interceptor of this.interceptors) {
            try {
                interceptor.after?.(event, payload);
            } catch (error) {
                // TODO: handle interceptor exception
            }
        }
    }

    private async handleMiddlewares<K extends keyof E>(event: K, payload: E[K]): Promise<{ stopped: boolean, newPayload: E[K] }> {
        const middlewares = this.middlewares;

        let stopped = false;
        let newPayload = payload;

        if (middlewares.length === 0) return { stopped, newPayload };

        const stop = () => { stopped = true; };
        const set = (p: E[K]) => { newPayload = p; };

        await executeMiddleware(0);

        return { stopped, newPayload };


        async function executeMiddleware(index: number): Promise<void> {
            if (index < middlewares.length) {
                const middleware = middlewares[index];
                const context = { event, payload: newPayload, stop, set };
                await middleware(context, () => executeMiddleware(index + 1));
            }
        };
    }

    private async handleExecute<K extends keyof E>(
        event: K,
        newPayload: E[K],
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
                        await this.execute(event, newPayload, timeout, handlerOptions);
                    } catch (err) {
                        // TODO: handle or log exception
                        if (haltOnError) throw err;
                    }
                })
            );
        } else {
            for (const handlerOptions of sortedHandlersBaseOnPriority) {
                try {
                    await this.execute(event, newPayload, timeout, handlerOptions);
                } catch (err) {
                    // TODO: handle or log exception
                    if (haltOnError) break;
                }
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
            if (!timeout) return this.call(handlerOptions.handler, payload);

            const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('FlareHandler timeout')), timeout));
            return Promise.race([this.call(handlerOptions.handler, payload), timeoutPromise]);
        } finally {
            if (handlerOptions.options.once) {
                this.handlerOptionsStore[event]?.delete(handlerOptions);
            }
        }
    };

    private call<K extends keyof E>(
        handler: FlareHandler<E[K]>,
        payload: E[K],
    ) {
        try {
            return Promise.resolve(handler(payload)).catch((e) => {
                // TODO: handle async exception
            });
        } catch (error) {
            // TODO: handle sync exception
            throw error;
        }
    }
}

interface HandlerOptionsPair<E, K extends keyof E> {
    handler: FlareHandler<E[K]>;
    options: FlareCatchOptions<E, K>;
};
