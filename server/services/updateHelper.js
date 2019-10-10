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
        try{
            const child = shell.exec(__dirname+'/../scripts/GitPull.sh',{async: true});
            child.stdout.on('data', function(data) {
                defer.resolve(data);
            });
        }
        catch (error){
            defer.reject(error);
        }

        return defer.promise;
    }

};