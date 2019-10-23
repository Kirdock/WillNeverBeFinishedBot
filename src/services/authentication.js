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
    isAdmin: isAdmin
}



function getToken(){
    if (!cachedToken) {
        if(storage.getItem(tokenName)){
            cachedToken = storage.getItem(tokenName);
        }
    }
    return cachedToken;
}

function setToken(token){
    cachedToken = token;
    storage.setItem(tokenName, token);
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
        payload = token.split(".")[1];
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

function isAdmin(){
    const payload = getDecodedToken();
    return payload && payload.admin;
}

    
export default authorization;