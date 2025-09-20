import {
    FlareCatchOptions,
    FlareFireOptions,
    FlareFireStrategy,
    FlareHandler,
    FlareInterceptor,
    FlareMiddleware,
} from './types';

type FlareHandlerWithOptions<E, K extends keyof E> = {
    fn: FlareHandler<E[K]>;
    once?: boolean;
};

export class Flare<E extends Record<string, any>> {
    private handlers: {
        [K in keyof E]?: Set<FlareHandlerWithOptions<E, K>>;
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

        const handlers = this.handlers[event];
        if (!handlers) return Promise.resolve(`No handlers found for event "${String(event)}".`);

        const { strategy = FlareFireStrategy.Parallel, timeout, haltOnError = false } = options;

        if (strategy === FlareFireStrategy.Parallel) {
            await Promise.allSettled(
                Array.from(handlers).map(async (handler) => {
                    try {
                        await this.executeWithOptions(event, handler, newPayload, timeout);
                    } catch (err) {
                        // TODO: handle or log exception
                        if (haltOnError) throw err;
                    }
                })
            );
        } else {
            for (const handler of handlers) {
                try {
                    await this.executeWithOptions(event, handler, newPayload, timeout);
                } catch (err) {
                    // TODO: handle or log exception
                    if (haltOnError) break;
                }
            }
        }

        this.handleAfterInterceptors(event, newPayload);
    }

    catch<K extends keyof E>(
        event: K,
        handler: FlareHandler<E[K]>,
        options: FlareCatchOptions = {},
    ): () => void {
        if (!this.handlers[event]) {
            this.handlers[event] = new Set();
        }

        this.handlers[event].add({
            fn: handler,
            once: options.once
        })

        return () => this.release(event, handler);
    }

    release<K extends keyof E>(
        event: K,
        handler: FlareHandler<E[K]>,
    ): void {
        const handlers = this.handlers[event];
        if (!handlers) return;

        for (const h of handlers) {
            if (h.fn === handler) {
                handlers.delete(h);
                break;
            }
        }
    }

    releaseAll(): void {
        for (const event in this.handlers) {
            if (!Object.prototype.hasOwnProperty.call(this.handlers, event)) continue;
            const handlers = this.handlers[event];
            handlers?.clear();
        }
        this.handlers = {};
    }

    // ==================== internals ====================

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

    private async executeWithOptions<K extends keyof E>(
        event: K,
        handlerWithOptions: FlareHandlerWithOptions<E, K>,
        payload: E[K],
        timeout?: number
    ): Promise<void> {
        await this.execute(handlerWithOptions.fn, payload, timeout);

        if (handlerWithOptions.once) {
            this.release(event, handlerWithOptions.fn);
        }
    }

    private async execute<K extends keyof E>(
        handler: FlareHandler<E[K]>,
        payload: E[K],
        timeout?: number): Promise<void> {
        if (!timeout) return this.call(handler, payload);

        const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('FlareHandler timeout')), timeout));
        return Promise.race([this.call(handler, payload), timeoutPromise]);
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
