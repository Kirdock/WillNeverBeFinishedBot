<template>
    <div>
        <h1>Login</h1>
        <a class="btn btn-primary" :href="loginLink">Login</a>
    </div>
</template>
<script>
import dataservice from '../services/dataservice';
export default {
    data(){
        return {
            loginLink: 'https://discordapp.com/api/oauth2/authorize?client_id=630064403525533706&redirect_uri='+this.getLocationEncoded()+'&response_type=code&scope=identify%20guilds'
        }
    },
    methods: {
        checkCode(){
            const url = new URL(window.location.href);
            const code = url.searchParams.get('code');
            if (code) {
              dataservice.login(code, this.getLocation()).then(response=>{
                this.$auth.setToken(response.data);
                this.$router.push('/');
              }).catch(error =>{
                this.$bvToast.toast(`Der Login hot nit funktioniert. Probiers noch amol`, {
                    title: 'Fehler',
                    autoHideDelay: this.$config.toastDelay,
                    appendToast: true
                });
              });
            }
        },
        getLocationEncoded(){
            return encodeURIComponent(this.getLocation());
        },
        getLocation(){
            return window.location.protocol+'//'+window.location.host+this.$router.currentRoute.path;
        }
    },
    created(){
        this.checkCode();
    }
}
</script>