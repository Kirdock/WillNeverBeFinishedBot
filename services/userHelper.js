'use strict'
// const url = require('url');
const request = require('request')
const q = require('q');
const jwt = require('jsonwebtoken');

module.exports = (config) =>{
    const userHelper = {
        login: login,
        refreshToken: refreshToken,
        tryGetToken: tryGetToken,
        getServers: getServers
    }
    const secret = 'Q8{He@4et!5Prhr/Zy:s';

    return userHelper;

    function login(code, redirectUrl){
        var defer = q.defer();

        const data = {
            'client_id': config.clientId,
            'client_secret': config.clientSecret,
            'grant_type': 'authorization_code',
            'refresh_token': refresh_token,
            'redirect_uri': redirectUrl,
            'scope': config.scope,
            'code': code
        }
        const headers ={
            'Content-Type':'application/x-www-form-urlencoded'
        }

        request.post('https://discordapp.com/api/oauth2/token', data, headers)
            .then(res => res.json())
            .then(res =>{
                //save access_token
                // users == config file
                // get users
                // users['sessionID'] = encryptedToken;
                // save users
                
                fetchData(res)
                    .then(userData => {
                        defer.resolve(jwt.sign(userData, secret));
                    })
                    .catch(defer.reject);
            })
            .catch(defer.reject);
        return defer.promise;
    }

    function refreshToken(refresh_token, redirectUrl){
        const data = {
            'client_id': config.clientId,
            'client_secret': config.clientSecret,
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'redirect_uri': redirectUrl,
            'scope': config.scope
          }
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
          r = request.post('https://discordapp.com/api/oauth2/token', data=data, headers=headers);
          r.raise_for_status();
          return r.json()
    }

    function fetchData(info){
        return request.get('https://discordapp.com/api/users/@me', {
            headers: {
                authorization: `${info.token_type} ${info.access_token}`,
            },
        });
    }

    function tryGetToken(authToken){
        const defer = q.defer();
        jwt.verify(authToken, secret, function(err, decoded) {
            if(err){
                defer.reject(err);
            }
            else{
                //defer.resolve(decoded);
                //read users file
                //defer.resolve(users[decoded.id]);
            }
        });
        return defer.promise;
    }

    function getServers(info){
        return request.get('https://discordapp.com/api/users/@me/guilds', {
            headers: {
                authorization: `${info.token_type} ${info.access_token}`,
            },
        });
    }
}