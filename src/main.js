import Vue from 'vue';
import App from './App.vue';
import router from './router';
import './services/injector';
import 'bootstrap';
import './assets/style.css';
import './assets/bootstrap.min.css';

Vue.config.productionTip = false;

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
