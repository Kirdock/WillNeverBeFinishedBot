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
const servers = 'servers';
const settings = 'settings';
const maxLogsReturned = 20;
const maxLogsStored = 100;
const maxLogsDeleted = 50;
setDefault();

// db.get(sounds).value().forEach(sound =>{
//     delete sound.server;
//     sound.serverId = '174198012501819393';
// });
// db.write();

function setDefault(){
    let query = {};
    query[users] = [];
    query[sounds] = [];
    query[logs] = [];
    query[servers] = [];
    query[settings] = {};
    db.defaults(query).write();
}

module.exports = () =>{
    
    const databaseHelper = {
        addUser: addUser,
        addSoundsMeta: addSoundsMeta,
        addSoundMeta: addSoundMeta,
        removeSoundMeta: removeSoundMeta,
        getSoundsMeta: getSoundsMeta,
        getSoundMeta: getSoundMeta,
        removeUser: removeUser,
        getUser: getUser,
        logPlaySound: logPlaySound,
        getLog: getLog,
        updateUserToken: updateUserToken,
        getSoundCategories: getSoundCategories,
        setIntro: setIntro,
        getIntro: getIntro,
        getUserInfo: getUserInfo,
        getUsersInfo: getUsersInfo,
        addUserWithoutToken: addUserWithoutToken,
        getSoundMetaByName: getSoundMetaByName,
        getServersInfo: getServersInfo,
        udpateServerInfo: udpateServerInfo,
        getServerInfo: getServerInfo,
        setForceLock,
        getForceLock
    }
    return databaseHelper;

    function setForceLock(forceLock){
        return db.get(settings).assign({forceLock});
    }

    function getForceLock(){
        return db.get(settings).value().forceLock;
    }

    function addUser(user, authData){
        const userInfo = getUser(user.id);
        if(!userInfo || !userInfo.info){
            const userClone = JSON.parse(JSON.stringify(user));//without reference
            let query = userInfo ? {...userInfo, ...userClone} : userClone;
            query.info = authData;
            query.time = new Date().getTime();
            if(userInfo){
                db.get(users).find({id:user.id}).assign(query).write();
            }
            else{
                db.get(users).push(query).write();
            }
        }
        else{
            updateUserToken(user.id, authData);
        }
    }

    function addUserWithoutToken(user){
        db.get(users).push(user).write();
    }

    function setIntro(userId, soundId, serverId){
        if(!getUser(userId)){
            addUserWithoutToken({id: userId});
        }
        let query = {intros:{}};
        query.intros[serverId] = soundId;
        db.get(users).find({id: userId}).assign(query).write();
    }

    function getIntro(userId, serverId){
        let userInfo = getUser(userId);
        return userInfo && userInfo.intros ? userInfo.intros[serverId] : undefined;
    }

    function addSoundsMeta(files,user, category, serverId, serverName){
        return files.map(file =>{
            return addSoundMeta(fileHelper.getFileName(file.filename), file.path, fileHelper.getFileName(file.originalname), user, category, serverId, serverName);
        });
    }

    function addSoundMeta(id, filePath, fileName, user, category, serverId, serverName){
        const query = {id: id, path: filePath, fileName: fileName, category: category, user: {id: user.id, name: user.username}, serverId: serverId, time: new Date().getTime()};
        db.get(sounds).push(query).write();
        logSoundUpload(query, serverName);
        let {path, ...result} = query;
        return result;
    }

    function getSoundsMeta(servers){
        return db.get(sounds).value().map(({ path, ...item }) => item).filter(meta => servers.some(server => server.id === meta.serverId)).sort((a,b) => a.fileName.localeCompare(b.fileName));
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

    function removeSoundMeta(id, serverName){
        logSoundDelete(getSoundMeta(id), serverName);
        db.get(sounds).remove({id: id}).write();
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

    function getUsersInfo(users, serverId){
        return users.map(user =>{
            return getUserInfo(user, serverId);
        });
    }

    function getUserInfo(user, serverId){
        const userInfo = getUser(user.id);
        user.intros = {};
        if(userInfo && userInfo.intros){
            for(let serverId of Object.keys(userInfo.intros)){
                let intro = {id:''};
                const meta = getSoundMeta(userInfo.intros[serverId]);
                if(meta){
                    intro = {
                        id: userInfo.intros[serverId],
                        fileName: meta.fileName
                    };
                }
                user.intros[serverId] = intro;
            }
        }
        if(!user.intros){
            user.intros = {};
        }
        if(!user.intros[serverId]){
            user.intros[serverId] = {id:''};
        }
        return user;
    }

    function logPlaySound(user, serverId, serverName, meta){
        let query = {};
        query.username = user.username;
        query.message = 'Play Sound';
        query.server = {
            id: serverId,
            name: serverName
        };
        query.fileId = meta.id;
        query.fileName = meta.fileName;
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

    function logSoundUpload(soundMeta, serverName){
        log({username: soundMeta.user.name, message:'Sound Upload', fileName: soundMeta.fileName, fileId: soundMeta.id, server: {id: soundMeta.serverId, name: serverName}});
    }

    function logSoundDelete(soundMeta, serverName){
        log({username: soundMeta.user.name, message:'Sound Delete', fileName: soundMeta.fileName, fileId: soundMeta.id, server: {id: soundMeta.serverId, name: serverName}});
    }

    function getLogs(){
        return db.get(logs).value();
    }

    function getLog(servers){
        let logsData = getLogs();
        
        if(servers){
            logsData = logsData.filter(log => servers.some(server => server.id == log.server.id));
        }
        
        return logsData.slice(logsData.length > maxLogsReturned ? (logsData.length - (maxLogsReturned+1)): 0).sort((a,b) => (b.timestamp - a.timestamp));
    }

    function getServersInfo(botServers){
        return botServers.map(server => getServerInfo(server.id) || server);
    }

    function getServerInfo(id){
        return db.get(servers).find({id: id}).value();
    }

    function udpateServerInfo(serverInfo){
        if(getServerInfo(serverInfo.id)){
            db.get(servers).find({id: serverInfo.id}).assign(serverInfo).write();
        }
        else{
            db.get(servers).push(serverInfo).write();
        }
    }
}