import { Flare } from './flare';

export * from './types';
export default Flare;
export const flare: Flare<Record<string, any>> = new Flare<
    Record<string, any>
>();
