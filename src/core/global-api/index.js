/* @flow */

//全局配置
import config from '../config'
//全局方法use的初始化函数
import {
  initUse
} from './use'
//全局方法mixin的初始化函数
import {
  initMixin
} from './mixin'
//全局方法extend的初始化函数
import {
  initExtend
} from './extend'
//component/directive/filter的注册器
import {
  initAssetRegisters
} from './assets'
//全局方法set/delete的初始化函数
import {
  set,
  del
} from '../observer/index'
//引入component/directive/filte
import {
  ASSET_TYPES
} from 'shared/constants'
//引入内部组件（现在只有keep-alive）
import builtInComponents from '../components/index'
//另外一些全局API的初始化函数，有一些暂时不对外开放
import {
  warn,
  //这个extend函数不是vue的extend全局API，但是初始化extend API的时候会用到extend函数
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI(Vue: GlobalAPI) {
  //将全局配置置入到Vue的config属性中去(Vue.config)
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  //这些API暂时不当作全局API的一部分，使用有风险(Vue.util)
  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  //这里定义了全局API(Vue.set Vue.delete Vue.nextTick)
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  //定义Vue自带的各种资源(Vue.options)，以后会很重要，Vue初始化时候会向其中添加很多东西
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  //将Vue的内置组件合并到Vue的组件列表中去
  extend(Vue.options.components, builtInComponents)

  //初始化另外一些API函数
  //Vue.use
  initUse(Vue)
  //Vue.mixin
  initMixin(Vue)
  //vue.extend
  initExtend(Vue)
  //拓展component/directive/filter的方法(Vue.component Vue.directive Vue.filter)
  initAssetRegisters(Vue)
}
