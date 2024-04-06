/////////////////////////////////////////////////////////////////////

import { isObject } from "@vue/shared"
import {
    mutableHandler,
    shallowReactiveHandler,
    readonlyHandler,
    shallowReadonlyHandler
} from "./baseHandlers"


// 以下四个函数创建响应式对象的参数是不是只读，是不是深度

/**
 * reactive 返回一个对象的响应式代理。
 * 详情https://cn.vuejs.org/api/reactivity-core.html#reactive
 * @param target 被代理对象
 * @returns UnwrapNestedRefs<T>
 */
export function reactive<T extends object>(target: T) {
    return createReactiveObject(target, false, mutableHandler)
}

/**
 * shallowReactive reactive() 的浅层作用形式。
 * 详情https://cn.vuejs.org/api/reactivity-advanced.html#shallowreactive
 * @param target 被代理对象
 * @returns T
 */
export function shallowReactive<T extends object>(target: T) {
    return createReactiveObject(target, false, shallowReactiveHandler)
}

/**
 * readonly 接受一个对象 (不论是响应式还是普通的) 或是一个 ref，返回一个原值的只读代理。
 * 详情https://cn.vuejs.org/api/reactivity-core.html#readonly
 * @param target 被代理对象
 * @returns DeepReadonly<UnwrapNestedRefs<T>>
 */
export function readonly<T extends object>(target: T) {
    return createReactiveObject(target, true, readonlyHandler)
}

/**
 * shallowReadonly readonly() 的浅层作用形式
 * 详情https://cn.vuejs.org/api/reactivity-advanced.html#shallowreadonly
 * @param target 被代理对象
 * @returns Readonly<T>
 */
export function shallowReadonly<T extends object>(target: T) {
    return createReactiveObject(target, true, shallowReadonlyHandler)
}

/////////////////////////////////////////////////////////////////////

// 被代理目标对象的类型顶以
export interface Target {}

// WeakMap会自动进行垃圾回收 不会造成内存泄漏 存储的key只能是对象
// WeakMap详情请看MDN https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
export const reactiveMpa = new WeakMap()
export const readonlyMap = new WeakMap()

export function createReactiveObject(
    target: Target,
    isReadonly: boolean,

    // ProxyHandler类型是Proxy目标对象的代理配置方法
    // 详情请看MDN https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy#handler_%E5%AF%B9%E8%B1%A1%E7%9A%84%E6%96%B9%E6%B3%95
    baseHandlers: ProxyHandler<any>,
) {
    // 如果目标不是对象 没法拦截了，reactive这个api只能拦截对象类型
    if (!isObject(target)) {
        return target
    }

    // 如果某个对象已经被代理过了 就不要再次代理
    // 利用WeakMap缓存代理对象和代理结果
    // 减少重复代理成本 降低内存开销

    // 可能一个对象被深度代理又被只读代理
    const proxyMap = isReadonly ? readonlyMap : reactiveMpa

    // 取目标对象看是否存在且被代理 如果被代理过则直接返回
    const existingProxy =  proxyMap.get(target)
    if (existingProxy) {
        return existingProxy
    }

    const proxy = new Proxy(target, baseHandlers)
    
    // 对新代理的对象和代理结果进行缓存
    proxyMap.set(target, proxy)

    return proxy
}