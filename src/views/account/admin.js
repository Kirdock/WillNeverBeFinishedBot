import dataservice from './../../services/dataservice.js';


export default {
    data() {
        return {
          logs: []
        };
    },
    created() {
        this.fetchLogs();
    },
    methods: {
        fetchLogs(){
            dataservice.fetchLogs().then(response =>{
                this.logs = response.data;
            }).catch(error =>{
    
            });
        },
        formatTime(time){
            const date = new Date(time);
            return date.toLocaleDateString() + '  ' + date.toLocaleTimeString();
        }
    }
}