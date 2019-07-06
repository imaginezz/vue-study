/* @flow */

import {
  toArray
} from '../util/index'

//初始化Vue.use方法
export function initUse(Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    //初始化Vue._installedPlugins数组
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    //如果初始化过，就直接返回
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    //根据参数初始化plugin，调用插件的install方法或直接调用插件函数本身
    const args = toArray(arguments, 1)
    args.unshift(this)
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
