#!/bin/sh
if git merge-base --is-ancestor origin/master master;
then
	echo "nix neies!"
else
	echo "olles nei!"
	git fetch
	git pull
	npm stop
	npm install --production
	npm start
fi
