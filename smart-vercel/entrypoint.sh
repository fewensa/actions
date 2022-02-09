#!/bin/bash
#

set -xe

SCRIPT_RUN=${INPUT_SCRIPT_RUN}
SCRIPT_INSTALL=${INPUT_SCRIPT_INSTALL}
SCRIPT_BUILD=${INPUT_SCRIPT_BUILD}
WORKDIR=${INPUT_WORKDIR}
PROJECT_NAME=${INPUT_PROJECT_NAME}
VERCEL_GROUP=${INPUT_VERCEL_GROUP}
VERCEL_TOKEN=${INPUT_VERCEL_TOKEN}
PROD_MODE=${INPUT_PROD_MODE}
DIST_PATH=${INPUT_DIST_PATH}

PREVIEW_OUTPUT=${INPUT_PREVIEW_OUTPUT}

node -v 
npm -v


cd ${WORKDIR}

if [ "${SCRIPT_RUN}" == "true" ]; then
  ${SCRIPT_INSTALL}

  ${SCRIPT_BUILD}
fi


REPO_NAME=${PROJECT_NAME:-${GITHUB_REPOSITORY#*/}}
echo ${REPO_NAME}

mv ${DIST_PATH} ${REPO_NAME}

cd ${REPO_NAME}

vercel ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} \
  ${VERCEL_GROUP:+--scope $VERCEL_GROUP} link \
  --confirm

vercel ${VERCEL_TOKEN:+--token $VERCEL_TOKEN} \
  ${VERCEL_GROUP:+--scope $VERCEL_GROUP} \
  ${PROD_MODE:+--prod} deploy | tee deploy.log

content=$(cat deploy.log)
content="${content//'%'/'%25'}"
content="${content//$'\n'/'%0A'}"
content="${content//$'\r'/'%0D'}"
PREVIEW_LINK=${content}

rm -rf deploy.log

echo ''


if [ -n "${PREVIEW_OUTPUT}" ]; then
  SHA=${GITHUB_SHA::7}
  COMMIT="Commit: [${SHA}](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/commit/${SHA})"
  PREVIEW="Preview: ${PREVIEW_LINK}"

  echo '\---' >> comment.md
  echo $COMMIT >> comment.md
  echo $PREVIEW >> comment.md
  echo '' >> comment.md

  content=$(cat comment.md)
  content="${content//'%'/'%25'}"
  content="${content//$'\n'/'%0A'}"
  content="${content//$'\r'/'%0D'}"
  PREVIEW_OUTPUT=${content}

  rm -rf comment.md

  echo "::set-output name=PREVIEW_OUTPUT::$PREVIEW_OUTPUT"
else
  echo "::set-output name=PREVIEW_OUTPUT::$PREVIEW_LINK"
fi
echo ''

echo "::set-output name=PREVIEW_LINK::$PREVIEW_LINK"
