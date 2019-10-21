'use strict'
import dataservice from './services/dataservice.js';
import authorization from './services/autorization.js';
import { settings } from './services/settings.js';
import Vue from 'vue';

export default {
    data() {
      return{
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
        joinUser: true,
        youtubeUrl: undefined,
        searchText: ''
      }
    },
    created(){
        this.fetchServers().then(response =>{
            loadSettings();
            const decodedToken = authorization.getDecodedToken();
            if(decodedToken){
              this.username = decodedToken.username;
              this.isAdmin = decodedToken.admin;
              if(this.isAdmin){
                  this.maxVolume = 100;
              }
            }
        });
        this.fetchCategories();
        this.fetchSounds();
        if(authorization.isAdmin){
            this.fetchLogs();
        }
    },
    methods: {
      createNewCat() {
        if(!this.soundCategories.includes(this.newCatInput)){
          dataservice.createNewCat(this.newCatInput).then(response =>{
            this.newCatInput = undefined;
            this.fetchCategories();
          }).catch(error =>{

          });
        }
      },
      fetchServers(loadChannels) {
        return dataservice.fetchServers().then(response => {
            this.servers = response.data;
            this.selectedServer = this.servers[0].id;
        })
        .catch(error =>{

        });
      },
      submitFile(){
        this.file = this.$refs.file.files[0];
        let formData = new FormData();
        formData.append('file', this.file);
        formData.append('category', this.selectedCategory);
        
        dataservice.uploadFile(formData)
        .then(response => {

        });
      },
      fetchCategories(){
          dataservice.fetchCategories().then(response => {
            this.soundCategories = [];
            response.data.forEach(category =>{
                this.soundCategories.push({name: category, show: true}); //vue.js does not recognize new elements. that's why I have to add "show"
            })
            this.selectedCategory = this.soundCategories[0].name;
          }).catch(error => {

          })
      },
      fetchChannels(){
          return dataservice.fetchChannels(this.selectedServer).then(response =>{
              this.channels = response.data;
              this.selectedChannel = this.channels[0].id;
          }).catch(error => {

          });
      },
      fetchSounds(){
          dataservice.fetchSounds().then(response =>{
              this.sounds = response.data;
          }).catch(error =>{

          });
      },
      playSound(path){
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
      changeCategoryVisibility(category){
        category.show = !category.show;
      },
      setCategoriesVisibility(status){
        this.soundCategories.forEach(category =>(category.show = status));
      },
      updateWebsite(){
        dataservice.updateWebsite().then(response=>{
          console.log(response);
        }).catch(error =>{

        });
      },
      saveSettings: saveSettings,
      stopPlaying(){
        dataservice.stopPlaying(this.selectedServer).then(response =>{

        }).catch(error =>{

        })
      },
      updateServerList(){
        dataservice.updateServerList().then(servers =>{
          this.servers = servers.data;
        });
      },
      filteredSounds(categoryName){
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
  };


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