<template>
    <div>
        <h1>Admin Panel</h1>
        <h2>Benutzer Intros</h2>
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
                <tr v-for="user in filteredUsers()" :key="user.id">
                    <td>
                        {{user.id}}
                    </td>
                    <td>
                        {{user.name}}
                    </td>
                    <td>
                        <div class="input-group">
                            <select class="form-control" :value="user.intro.id" @change="updateIntro(user, $event)">
                                <optgroup v-for="category in soundCategories" :label="category" :key="category">
                                    <option v-for="sound in sounds[category]" :key="sound.id" :value="sound.id">
                                        {{sound.fileName}}
                                    </option>
                                </optgroup>
                            </select>
                            <a href="#" @click.prevent="updateIntro(user)" title="Intro zurücksetzen">
                                <i class="fas fa-undo"></i>
                            </a>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <h2>Logs</h2>
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
                        {{log.serverName}}
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
          searchText: ''
        };
    },
    created() {
        this.fetchLogs();
        this.fetchSounds();
        this.fetchUserData();
    },
    methods: {
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
        filteredUsers(){
            if(this.searchText.length > 0){
                const re = new RegExp(this.searchText,'i');
                return this.users.filter(user => re.test(user.name));
            }
            else{
                return this.users;
            }
        },
        updateIntro(user,event){
            const id = event ? event.target.value : undefined;
            
            dataservice.setIntro(id,user.id).then(()=>{
                user.intro.id = id;
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
        fetchUserData(){
            dataservice.fetchUsersData().then(response =>{
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
        }
    }
}
</script>
<style scoped>
/*Action icons*/
table a i {
  font-size: 35px !important;
  padding-right: 10px;
}
</style>