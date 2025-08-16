import {
    Handler,
    Middleware,
    IFlareFireOptions,
    IFlareCatchOptions,
} from './types';

export class Flare<E extends Record<string, any>> {
    private handlers: {
        [K in keyof E]?: Set<Handler<E[K]>>;
    } = {};

    private middlewares: Middleware<E>[] = [];

    use(middleware: Middleware<E>): void {
        this.middlewares.push(middleware);
    }

    fire<K extends keyof E>(
        event: K,
        payload: E[K],
        options?: IFlareFireOptions,
    ): void {
        for (const middleware of this.middlewares) {
            try {
                const shouldContinue = middleware.before?.(event, payload);
                if (shouldContinue === false) return;
            } catch (error) {
                // TODO: handle middleware exception
            }
        }

        const handlers = this.handlers[event];
        if (!handlers) return;

        for (const handler of handlers) {
            this.call(handler, payload);
        }

        for (const middleware of this.middlewares) {
            try {
                middleware.after?.(event, payload);
            } catch (error) {
                // TODO: handle middleware exception
            }
        }
    }

    catch<K extends keyof E>(
        event: K,
        handler: Handler<E[K]>,
        options?: boolean | IFlareCatchOptions,
    ): () => void {
        if (!this.handlers[event]) {
            this.handlers[event] = new Set();
        }

        let opt = {} as IFlareCatchOptions;
        if (options) {
            if (typeof options === 'boolean') {
                opt.once = options;
            } else {
                opt = options;
            }
        }

        if (opt.once) {
            const wrappedHandler = (payload: E[K]) => {
                this.call(handler, payload);
                this.release(event, wrappedHandler);
            };
            this.handlers[event]!.add(wrappedHandler);
        } else {
            this.handlers[event]!.add(handler);
        }

        return () => this.release(event, handler);
    }

    release<K extends keyof E>(
        event: K,
        handler: Handler<E[K]>,
    ): void {
        this.handlers[event]?.delete(handler);
    }

    releaseAll(): void {
        for (const event in this.handlers) {
            if (!Object.prototype.hasOwnProperty.call(this.handlers, event))
                continue;
            const handlers = this.handlers[event];
            handlers?.clear();
        }
        this.handlers = {};
    }

    private call<K extends keyof E>(
        handler: Handler<E[K]>,
        payload: E[K],
    ) {
        try {
            Promise.resolve(handler(payload)).catch((e) => {
                // TODO: handle async exception
            });
        } catch (error) {
            // TODO: handle sync exception
        }
    }
}
