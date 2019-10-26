<template>
    <div>
        <h1 style="margin-bottom:50px">Cunt Panel</h1>
        <div class="form-horizontal">
            <div class="input-group">
                <label class="control-label">Intro</label>
                <div class="col-md-5">
                    <select class="form-control" :value="user.intro.id" @change="updateIntro($event)">
                        <optgroup v-for="category in soundCategories" :label="category" :key="category">
                            <option v-for="sound in sounds[category]" :key="sound.id" :value="sound.id">
                                {{sound.fileName}}
                            </option>
                        </optgroup>
                    </select>
                </div>
                <a href="#" @click.prevent="updateIntro()" title="Intro zurücksetzen">
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
          user: {intro:{}}
        };
    },
    created() {
        this.fetchSounds();
        this.fetchUserData();
    },
    methods: {
        updateIntro(event){
            const id = event ? event.target.value : undefined;
            
            dataservice.setIntro(id).then(()=>{
                this.user.intro.id = id;
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
            dataservice.fetchUserData().then(response =>{
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