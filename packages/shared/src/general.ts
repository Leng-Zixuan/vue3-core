export const NOOP = () => {}

export const isObject = (v: unknown): v is Record<any, any> => 
    typeof v === 'object' && v !== null