#!/bin/bash

set -e

REPOSITORY=$1
ACCESS_TOKEN=$2
SSH_KEY=$3
SSH_HOST=$4
TARGET_NAME=$5

PATH_SSH=$HOME/.ssh

mkdir -p $PATH_SSH

if [ -n "$SSH_KEY" ]; then
  echo "$SSH_KEY" > $PATH_SSH/id_rsa
fi

if [ -n "$SSH_HOST" ]; then
  apk update
  apk add openssh
  ssh-keyscan github.com >> ~/.ssh/known_hosts
fi

Z_REPOSITORY=$REPOSITORY

if [ -n "$ACCESS_TOKEN" ]; then
  echo 'access token: ' $ACCESS_TOKEN
  if [[ "$REPOSITORY" =~ ^https://* ]]; then
      Z_REPOSITORY=$(echo $REPOSITORY | sed -e "s/https:\/\//https:\/\/${ACCESS_TOKEN}@/g")
  fi
  if [[ "$REPOSITORY" =~ ^http://* ]]; then
      Z_REPOSITORY=$(echo $REPOSITORY | sed -e "s/http:\/\//http:\/\/${ACCESS_TOKEN}@/g")
  fi
fi



if [ -z "$TARGET_NAME" ]; then
    git clone $Z_REPOSITORY

    echo "Cloned $2 repository successfully."
else
    git clone Z_REPOSITORY $TARGET_NAME

    echo "Cloned $2 repository successfully."
    echo "Access the repository content using \"cd $2\"."
fi

