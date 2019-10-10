'use strict'
axios.interceptors.request.use(function (config) {
    config.headers.Authorization = 'Bearer ' + getToken();
    return config;
});

let cachedToken;
const storage = window.localStorage;
const tokenName = 'OiToken';
let isLoggedIn;
updateIsLoggedIn();

const authorization = {
    getToken: getToken,
    setToken: setToken,
    getDecodedToken: getDecodedToken,
    deleteToken: deleteToken,
    isLoggedIn: isLoggedIn
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
    updateIsLoggedIn();
}

function deleteToken(){
    cachedToken = undefined;
    storage.setItem(tokenName,undefined);
    updateIsLoggedIn();
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

function updateIsLoggedIn(){
    isLoggedIn = getToken() !== undefined;
}

    
export {authorization}