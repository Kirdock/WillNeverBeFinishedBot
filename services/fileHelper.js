'use strict'
const fs = require('fs');
const q = require('q');
const path = require('path');
const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => fs.lstatSync(source).isFile();
const config = require('./../config.json');

module.exports = () =>{

    const fileHelper = {
        getDirectories: getDirectories,
        getDirectoriesWithName: getDirectoriesWithName,
        moveToCategory: moveToCategory,
        tryGetSoundFile: tryGetSoundFile,
        getSounds: getSounds
    };

    checkAndCreateFolder();

    return fileHelper;

    function getDirectories(source){
        return fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
    }

    function getFiles(source){
        return fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);
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
        const newFile = path.join(config.soundFolder,category,path.basename(oldfile));
        
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
        const dirs = getDirectories(config.soundFolder);
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
        const folder = path.join(config.soundFolder,config.uploadFolder);
        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
        }
    }

    function getSounds(){
        let result = {};
        getDirectories(config.soundFolder).forEach( dir => {
            result[dir.split(path.sep).pop()] = getFiles(dir).map(file => {return {path: file, name: path.basename(file, path.extname(file))}});
        });
        return result;
    }
}
