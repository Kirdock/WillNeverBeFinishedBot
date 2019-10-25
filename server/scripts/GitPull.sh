#!/bin/bash
exec 3>&1 4>&2
trap 'exec 2>&4 1>&3' 0 1 2 3
exec 1>log.out 2>&1

git fetch
UPSTREAM=${1:-'@{u}'}
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "$UPSTREAM")
BASE=$(git merge-base @ "$UPSTREAM")

if [ $LOCAL = $REMOTE ];
then
	echo "Up-to-date"
elif [ $LOCAL = $BASE ];
then
    echo "need to pull"
	git pull
	npm install --production
	npm run build
	npm restart
elif [ $REMOTE = $BASE ];
then
    echo "Need to push"
else
    echo "Diverged"
fi
