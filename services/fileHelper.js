'use strict'
const fs = require('fs');
const q = require('q');
const path = require('path');
const isDirectory = source => fs.lstatSync(source).isDirectory();
const config = require('./../config.json');

module.exports = () =>{

    const fileHelper = {
        getDirectories: source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory),
        getDirectoriesWithName: getDirectoriesWithName,
        moveToCategory: moveToCategory
    };

    checkAndCreateFolder();

    return fileHelper;


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
        console.log(config.soundFolder,category,path.basename(oldfile));
        const newFile = path.join(config.soundFolder,category,path.basename(oldfile));
        console.log(oldfile, newFile);
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

    function checkAndCreateFolder(){
        const folder = path.join(config.soundFolder,config.uploadFolder);
        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
        }
    }
}
