'use strict'

let cachedToken;
const storage = window.localStorage;
const tokenName = 'OiToken';

const authorization = {
    getToken: getToken,
    setToken: setToken,
    hasToken: hasToken,
    getDecodedToken: getDecodedToken,
    deleteToken: deleteToken,
    isLoggedIn: isLoggedIn,
    isOwner: isOwner,
    setHasAdminServers: setHasAdminServers,
    getHasAdminServers: getHasAdminServers
}



function getToken(){
    if (!cachedToken) {
        const tempToken = storage.getItem(tokenName);
        if(tempToken){
            cachedToken = tempToken;
        }
    }
    return cachedToken;
}

function setToken(token){
    cachedToken = token;
    storage.setItem(tokenName, token);
}

function setHasAdminServers(status){
    storage.setItem('hasAdminServers', status);
}

function getHasAdminServers(){
    return !!storage.getItem('hasAdminServers');
}

function hasToken(){
    return !!getToken();
}

function deleteToken(){
    cachedToken = undefined;
    storage.removeItem(tokenName);
}


function getDecodedToken () {
    let decoded_payload;
    let payload;
    const token = getToken();

    if (token) {
        payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        switch (payload.length % 4) {
            case 0:
                break;
            case 1:
                payload += "===";
                break;
            case 2:
                payload += "==";
                break;
            case 3:
                payload += "=";
                break;
        }
        decoded_payload = JSON.parse(atob(payload));
    }
    return decoded_payload;
}

function isLoggedIn(){
    return !!getToken();
}

function isOwner(){
    const payload = getDecodedToken();
    return payload && payload.owner;
}

    
export default authorization;