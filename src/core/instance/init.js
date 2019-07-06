/* @flow */

import config from '../config'
import {
  initProxy
} from './proxy'
import {
  initState
} from './state'
import {
  initRender
} from './render'
import {
  initEvents
} from './events'
import {
  mark,
  measure
} from '../util/perf'
import {
  initLifecycle,
  callHook
} from './lifecycle'
import {
  initProvide,
  initInjections
} from './inject'
import {
  extend,
  mergeOptions,
  formatComponentName
} from '../util/index'

let uid = 0

//初始化Vue全局minix属性
export function initMixin(Vue: Class < Component > ) {
  //居然在这里定义了vue的_init属性
  Vue.prototype._init = function (options ? : Object) {
    const vm: Component = this
    //初始化第一个Vue对象的Uid为1
    // a uid
    vm._uid = uid++

    //有关性能测试
    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    //设置一个flag来避免Vue实例被观察到（不是很懂这里具体的含义）
    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    //step1.如果是组件的话，就将父组件和子组件的options进行自定义merge
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    //step2.设置render代理（只是一些可能出错的提示，只在开发环境出现）
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    //step3.初始化生命周期
    initLifecycle(vm)
    //step4.初始化事件监听
    initEvents(vm)
    //step5.编译render
    initRender(vm)
    //step6.回调beforeCreate钩子
    callHook(vm, 'beforeCreate')
    //step7.在初始化data/props之前绑定vm？
    initInjections(vm) // resolve injections before data/props
    //step8.初始化state
    initState(vm)
    //step9.初始化provide
    initProvide(vm) // resolve provide after data/props
    //step10.回调created钩子
    callHook(vm, 'created')

    //性能测试
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    //step11. 如果有el选项，就执行mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

//初始化组件的一些属性（主要是和父组件相关的）
export function initInternalComponent(vm: Component, options: InternalComponentOptions) {
  //继承父对象的options属性
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  //标注父对象的属性
  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

//递归解析构造对象及其父对象的所有options
export function resolveConstructorOptions(Ctor: Class < Component > ) {
  let options = Ctor.options
  //判断是否是Vue的子对象
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    //判断父对象中的Options有没有变化
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

//解析被改变的options
function resolveModifiedOptions(Ctor: Class < Component > ): ? Object {
  let modified
  const latest = Ctor.options
  const extended = Ctor.extendOptions
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = dedupe(latest[key], extended[key], sealed[key])
    }
  }
  return modified
}

//应该是删去重复的options
function dedupe(latest, extended, sealed) {
  // compare latest and sealed to ensure lifecycle hooks won't be duplicated
  // between merges
  if (Array.isArray(latest)) {
    const res = []
    sealed = Array.isArray(sealed) ? sealed : [sealed]
    extended = Array.isArray(extended) ? extended : [extended]
    for (let i = 0; i < latest.length; i++) {
      // push original options and not sealed options to exclude duplicated options
      if (extended.indexOf(latest[i]) >= 0 || sealed.indexOf(latest[i]) < 0) {
        res.push(latest[i])
      }
    }
    return res
  } else {
    return latest
  }
}
