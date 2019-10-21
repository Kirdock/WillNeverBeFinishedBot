'use strict'
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');



module.exports = () =>{
    const fileHelper = require('./fileHelper.js')();
    const database = __dirname+'/config/database.json';
    fileHelper.checkAndCreateFile(database);
    const adapter = new FileSync(database);
    const db = low(adapter);
    const users = 'users';

    setDefault();

    const databaseHelper = {
        addUser: addUser,
        removeUser: removeUser,
        getUser: getUser,
        setServersOfUser: setServersOfUser,
        log: log,
        getLog: getLog
    }
    return databaseHelper;

    function addUser(user, authData, servers, time){
        if(!getUser(user.id)){
            let query = JSON.parse(JSON.stringify(user)); //without reference
            query.info = authData;
            query.servers = servers;
            query.time = time;
            db.get(users).push(query).write();
        }
    }

    function removeUser(id){
        db.get(users).remove({id: id}).write();
    }

    function getUser(id){
        return db.get(users).find({id: id}).value();
    }

    function setDefault(){
        let query = {};
        query[users] = [];
        query['log'] = [];
        db.defaults(query).write();
    }

    function setServersOfUser(id, servers){
        db.get(users).find({id: id}).assign({ servers: servers}).write();
    }

    function log(user, message){
        let query = {};
        query.username = user.username;
        query.message = message;
        query.timestamp = Date.now();
        db.get('log').push(query).write();
    }

    function getLog(){
        return db.get('log').value();
    }
}