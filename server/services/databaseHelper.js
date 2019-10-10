'use strict'
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');



module.exports = () =>{
    const fileHelper = require('./fileHelper.js')();
    const database = __dirname+'/../config/database.json';
    fileHelper.checkAndCreateFile(database);
    const adapter = new FileSync(database);
    const db = low(adapter);
    const users = 'users';

    setDefault();

    const databaseHelper = {
        addUser: addUser,
        removeUser: removeUser,
        getUser: getUser
    }
    return databaseHelper;

    function addUser(user, authData){
        if(!getUser(user.id)){
            let query = JSON.parse(JSON.stringify(user)); //without reference
            query.info = authData;
            db.get(users).push(query).write();
        }
    }

    function removeUser(id){
        db.get('users').remove({id: id}).write();
    }

    function getUser(id){
        return db.get(users).find({id: id}).value();
    }

    function setDefault(){
        let query = {};
        query[users] = [];
        db.defaults(query).write();
    }
}