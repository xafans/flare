import { Handler } from "types";

export class Flare<Events extends Record<string, any>> {
    private handlers: {
        [K in keyof Events]?: Set<Handler<Events[K]>>;
    } = {};

    fire<K extends keyof Events>(event: K, payload: Events[K]): void {
        this.handlers[event]?.forEach(handler => handler(payload));
    }

    catch<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
        if (!this.handlers[event]) {
            this.handlers[event] = new Set();
        }
        this.handlers[event]!.add(handler);

        return this.release(event, handler);
    }

    release<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
        this.handlers[event]?.delete(handler);
    }

    releaseAll(): void {
        this.handlers = {};
    }
}
