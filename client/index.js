'use strict'
import { dataservice } from './services/dataservice.js'

var app = new Vue({
    el: '#fetch',
    data: {
      servers: [],
      soundCategories: []
    },
    methods: {
      fetchServers: function () {
        dataservice.fetchServers().then(response => {
            this.servers = response.data;
        })
        .catch(error =>{

        });
      },
      submitFile: function(){
        this.file = this.$refs.file.files[0];
        let formData = new FormData();
        formData.append('file', this.file);
        formData.append('file', this.file.name);
        console.log(this.file);
        console.log(this.file.name);
        dataservice.uploadFile(formData)
        .then(response => {

        });
      },
      fetchCategories: function(){
          dataservice.fetchCategories().then(response => {
            this.soundCategories = response.data;
          }).catch(error => {

          })
      }
    },
    created: function (){
        this.fetchServers();
        this.fetchCategories();
    }
  });

