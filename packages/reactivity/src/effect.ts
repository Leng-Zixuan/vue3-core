export let activeEffect: ReactiveEffect | undefined

export class ReactiveEffect<T = any> {
    active = true

    /**
     * @internal
     */
    _trackId = 0

    /**
     * 制作一个effect标识 用于区分effect
     * @internal
     */
    _runnings = 0    

    constructor() {}

    run() {}
}

export interface DebuggerOptions {}

export interface ReactiveEffectOptions extends DebuggerOptions {
    lazy?: boolean
}

export interface ReactiveEffectRunner<T = any> {
    (): T
    effect: ReactiveEffect
  }

export function effect<T = any>(
    fn: () => T,
    options?: ReactiveEffectOptions
) {

    const _effect = new ReactiveEffect();

    if (!options || !options.lazy){
        _effect.run()
    }

}