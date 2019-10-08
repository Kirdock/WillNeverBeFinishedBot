#!/bin/sh

UPSTREAM=${1:-'@{u}'}
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "$UPSTREAM")
BASE=$(git merge-base @ "$UPSTREAM")


if [ $LOCAL = $BASE ];
then
    echo "olles nei!"
	git pull
	npm stop
	npm install --production
	npm start
else
	echo "nix neies!"
fi


#if [ $LOCAL = $REMOTE ]; then
#    echo "Up-to-date"
#elif [ $REMOTE = $BASE ]; then
#    echo "Need to push"
#else
#    echo "Diverged"
#fi
