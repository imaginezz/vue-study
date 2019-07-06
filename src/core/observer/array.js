/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import {
  def
} from '../util/index'

//获取原生数组的原型
const arrayProto = Array.prototype
//新建数组对象，修改该对象中的方法，防止污染原生数组的原型
export const arrayMethods = Object.create(arrayProto)

//需要添加响应式的方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

//对数组原型中的这些方法进行重写，主要是拦截原型中的方法，然后监听变化，并执行原生方法，最后dep通知关联的所有观察者进行响应式处理
//但是修改了数组的原生方法以后我们还是没法像原生数组一样直接通过数组的下标或者设置length来修改数组，可以通过Vue.set以及splice方法。
/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  //缓存原生方法
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator(...args) {
    //调用原生方法
    const result = original.apply(this, args)
    const ob = this.__ob__
    // 数组新插入的元素需要重新进行observe才能响应式
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    //dep通知所有注册的观察者进行响应式处理
    ob.dep.notify()
    return result
  })
})
