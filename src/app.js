'use strict'
import authorization from './services/autorization.js';
import dataservice from './services/dataservice.js';

  export default {
    name: 'App',
    data() {
        return{
            username: undefined,
            isAdmin: false,
            loggedIn: false,
            loginLink: 'https://discordapp.com/api/oauth2/authorize?client_id=630064403525533706&redirect_uri='+getLocationEncoded()+'&response_type=code&scope=identify%20guilds'
        }
    },
    methods: {
      checkCode(){
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
      fetchData(){
        this.setUserData();
      },
      setUserData(){
        const decodedToken = authorization.getDecodedToken();
        this.username = decodedToken.username;
        this.isAdmin = decodedToken.admin;
        this.loggedIn = true;
      },
      logout(){
        dataservice.logout().then(result =>{
          authorization.deleteToken();
          this.isAdmin = false;
          this.loggedIn = false;
        }).catch(error =>{

        });
      }
    },
    created(){
      this.checkCode();
    }
  };

  function removeQueryFromUrl() {
    window.history.pushState({}, document.title, window.location.href.split("?")[0]);
  }

  function getLocation(){
    return window.location.protocol+'//'+window.location.host+'/';
  }

  function getLocationEncoded(){
    return encodeURIComponent(getLocation());
  }

