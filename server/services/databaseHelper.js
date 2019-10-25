'use strict'
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fileHelper = require('./fileHelper.js')();
const database = __dirname+'/../config/database.json';
fileHelper.checkAndCreateFile(database);
const nanoid = require('nanoid');
const adapter = new FileSync(database);
const db = low(adapter);
const users = 'users';
const sounds = 'sounds';
const maxLogsReturned = 20;
const maxLogsStored = 100;
const maxLogsDeleted = 50;
setDefault();

function setDefault(){
    let query = {};
    query[users] = [];
    query[sounds] = [];
    query['log'] = [];
    db.defaults(query).write();
}

module.exports = () =>{
    
    const databaseHelper = {
        addUser: addUser,
        addSoundsMeta: addSoundsMeta,
        removeSoundMeta: removeSoundMeta,
        updateSoundMeta: updateSoundMeta,
        getSoundsMeta: getSoundsMeta,
        getSoundMeta: getSoundMeta,
        removeUser: removeUser,
        getUser: getUser,
        setServersOfUser: setServersOfUser,
        log: log,
        getLog: getLog,
        updateUserToken: updateUserToken,
        getSoundCategories: getSoundCategories
    }
    return databaseHelper;

    function addUser(user, authData, servers){
        if(!getUser(user.id)){
            let query = JSON.parse(JSON.stringify(user)); //without reference
            query.info = authData;
            query.servers = servers;
            query.time = new Date().getTime();
            db.get(users).push(query).write();
        }
        else{
            updateUserToken(user.id, authData);
        }
    }

    function addSoundsMeta(files,user, category){
        files.forEach(file =>{
            addSoundMeta(file.path, user, category);
        });
    }

    function addSoundMeta(path, user, category){
        db.get(sounds).push({id: nanoid(), path: path, fileName: fileHelper.getFileName(path), category: category, user: {id: user.id, name: user.username}, time: new Date().getTime()}).write();
    }

    function getSoundsMeta(){
        return db.get(sounds).value().map(meta =>{
            delete meta.path;
            return meta;
        }).sort((a,b) => a.fileName.localeCompare(b.fileName));
    }

    function getSoundMeta(id){
        return db.get(sounds).find({id: id}).value();
    }

    function getSoundCategories(){
        return Array.from(new Set(db.get(sounds).value().map(meta => meta.category))).sort((a,b) => a.localeCompare(b));
    }

    function removeSoundMeta(id, user){
        let meta = getSoundMeta(id);
        let remove = meta && (meta.user.id === user.id || user.admin);
        if(remove){
            db.get(sounds).remove({id: id}).write();
        }
        return remove;
    }

    function updateSoundMeta(id, user, fileName, category){
        let meta = getSoundMeta();
        let update = meta && (meta.user.id === user.id || user.admin);
        if(update){
            let query = {};
            if(fileName){
                query.fileName = fileName;
            }
            if(category){
                query.category = category;
            }
            db.get(sounds).find({id: id}).assign(query).write();
        }
        return update;
    }

    function updateUserToken(id, info){
        db.get(users).find({id: id}).assign({info: info, time: new Date().getTime()}).write();
    }

    function removeUser(id){
        db.get(users).remove({id: id}).write();
    }

    function getUser(id){
        return db.get(users).find({id: id}).value();
    }

    function setServersOfUser(id, servers){
        db.get(users).find({id: id}).assign({ servers: servers}).write();
    }

    function log(user, serverName, message){
        let query = {};
        query.username = user.username;
        query.message = message;
        query.timestamp = Date.now();
        query.serverName = serverName;
        let logs = getLog();
        if(logs.length > maxLogsStored){
            logs = logs.slice(logs.length-(maxLogsDeleted+1));
            logs.push(query);
            db.assign({log: logs}).write();
        }
        else{
            db.get('log').push(query).write();
        }
    }

    function getLog(){
        let logs = db.get('log').value();
        return logs.slice(logs.length - (maxLogsReturned+1)).sort((a,b) => (b.timestamp - a.timestamp));
    }
}