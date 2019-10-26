'use strict'
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fileHelper = require('./fileHelper.js')();
const database = __dirname+'/../config/database.json';
fileHelper.checkAndCreateFile(database);
const adapter = new FileSync(database);
const db = low(adapter);
const users = 'users';
const sounds = 'sounds';
const logs = 'log';
const maxLogsReturned = 20;
const maxLogsStored = 100;
const maxLogsDeleted = 50;
setDefault();

function setDefault(){
    let query = {};
    query[users] = [];
    query[sounds] = [];
    query[logs] = [];
    db.defaults(query).write();
}

module.exports = () =>{
    
    const databaseHelper = {
        addUser: addUser,
        addSoundsMeta: addSoundsMeta,
        addSoundMeta: addSoundMeta,
        removeSoundMeta: removeSoundMeta,
        updateSoundMeta: updateSoundMeta,
        getSoundsMeta: getSoundsMeta,
        getSoundMeta: getSoundMeta,
        removeUser: removeUser,
        getUser: getUser,
        setServersOfUser: setServersOfUser,
        logPlaySound: logPlaySound,
        getLog: getLog,
        updateUserToken: updateUserToken,
        getSoundCategories: getSoundCategories,
        setIntro: setIntro,
        getIntro: getIntro,
        getUserInfo: getUserInfo,
        getUsersInfo: getUsersInfo,
        addUserWithoutToken: addUserWithoutToken,
        getSoundMetaByName: getSoundMetaByName
    }
    return databaseHelper;

    function addUser(user, authData, servers){
        const userInfo = getUser(user.id);
        if(!userInfo || !userInfo.info){
            const userClone = JSON.parse(JSON.stringify(user));//without reference
            let query = userInfo ? {...userInfo, ...userClone} : userClone;
            query.info = authData;
            query.servers = servers;
            query.time = new Date().getTime();
            db.get(users).push(query).write();
        }
        else{
            updateUserToken(user.id, authData);
        }
    }

    function addUserWithoutToken(user){
        db.get(users).push(user).write();
    }

    function setIntro(userId, soundId){
        if(!getUser(userId)){
            addUserWithoutToken({id: userId});
        }
        db.get(users).find({id: userId}).assign({intro: soundId}).write();
    }

    function getIntro(userId){
        let userInfo = getUser(userId);
        return userInfo ? userInfo.intro : undefined;
    }

    function addSoundsMeta(files,user, category){
        return files.map(file =>{
            return addSoundMeta(fileHelper.getFileName(file.filename), file.path, fileHelper.getFileName(file.originalname), user, category);
        });
    }

    function addSoundMeta(id, filePath, fileName, user, category){
        const query = {id: id, path: filePath, fileName: fileName, category: category, user: {id: user.id, name: user.username}, time: new Date().getTime()};
        db.get(sounds).push(query).write();
        logSoundUpload(query);
        let {path, ...result} = query;
        return result;
    }

    function getSoundsMeta(){
        return db.get(sounds).value().map(({ path, ...item }) => item).sort((a,b) => a.fileName.localeCompare(b.fileName));
    }

    function getSoundMeta(id){
        return db.get(sounds).find({id: id}).value();
    }

    function getSoundMetaByName(name){
        return db.get(sounds).find({fileName: name}).value();
    }

    function getSoundCategories(){
        return Array.from(new Set(db.get(sounds).value().map(meta => meta.category))).sort((a,b) => a.localeCompare(b));
    }

    function removeSoundMeta(id){
        logSoundDelete(getSoundMeta(id));
        db.get(sounds).remove({id: id}).write();
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

    function getUsersInfo(users){
        return users.map(user =>{
            return getUserInfo(user);
        });
    }

    function getUserInfo(user){
        const userInfo = getUser(user.id);
        let intro = {};
        if(userInfo){
            if(userInfo.intro){
                intro = {
                    id: userInfo.intro,
                    fileName: getSoundMeta(userInfo.intro).fileName
                };
            }
            else{
                user.servers = userInfo.servers;
            }
        }
        user.intro = intro;
        return user;
    }

    function setServersOfUser(id, servers){
        db.get(users).find({id: id}).assign({ servers: servers}).write();
    }

    function logPlaySound(user, serverName, message){
        let query = {};
        query.username = user.username;
        query.message = message;
        query.serverName = serverName;
        log(query);
    }

    function log(query){
        query.timestamp = Date.now();
        let logData = getLogs();
        if(logData.length > maxLogsStored){
            logData = logData.slice(logData.length-(maxLogsDeleted+1));
            logData.push(query);
            db.assign({log: logData}).write();
        }
        else{
            db.get(logs).push(query).write();
        }
    }

    function logSoundUpload(soundMeta){
        log({username: soundMeta.user.name, message:'Sound Upload', fileName: soundMeta.fileName, fileId: soundMeta.id});
    }

    function logSoundDelete(soundMeta){
        log({username: soundMeta.user.name, message:'Sound Delete', fileName: soundMeta.fileName, fileId: soundMeta.id});
    }

    function getLogs(){
        return db.get(logs).value();
    }

    function getLog(){
        let logsData = getLogs();
        return logsData.slice(logsData.length > maxLogsReturned ? (logsData.length - (maxLogsReturned+1)): 0).sort((a,b) => (b.timestamp - a.timestamp));
    }
}