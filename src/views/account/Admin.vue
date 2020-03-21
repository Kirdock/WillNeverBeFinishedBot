<template>
    <div>
        <h1>Admin Panel</h1>
        <b-tabs content-class="mt-3">
            <b-tab title="Benutzer Intros" active>
                <div class="form-group col-md-5">
                    <label class="control-label">Server</label>
                    <select class="form-control" v-model="selectedIntroServer" @change="fetchUserData()">
                        <option v-for="server in servers" :key="server.id" :value="server.id">
                            {{server.name}}
                        </option>
                    </select>
                </div>
                <div class="form-group col-md-5">
                    <label class="control-label">Suche Benutzer</label>
                    <input class="form-control" v-model="searchText">
                </div>
                <table class="table text-break">
                    <thead>
                        <tr>
                            <th>Benutzer ID</th>
                            <th>Benutzername</th>
                            <th>Intro</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in filteredUsers" :key="user.id">
                            <td>
                                {{user.id}}
                            </td>
                            <td>
                                {{user.name}}
                            </td>
                            <td>
                                <div class="input-group">
                                    <select class="form-control" v-model="user.intros[selectedIntroServer].id" @change="updateIntro(user)" @focus="cacheIntroBefore = user.intros[selectedIntroServer].id">
                                        <optgroup v-for="category in getSoundCategories()" :label="category" :key="category">
                                            <option v-for="sound in getSounds(category)" :key="sound.id" :value="sound.id">
                                                {{sound.fileName}}
                                            </option>
                                        </optgroup>
                                    </select>
                                    <a href="#" @click.prevent="updateIntro(user, true)" @focus="cacheIntroBefore = user.intros[selectedIntroServer].id" title="Intro zurücksetzen">
                                        <i class="fas fa-undo"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </b-tab>
             <b-tab title="Logs">
                <table class="table text-break">
                    <thead>
                        <tr>
                            <th>Datum & Zeit</th>
                            <th>Server</th>
                            <th>Dateiname</th>
                            <th>Benutzername</th>
                            <th>Aktion</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="log in logs" :key="log">
                            <td>
                                {{formatTime(log.timestamp)}}
                            </td>
                            <td>
                                {{log.server.name}}
                            </td>
                            <td>
                                {{log.fileName}}
                            </td>
                            <td>
                                {{log.username}}
                            </td>
                            <td>
                                {{log.message}}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </b-tab>
            <b-tab title="Server-Einstellungen">
                <div class="form-horizontal">
                    <div class="form-group">
                        <label class="control-label">Server</label>
                        <select class="form-control col-md-5" v-model="selectedServer">
                            <option v-for="server in servers" :key="server.id" :value="server">
                                {{server.name}}
                            </option>
                        </select>
                    </div>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="serverIntro" v-model="selectedServer.intro" @change="updateServerInfo()" >
                        <label class="form-check-label" for="serverIntro">
                            Server Intro
                        </label>
                    </div>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="serverMinUser" v-model="selectedServer.minUser" @change="updateServerInfo()" >
                        <label class="form-check-label" for="serverMinUser">
                            Zumindest ein Benutzer im Channel, damit das Intro abgespielt wird
                        </label>
                    </div>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="leaveAfterPlay" v-model="selectedServer.leaveChannelAfterPlay" @change="updateServerInfo()" >
                        <label class="form-check-label" for="leaveAfterPlay">
                            Bot soll nach dem Abspielen den Kanal verlassen
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label">Default Intro</label>
                        <div class="input-group">
                            <select class="form-control col-md-5" v-model="selectedServer.defaultIntro" @change="updateServerInfo()">
                                <optgroup v-for="category in soundCategories[selectedServer.id]" :label="category" :key="category">
                                    <option v-for="sound in sounds[selectedServer.id][category]" :key="sound.id" :value="sound.id">
                                        {{sound.fileName}}
                                    </option>
                                </optgroup>
                            </select>
                            <a href="#" @click.prevent="selectedServer.defaultIntro = ''; updateServerInfo()" title="Intro zurücksetzen">
                                <i class="fas fa-undo"></i>
                            </a>
                        </div>
                    </div>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="serverOutro" v-model="selectedServer.outro" @change="updateServerInfo()" >
                        <label class="form-check-label" for="serverOutro">
                            Server Outro
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label">Default Outro</label>
                        <div class="input-group">
                            <select class="form-control col-md-5" v-model="selectedServer.defaultOutro" @change="updateServerInfo()">
                                <optgroup v-for="category in soundCategories[selectedServer.id]" :label="category" :key="category">
                                    <option v-for="sound in sounds[selectedServer.id][category]" :key="sound.id" :value="sound.id">
                                        {{sound.fileName}}
                                    </option>
                                </optgroup>
                            </select>
                            <a href="#" @click.prevent="selectedServer.defaultOutro = ''; updateServerInfo()" title="Outro zurücksetzen">
                                <i class="fas fa-undo"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </b-tab>
        </b-tabs>
    </div>
