import { NOOP } from "@vue/shared";
import type { Dep } from "./dep";
import { type EffectScope } from "./effectScope";
import type { ComputedRefImpl } from "./computed";
import {} from "./constants";

export type EffectScheduler = (...args: any[]) => any;

export let activeEffect: ReactiveEffect | undefined;

export class ReactiveEffect<T = any> {
  /**
   * active表示响应式依赖是否处于活动状态,当 ReactiveEffect 被创建时，这个值默认为 true
   */
  active = true;

  /**
   * deps是一个包含所有响应式依赖的数组。当这些依赖的状态发生变化时，ReactiveEffect 会自动重新运行
   */
  deps: Dep[] = [];

  /**
   * Can be attached after creation
   * @internal
   */
  computed?: ComputedRefImpl<T>;

  /**
   * allowRecurse允许开发者在计算属性或观察者中递归地调用它们自己。在某些特定场景下，计算属性或观察者可能需要重新计算或重新运行，即使它们当前正在执行。默认情况下，Vue 会阻止这种递归调用，以避免潜在的无限循环和性能问题。然而，在某些情况下，开发者可能需要允许这种递归行为。

   * 递归调用控制：allowRecurse 属性控制是否允许响应式副作用（如计算属性）在其自身的执行过程中递归调用。默认情况下，这个属性被设置为 false，以防止无限循环。

   * 条件性递归：在某些复杂的逻辑中，可能需要在计算属性的计算过程中根据某些条件重新计算。当 allowRecurse 设置为 true 时，可以允许这种递归调用，但开发者需要确保递归调用有一个明确的退出条件，以避免无限循环。

   * 性能考虑：虽然 allowRecurse 提供了递归调用的能力，但开发者应谨慎使用，因为这可能会导致性能问题。递归调用会增加计算属性的执行次数，从而增加响应式系统的负担。因此，只有在确实需要时才应该启用递归，并且要确保递归的深度受到严格控制。

   * 内部机制：allowRecurse 是 Vue 响应式系统内部的一个机制，通常情况下，开发者不需要直接操作这个属性。Vue 的响应式系统会自动处理大多数情况，确保响应式数据的更新和计算属性的执行是安全和高效的。

   * 调试和错误处理：在开发和调试过程中，allowRecurse 可以帮助开发者识别和解决递归调用相关的问题。如果计算属性或观察者的行为不符合预期，检查 allowRecurse 的设置可能是一个有用的调试步骤。

   * @internal 
   *
   */
  allowRecurse?: boolean;

  /**
   * onStop是一个在响应式依赖停止时调用的函数，它通常用于执行一些清理工作，例如移除事件监听器。
   */
  onStop?: () => void;

  /**
   * _trackId用于标识和追踪响应式依赖的创建和运行，以确保 Vue 能够准确地知道何时以及如何响应数据的变化。
    
   * 唯一标识：_trackId 为每个 ReactiveEffect 实例提供了一个唯一的标识符。这个标识符在响应式系统中用于区分不同的依赖项和副作用实例。

   * 依赖追踪：当 ReactiveEffect 实例运行时，它会使用 _trackId 来标记当前正在追踪的依赖项。这样，当响应式数据源（如 ref 或 reactive 对象）被访问时，它们可以识别是哪个 ReactiveEffect 实例正在追踪它们，并据此更新依赖列表。

   * 避免循环依赖：_trackId 有助于避免响应式系统中的循环依赖问题。如果一个 ReactiveEffect 实例试图在同一个追踪周期内再次运行，Vue 可以使用 _trackId 来检测这种情况，并阻止进一步的运行，从而避免无限循环。

   * 优化性能：通过使用 _trackId，Vue 可以更有效地管理依赖项和副作用的生命周期。例如，如果一个 ReactiveEffect 实例不再需要，Vue 可以快速地识别出该实例的依赖项，并停止追踪它们，从而释放资源并提高性能。

   * 调试和错误报告：在开发环境中，_trackId 可以用于提供更详细的调试信息。例如，如果开发者在追踪响应式数据时遇到问题，_trackId 可以帮助他们识别是哪个 ReactiveEffect 实例导致了问题
   * @internal
   */
  _trackId = 0;

