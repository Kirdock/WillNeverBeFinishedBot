'use strict'

var app = new Vue({
    el: '#fetch',
    data: {
      servers: []
    },
    methods: {
      fetchServers: function () {
        // this.servers = [{id: 'saldfj', name:'sdlfj'}, {id:'212121', name:'wpeori'}];
        axios
        .get('./api/servers')
        .then(response => (this.servers = response))
      }
    }
  });

