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
    updateWebsite: updateWebsite
}

function fetchServers(){
    return axios.get(config.api+'/servers');
}

function playSound(path, serverId, channelId, volume){
    return axios.post(config.api+'/playSound', 
    {
        path: path,
        serverId: serverId,
        channelId: channelId,
        volume: volume
    },
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

export {dataservice}