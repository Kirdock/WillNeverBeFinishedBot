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
            loginLink: 'https://discordapp.com/api/oauth2/authorize?client_id=630064403525533706&redirect_uri='+this.$parent.getLocationEncoded()+'&response_type=code&scope=identify'
        }
    },
    methods: {
        checkCode(){
            const url = new URL(window.location.href);
            const code = url.searchParams.get('code');
            if (code) {
              dataservice.login(code, this.$parent.getLocation()).then(response=>{
                this.$auth.setToken(response.data);
                this.$parent.updateLogin();
                this.$router.push('/');
              }).catch(error =>{
                this.$bvToast.toast(`Der Login hot nit funktioniert. Probiers noch amol`, {
                    title: 'Fehler',
                    autoHideDelay: this.$config.toastDelay,
                    variant: 'danger',
                    appendToast: true,
                });
              });
            }
        }
    },
    created(){
        this.checkCode();
    }
}
</script>