</template>
<script>
import dataservice from '../../services/dataservice';

export default {
    data() {
        return {
          logs: [],
          soundCategories: [],
          sounds: [],
          users: [],
          searchText: '',
          servers: [],
          selectedServer: {},
          selectedIntroServer: undefined,
          cacheIntroBefore: undefined
        };
    },
    created() {
        this.fetchLogs();
        this.fetchSounds();
        this.fetchServers().then(()=>{
            this.fetchUserData();
        });
    },
    computed:{
        filteredUsers(){
            if(this.searchText.length > 0){
                const re = new RegExp(this.searchText,'i');
                return this.users.filter(user => re.test(user.name));
            }
            else{
                return this.users;
            }
        }
    },
    methods: {
        getSoundCategories(){
            return this.soundCategories[this.selectedIntroServer];
        },
        getSounds(category){
            let temp = [];
            if(category && this.sounds[this.selectedIntroServer] && this.sounds[this.selectedIntroServer][category]){
                temp = this.sounds[this.selectedIntroServer][category];
            }
            return temp;
        },
        fetchServers(){
            return dataservice.fetchServers().then(response=>{
                this.servers = response.data.filter(server => server.admin);
                if(this.servers.length > 0){
                    this.selectedServer = this.servers[0];
                    this.selectedIntroServer = this.servers[0].id;
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
        fetchLogs(){
            dataservice.fetchLogs().then(response =>{
                this.logs = response.data;
            }).catch(error =>{
                this.$bvToast.toast(`Logs kennan nit glodn werdn`, {
                    title: 'Fehler',
                    autoHideDelay: this.$config.toastDelay,
                    variant: 'danger',
                    appendToast: true
                });
            });
        },
        updateIntro(user, reset){
            const id = reset ? undefined : user.intros[this.selectedIntroServer].id;
            if(!reset){
                user.intros[this.selectedIntroServer].id = this.cacheIntroBefore;
            }
            dataservice.setIntro(id,user.id, this.selectedIntroServer).then(()=>{
                user.intros[this.selectedIntroServer].id = id;
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
            dataservice.fetchSounds().then(response =>{
                this.sounds = {};
                this.soundCategories = {};
                response.data.forEach(sound =>{
                    if(!this.sounds[sound.serverId]){
                        this.$set(this.sounds,sound.serverId,{});
                        this.$set(this.soundCategories,sound.serverId,{});
                    }
                    if(!this.sounds[sound.serverId][sound.category]){
                        this.$set(this.sounds[sound.serverId],sound.category,[]);
                    }
                    this.sounds[sound.serverId][sound.category].push(sound);
                });
                Object.keys(this.soundCategories).forEach(serverId =>{
                    this.soundCategories[serverId] =  Object.keys(this.sounds[serverId]).sort((a,b) => a.localeCompare(b));
                });
            }).catch(()=>{
                this.$bvToast.toast(`Sounds kennan nit glodn werdn`, {
                    title: 'Fehler',
                    autoHideDelay: this.$config.toastDelay,
                    variant: 'danger',
                    appendToast: true
                });
            });
        },
        fetchUserData(){
            this.users = [];
            dataservice.fetchUsersData(this.selectedIntroServer).then(response =>{
                this.users = response.data;
            }).catch(()=>{
                this.$bvToast.toast(`Benutzer kennan nit glodn werdn`, {
                    title: 'Fehler',
                    autoHideDelay: this.$config.toastDelay,
                    variant: 'danger',
                    appendToast: true
                });
            })
        },
        formatTime(time){
            const date = new Date(time);
            return date.toLocaleDateString() + '  ' + date.toLocaleTimeString();
        },
        updateServerInfo(){
            if(this.selectedServer){
                dataservice.updateServerInfo(this.selectedServer).then(()=>{
                    this.$bvToast.toast(`Änderung durchgeführt`, {
                        title: 'Erfolg',
                        autoHideDelay: this.$config.toastDelay,
                        variant: 'success',
                        appendToast: true
                    });
                }).catch(()=>{
                    this.$bvToast.toast(`Update fehlgeschlagen`, {
                        title: 'Fehler',
                        autoHideDelay: this.$config.toastDelay,
                        variant: 'danger',
                        appendToast: true
                    });
                });
            }
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