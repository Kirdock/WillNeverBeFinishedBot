import dataservice from '../services/dataservice';
import authorization from '../services/autorization';
import { settings } from '../services/settings';

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
    },
    testToast(){
      this.$bvToast.toast(`This is toast number`, {
        title: 'BootstrapVue Toast',
        autoHideDelay: 5000,
        appendToast: true
      })
    }
  }
};