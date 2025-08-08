export type Handler<Payload> = (payload: Payload) => void;

export interface IFlareFireOptions {
}

export interface IFlareCatchOptions {
    once?: boolean;
}