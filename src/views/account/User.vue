<template>
    <div>
        <h1 style="margin-bottom:50px">Cunt Panel</h1>
        <div class="form-horizontal">
            <div class="input-group">
                <label class="control-label">Server</label>
                <div class="col-md-5">
                    <select class="form-control" v-model="selectedServer" @change="serverChanged()">
                        <option v-for="server in servers" :key="server.id" :value="server.id">
                            {{server.name}}
                        </option>
                    </select>
                </div>
                <label class="control-label">Intro</label>
                <div class="col-md-5" v-if="user">
                    <select class="form-control" v-model="user.intros[selectedServer].id" @change="updateIntro()" @focus="cacheIntroBefore = user.intros[selectedServer].id">
                        <optgroup v-for="category in soundCategories" :label="category" :key="category">
                            <option v-for="sound in sounds[category]" :key="sound.id" :value="sound.id">
                                {{sound.fileName}}
                            </option>
                        </optgroup>
                    </select>
                </div>
                <a href="#" @click.prevent="updateIntro(true)" title="Intro zurücksetzen">
                    <i class="fas fa-undo"></i>
                </a>
            </div>
        </div>
    </div>
</template>
<script>
import dataservice from '../../services/dataservice';

export default {
    data() {
        return {
          soundCategories: [],
          sounds: [],
          servers: [],
          user: undefined,
          cacheIntroBefore: undefined,
          selectedServer: undefined,
          cacheIntroBefore: undefined
        };
    },
    created() {
        this.fetchServers().then(()=>{
            this.fetchUserData();
            this.fetchSounds();
        });
    },
    methods: {
        serverChanged(){
            if(!this.user.intros[this.selectedServer]){
                this.user.intros[this.selectedServer] = '';
            }
            this.fetchSounds();
        },
        updateIntro(reset){
            let id = undefined;
            if(!reset){
                id = this.user.intros[this.selectedServer].id;
                this.user.intros[this.selectedServer].id = this.cacheIntroBefore;
            }
            
            dataservice.setIntro(id, undefined, this.selectedServer).then(()=>{
                this.user.intros[this.selectedServer].id = id;
                this.$bvToast.toast(`Intro is gsetzt!`, {
                    title: 'Erfolg',
                    autoHideDelay: this.$config.toastDelay,
                    variant: 'success',
                    appendToast: true
                });
            }).catch(()=>{
                this.$bvToast.toast(`Konn des Intro nit setzn`, {
                    title: 'Fehler',
                    autoHideDelay: this.$config.toastDelay,
                    variant: 'danger',
                    appendToast: true
                });
            });
        },
        fetchSounds(){
            dataservice.fetchSounds(this.selectedServer).then(response =>{
                this.sounds = {};
                response.data.forEach(sound =>{
                    if(!this.sounds[sound.category]){
                    this.sounds[sound.category] = []
                    }
                    this.sounds[sound.category].push(sound);
                });
                this.soundCategories = Object.keys(this.sounds).sort((a,b) => a.localeCompare(b));
            }).catch(()=>{
                this.$bvToast.toast(`Sounds kennan nit glodn werdn`, {
                    title: 'Fehler',
                    autoHideDelay: this.$config.toastDelay,
                    variant: 'danger',
                    appendToast: true
                });
            });
        },
        fetchServers(){
            return dataservice.fetchServers().then(response=>{
                this.servers = response.data;
                if(this.servers.length > 0){
                    this.selectedServer = this.servers[0].id;
                }
            }).catch(()=>{
                this.$bvToast.toast(`Server kennan nit glodn werdn`, {
                    title: 'Fehler',
                    autoHideDelay: this.$config.toastDelay,
                    variant: 'danger',
                    appendToast: true
                });
            });
        },
        fetchUserData(){
            dataservice.fetchUserData(this.selectedServer).then(response =>{
                this.user = response.data;
            }).catch(()=>{
                this.$bvToast.toast(`Benutzer kennan nit glodn werdn`, {
                    title: 'Fehler',
                    autoHideDelay: this.$config.toastDelay,
                    variant: 'danger',
                    appendToast: true
                });
            })
        }
    }
}
</script>
<style scoped>
/*Action icons*/
a i {
  font-size: 35px !important;
  padding-right: 10px;
}
</style>