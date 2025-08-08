import { Handler, IFlareCatchOptions, IFlareFireOptions } from "types";

export class Flare<Events extends Record<string, any>> {
    private handlers: {
        [K in keyof Events]?: Set<Handler<Events[K]>>;
    } = {};

    fire<K extends keyof Events>(
        event: K,
        payload: Events[K],
        options?: IFlareFireOptions): void {

        this.handlers[event]?.forEach(handler => handler(payload));
    }

    catch<K extends keyof Events>(
        event: K,
        handler: Handler<Events[K]>,
        options?: boolean | IFlareCatchOptions): () => void {

        let opt = {} as IFlareCatchOptions;
        if (options) {
            if (options === true) {
                opt.once = true;
            } else {
                opt = options;
            }
        }

        if (!this.handlers[event]) {
            this.handlers[event] = new Set();
        }

        if (opt.once) {
            this.handlers[event]!.add((payload) => {
                handler(payload);
                this.release(event, handler);
            });
        } else {
            this.handlers[event]!.add(handler);
        }

        return () => this.release(event, handler);
    }

    release<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
        this.handlers[event]?.delete(handler);
    }

    releaseAll(): void {
        this.handlers = {};
    }
}
