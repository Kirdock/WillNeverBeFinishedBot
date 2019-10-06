'use strict'
const fs = require('fs');
const path = require('path');
const isDirectory = source => fs.lstatSync(source).isDirectory();


module.exports = () =>{

    const fileHelper = {
        getDirectories: source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory),
        getDirectoriesWithName: getDirectoriesWithName
    };

    return fileHelper;


    function getDirectoriesWithName(source){
        return fs.readdirSync(source).map(name => {
            return {
                    path: path.join(source, name),
                    name: name
                }
        }).filter(file => isDirectory(file.path)).map(file => file.name);
    }
}
