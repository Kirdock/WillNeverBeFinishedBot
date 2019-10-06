'use strict'
import { dataservice } from './services/dataservice.js'

var app = new Vue({
    el: '#fetch',
    data: {
      servers: [],
      soundCategories: [],
      selectedCategory: undefined,
      newCatInput: undefined
    },
    methods: {
      createNewCat: function () {
        if(!this.soundCategories.includes(this.newCatInput)){
          dataservice.createNewCat(this.newCatInput);
        }
      },
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
        formData.append('category', this.selectedCategory);
        
        dataservice.uploadFile(formData)
        .then(response => {

        });
      },
      fetchCategories: function(){
          dataservice.fetchCategories().then(response => {
            this.soundCategories = response.data;
            this.selectedCategory = this.soundCategories[0];
          }).catch(error => {

          })
      }
    },
    created: function (){
        this.fetchServers();
        this.fetchCategories();
    }
  });

