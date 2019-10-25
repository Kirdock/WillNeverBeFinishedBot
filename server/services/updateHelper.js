'use strict'
const spawn   = require('child_process').spawn;
const q = require('q');

module.exports = (config, logger) =>{

    const updateHelper = {
        updateWebsite: updateWebsite
    };

    return updateHelper;

    function updateWebsite(){
        const defer = q.defer();
        try{
            spawn(__dirname+'/../scripts/GitPull.sh');
            defer.resolve({success: true});
        }
        catch (error){
            defer.reject(error);
        }

        return defer.promise;
    }

};