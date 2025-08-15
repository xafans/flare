import {
    MaybePromise,
    Handler,
    IFlareCatchOptions,
    IFlareFireOptions,
} from './types';

export class Flare<Events extends Record<string, any>> {
    private handlers: {
        [K in keyof Events]?: Set<Handler<Events[K]>>;
    } = {};

    fire<K extends keyof Events>(
        event: K,
        payload: Events[K],
        options?: IFlareFireOptions,
    ): void {
        const handlers = this.handlers[event];
        if (!handlers) return;

        for (const handler of handlers) {
            try {
                Promise.resolve(handler(payload));
            } catch (error) {
                // TODO: handle exceptions
            }
        }
    }

    catch<K extends keyof Events>(
        event: K,
        handler: Handler<Events[K]>,
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
            const wrappedHandler = (payload: Events[K]) => {
                try {
                    Promise.resolve(handler(payload));
                } catch (error) {
                    // TODO: handle exceptions
                }
                this.release(event, wrappedHandler);
            };
            this.handlers[event]!.add(wrappedHandler);
        } else {
            this.handlers[event]!.add(handler);
        }

        return () => this.release(event, handler);
    }

    release<K extends keyof Events>(
        event: K,
        handler: Handler<Events[K]>,
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
}
