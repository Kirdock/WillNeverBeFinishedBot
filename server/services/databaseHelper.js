'use strict'
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

module.exports = () =>{
    const databaseHelper = {
        addUser: addUser,
        removeUser: removeUser,
        getUser: getUser
    }
    return databaseHelper;

    function addUser(user){

    }

    function removeUser(user){

    }

    function getUser(id){

    }
}