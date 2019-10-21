'use strict'
import './services/injector';
import authorization from './services/autorization.js';
import dataservice from './services/dataservice.js';
import Vue from 'vue';
import VueRouter from 'vue-router';
import router from './services/routing.js';
import 'bootstrap';
import './assets/style.css';
import './assets/bootstrap.min.css';


Vue.use(VueRouter);
// new Vue({
//   router
// }).$mount('#app');

  export default new Vue({
    router: router,
    el: '#app',
    data: {
      username: undefined,
      isAdmin: false,
      loggedIn: false,
      loginLink: 'https://discordapp.com/api/oauth2/authorize?client_id=630064403525533706&redirect_uri='+getLocationEncoded()+'&response_type=code&scope=identify%20guilds'
    },
    computed: {
      ViewComponent () {
        return routes[this.currentRoute] || NotFound
      }
    },
    methods: {
      checkCode: function(){
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code && !authorization.isLoggedIn) {
          dataservice.login(code, getLocation()).then(response=>{
            authorization.setToken(response.data);
            this.fetchData();
            removeQueryFromUrl();
          }).catch(error =>{
            removeQueryFromUrl();
          });
        }
        else if(authorization.isLoggedIn){
            this.fetchData();
        }
        else if(code){
          removeQueryFromUrl();
        }
      },
      fetchData: function(){
        this.setUserData();
      },
      setUserData: function(){
        const decodedToken = authorization.getDecodedToken();
        this.username = decodedToken.username;
        this.isAdmin = decodedToken.admin;
        this.loggedIn = true;
      },
      logout: function(){
        dataservice.logout().then(result =>{
          authorization.deleteToken();
          this.isAdmin = false;
          this.loggedIn = false;
        }).catch(error =>{

        });
      }
    },
    created: function(){
      this.checkCode();
    }
  });

  function removeQueryFromUrl() {
    window.history.pushState({}, document.title, window.location.href.split("?")[0]);
  }

  function getLocation(){
    return window.location.protocol+'//'+window.location.host+'/';
  }

  function getLocationEncoded(){
    return encodeURIComponent(getLocation());
  }