  /**
   * @internal
   * _runnings用于跟踪当前正在运行的响应式副作用（effects）的数量。这个属性对于确保响应式系统的一致性和避免潜在的无限循环至关重要。
   * 避免无限循环：在某些情况下，响应式副作用可能会相互依赖，从而创建一个循环依赖。例如，两个响应式变量可能会互相影响对方的值。在这种情况下，_runnings 属性可以帮助 Vue 跟踪当前正在运行的副作用数量，如果检测到副作用正在无限循环，Vue 可以中断这个循环，防止无限循环导致的性能问题。
   * 确保依赖项正确更新：当一个响应式变量被修改时，所有依赖于这个变量的响应式副作用都需要重新运行。_runnings 属性确保 Vue 能够正确地追踪这些副作用的运行状态，以便在依赖项发生变化时，Vue 知道是否需要重新运行这些副作用。
   * 调度更新：_runnings 属性还可以帮助 Vue 调度更新。在某些情况下，Vue 可能需要将更新延迟到当前的事件循环之后，以避免在同一个事件循环中多次更新 DOM。通过跟踪正在运行的副作用数量，Vue 可以决定是否需要延迟更新。
   * 调试和性能优化：_runnings 属性还可以用于调试和性能优化。开发者可以通过检查 _runnings 的值来识别响应式系统中的潜在问题，例如循环依赖或不必要的多次运行。此外，_runnings 也可以帮助 Vue 优化更新策略，减少不必要的计算和 DOM 更新。
   * 内部机制：_runnings 是 Vue 响应式系统的一个内部机制，开发者通常不需要直接与之交互。Vue 的响应式系统会自动管理 _runnings，确保响应式副作用的正确运行和更新。
   */
  _runnings = 0;

  /**
   * _depsLength 属性是一个内部属性，用于存储当前 ReactiveEffect 实例所依赖的响应式源（deps）的数量。这个属性对于管理响应式依赖和优化性能至关重要。

   * 依赖追踪：_depsLength 属性直接反映了 ReactiveEffect 实例所依赖的响应式源的数量。这个信息对于响应式系统来说是必要的，因为它需要知道哪些响应式数据的变化可能会触发副作用的重新运行。

   * 性能优化：通过追踪依赖的数量，Vue 可以对响应式系统进行性能优化。例如，如果一个 ReactiveEffect 实例依赖了大量的响应式源，Vue 可能会采取不同的策略来优化其运行和更新，以减少不必要的计算和内存消耗。

   * 依赖更新：当响应式源的状态发生变化时，ReactiveEffect 需要根据依赖的数量来决定是否重新运行。_depsLength 属性提供了这个决策所需的信息，帮助 Vue 确定是否需要执行副作用函数。

   * 内存管理：_depsLength 属性也有助于内存管理。当一个 ReactiveEffect 实例不再被使用时，Vue 可以通过 _depsLength 来确定需要清除多少依赖关系，从而避免内存泄漏。

   * 内部机制：_depsLength 是 Vue 响应式系统内部的一个机制，开发者通常不需要直接与之交互。Vue 的响应式系统会自动管理 _depsLength，确保响应式依赖的正确追踪和更新。

   * 调试和分析：在开发和调试过程中，_depsLength 属性可以提供有用的信息，帮助开发者理解响应式系统的工作原理，以及他们的代码是如何与响应式系统交互的。

   * @internal
   */
  _depsLength = 0;

  constructor(
    public fn: () => T,
    public trigger: () => void,
    public scheduler?: EffectScheduler,
    scope?: EffectScope
  ) {}

  /**
   *  用于手动触发 ReactiveEffect 的副作用函数。通常，这是内部使用的，但在某些高级用例中，开发者可能需要直接调用它来强制更新依赖项
   */
  run() {
    let lastEffect = activeEffect;
    try {
      shouldTrack = true;
      activeEffect = this;
      this._runnings++;
      preCleanupEffect(this);
      return this.fn();
    } finally {
    }
  }

  /**
   * 用于停止 ReactiveEffect。调用此方法后，ReactiveEffect 将不再追踪其依赖项，也不会再次运行。
   */
  stop() {
    if (this.active) {
      preCleanupEffect(this);
      postCleanupEffect(this);
      this.onStop?.();
      this.active = false;
    }
  }
}

export interface ReactiveEffectOptions {
  lazy?: boolean;
}

export interface ReactiveEffectRunner<T = any> {
  (): T;
  effect: ReactiveEffect;
}

