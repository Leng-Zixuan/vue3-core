import { isObject } from '@vue/shared'
import {
    reactive,
    readonly,
    type Target,
} from './reactive'

// 是不是只读代理 只读的属性set时会报异常
// 是不是深度代理 

function createGetter(isReadonly = false, shallow = false) { }

const get = createGetter()
const shallowGet = createGetter()
const readonlyGet = createGetter()
const shallowReadonlyGet = createGetter()

// 基础的响应式代理对象的配置对象
// Class是ES6新增的关键字，意为：类。类是面向对象编程范式的典型对象特征。类是定义对象属性（properties）和方法（methods）的模板，是用来绘制具体对象实例的“蓝图”。
// implements是typescript的语法 意为：实现。一个新的类，从父类或者接口实现所有的属性和方法，同时可以重写属性和方法，包含一些新的功能
class BaseReactiveHandler implements ProxyHandler<Target> {
    constructor(
        protected readonly _isReadonly = false,
        protected readonly _isShallow = false,
    ) { }

    // 初始化过程中对数据进行拦截代理，以便将拦截的普通对此昂编程响应式对象
    get(target: Target, key: string | symbol, receiver: object) {
        const isReadonly = this._isReadonly,
            isShallow = this._isShallow

        // Reflect是ES6内置Api，意为：反射。它提供拦截 JavaScript 操作的方法。这些方法与 proxy handler 的方法相同。Reflect 不是一个函数对象，因此它是不可构造的。 Reflect可以不使用Proxy
        // 详情https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect
        const res = Reflect.get(target, key, receiver)

        // 如果不是只读对象，那么将收集依赖，等待数据变化后追踪依赖以便更新相应的视图
        if (!isReadonly) {
            
        }

        // 如果对象本身就是是浅层代理对象，则直接返回
        if (isShallow) {
            console.log(isShallow, '======isShallow');
            
            return res
        }

        // 如果是对象，就要考虑递归处理内部属性是否是只读属性
        // vue2是初始化阶段获取值后直接暴力递归进行代理，vue3是仅当取值时进行代理（懒代理）。
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res)
        }


        return res
    }
}

// 可变的响应式代理对象的配置对象
// extends 继承，一个新的接口或者类，从父类或者接口继承所有的属性和方法，不可以重写属性，但可以重写方法
class MutableReactiveHandler extends BaseReactiveHandler {
    constructor(isShallow = false) {
        super(false, isShallow)
    }

    // 数据更新新过程中对视图变化的响应操作
    set(
        target: object,
        key: string | symbol,
        value: unknown,
        receiver: object,
    ): boolean {
        // Reflect是反射 它提供拦截 JavaScript 操作的方法。这些方法与 proxy handler 的方法相同。Reflect 不是一个函数对象，因此它是不可构造的。Reflect.set设置值成功后会有结果，值为true
        // 详情https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect
        
        const result = Reflect.set(target, key, value, receiver)
        return result
    }

    deleteProperty(target: object, key: string | symbol): boolean {
        const result = Reflect.deleteProperty(target, key)
        return result
    }

    has(target: object, key: string | symbol): boolean {
        const result = Reflect.has(target, key)
        return result
    }

    ownKeys(target: object): (string | symbol)[] {
        return Reflect.ownKeys(target)
    }
}

// 只读的响应式代理对象的配置对象
class ReadonlyReactiveHandler extends BaseReactiveHandler {
    constructor(isShallow = false) {
        super(true, isShallow)
    }

    set(target: object, key: string | symbol) {    
        console.warn(`设置键“${String(key)}”操作失败:${String(target)}对象为只读。`)
        return true
    }

    deleteProperty(target: object, key: string | symbol) {
        console.warn(`删除键“${String(key)}”操作失败:${String(target)}对象为只读。`)
        return true
    }
}

export const mutableHandler: ProxyHandler<object> = new MutableReactiveHandler()

export const shallowReactiveHandler: ProxyHandler<object> = new MutableReactiveHandler(true)

export const readonlyHandler: ProxyHandler<object> = new ReadonlyReactiveHandler()

export const shallowReadonlyHandler: ProxyHandler<object> = new ReadonlyReactiveHandler(true)