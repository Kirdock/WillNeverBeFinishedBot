import Vue from 'vue';
import axios from 'axios';
import App from './App.vue';
import router from './router';
import 'bootstrap';
import './assets/bootstrap.min.css';
import 'bootstrap-vue';
import { ToastPlugin } from 'bootstrap-vue';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import config from './services/config';
import auth from './services/authentication'

Vue.prototype.$config = config;
Vue.prototype.$auth = auth;

Vue.config.productionTip = false;
Vue.use(ToastPlugin);
let instances = {};

axios.interceptors.request.use(function (config) {
  const token = auth.getToken();
  if(token){
      config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

axios.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  if(error.response.status === 401){
    auth.deleteToken();
    if(router.currentRoute.name !== 'Login'){
      if(instances.vue){
        instances.vue.authFail();
      }
      router.push({path:'/Login',params:{auth: true}});
    }
  }
  return Promise.reject(error);
});

instances.vue = new Vue({
  router,
  render: h => h(App),
  methods:{
    authFail(){
      this.$bvToast.toast(`Auth funktioniert net. I logg di mol aus`, {
        title: 'Fehler',
        autoHideDelay: this.$config.toastDelay,
        variant: 'danger',
        appendToast: true
      });
    }
  }
}).$mount('#app');

