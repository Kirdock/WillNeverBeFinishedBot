'use strict'
const shell = require('shelljs')
const q = require('q');


module.exports = (config, logger) =>{

    const updateHelper = {
        updateWebsite: updateWebsite
    };


    return updateHelper;

    function updateWebsite(){
        const defer = q.defer();
        const child = shell.exec('./../GitPull.sh');
        if(child){
            child.stdout.on('data', function(data) {
                defer.resolve(data);
            });
        }
        else{
            defer.reject('File not found?');
        }

        return defer.promise();
    }

};