/**
 * effect 函数是一个核心概念，用于创建响应式副作用（effects）。它是 ReactiveEffect 类的一个实例方法，通常在响应式系统内部被调用，以确保当响应式状态变化时，相关的副作用能够被触发执行。
 * 响应式追踪：effect 函数使得开发者能够定义一个依赖于响应式状态的函数。当这个函数被调用时，它会追踪所有在函数内部访问的响应式状态。如果这些状态中的任何一个发生变化，effect 函数将会重新运行。

 * 副作用执行：effect 函数允许开发者定义副作用逻辑，这些逻辑可以是数据获取、DOM 更新、状态修改等。当响应式状态变化时，Vue 会自动执行这些副作用，确保应用状态与数据保持同步。

 * 依赖项管理：effect 函数内部维护了一个依赖项列表，记录了所有在函数执行过程中被访问的响应式状态。Vue 使用这个列表来确定何时需要重新执行 effect 函数。

 * 性能优化：effect 函数支持懒求值和缓存机制。只有当依赖的响应式状态发生变化时，effect 函数才会重新执行。这有助于减少不必要的计算和更新，提高应用性能。

 * 停止和重启：effect 函数返回一个停止函数（cleanup function），允许开发者在适当的时候停止响应式追踪。当组件被销毁或者不再需要该 effect 时，可以使用这个停止函数来清理资源。同时，如果需要，effect 也可以在新的依赖项上重新启动。

 * 内部实现：effect 函数是 Vue 3 响应式系统的内部实现细节之一。开发者通常不需要直接调用这个函数，而是通过 Vue 提供的 API（如 ref、reactive、computed 和 watch）来创建和管理响应式状态和副作用。
 * @param fn function
 * @param options ReactiveEffectOptions
 */
export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const _effect = new ReactiveEffect(fn, NOOP, () => {});

  if (!options || !options.lazy) {
    _effect.run();
  }
}

/**
 * 控制是否应该追踪当前正在访问的响应式状态。这个变量是在 ReactiveEffect 类的上下文中使用的，用于优化性能和避免不必要的依赖追踪。

 * 优化追踪：shouldTrack 变量帮助 Vue 3 的响应式系统决定是否需要将当前操作视为一个有效的依赖追踪点。在某些情况下，可能不需要追踪特定的状态访问，例如，当计算属性的值被用于条件判断而不是直接用于渲染时。

 * 避免不必要的更新：通过使用 shouldTrack，Vue 可以避免在不需要时触发响应式更新。这有助于减少不必要的计算和 DOM 更新，从而提高应用的性能。

 *  条件性追踪：shouldTrack 变量通常与特定的条件逻辑结合使用，以确定是否应该追踪某个响应式状态。例如，它可能被设置为 false，以避免在计算属性的 getter 中追踪那些不会影响最终结果的状态访问。

 *  内部实现细节：shouldTrack 是 Vue 3 响应式系统的内部实现细节之一。开发者通常不需要直接操作这个变量，因为它是由 Vue 的响应式系统自动管理的。

 *  防止副作用的递归调用：在某些复杂的响应式逻辑中，可能会发生计算属性或观察者函数递归调用自身的情况。在这种情况下，shouldTrack 可以帮助防止无限循环的副作用调用，通过暂时停止追踪直到当前的副作用调用完成。

 * 调试和维护：虽然 shouldTrack 变量对于开发者来说是不可见的，但它在 Vue 3 的源码中有助于维护和调试响应式系统的行为。了解这个变量的存在和作用可以帮助开发者更好地理解 Vue 的内部工作机制/
 */
export let shouldTrack = true;

/**
 * preCleanupEffect 是一个内部函数，与 ReactiveEffect 类相关联。这个函数的主要作用是在 ReactiveEffect 实例的清理函数（cleanup function）被调用之前执行一些预先的清理工作。

 * 清理前的准备：preCleanupEffect 通常在 ReactiveEffect 实例的清理函数被执行之前调用。它可以用来执行一些必要的清理操作，例如移除事件监听器、取消定时器或其他异步操作，以确保在主要清理函数执行之前，所有相关的资源都已经被正确处理。

 * 避免潜在问题：通过在清理函数执行之前运行 preCleanupEffect，Vue 可以确保在实际清理响应式引用或计算属性之前，所有的副作用都已经停止，从而避免潜在的内存泄漏或其他问题。

 * 优化性能：preCleanupEffect 函数也可以用来优化性能。例如，它可以用来移除不再需要的依赖追踪，或者清理那些不再需要的缓存数据，从而减少内存占用并提高应用的整体性能。

 * 内部实现细节：preCleanupEffect 是 Vue 响应式系统的内部实现细节之一。开发者通常不需要直接调用或操作这个函数，因为它是由 Vue 的响应式系统自动管理的。

 * 确保数据一致性：在某些复杂的响应式场景中，可能需要在清理响应式数据之前执行一些同步操作。preCleanupEffect 函数可以用来确保这些操作在数据被清理之前完成，从而保持应用的数据一致性。

 * 错误处理和调试：在开发和调试过程中，preCleanupEffect 函数可以帮助开发者识别和解决响应式系统中的潜在问题。通过检查 preCleanupEffect 的执行情况，开发者可以更好地理解响应式系统的清理过程，并确保资源被正确管理。
 * @param effect ReactiveEffect
 */
