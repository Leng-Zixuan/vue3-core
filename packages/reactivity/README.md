# @vue/reactivity
Vue 的响应式系统的核心功能。这个包不仅被内嵌到 Vue 的用户面对的渲染器构建中（例如 @vue/runtime-dom），还作为一个独立的包发布，可以单独被第三方引用。

reactivity 提供了创建和管理响应式数据的方法，这是 Vue 框架能够实现数据变化自动更新视图的关键。它利用了 JavaScript ES6中的Proxy 对象来实现对对象属性的监听，也利用了 JavaScript Getter和Setter 属性访问器来实现对基本类型属性的监听，从而能够检测到属性的变化并触发相应的更新。

reactivity 是 Vue 3 响应式系统的基础，它提供了创建和管理响应式数据的能力，使得开发者能够更容易地构建出能够响应数据变化的应用程序