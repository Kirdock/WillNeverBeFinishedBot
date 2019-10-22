import Vue from 'vue';
import App from './App.vue';
import router from './router';
import './services/injector';
import 'bootstrap';
import './assets/style.css';
import './assets/bootstrap.min.css';
import 'bootstrap-vue';
import { ToastPlugin } from 'bootstrap-vue';
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.config.productionTip = false;
Vue.use(ToastPlugin);

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
