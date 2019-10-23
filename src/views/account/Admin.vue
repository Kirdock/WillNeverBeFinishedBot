<template>
    <div>
        <h1>Admin Panel</h1>
        <h2>Logs</h2>
        <table class="table text-break">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Username</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="log in logs" :key="log">
                    <td>
                        {{formatTime(log.timestamp)}}
                    </td>
                    <td>
                        {{log.username}}
                    </td>
                    <td>
                        {{log.message}}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<script>
import dataservice from '../../services/dataservice';

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
</script>