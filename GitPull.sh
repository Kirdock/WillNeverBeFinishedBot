#!/bin/sh
if [[ $(git fetch) ]];
then
	echo "olles nei!"
	git pull
	npm stop
	npm install --production
	npm start
else
	echo "nix neies!"
fi
