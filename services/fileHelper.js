'use strict'
const fs = require('fs');
const q = require('q');
const path = require('path');
const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => fs.lstatSync(source).isFile();
const config = require('./../config.json');
const soundFolder = path.join(__dirname+'/../assets/sounds');

module.exports = () =>{

    const fileHelper = {
        getDirectories: getDirectories,
        getDirectoriesWithName: getDirectoriesWithName,
        moveToCategory: moveToCategory,
        tryGetSoundFile: tryGetSoundFile,
        getSounds: getSounds,
        createCatFolder: createCatFolder,
        existsFile: existsFile,
        getDirectoriesOfSoundFolder: getDirectoriesOfSoundFolder,
        soundFolder: soundFolder
    };

    checkAndCreateFolder();

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

    function getDirectoriesWithName(source){
        return fs.readdirSync(source).map(name => {
            return {
                    path: path.join(source, name),
                    name: name
                }
        }).filter(file => isDirectory(file.path) && file.name !== config.uploadFolder).map(file => file.name);
    }

    function moveToCategory(oldfile, category){
        const defer = q.defer();
        const newFile = path.join(soundFolder,category,path.basename(oldfile));
        
        fs.rename(oldfile, newFile, (err) => {
            if (err){
                defer.reject(err);
            }
            else{
                defer.resolve({success: true});
            }
        });
        return defer.promise;
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

    function checkAndCreateFolder(){
        const folder = path.join(soundFolder,config.uploadFolder);
        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
        }
    }

    function getSounds(){
        let result = {};
        getDirectories(soundFolder).forEach( dir => {
            result[dir.split(path.sep).pop()] = getFiles(dir).map(file => {return {path: file, name: path.basename(file, path.extname(file))}});
        });
        return result;
    }
}
