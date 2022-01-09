#!/bin/sh
#

set -e

REPOSITORY=${INPUT_REPOSITORY}
ACCESS_TOKEN=${INPUT_ACCESS_TOKEN}
SSH_KEY=${INPUT_SSH_KEY}
SSH_HOST=${INPUT_SSH_HOST}
TARGET_NAME=${INPUT_TARGET}

mkdir -p ~/.ssh

if [ -n "$SSH_KEY" ]; then
  eval $(ssh-agent -s)
  echo "$SSH_KEY" | tr -d '\r' | ssh-add -
fi

if [ -n "$SSH_HOST" ]; then
  ssh-keyscan -H "$SSH_HOST" >> ~/.ssh/known_hosts
fi

Z_REPOSITORY=$REPOSITORY

if [ -n "$ACCESS_TOKEN" ]; then
  if [[ $(expr match "$REPOSITORY" 'https://*') != 0 ]]; then
      Z_REPOSITORY=$(echo $REPOSITORY | sed -e "s/https:\/\//https:\/\/${ACCESS_TOKEN}@/g")
  fi
  if [[ $(expr match "$REPOSITORY" 'http://*') != 0 ]]; then
      Z_REPOSITORY=$(echo $REPOSITORY | sed -e "s/http:\/\//http:\/\/${ACCESS_TOKEN}@/g")
  fi
fi



echo 'Repository:' $Z_REPOSITORY
if [ -z "$TARGET_NAME" ]; then
    git clone $Z_REPOSITORY repo
    chmod -R 755 ./repo
    mv ./repo/* ./
    rm -rf ./repo

    echo "Cloned $Z_REPOSITORY repository successfully."
else
    git clone $Z_REPOSITORY $TARGET_NAME
    chmod -R 755 ./$TARGET_NAME

    echo "Cloned $Z_REPOSITORY repository successfully."
    echo "Access the repository content using \"cd $TARGET_NAME\"."
fi

