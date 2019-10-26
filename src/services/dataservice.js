import config from './config.js';
import axios from 'axios';

const options = {
    headers:{
        'Content-Type': 'application/json'
    }
};

let dataservice = {
    fetchServers: fetchServers,
    uploadFile: uploadFile,
    fetchCategories: fetchCategories,
    fetchChannels: fetchChannels,
    fetchSounds: fetchSounds,
    playSound: playSound,
    deleteSound: deleteSound,
    fetchChannels: fetchChannels,
    updateWebsite: updateWebsite,
    stopPlaying: stopPlaying,
    login: login,
    updateServerList: updateServerList,
    fetchLogs: fetchLogs,
    setIntro: setIntro,
    fetchUserData: fetchUserData,
    fetchUsersData: fetchUsersData
}

function setIntro(soundId, userId){
    return axios.post(config.api+'/setIntro', {soundId, userId}, options);
}

function fetchUsersData(){
    return axios.get(config.api+'/users');
}

function fetchUserData(){
    return axios.get(config.api+'/user');
}

function fetchServers(){
    return axios.get(config.api+'/servers');
}

function fetchLogs(){
    return axios.get(config.api+'/log');
}

function playSound(data){
    return axios.post(config.api+'/playSound', data, options);
}

function deleteSound(id){
    return axios.delete(config.api+'/deleteSound/'+id);
}

function fetchCategories(){
    return axios.get(config.api+'/soundCategories');
}

function uploadFile(file){
    return axios.put(config.api + '/uploadFile',
        file,
        {
            headers: {
                'Content-Type': undefined
            }
        }
    )
}

function fetchSounds(){
    return axios.get(config.api+'/sounds');
}

function fetchChannels(serverId){
    return axios.get(config.api+'/Channels/'+serverId);
}

function updateWebsite(){
    return axios.get(config.api+'/UpdateWebsite');
}

function stopPlaying(serverId){
    return axios.get(config.api+'/stopPlaying/'+serverId);
}

function login(code, redirectUrl){
    return axios.post(config.api+'/login',{
        code: code,
        redirectUrl: redirectUrl
    },options);
}

function updateServerList(){
    return axios.get(config.api+'/updateServer');
}

export default dataservice;