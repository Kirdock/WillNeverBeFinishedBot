'use strict'
import { dataservice } from './services/dataservice.js';
import { authorization } from './services/autorization.js';


var app = new Vue({
    el: '#fetch',
    data: {
      servers: [],
      sounds: [],
      channels: [],
      soundCategories: [],
      volume: 0.5,
      selectedCategory: undefined,
      newCatInput: undefined,
      selectedServer: undefined,
      selectedCategory: undefined,
      selectedChannel: undefined,
      isAdmin: false,
      maxVolume: 1,
      loggedIn: false
    },
    methods: {
      createNewCat: function () {
        if(!this.soundCategories.includes(this.newCatInput)){
          dataservice.createNewCat(this.newCatInput).then(response =>{
            this.newCatInput = undefined;
            this.fetchCategories();
          }).catch(error =>{

          });
        }
      },
      fetchServers: function () {
        dataservice.fetchServers().then(response => {
            this.servers = response.data;
            this.selectedServer = this.servers[0].id;
            this.fetchChannels();
        })
        .catch(error =>{

        });
      },
      submitFile: function(){
        this.file = this.$refs.file.files[0];
        let formData = new FormData();
        formData.append('file', this.file);
        formData.append('category', this.selectedCategory);
        
        dataservice.uploadFile(formData)
        .then(response => {

        });
      },
      fetchCategories: function(){
          dataservice.fetchCategories().then(response => {
            this.soundCategories = [];
            response.data.forEach(category =>{
                this.soundCategories.push({name: category, show: false}); //vue.js does not recognize new elements. that's why I have to add "show"
            })
            this.selectedCategory = this.soundCategories[0].name;
          }).catch(error => {

          })
      },
      fetchChannels: function(){
          dataservice.fetchChannels(this.selectedServer).then(response =>{
              this.channels = response.data;
              this.selectedChannel = this.channels[0].id;
          }).catch(error => {

          });
      },
      fetchSounds: function(){
          dataservice.fetchSounds().then(response =>{
              this.sounds = response.data;
          }).catch(error =>{

          });
      },
      playSound: function(path){
          dataservice.playSound(path, this.selectedServer, this.selectedChannel, this.volume).then(response =>{

          }).catch(error =>{

          });
      },
      changeCategoryVisibility: function(category){
        category.show = !category.show;
      },
      setCategoriesVisibility: function(status){
        this.soundCategories.forEach(category =>(category.show = status));
      },
      updateWebsite: function(){
        dataservice.updateWebsite().then(response=>{
          console.log(response);
        }).catch(error =>{

        });
      },
      stopPlaying: function(){
        dataservice.stopPlaying(this.selectedServer).then(response =>{

        }).catch(error =>{

        })
      },
      updateServerList: function(){
        dataservice.updateServerList().then(servers =>{
          this.servers = servers.data;
        });
      }
    }
  });

  var appNav =  new Vue({
    el: '#nav',
    data: {
      username: undefined,
      isAdmin: false,
      loggedIn: false,
      loginLink: 'https://discordapp.com/api/oauth2/authorize?client_id=630064403525533706&redirect_uri='+getLocationEncoded()+'&response_type=code&scope=identify%20guilds'
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
        app.fetchServers();
        app.fetchCategories();
        app.fetchSounds();
      },
      setUserData: function(){
        const decodedToken = authorization.getDecodedToken();
        this.username = decodedToken.username;
        this.isAdmin = app.isAdmin = decodedToken.admin;
        if(this.isAdmin){
          app.maxVolume = 100;
        }
        this.loggedIn = app.loggedIn = true;
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