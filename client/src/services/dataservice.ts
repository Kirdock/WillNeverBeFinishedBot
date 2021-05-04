import config from './config.js';
import axios from 'axios';
import { Snowflake } from 'discord.js';
import { Server } from '../../server/src/models/Server.js';

export class DataService {
    private readonly options = {
        headers:{
            'Content-Type': 'application/json'
        }
    };
    constructor(){
        axios.defaults.baseURL = config.api;
    }

    setIntro(soundId: number, userId: Snowflake, serverId: Snowflake){
        return axios.post('/setIntro', {soundId, userId, serverId}, this.options);
    }

    downloadSound(soundId: number){
        return axios({
            method: 'GET',
            url: '/sound/'+soundId,
            responseType: 'blob'
        });
    }

    updateServerInfo(serverInfo: Server){
        return axios.post('/serverInfo', {serverInfo}, this.options);
    }

    fetchUsersData(serverId: Snowflake){
        return axios.get('/users/'+serverId);
    }

    fetchUserData(serverId: Snowflake){
        return axios.get('/user/'+serverId);
    }

    fetchServers(){
        return axios.get('/servers');
    }

    fetchLogs(){
        return axios.get('/log');
    }

    playSound(data){
        return axios.post('/playSound', data, this.options);
    }

    deleteSound(id){
        return axios.delete('/deleteSound/'+id);
    }

    fetchCategories(){
        return axios.get('/soundCategories');
    }

    uploadFile(file){
        return axios.put(config.api + '/uploadFile',
            file,
            {
                headers: {
                    'Content-Type': undefined
                }
            }
        )
    }

    fetchSounds(serverId){
        return axios.get('/sounds' + (serverId ? '/'+serverId : ''));
    }

    fetchChannels(serverId){
        return axios.get('/Channels/'+serverId);
    }

    updateWebsite(){
        return axios.get('/UpdateWebsite');
    }

    stopPlaying(serverId){
        return axios.get('/stopPlaying/'+serverId);
    }

    login(code, redirectUrl){
        return axios.post('/login',{
            code: code,
            redirectUrl: redirectUrl
        },this.options);
    }

    hasAdminServers(){
        return axios.get('/hasAdminServers');
    }
}