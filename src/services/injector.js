import auth from './authentication';
import axios from 'axios';

axios.interceptors.request.use(function (config) {
    const token = auth.getToken();
    if(token){
        config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
});

