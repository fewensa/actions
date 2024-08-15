import * as fs from 'node:fs/promises'
import core from '@actions/core'


const boundAlias = {
  'branch.txt': 'Branch',
  'commit.txt': 'Commit',
  'date.txt': 'Time',
  'message.txt': 'Message',
  'ref.txt': 'Refs',
  'tag.txt': 'Tag'
};
const defaultAllowSuffixes = [
  'txt', 'text', 'json', 'md', 'yml', 'yaml',
  'ini', 'toml', 'properties', 'conf'
];

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

async function _extraPaths(paths, dep = 0) {
  const inputEnableListDir = core.getInput('enable-list-dir');
  const enableListDir = inputEnableListDir === 'true';
  const rets = [];
  for (const path of paths) {
    const lowercasePath = path.toLowerCase();
    const foundedSuffix = defaultAllowSuffixes.find(item => lowercasePath.endsWith(item));
    if (!foundedSuffix) {
      core.info(`not allow ${path} please add suffixes to support this file`);
      continue;
    }
    const stat = await fs.stat(path);
    if (stat.isFile()) {
      rets.push(path);
      continue;
    }
    if (enableListDir && stat.isDirectory()) {
      if (dep === 1) continue;
      const dirFiles = _extraPaths([path], dep + 1);
      rets.push(...dirFiles);
    }
  }
  return rets;
}

async function parsePaths() {
  const path = core.getInput('path', { required: true });
  let paths;
  try {
    paths = JSON.parse(path);
    if (paths && paths.length) {
      return await _extraPaths(paths);
    }
  } catch (e) {
  }
  paths = _formatArrayText(path);
  return await _extraPaths(paths);
}

function parseAlias() {
  const alias = core.getInput('alias');
  const rawAliasArray = _formatArrayText(alias);
  const aliasMap = {};
  for (const a of rawAliasArray) {
    const [left, right] = a.split(':');
    aliasMap[left.trim()] = right.trim();
  }
  const inputUseBoundAlias = core.getInput('use-bound-alias');
  const useBoundAlias = inputUseBoundAlias === 'true';
  if (useBoundAlias) {
    return {
      ...boundAlias,
      ...aliasMap,
    }
  }
  return aliasMap;
}

async function main() {
  const paths = await parsePaths();
  const alias = parseAlias();
  const inputEnableSegment = core.getInput('enable-segment');
  const regularExpression = core.getInput('pattern');
  const pattern = new RegExp(regularExpression);
  const enableSegment = inputEnableSegment === 'true';

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
