'use strict'
// const url = require('url');
const q = require('q');
const jwt = require('jsonwebtoken');
const databaseHelper = require('./databaseHelper.js')();
const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = (config) =>{
    const userHelper = {
        login: login,
        refreshToken: refreshToken,
        tryGetToken: tryGetToken,
        getServers: getServers,
        auth: auth,
        getServersEquivalent: getServersEquivalent,
        isInServer: isInServer,
        updateServers: updateServers
    }
    const secret = 'Q8{He@4et!5Prhr/Zy:s';
    const application = 'DiscordBot';

    return userHelper;

    //returns JSON WebToken with user data (auth_token not included)
    function login(code, redirectUrl){
        var defer = q.defer();
        const data = new FormData();

        data.append('client_id', config.clientId);
        data.append('client_secret', config.clientSecret);
        data.append('grant_type', 'authorization_code');
        data.append('redirect_uri', redirectUrl);
        data.append('scope', config.scope);
        data.append('code', code);
        
        fetch('https://discordapp.com/api/oauth2/token',{
            method: 'POST',
            body: data
        }).then(res => res.json())
        .then(res =>{
            if(res.error){
                defer.reject(res.error);
            }
            else{
                fetchData(res)
                .then(userData => {
                    if(!userData){
                        defer.reject({message: 'Not authorized'});
                    }
                    else{
                        
                        getServersWithToken(res).then(servers =>{
                            userData.owner = config.owner == userData.id;
                            userData.admin = config.admins.includes(userData.id);
                            userData.application = application;

                            databaseHelper.addUser(userData, res, servers);

                            defer.resolve(jwt.sign(userData, secret));
                        }).catch(defer.reject)
                    }
                })
                .catch(defer.reject);
            }
        });
        
        return defer.promise;
    }

    function refreshToken(refresh_token, redirectUrl){
        const data = new FormData();

        data.append('client_id', config.clientId);
        data.append('client_secret', config.clientSecret);
        data.append('grant_type', 'refresh_token');
        data.append('redirect_uri', redirectUrl);
        data.append('scope', config.scope);
        data.append('refresh_token', refresh_token);

        return fetch('https://discordapp.com/api/oauth2/token',{
            method: 'POST',
            body: data
        }).then(r=>r.json());
    }

    function fetchData(info){
        return fetch('https://discordapp.com/api/users/@me', {
            headers: {
                authorization: `${info.token_type} ${info.access_token}`
            },
        }).then(res => res.json());
    }

    function tryGetToken(authToken){
        const defer = q.defer();
        jwt.verify(authToken, secret, function(err, decoded) {
            if(err){
                defer.reject(err);
            }
            else{
                defer.resolve(databaseHelper.getUser(decoded.id));
            }
        });
        return defer.promise;
    }

    function auth(req){
        const defer = q.defer();
        let result = {
			status:  200,
			message: 'Everything went well'
		};
		try {
			if (!req.headers.authorization) {
				result.status = 301;
                result.message = 'Sorry, you are not authorized yet.';
                defer.reject(result);
			}
			else {
                const token = req.headers.authorization.split(' ')[1]; // strip 'Bearer'
                tryGetToken(token).then(data =>{
                    if (data.application !== application) {
                        result.status = 401;
                        result.message = 'Authentication failed!';
                        defer.reject(result);
                    }
                    else{
                        result.user = data;
                        defer.resolve(result);
                    }
                }).catch(defer.reject);
			}
		}
		catch (e) {
			result.status = 401;
            result.message = 'Authentication failed!';
            defer.reject(result);
		}
		return defer.promise;
    }

    function getServers(user){
        const defer = q.defer();
        defer.resolve(user.servers);
        return defer.promise;
    }

    function getServersWithToken(info){
        return fetch('https://discordapp.com/api/users/@me/guilds', {
            method: 'GET',
            headers: {
                authorization: `${info.token_type} ${info.access_token}`,
            },
        }).then(res => res.json());
    }

    function getServersEquivalent(user, botServers){
        const defer = q.defer();
        getServers(user).then(servers =>{
            let sameServers = [];
            servers.forEach(server =>{
                for(let i = 0; i < botServers.length; i++){
                    if(botServers[i].id == server.id){
                        sameServers.push(botServers[i]);
                        break;
                    }
                }
            });
            defer.resolve(sameServers);
        }).catch(defer.reject);
        return defer.promise;
    }

    function updateServers(user){
        return getServersWithToken(user.info).then(servers =>{
            databaseHelper.setServersOfUser(user.id,servers);
        });
    }

    function isInServer(user,serverId){
        var defer = q.defer();
        getServers(user).then(servers =>{
            if(servers.retry_after){
                defer.reject(servers);
            }
            else{
                let status = false;
                for(let i = 0; i < servers.length; i++){
                    if(servers[i].id == serverId){
                        status = true;
                        break;
                    }
                }
                if(status){
                    defer.resolve(status);
                }
                else{
                    defer.reject(status);
                }
            }
        }).catch(defer.reject);
        return defer.promise;
    }
}