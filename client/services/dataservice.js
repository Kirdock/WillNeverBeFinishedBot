import { config } from './config.js';

let dataservice = {
    fetchServers: fetchServers,
    uploadFile: uploadFile,
    fetchCategories: fetchCategories,
    createNewCat: createNewCat,
    fetchChannels: fetchChannels
}

function fetchServers(){
    return axios.get(config.api+'/servers');
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

function createNewCat(newCatName){
    return axios.put(config.api +  'addcat/' + newCatName)
}

function fetchChannels(serverId){
    return axios.get(config.api+'/Channels/'+serverId);
}

export {dataservice}