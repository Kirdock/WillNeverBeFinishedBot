'use strict'
import { dataservice } from './services/dataservice.js';
import { authorization } from './services/autorization.js';
import { settings } from './services/settings.js';


var app = new Vue({
    el: '#fetch',
    data: {
      servers: [],
      sounds: [],
      channels: [],
      soundCategories: [],
      logs: [],
      volume: 0.5,
      selectedCategory: undefined,
      newCatInput: undefined,
      selectedServer: undefined,
      selectedCategory: undefined,
      selectedChannel: undefined,
      isAdmin: false,
      maxVolume: 1,
      loggedIn: false,
      joinUser: true,
      youtubeUrl: undefined,
      searchText: ''
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
      fetchServers: function (loadChannels) {
        return dataservice.fetchServers().then(response => {
            this.servers = response.data;
            this.selectedServer = this.servers[0].id;
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
                this.soundCategories.push({name: category, show: true}); //vue.js does not recognize new elements. that's why I have to add "show"
            })
            this.selectedCategory = this.soundCategories[0].name;
          }).catch(error => {

          })
      },
      fetchChannels: function(){
          return dataservice.fetchChannels(this.selectedServer).then(response =>{
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
        const data = {
          path: path,
          serverId: this.selectedServer,
          channelId: this.selectedChannel,
          volume: this.volume,
          joinUser: this.joinUser,
          url: this.youtubeUrl
        }
        dataservice.playSound(data).then(response =>{

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
      saveSettings: saveSettings,
      stopPlaying: function(){
        dataservice.stopPlaying(this.selectedServer).then(response =>{

        }).catch(error =>{

        })
      },
      updateServerList: function(){
        dataservice.updateServerList().then(servers =>{
          this.servers = servers.data;
        });
      },
      filteredSounds: function(categoryName){
        if(this.searchText.length > 0){
          const re = new RegExp(this.searchText,'i');
          return this.sounds[categoryName].filter(server => re.test(server.name));
        }
        else{
          return this.sounds[categoryName];
        }
      },
      fetchLogs: function(){
        dataservice.fetchLogs().then(response =>{
          this.logs = response.data;
        }).catch(error =>{

        })
      },
      formatTime: function(time){
        const date = new Date(time);
        return date.toLocaleDateString() + '  ' + date.toLocaleTimeString();
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
        app.fetchServers().then(response =>{
          loadSettings();
        });
        app.fetchCategories();
        app.fetchSounds();
        if(authorization.getDecodedToken().admin){
          app.fetchLogs();
        }
      },
      setUserData: function(){
        const decodedToken = authorization.getDecodedToken();
        this.username = decodedToken.username;
        this.isAdmin = app.isAdmin = decodedToken.admin;
        if(this.isAdmin){
          app.maxVolume = 100;
        }
        this.loggedIn = app.loggedIn = true;
      },
      logout: function(){
        dataservice.logout().then(result =>{
          authorization.deleteToken();
          this.isAdmin = app.isAdmin = false;
          this.loggedIn = app.loggedIn = false;
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

  function saveSettings(){
    const data = {
      selectedServer: app.selectedServer,
      selectedChannel: app.selectedChannel,
      joinUser: app.joinUser,
      volume: app.volume
    }
    settings.save(data);
  }

  function loadSettings(){
    const data = settings.load();
    if(data){
      if(containsServer(data.selectedServer)){
        app.selectedServer = data.selectedServer;
        app.fetchChannels().then(response =>{
          if(containsChannel(data.selectedChannel)){
            app.selectedChannel = data.selectedChannel;
          }
        })
      }
      
      app.volume = data.volume;
      app.joinUser = data.joinUser;
    }
    else{
      app.fetchChannels();
    }
  }

  function containsServer(serverId){
    return arrayContainsId(app.servers,serverId);
  }

  function containsChannel(channelId){
    return arrayContainsId(app.channels,channelId);
  }

  function arrayContainsId(array, id){
    let status = false;
    for(let i = 0; i < array.length; i++){
      if(array[i].id == id){
        status = true;
        break;
      }
    }
    return status;
  }