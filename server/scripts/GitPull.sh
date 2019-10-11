#!/bin/sh
cd ..
cd ..
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
	npm stop
	npm install --production
	npm start
elif [ $REMOTE = $BASE ];
then
    echo "Need to push"
else
    echo "Diverged"
fi
