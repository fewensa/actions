#!/bin/bash
#

set -e

NODE_VERSION=${INPUT_NODE_VERSION:-14.17.0}

nvm install ${NODE_VERSION}
nvm use ${NODE_VERSION}

node -v
npm -v

ls

