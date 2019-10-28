'use strict'
// const url = require('url');
const q = require('q');
const jwt = require('jsonwebtoken');
const databaseHelper = require('./databaseHelper.js')();
const fetch = require('node-fetch');
const FormData = require('form-data');
const { Permissions } = require('discord.js');

module.exports = (config) =>{
    const userHelper = {
        login: login,
        tryGetToken: tryGetToken,
        auth: auth
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
                        userData.owner = config.owner == userData.id;
                        userData.admin = config.admins.includes(userData.id);
                        userData.application = application;
                        databaseHelper.addUser(userData, res);
                        defer.resolve(jwt.sign(userData, secret));
                    }
                })
                .catch(defer.reject);
            }
        });
        
        return defer.promise;
    }

    function refreshToken(refresh_token, scope, request_url){
        const data = new FormData();

        data.append('client_id', config.clientId);
        data.append('client_secret', config.clientSecret);
        data.append('grant_type', 'refresh_token');
        data.append('redirect_uri', request_url);
        data.append('scope', scope);
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
                if(token && token.length > 0){
                    tryGetToken(token).then(data =>{ //returns all user information including auth_token
                        if (!data || data.application !== application) {
                            result.status = 401;
                            result.message = 'Authentication failed!';
                            defer.reject(result);
                        }
                        else{
                            checkTokenExpired(data, req.headers.referer+'Login').then(newUser =>{
                                result.user = newUser;
                                // if(result.user.permission == '188015113888989184'){
                                    defer.resolve(result);
                                // }
                                // else{
                                //     defer.reject(new Error('User does not have enough permission ' + result.user.username));
                                // }
                            }).catch(defer.reject);
                        }
                    }).catch(defer.reject);
                }
                else{
                    defer.reject({status: 401});
                }
			}
		}
		catch (e) {
            result.status = 401;
            result.error = e;
            result.message = 'Authentication failed!';
            defer.reject(result);
		}
		return defer.promise;
    }

    function tryGetToken(authToken){
        const defer = q.defer();
        jwt.verify(authToken, secret, function(err, decoded) {
            if(err){
                defer.reject(err);
            }
            else{
                let user = databaseHelper.getUser(decoded.id);
                if(user){
                    defer.resolve(user);
                }
                else{
                    defer.reject({status: 401});
                }
            }
        });
        return defer.promise;
    }

    function checkTokenExpired(user, request_url){
        const defer = q.defer();
        const timeBegin = user.time;
        const expire = user.info.expires_in;
        const timeNow = new Date().getTime();
        if((timeNow - timeBegin)/1000 > expire){
            console.log('refresh Token',timeNow, timeBegin, expire, user.username, request_url);
            databaseHelper.updateUserToken(user.id, user.info);
            //reset time just in case there are several requests by the user
            //else there will be several refresh request if the first one has not received a response
            refreshToken(user.info.refresh_token, user.info.scope, request_url).then(result =>{
                if(result.error){
                    result.status = 401;
                    result.user = user;
                    defer.reject(result);
                }
                else{
                    user.info = result;
                    databaseHelper.updateUserToken(user.id, user.info);
                    defer.resolve(user);
                }
            }).catch(defer.reject);
        }
        else{
            defer.resolve(user);
        }
        return defer.promise;
    }
}