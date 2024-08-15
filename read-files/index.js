import * as fs from 'node:fs/promises'
import core from '@actions/core'


function _formatArrayText(text) {
  return text('\n', ',')
    .replace('\r', ',')
    .replace(' ', ',')
    .replace('\t', ',')
    .split(',')
    .filter(item => item);
}

function _pickAlias(alias, path) {
  for (const apath of Object.keys(alias)) {
    if (apath.endsWith(path)) {
      return alias[apath];
    }
  }
  return path;
}

function parsePaths() {
  const path = core.getInput('path', { required: true });
  let paths;
  try {
    paths = JSON.parse(path);
    if (paths && paths.length) {
      return paths;
    }
  } catch (e) {
  }
  return _formatArrayText(path);
}

function parseAlias() {
  const alias = core.getInput('alias');
  const rawAliasArray = _formatArrayText(alias);
  const aliasMap = {};
  for (const a of rawAliasArray) {
    const [left, right] = a.split(':');
    aliasMap[left.trim()] = right.trim();
  }
  return aliasMap;
}

async function main() {
  const paths = parsePaths();
  const alias = parseAlias();
  const inputSegment = core.getInput('segment');
  const regularExpression = core.getInput('pattern');
  const pattern = new RegExp(regularExpression);
  const enableSegment = inputSegment === 'true';

  const matchingFilePaths = paths.filter((filePath) => pattern.test(filePath));

  const outputs = [];

  for (const mfp of matchingFilePaths) {
    const stat = await fs.stat(mfp);
    if (!stat.isFile()) {
      continue;
    }
    const content = await fs.readFile(mfp, 'utf-8');
    if (enableSegment) {
      outputs.push(`=== ${_pickAlias(alias, mfp)} ===`);
    }
    outputs.push(content);
  }

  core.setOutput('content', outputs.join('\n'))
}

main().catch((err) => core.setFailed(err.message));
