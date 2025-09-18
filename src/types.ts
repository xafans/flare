export type MaybePromise<T> = T | Promise<T>;

export type FlareHandler<P> = (payload: P) => MaybePromise<void>;

export enum FlareFireStrategy {
    Parallel = 'parallel',
    Serial = 'serial'
};

export type FlareFireOptions<E, K extends keyof E> = {
    timeout?: number;
    haltOnError?: boolean;
    strategy?: FlareFireStrategy;
    fireIf?: (payload: E[K]) => boolean;
};

export type FlareCatchOptions = {
    once?: boolean;
};

export type FlareInterceptor<E> = {
    id?: string;
    before?<K extends keyof E>(event: K, payload: E[K]): boolean | void;
    after?<K extends keyof E>(event: K, payload: E[K]): void;
};

export type FlareMiddleware<E extends Record<string, any>> = <K extends keyof E>(
    context: {
        event: K;
        payload: E[K];
        stop: () => void;
        set: (newPayload: E[K]) => void;
    },
    next: () => Promise<void>
) => void | Promise<void>;
