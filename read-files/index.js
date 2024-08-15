import * as fs from 'node:fs/promises'
import * as core from '@actions/core'


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

function _input(name, options) {
  if (!name) return null;
  const stdNameEnv = name.toUpperCase().replaceAll('-', '_');
  let value;
  try {
    value = core.getInput(name, options);
    if (!value) {
      value = process.env[stdNameEnv];
    }
  } catch (e) {
    value = process.env[stdNameEnv];
    if (!value) {
      throw e;
    }
  }
  return value;
}

function _formatArrayText(text) {
  if (!text) return [];
  return text
    .replaceAll('\n', ',')
    .replaceAll('\r', ',')
    .replaceAll(' ', ',')
    .replaceAll('\t', ',')
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
  const inputEnableListDir = _input('enable-list-dir');
  const enableListDir = inputEnableListDir === 'true';
  const rets = [];
  for (const path of paths) {
    const stat = await fs.stat(path);
    core.debug(`${path} ${stat} ${stat.isDirectory()} ${enableListDir}`);
    if (stat.isFile()) {
      const lowercasePath = path.toLowerCase();
      const foundedSuffix = defaultAllowSuffixes.find(item => lowercasePath.endsWith(item));
      if (!foundedSuffix) {
        core.info(`not allow ${path} please add suffixes to support this file`);
        continue;
      }
      rets.push(path);
      continue;
    }
    if (enableListDir && stat.isDirectory()) {
      if (dep === 1) continue;
      const fileList = await fs.readdir(path);
      const patchFileNames = fileList.map(item => `${path}/${item}`);
      const dirFiles = await _extraPaths(patchFileNames, dep + 1);
      rets.push(...dirFiles);
    }
  }
  return rets;
}

async function parsePaths() {
  const inputPaths = _input('paths', { required: true });
  let paths;
  try {
    paths = JSON.parse(inputPaths);
    if (paths && paths.length) {
      return await _extraPaths(paths);
    }
  } catch (e) {
  }
  paths = _formatArrayText(inputPaths);
  return await _extraPaths(paths);
}

function parseAlias() {
  const alias = _input('alias');
  const rawAliasArray = _formatArrayText(alias);
  const aliasMap = {};
  for (const a of rawAliasArray) {
    const [left, right] = a.split(':');
    aliasMap[left.trim()] = right.trim();
  }
  return {
    ...boundAlias,
    ...aliasMap,
  }
}

async function main() {
  const paths = await parsePaths();
  core.info(`detected paths: [${paths.join(',')}]`);
  const alias = parseAlias();
  const inputEnableSegment = _input('enable-segment');
  // const regularExpression = _input('pattern');
  // const pattern = new RegExp(regularExpression);
  const enableSegment = inputEnableSegment === 'true';

  // const matchingFilePaths = paths.filter((filePath) => pattern.test(filePath));

  const outputs = [];

  for (const mfp of paths) {
    const content = await fs.readFile(mfp, 'utf-8');
    if (enableSegment) {
      outputs.push(`=== ${_pickAlias(alias, mfp)} ===`);
    }
    outputs.push(content);
    core.info(`append path ${mfp} to result`);
  }

  const content = outputs.join('\n');
  core.info(content);

  core.setOutput('content', content);
}

main().catch((err) => core.setFailed(err.message));
