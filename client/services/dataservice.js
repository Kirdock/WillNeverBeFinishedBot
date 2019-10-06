import { config } from './config.js';

let dataservice = {
    fetchServers: fetchServers,
    uploadFile: uploadFile,
    fetchCategories: fetchCategories,
    fetchChannels: fetchChannels,
    fetchSounds: fetchSounds,
    playSound: playSound
}

function fetchServers(){
    return axios.get(config.api+'/servers');
}

function playSound(path, serverId, channelId){
    return axios.post(config.api+'/playSound', 
    {
        path: path,
        serverId: serverId,
        channelId: channelId
    },
    {
        headers:{
            'Content-Type': 'application/json',
            'Accept': 'application/json'
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

function fetchChannels(serverId){
    return axios.get(config.api+'/Channels/'+serverId);
}

export {dataservice}