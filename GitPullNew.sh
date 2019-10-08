#!/bin/sh
if git merge-base --is-ancestor origin/master master;
then
	echo "nix neies!"
else
	echo "olles nei!"
	git fetch
	git pull
	node stop
	npm install --production
	node start
fi