function preCleanupEffect(effect: ReactiveEffect) {
  effect._trackId++;
  effect._depsLength = 0;
}

/**
 * postCleanupEffect 是一个内部概念，通常与 ReactiveEffect 类相关联，用于在响应式副作用（effect）完成清理后执行一些后续操作。这个概念有助于确保响应式系统的清理过程是完整和正确的，同时也处理了一些与清理相关的边缘情况。

 * 清理后的收尾工作：postCleanupEffect 函数在 ReactiveEffect 实例的清理函数（cleanup function）执行完毕后被调用。它可以用来执行一些清理后的收尾工作，比如确保所有的订阅和监听器都被移除，或者处理一些可能在清理过程中遗留的问题。

 * 确保依赖项的移除：在响应式系统中，副作用可能会依赖于多个响应式引用。postCleanupEffect 确保这些依赖项在清理过程中被正确移除，防止内存泄漏或其他潜在问题。

 * 处理异步操作：在某些情况下，响应式副作用可能涉及异步操作，如网络请求或定时器。postCleanupEffect 可以用来确保这些异步操作在清理时被正确处理，例如通过取消未完成的请求。

 * 维护响应式系统的一致性：postCleanupEffect 有助于维护响应式系统的一致性。它确保在副作用被清理后，系统的状态是一致的，没有残留的副作用或依赖项。

 * 内部实现细节：postCleanupEffect 是 Vue 响应式系统的内部实现细节之一。开发者通常不需要直接调用或操作这个概念，因为它是由 Vue 的响应式系统自动管理的。

 * 错误处理和调试：在开发和调试过程中，postCleanupEffect 可以提供有用的信息，帮助开发者理解响应式系统的清理过程，并确保资源被正确管理。
 * @param effect ReactiveEffect
 */
function postCleanupEffect(effect: ReactiveEffect) {
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanupDepEffect(effect.deps[i], effect);
    }
    effect.deps.length = effect._depsLength;
  }
}

/**
 * cleanupDepEffect 是一个内部方法，通常与 ReactiveEffect 类相关联。这个方法的主要作用是在响应式依赖项不再需要时执行清理工作。这通常是因为响应式数据的上下文发生了变化，例如组件被销毁或者响应式数据不再被使用。

 * 依赖项清理：当一个响应式数据的依赖项不再需要时，cleanupDepEffect 方法会被调用。它的任务是确保所有与这些依赖项相关的资源和监听器都被适当地移除，防止内存泄漏。

 * 维护响应式系统的健康：通过清理不再需要的依赖项，cleanupDepEffect 有助于保持响应式系统的健康和效率。它可以确保系统不会因为残留的监听器或订阅而变得臃肿。

 * 优化性能：cleanupDepEffect 方法的执行有助于优化 Vue 应用的性能。通过及时清理不再需要的依赖项，可以减少不必要的计算和更新，从而提高应用的运行效率。

 * 内部实现细节：cleanupDepEffect 是 Vue 响应式系统的内部实现细节之一。开发者通常不需要直接调用或操作这个方法，因为它是由 Vue 的响应式系统自动管理的。

 * 错误处理和调试：在开发和调试过程中，了解 cleanupDepEffect 方法的存在和作用可以帮助开发者更好地理解响应式系统的工作原理，并确保资源被正确管理。

 * 响应式数据的生命周期管理：cleanupDepEffect 方法是响应式数据生命周期管理的一部分。它确保在响应式数据不再被使用时，相关的依赖项能够被及时清理，从而维护应用的响应性和稳定性。
 * @param dep 
 * @param effect 
 */
function cleanupDepEffect(dep: Dep, effect: ReactiveEffect) {
  const trackId = dep.get(effect);
  if (trackId !== undefined && effect._trackId !== trackId) {
    dep.delete(effect);
    if (dep.size === 0) {
      dep.cleanup();
    }
  }
}
