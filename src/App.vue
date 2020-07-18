<template>
  <div>
    <nav id="nav" class="navbar navbar-expand-lg navbar-dark bg-dark">
          <a class="navbar-brand" href="#">WillNeverBeFinishedBot</a>
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
              <li class="nav-item active">
                  <router-link class="nav-link" to="/">Startseite</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/Account">Account</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" v-if="hasAdminServers" to="/Admin">Admin</router-link>
              </li>
              <li class="nav-item">
                <a class="nav-link" :href="addServerLink">Server hinzufügen</a>
              </li>
              <li class="nav-item" v-if="$auth.isLoggedIn()">
                <a class="nav-link" href="#" @click="logout">Abmelden</a>
              </li>
            </ul>
          </div>
          <span class="navbar-text" v-if="$auth.isLoggedIn()">
                Der Vollpfostn <span style="font-weight: bold; color: blue">{{username}}</span> hots auf de Seitn gschofft!
          </span>
        </nav>
        <router-view/>
  </div>
</template>
<script>
import dataservice from './services/dataservice';

export default {
  name: 'App',
  data() {
      return{
          username: undefined,
          hasAdminServers: false,
          addServerLink: `https://discord.com/api/oauth2/authorize?client_id=630064403525533706&permissions=3148800&redirect_uri=${this.getLocationEncoded()}&scope=bot`
      }
  },
  methods: {
    setUserData(){
      const decodedToken = this.$auth.getDecodedToken();
      if(decodedToken){
        this.username = decodedToken.username;
      }
    },
    logout(){
        this.$auth.deleteToken();
        this.hasAdminServers = false;
        this.$auth.setHasAdminServers(false);
        this.username = undefined;
        this.$router.push('/Login');
    },
    setHasAdminServers(){
      if(this.$auth.isLoggedIn()){
        dataservice.hasAdminServers().then(response =>{
          this.$auth.setHasAdminServers(response.data);
          this.hasAdminServers = response.data;
        }).catch(()=>{
          this.$bvToast.toast(`I konn nit nochfrogn ob du a Admin bist`, {
            title: 'Fehler',
            autoHideDelay: this.$config.toastDelay,
            variant: 'danger',
            appendToast: true
          });
        });
      }
    },
    getLocationEncoded(){
      return encodeURIComponent(this.getLocation());
    },
    getLocation(){
      return window.location.protocol+'//'+window.location.host+(this.$router.currentRoute.name === 'Login' ? this.$router.currentRoute.path : '/');
    },
    updateLogin(){
      this.setUserData();
      this.setHasAdminServers();
    }
  },
  created(){
    this.updateLogin();
  }
};
</script>