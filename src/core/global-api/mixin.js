/* @flow */

import {
  mergeOptions
} from '../util/index'

//定义Vue.mixin,将其它资源混入Vue.options中
export function initMixin(Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
