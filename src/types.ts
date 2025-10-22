export type MaybePromise<T> = T | Promise<T>;

export type FlareHandler<P> = (payload: P) => MaybePromise<void>;

export enum FlareFireStrategy {
    Parallel = 'parallel',
    Serial = 'serial'
};

export enum FlareFirePriority {
    Low,
    Medium,
    High,
    Highest
};

export type FlareFireOptions = {
    timeout?: number;
    haltOnError?: boolean;
    strategy?: FlareFireStrategy;
    priority?: FlareFirePriority;
};

export type FlareCatchOptions<E, K extends keyof E> = {
    once?: boolean;
    priority?: FlareFirePriority;
    when?: (payload: E[K]) => boolean;
};

export type FlareInterceptor<E> = {
    id?: string;
    before?<K extends keyof E>(event: K, payload: E[K]): boolean | void;
    after?<K extends keyof E>(event: K, payload: E[K]): void;
};

export type FlareMiddleware<E extends Record<string, any>> = {
    id?: string;
    fn: <K extends keyof E>(
        context: {
            event: K;
            payload: E[K];
            stop: () => void;
            set: (newPayload: E[K]) => void;
        },
        next: () => Promise<void>
    ) => void | Promise<void>
};

export type FlareObserver<E, K extends keyof E> = {
    id?: string;
    fn: <T>(
        context: {
            event: K,
            payload: E[K],
            timestamp: number,
            type: FlareObservationType,
            sourceId: string | undefined,
            source: FlareObservationSource,
        },
        arg: T) => void;
}

export enum FlareObservationType {
    Info = 'info',
    Warning = 'warning',
    Error = 'error'
};

export enum FlareObservationSource {
    Interceptor = 'interceptor',
    Middleware = 'middleware',
    Handler = 'handler',
    Flare = 'flare'
};
