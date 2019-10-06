'use strict'
import { dataservice } from './services/dataservice.js'

var app = new Vue({
    el: '#fetch',
    data: {
      servers: [],
      sounds: [],
      channels: [],
      soundCategories: [],
      selectedCategory: undefined,
      newCatInput: undefined,
      selectedServer: undefined,
      selectedCategory: undefined,
      selectedChannel: undefined
    },
    methods: {
      createNewCat: function () {
        if(!this.soundCategories.includes(this.newCatInput)){
          dataservice.createNewCat(this.newCatInput);
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
            this.soundCategories = response.data;
            this.selectedCategory = this.soundCategories[0];
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
          dataservice.playSound(path, this.selectedServer, this.selectedChannel).then(response =>{

          }).catch(error =>{
              
          });
      }
    },
    created: function (){
        this.fetchServers();
        this.fetchCategories();
        this.fetchSounds();
    }
  });

