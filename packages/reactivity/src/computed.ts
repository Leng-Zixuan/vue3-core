import { Dep } from "./dep";

/**
 * 在 Vue 3 的源码中，ComputedRefImpl 是计算属性的底层实现类之一。它是 ref 类型的计算属性的内部表示，用于处理那些返回基本类型值（如字符串、数字、布尔值等）的计算属性。ComputedRefImpl 内部effect 来自 ReactiveEffect 类的实现，因此它具有响应式副作用的所有特性，并且专门针对计算属性进行了优化。
 * 继承自 ReactiveEffect：ComputedRefImpl 继承了 ReactiveEffect 的所有功能，包括依赖追踪、懒求值、缓存机制等。这使得 ComputedRefImpl 可以作为计算属性的基础实现。
 * 处理基本类型的计算属性：ComputedRefImpl 主要用于处理返回基本类型值的计算属性。这意味着它适用于那些不依赖于复杂对象或数组的计算属性。
 * 值缓存：ComputedRefImpl 维护一个 value 属性，用于存储计算属性的当前值。这个值在计算属性被访问时返回，如果依赖项没有变化，Vue 将不会重新计算值，从而提高性能。
 * 优化性能：由于 ComputedRefImpl 专门用于处理基本类型的计算属性，它可以进行一些额外的性能优化。例如，它可以直接比较新旧值是否相等，而不需要进行深层比较，这可以减少不必要的计算和更新。
 * 响应式更新：当 ComputedRefImpl 的依赖项发生变化时，它会触发重新计算，并更新 value 属性。这个更新过程是响应式的，意味着如果计算属性的值发生变化，Vue 将确保视图得到相应的更新。
 */
export class ComputedRefImpl<T> {}
