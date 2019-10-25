'use strict'
const fs = require('fs');
const q = require('q');
const path = require('path');
const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => fs.lstatSync(source).isFile();
const config = require('../config/config.json');
const soundFolder = path.join(__dirname+'/../assets/sounds');

module.exports = () =>{

    const fileHelper = {
        getDirectories: getDirectories,
        tryGetSoundFile: tryGetSoundFile,
        createCatFolder: createCatFolder,
        existsFile: existsFile,
        getDirectoriesOfSoundFolder: getDirectoriesOfSoundFolder,
        soundFolder: soundFolder,
        checkAndCreateFolder: checkAndCreateFolder,
        checkAndCreateFile: checkAndCreateFile,
        deleteFiles: deleteFiles,
        deleteFiles: deleteFiles,
        getFileName: getFileName
    };
    checkAndCreateFolderSystem();

    return fileHelper;

    function getDirectories(source){
        return fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
    }

    function getDirectoriesOfSoundFolder(){
        return getDirectories(soundFolder);
    }

    function getFiles(source){
        return fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);
    }
    
    function createCatFolder(folderName){
        const folder = path.join(soundFolder, folderName);
        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
        }
        return folder;
    }

    function existsFile(folder){
        return fs.existsSync(folder);
    }

    function deleteFile(path){
        const defer = q.defer();

        fs.unlink(path,function (error){
            if(error){
                defer.reject(error);
            }
            else{
                defer.resolve({success: true});
            }
        })

        return defer.promise;
    }

    function deleteFiles(files){
        let actions = [];
        files.map(file =>{
            return deleteFile(file.path);
        });
        return q.all(actions);
    }

    function tryGetSoundFile(name){
        const dirs = getDirectories(soundFolder);
        let foundFile = undefined;
        for(let i = 0; i < dirs.length; i++){
            let file = path.join(dirs[i],name+'.mp3');
            if(fs.existsSync(file))
            {
                foundFile = file;
                break;
            }
        }
        return foundFile;
    }

    function checkAndCreateFolder(dir){
        const folder = dir;
        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
        }
    }

    function checkAndCreateFolderSystem(){
        const files = ['/../assets', '/../config', '/../assets/sounds'];
        files.forEach(folder =>{
            checkAndCreateFolder(path.join(__dirname,folder));
        })
    }

    function getFileName(filePath){
        return path.basename(filePath, path.extname(filePath));
    }

    function checkAndCreateFile(filePath){
        if(!fs.existsSync(filePath)){
            fs.writeFileSync(filePath,'{}');
        }
    }
}
