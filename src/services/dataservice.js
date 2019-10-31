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
    fetchLogs: fetchLogs,
    setIntro: setIntro,
    fetchUserData: fetchUserData,
    fetchUsersData: fetchUsersData,
    updateServerInfo: updateServerInfo,
    hasAdminServers: hasAdminServers,
    downloadSound: downloadSound
}

function setIntro(soundId, userId){
    return axios.post(config.api+'/setIntro', {soundId, userId}, options);
}

function downloadSound(soundId){
    return axios({
        method: 'GET',
        url: config.api+'/sound/'+soundId,
        responseType: 'blob'
    });
}

function updateServerInfo(serverInfo){
    return axios.post(config.api+'/serverInfo', {serverInfo}, options);
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

function fetchSounds(serverId){
    return axios.get(config.api+'/sounds' + (serverId ? '/'+serverId : ''));
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

function hasAdminServers(){
    return axios.get(config.api+'/hasAdminServers');
}

export default dataservice;