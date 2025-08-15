export type MaybePromise<T> = T | Promise<T>;

export type Handler<Payload> = (payload: Payload) => MaybePromise<void>;

export interface IFlareFireOptions {}

export interface IFlareCatchOptions {
    once?: boolean;
}
