<template>
    <div class="container" style="margin-top:50px">
        <div id="fetch" class="form-horizontal" >
            <button type="button" class="btn btn-primary" v-on:click="updateWebsite()" v-if="isAdmin">Update Website</button>
            <h1 class="control-label">Server</h1>
            <div class="input-group">
                <select class="form-control" v-model="selectedServer" @change="fetchChannels(); saveSettings()">
                    <option v-for="server in servers" :value="server.id" :key="server.id">
                        {{server.name}}
                    </option>
                </select>
                <button type="button" class="btn btn-primary col-md-2" v-on:click="updateServerList()">Update Serverlist</button>
            </div>

            <h1>Sound Upload</h1>

            <div class="form-group">
                <label class="control-label">Create new Category</label>
                <div class="input-group">
                    <input class="form-control col-md-10" v-model="newCatInput">
                    <button type="button" class="btn btn-primary col-md-2" id="newCat" v-on:click="createNewCat()">Create New Cat</button>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label">Choose sound category</label>
                <div class="input-group">
                    <select class="form-control" v-model="selectedCategory">
                        <option v-for="category in soundCategories" :value="category.name" :key="category">
                            {{category.name}}
                        </option>
                    </select>
                    <label class="btn btn-primary col-md-2 finger">
                        Browse.. <input type="file" style="display:none" id="file" ref="file" accept="audio/*" v-on:change="submitFile()"/>
                    </label>
                </div>
            </div>
                
            <h1>Play Sounds</h1>
            <div class="form-group ">
                <label class="control-label">Choose Channel</label>
                <select class="form-control" v-model="selectedChannel"  @change="saveSettings()">
                    <option v-for="channel in channels" :value="channel.id" :key="channel">
                        {{channel.name}}
                    </option>
                </select>
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="joinUser" v-model="joinUser" @change="saveSettings()" >
                    <label class="form-check-label" for="joinUser">
                        Join to User
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label class="control-label">Volume</label>
                <input class="form-control col-md-1" type="number" v-model="volume" step="0.5" :max="maxVolume"  @change="saveSettings()">
            </div>
            
            <div class="form-group">
                <label class="control-label">Youtube URL</label>
                <div class="input-group">
                    <input class="form-control col-md-10" v-model="youtubeUrl">
                    <button type="button" class="btn btn-primary col-md-2" v-on:click="playSound()">Play</button>
                </div>
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-primary" v-on:click="stopPlaying()">Stop Playing</button>
            </div>
            <div class="form-group">
                <label class="control-label">Search</label>
                <input class="form-control" v-model="searchText">
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-primary" v-on:click="setCategoriesVisibility(true)">Expand all categories</button>
                <button type="button" class="btn btn-primary" v-on:click="setCategoriesVisibility(false)">Collapse all categories</button>
            </div>
            
            <div v-for="category in soundCategories" :key="category">
                <h2 class="control-label">{{category.name}}</h2>
                <button type="button" class="btn btn-primary" v-on:click="changeCategoryVisibility(category)" style="width: 40px; height: 40px">{{category.show ? '-' : '+'}}</button>
                <table class="table text-break" v-show="category.show">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th style="width: 100px">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="sound in filteredSounds(category.name)" :key="sound">
                            <td>
                                {{sound.name}}
                            </td>
                            <td style="width: 100px">
                                <button type="button" class="btn btn-primary" v-on:click="playSound(sound.path)">Play</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</template>
<script>
import dataservice from '../services/dataservice';
import settings from '../services/settings';

export default {
  data() {
    return {
      servers: [],
      sounds: [],
      channels: [],
      soundCategories: [],
      logs: [],
      volume: 0.5,
      selectedCategory: undefined,
      newCatInput: undefined,
      selectedServer: undefined,
      selectedChannel: undefined,
      isAdmin: false,
      maxVolume: 1,
      joinUser: true,
      youtubeUrl: undefined,
      searchText: '',
    };
  },
  created() {
      this.fetchServers().then(response => {
          this.loadSettings();
          const decodedToken = this.$auth.getDecodedToken();
          if(decodedToken){
            this.isAdmin = decodedToken.admin;
            if(this.isAdmin){
                this.maxVolume = 100;
            }
          }
      });
      this.fetchCategories();
      this.fetchSounds();
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
    containsServer(serverId){
      return this.arrayContainsId(this.servers,serverId);
    },
    containsChannel(channelId){
      return this.arrayContainsId(this.channels,channelId);
    },
    saveSettings(){
      const data = {
        selectedServer: this.selectedServer,
        selectedChannel: this.selectedChannel,
        joinUser: this.joinUser,
        volume: this.volume
      }
      settings.save(data);
    },
    loadSettings(){
      const data = settings.load();
      if(data){
        if(this.containsServer(data.selectedServer)){
          this.selectedServer = data.selectedServer;
          this.fetchChannels().then(response =>{
            if(this.containsChannel(data.selectedChannel)){
              this.selectedChannel = data.selectedChannel;
            }
          })
        }
        
        this.volume = data.volume;
        this.joinUser = data.joinUser;
      }
      else{
        this.fetchChannels();
      }
    },
    arrayContainsId(array, id){
      let status = false;
      for(let i = 0; i < array.length; i++){
        if(array[i].id == id){
          status = true;
          break;
        }
      }
      return status;
    }
  }
}
</script>

<style scoped>
.finger {
    cursor: pointer;
}
</style>