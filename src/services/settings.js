'use strict'
const settingName = 'Settings';
const storage = window.localStorage;
const settings = {
    save: save,
    load: load
};


function save(data){
    storage.setItem(settingName,JSON.stringify(data));
}

function load(){
    return JSON.parse(storage.getItem(settingName));
}



export {settings}