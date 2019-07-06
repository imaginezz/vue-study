/* @flow */

// watcher是一个观察者对象
import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  noop
} from '../util/index'

import {
  traverse
} from './traverse'
import {
  queueWatcher
} from './scheduler'
import Dep, {
  pushTarget,
  popTarget
} from './dep'

import type {
  SimpleSet
} from '../util/index'

let uid = 0

//观察者解析表达式，收集依赖关系，并且在表达式值改变的时候进行回调。用于$watch API和directive指令
/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array < Dep > ;
  newDeps: Array < Dep > ;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ? Function;
  getter: Function;
  value: any;

  constructor(
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options ? : ? Object,
    isRenderWatcher ? : boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    //_watchers存放所有订阅者的实例
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers

    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()

    this.expression = process.env.NODE_ENV !== 'production' ?
      expOrFn.toString() :
      ''
    //将表达式expOrFn解析成getter
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    this.value = this.lazy ?
      undefined :
      this.get()
  }

  //获得getter的值，并重新进行依赖的收集（说实话没看懂）
  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get() {
    //将自身watcher观察者实例设置给Dep.target，用以依赖收集
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      //如果存在deep，则触发每个深层对象的依赖，追踪其变化
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        //递归每一个对象或者数组，触发它们的getter，使得对象或数组的每一个成员都被依赖收集，形成一个“深（deep）”依赖关系
        traverse(value)
      }
      //将观察者实例从target栈中取出并设置给Dep.target
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  //添加一个依赖关系
  /**
   * Add a dependency to this directive.
   */
  addDep(dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  //清理依赖关系收集
  /**
   * Clean up for dependency collection.
   */
  cleanupDeps() {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  //订阅者接口，当依赖发生变化时进行回调
  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update() {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
      //同步直接执行run
    } else if (this.sync) {
      this.run()
      //异步推送到观察者队列中，由订阅者调用
    } else {
      queueWatcher(this)
    }
  }

  //订阅者接口，会被scheduler调用
  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run() {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        //即使value相同，拥有deep属性的观察者以及在对象／数组上的观察者应该被触发更新，因为它们的值可能发生改变
        isObject(value) ||
        this.deep
      ) {
        // set new value
        //设置新的值
        const oldValue = this.value
        this.value = value
        //触发回调，渲染视图
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  //获取观察者的值
  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate() {
    this.value = this.get()
    this.dirty = false
  }

  //收集该watcher的所有deps依赖
  /**
   * Depend on all deps collected by this watcher.
   */
  depend() {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  //将自身从所有依赖的订阅者列表中删除
  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown() {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
