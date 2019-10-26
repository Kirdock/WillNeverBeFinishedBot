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
              <li class="nav-item" v-if="$auth.isAdmin()">
                <router-link class="nav-link" to="/Admin">Admin</router-link>
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
        this.$router.push('/Login');
    }
  },
  created(){
    this.setUserData();
  }
};
</script>