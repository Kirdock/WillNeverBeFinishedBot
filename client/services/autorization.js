'use strict'
axios.interceptors.request.use(function (config) {
    config.headers.Authorization = 'Bearer ' + getToken();
    return config;
});

let cachedToken;
const storage = window.localStorage;
const tokenName = 'OiToken';

const authorization = {
    getToken: getToken,
    setToken: setToken,
    getDecodedToken: getDecodedToken
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
        decoded_payload = JSON.parse(base64.decode(payload));
    }
    return decoded_payload;
}

    
export {authorization}