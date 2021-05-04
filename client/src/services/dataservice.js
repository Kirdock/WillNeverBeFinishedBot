"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataService = void 0;
var config_js_1 = __importDefault(require("./config.js"));
var axios_1 = __importDefault(require("axios"));
var DataService = /** @class */ (function () {
    function DataService() {
        this.options = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        axios_1.default.defaults.baseURL = config_js_1.default.api;
    }
    DataService.prototype.setIntro = function (soundId, userId, serverId) {
        return axios_1.default.post('/setIntro', { soundId: soundId, userId: userId, serverId: serverId }, this.options);
    };
    DataService.prototype.downloadSound = function (soundId) {
        return axios_1.default({
            method: 'GET',
            url: '/sound/' + soundId,
            responseType: 'blob'
        });
    };
    DataService.prototype.updateServerInfo = function (serverInfo) {
        return axios_1.default.post('/serverInfo', { serverInfo: serverInfo }, this.options);
    };
    DataService.prototype.fetchUsersData = function (serverId) {
        return axios_1.default.get('/users/' + serverId);
    };
    DataService.prototype.fetchUserData = function (serverId) {
        return axios_1.default.get('/user/' + serverId);
    };
    DataService.prototype.fetchServers = function () {
        return axios_1.default.get('/servers');
    };
    DataService.prototype.fetchLogs = function () {
        return axios_1.default.get('/log');
    };
    DataService.prototype.playSound = function (data) {
        return axios_1.default.post('/playSound', data, this.options);
    };
    DataService.prototype.deleteSound = function (id) {
        return axios_1.default.delete('/deleteSound/' + id);
    };
    DataService.prototype.fetchCategories = function () {
        return axios_1.default.get('/soundCategories');
    };
    DataService.prototype.uploadFile = function (file) {
        return axios_1.default.put(config_js_1.default.api + '/uploadFile', file, {
            headers: {
                'Content-Type': undefined
            }
        });
    };
    DataService.prototype.fetchSounds = function (serverId) {
        return axios_1.default.get('/sounds' + (serverId ? '/' + serverId : ''));
    };
    DataService.prototype.fetchChannels = function (serverId) {
        return axios_1.default.get('/Channels/' + serverId);
    };
    DataService.prototype.updateWebsite = function () {
        return axios_1.default.get('/UpdateWebsite');
    };
    DataService.prototype.stopPlaying = function (serverId) {
        return axios_1.default.get('/stopPlaying/' + serverId);
    };
    DataService.prototype.login = function (code, redirectUrl) {
        return axios_1.default.post('/login', {
            code: code,
            redirectUrl: redirectUrl
        }, this.options);
    };
    DataService.prototype.hasAdminServers = function () {
        return axios_1.default.get('/hasAdminServers');
    };
    return DataService;
}());
exports.DataService = DataService;
