#!/bin/bash
#

set -e

NODE_VERSION=${INPUT_NODE_VERSION}

nvm install ${NODE_VERSION:-14.17.0}

node -v
npm -v

ls

