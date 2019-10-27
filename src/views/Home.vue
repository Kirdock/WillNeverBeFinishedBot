<template>
    <div class="container" style="margin-top:50px">
        <div id="fetch" class="form-horizontal" >
            <button type="button" class="btn btn-primary" v-on:click="updateWebsite()" v-if="isAdmin">Server aktualisieren</button>
            <h1 class="control-label">Server</h1>
            <div class="input-group">
                <select class="form-control" v-model="selectedServer" @change="fetchChannels(); saveSettings()">
                    <option v-for="server in servers" :value="server.id" :key="server.id">
                        {{server.name}}
                    </option>
                </select>
                <button type="button" class="btn btn-primary col-md-2" v-on:click="updateServerList()">Serverliste aktualisieren</button>
            </div>

            <h1>Sounds hochladen</h1>
            <div class="form-group">
                <label class="control-label">Wähle eine Kategorie aus</label>
                <div class="input-group">
                    <label class="btn btn-primary col-md-2 finger">
                        Auswahl der Datei(en) <input type="file" style="display:none" multiple id="file" ref="file" accept="audio/*" v-on:change="submitFile()"/>
                    </label>
                    <typeahead class="col-md-10" :suggestions="soundCategories" item_key="name" :selection.sync="selectedCategory" />
                </div>
            </div>
                
            <h1>Sounds abspielen</h1>
            <div class="form-group ">
                <label class="control-label">Channel auswählen</label>
                <select class="form-control" v-model="selectedChannel"  @change="saveSettings()">
                    <option v-for="channel in channels" :value="channel.id" :key="channel">
                        {{channel.name}}
                    </option>
                </select>
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="joinUser" v-model="joinUser" @change="saveSettings()" >
                    <label class="form-check-label" for="joinUser">
                        Beim Benutzer joinen
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label class="control-label">Laustärke (von 0,0-1)</label>
                <input class="form-control col-md-1" type="number" v-model="volume" step="0.5" :max="maxVolume"  @change="saveSettings()">
            </div>
            
            <div class="form-group">
                <label class="control-label">Youtube URL</label>
                <div class="input-group">
                    <input class="form-control col-md-10" v-model="youtubeUrl">
                    <button type="button" class="btn btn-primary col-md-2" v-on:click="playSound()">Abspielen</button>
                </div>
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-primary" v-on:click="stopPlaying()">Abspielen stoppen</button>
            </div>
            <div class="form-group">
                <label class="control-label">Suche</label>
                <input class="form-control" v-model="searchText">
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-primary" v-on:click="setCategoriesVisibility(true)">Alle Kategorien erweitern</button>
                <button type="button" class="btn btn-primary" v-on:click="setCategoriesVisibility(false)">Alle Kategorien schließen</button>
            </div>
            
            <div v-for="category in soundCategories" :key="category.name">
                <h2 class="control-label">{{category.name}}</h2>
                <button type="button" class="btn btn-primary" v-on:click="changeCategoryVisibility(category)" style="width: 40px; height: 40px">{{category.show ? '-' : '+'}}</button>
                <table class="table text-break" v-show="category.show">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Benutzer</th>
                            <th style="width: 180px">Aktion</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(sound, $index) in filteredSounds(category.name)" :key="sound.id">
                            <td>
                                {{sound.fileName}}
                            </td>
                            <td>
                                {{sound.user.name}}
                            </td>
                            <td>
                              <a href="#" @click.prevent="playSound(sound.id)" title="Sound abspielen">
                                <i class="far fa-play-circle"></i>
                              </a>
                              <a href="#" @click.prevent="setIntro(sound.id)" title="Als Intro festlegen">
                                <i class="fas fa-save"></i>
                              </a>
                              <a href="#" @click.prevent="deleteSound(sound.id, $index, category.name)" title="Sound löschen" :class="userId == sound.user.id || isAdmin ? '' : 'disabled'">
                                <i class="fas fa-trash-alt"></i>
                              </a>
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
      sounds: {},
      channels: [],
      soundCategories: [],
      volume: 0.5,
      selectedCategory: undefined,
      selectedServer: undefined,
      selectedChannel: undefined,
      isAdmin: false,
      maxVolume: 1,
      joinUser: true,
      youtubeUrl: undefined,
      searchText: '',
      userId: undefined
    };
  },
  created() {
      this.fetchServers().then(response => {
          this.loadSettings();
          const decodedToken = this.$auth.getDecodedToken();
          if(decodedToken){
            this.userId = decodedToken.id;
            this.isAdmin = decodedToken.admin;
            if(this.isAdmin){
                this.maxVolume = 100;
            }
          }
      });
      this.fetchSounds();
  },
  methods: {
    fetchServers(loadChannels) {
      return dataservice.fetchServers().then(response => {
          this.servers = response.data;
          this.selectedServer = this.servers[0].id;
      })
      .catch(error =>{
          this.$bvToast.toast(`Konn de Channels nit lodn. Ka wos do los is`, {
            title: 'Fehler',
            autoHideDelay: this.$config.toastDelay,
            variant: 'danger',
            appendToast: true
          });
      });
    },
    submitFile(){
      const selectedCat = this.selectedCategory;
      if(selectedCat){
        let formData = new FormData();
        formData.append('category', selectedCat);
        for(let i = 0; i < this.$refs.file.files.length; i++){
          formData.append(`files`,this.$refs.file.files[i]);
        }
        
        dataservice.uploadFile(formData)
        .then(response => {
          if(!this.sounds[selectedCat]){
            this.sounds[selectedCat] = [];
            this.soundCategories.push({name: selectedCat, show: true});
            this.soundCategories.sort((a,b)=> a.name.localeCompare(b.name));
          }
          Array.prototype.push.apply(this.sounds[selectedCat],response.data);
          this.sounds[selectedCat].sort((a,b) => a.fileName.localeCompare(b.fileName));
          this.$forceUpdate();
          this.$bvToast.toast(`Gratuliere! Du hosts gschofft a Datei hochzulodn :thumbsup:`, {
              title: 'Erfolg',
              autoHideDelay: this.$config.toastDelay,
              variant: 'success',
              appendToast: true
            });
        }).catch(error =>{
          this.$bvToast.toast(`Konn de Datei nit aufelodn ¯\\_(ツ)_/¯`, {
              title: 'Fehler',
              autoHideDelay: this.$config.toastDelay,
              variant: 'danger',
              appendToast: true
          });
        });
      }
      else{
        this.$bvToast.toast(`Gib bitte a Kategorie beim Upload on du Pliatz`, {
            title: 'Warnung',
            autoHideDelay: this.$config.toastDelay,
            variant: 'warning',
            appendToast: true
        });
      }
    },
    fetchChannels(){
        return dataservice.fetchChannels(this.selectedServer).then(response =>{
            this.channels = response.data;
            this.selectedChannel = this.channels[0].id;
        }).catch(error => {
          this.$bvToast.toast(`Hob de Channels nit glodn. Meh... Probiers amfoch noch amol`, {
            title: 'Fehler',
            autoHideDelay: this.$config.toastDelay,
            variant: 'danger',
            appendToast: true
          });
        });
    },
    fetchSounds(){
        dataservice.fetchSounds().then(response =>{
          this.sounds = {};
          response.data.forEach(sound =>{
            if(!this.sounds[sound.category]){
              this.sounds[sound.category] = []
            }
            this.sounds[sound.category].push(sound);
          });
          this.setSoundCategories();
        }).catch(error =>{
          this.$bvToast.toast(`Konn de Sounds nit lodn. Frog Mr. Admin wos do vakehrt laft`, {
            title: 'Fehler',
            autoHideDelay: this.$config.toastDelay,
            variant: 'danger',
            appendToast: true
          });
        });
    },
    setSoundCategories(){
      this.soundCategories = Object.keys(this.sounds).sort((a,b) => a.localeCompare(b)).map(category =>({name: category, show: true})); //vue.js does not recognize new elements. that's why I have to add "show"
      if(this.soundCategories.length > 0){
        this.selectedCategory = this.soundCategories[0].name;
      }
    },
    playSound(soundId){
      const data = {
        soundId: soundId,
        serverId: this.selectedServer,
        channelId: this.selectedChannel,
        volume: this.volume,
        joinUser: this.joinUser,
        url: this.youtubeUrl
      }
      dataservice.playSound(data).then(response =>{
        
      }).catch(error =>{
        let message = error.response.status === 400 ? 
        'Dir is schon klor, dass des "Join to User" nit funktioniert, wenn du in kan Channel bist oda?' :
        `Der Sound konn nit obgspült werdn. Very strange`
        
        this.$bvToast.toast(message, {
          title: 'Fehler',
          autoHideDelay: this.$config.toastDelay,
          variant: 'danger',
          appendToast: true
        });
      });
    },
    setIntro(soundId){
      dataservice.setIntro(soundId).then(()=>{
        this.$bvToast.toast('Intro gsetzt', {
          title: 'Erfolg',
          autoHideDelay: this.$config.toastDelay,
          variant: 'success',
          appendToast: true
        });
      }).catch(()=>{
        this.$bvToast.toast('Konn des Intro nit setzn', {
          title: 'Fehler',
          autoHideDelay: this.$config.toastDelay,
          variant: 'danger',
          appendToast: true
        });
      })
    },
    deleteSound(soundId, index, categoryName){
      dataservice.deleteSound(soundId).then(()=>{
        this.sounds[categoryName].splice(index,1);
        if(this.sounds[categoryName].length == 0){
          delete this.sounds[categoryName];
          let index = -1;
          this.soundCategories.forEach((category, $index) =>{
            if(category.name == categoryName){
              index = $index;
            }
          })
          if(index !== -1){
            this.soundCategories.splice(index,1);
          }
        }
        this.$forceUpdate();
        this.$bvToast.toast('Die Datei wurde gelöscht My Lord', {
          title: 'Erfolg',
          autoHideDelay: this.$config.toastDelay,
          variant: 'success',
          appendToast: true
        });
      }).catch(()=>{
        this.$bvToast.toast('I konn de Datei nit löschen ( ._.)', {
          title: 'Fehler',
          autoHideDelay: this.$config.toastDelay,
          variant: 'danger',
          appendToast: true
        });
      })
    },
    changeCategoryVisibility(category){
      category.show = !category.show;
    },
    setCategoriesVisibility(status){
      this.soundCategories.forEach(category =>(category.show = status));
    },
    updateWebsite(){
      dataservice.updateWebsite().then(response=>{
        this.$bvToast.toast(`Also Fehla gibts onscheinend kan. Des wär der Response\n ${response.data}`, {
          title: 'Information',
          autoHideDelay: this.$config.toastDelay,
          variant: 'info',
          appendToast: true
        });
      }).catch(error =>{
        this.$bvToast.toast(`Warum is do schon wieda a Fehla?`, {
            title: 'Fehler',
            autoHideDelay: this.$config.toastDelay,
            variant: 'danger',
            appendToast: true
          });
      });
    },
    stopPlaying(){
      dataservice.stopPlaying(this.selectedServer).then(response =>{
        this.$bvToast.toast(`Da Bot holtat jetz de Goschn`, {
          title: 'Erfolg',
          autoHideDelay: this.$config.toastDelay,
          variant: 'success',
          appendToast: true
        });
      }).catch(error =>{
        this.$bvToast.toast(`Der Bot wüll nit aufhean oda hot schon aufgheat?`, {
          title: 'Fehler',
          autoHideDelay: this.$config.toastDelay,
          variant: 'danger',
          appendToast: true
        });
      })
    },
    updateServerList(){
      dataservice.updateServerList().then(servers =>{
        this.servers = servers.data;
        this.$bvToast.toast(`Listn is aktualisiert`, {
          title: 'Erfolg',
          autoHideDelay: this.$config.toastDelay,
          variant: 'success',
          appendToast: true
        });
      }).catch(error =>{
        this.$bvToast.toast(`Die Server protestiern grod in Hong Kong und hobm ka Zeit`, {
            title: 'Fehler',
            autoHideDelay: this.$config.toastDelay,
            variant: 'danger',
            appendToast: true
          });
      });
    },
    filteredSounds(categoryName){
      if(this.searchText.length > 0){
        const re = new RegExp(this.searchText,'i');
        return this.sounds[categoryName].filter(sound => re.test(sound.fileName));
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

/*Action icons*/
table a i {
  font-size: 40px !important;
  padding-right: 10px;
}

a.disabled {
  pointer-events: none;
  cursor: default;
  color: gray;
}
</style>