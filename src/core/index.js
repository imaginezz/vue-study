//入口程序
//vue函数本体所在
import Vue from './instance/index'
//global api初始化模块
import {
  initGlobalAPI
} from './global-api/index'
//用来判断是不是SSR,env文件里还包含很多判断运行环境的方法
import {
  isServerRendering
} from 'core/util/env'
//virtualDom编译成renderContext的方法
import {
  FunctionalRenderContext
} from 'core/vdom/create-functional-component'

//首先初始化全局API，就是Vue官网的全局API里的那些
//https://cn.vuejs.org/v2/api/#%E5%85%A8%E5%B1%80-API
initGlobalAPI(Vue)

//为Vue原型添加$isServer属性
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

//然后再添加$ssrContext属性(还不是很懂)
Object.defineProperty(Vue.prototype, '$ssrContext', {
  get() {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

//添加FunctionalRenderContext方法
// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})

//vue版本，还不知道从哪里获得
Vue.version = '__VERSION__'

export default Vue
