'use strict'

var app = new Vue({
    el: '#fetch',
    data: {
      servers: []
    },
    methods: {
      fetchServers: function () {
        axios
        .get('./api/servers')
        .then(response => {
            this.servers = response.data;
        })
        .catch(error =>{

        });
      }
    }
  });

