'use strict'
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fileHelper = require('./fileHelper.js')();
const database = __dirname+'/../config/database.json';
fileHelper.checkAndCreateFile(database);
const adapter = new FileSync(database);
const db = low(adapter);
const users = 'users';
const maxLogs = 20;
const maxLogsStored = 100;
const maxLogsDeleted = 50;
setDefault();

function setDefault(){
    let query = {};
    query[users] = [];
    query['log'] = [];
    db.defaults(query).write();
}

module.exports = () =>{
    
    const databaseHelper = {
        addUser: addUser,
        removeUser: removeUser,
        getUser: getUser,
        setServersOfUser: setServersOfUser,
        log: log,
        getLog: getLog,
        updateUserToken: updateUserToken
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
        return logs.slice(logs.length - (maxLogs+1)).sort((a,b) => (b.timestamp - a.timestamp));
    }
}