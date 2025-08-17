export type MaybePromise<T> = T | Promise<T>;

export type Handler<P> = (payload: P) => MaybePromise<void>;

export type IFlareFireOptions = {};

export type IFlareCatchOptions = {
    once?: boolean;
};

export type Middleware<E> = {
    before?<K extends keyof E>(event: K, payload: E[K]): boolean | void;
    after?<K extends keyof E>(event: K, payload: E[K]): void;
};
