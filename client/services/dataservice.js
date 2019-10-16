import { config } from './config.js';

let dataservice = {
    fetchServers: fetchServers,
    uploadFile: uploadFile,
    fetchCategories: fetchCategories,
    fetchChannels: fetchChannels,
    fetchSounds: fetchSounds,
    playSound: playSound,
    createNewCat: createNewCat,
    fetchChannels: fetchChannels,
    updateWebsite: updateWebsite,
    stopPlaying: stopPlaying,
    login: login,
    logout: logout,
    updateServerList: updateServerList,
    fetchLogs: fetchLogs
}

function fetchServers(){
    return axios.get(config.api+'/servers');
}

function fetchLogs(){
    return axios.get(config.api+'/log');
}

function playSound(data){
    return axios.post(config.api+'/playSound', data,
    {
        headers:{
            'Content-Type': 'application/json'
        }
    }
    );
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

function createNewCat(newCatName){
    return axios.put(config.api +  'addcat/' + newCatName)
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
    },
    {
        headers:{
            'Content-Type': 'application/json'
        }
    });
}

function logout(){
    return axios.get(config.api+'/logout');
}

function updateServerList(){
    return axios.get(config.api+'/updateServer');
}

export {dataservice}