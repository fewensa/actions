"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (process.env.DEBUG_ACTION === 'true') {
                core.debug("DEBUG FLAG DETECTED, SHORTCUTTING ACTION.");
                return;
            }
            const _storePath = core.getInput('path');
            const _signingKeyBase64 = core.getInput('signingKeyBase64');
            const _alias = core.getInput('alias');
            const _keyStorePassword = core.getInput('keyStorePassword');
            const _keyPassword = core.getInput('keyPassword');
            let _betterStorePath = _storePath;
            if (_storePath.indexOf('.properties') == -1) {
                _betterStorePath = path_1.default.join(_storePath, 'key.properties');
            }
            console.log(`The sign file will be write to ${_betterStorePath}`);
            // 1. Write jks file
            if (fs_1.default.existsSync(_betterStorePath)) {
                fs_1.default.rmSync(_betterStorePath, { force: true, recursive: true });
            }
            const parentDir = path_1.default.basename(path_1.default.dirname(_betterStorePath));
            if (!fs_1.default.existsSync(parentDir)) {
                fs_1.default.mkdirSync(parentDir, { recursive: true });
            }
            const pathSigningKey = path_1.default.join(parentDir, 'signingKey.jks');
            fs_1.default.writeFileSync(pathSigningKey, _signingKeyBase64, 'base64');
            // 2. write properties
            const propertiesValues = [
                `keyAlias=${_alias}`,
                `storePassword=${_keyStorePassword}`,
                `storeFile=${pathSigningKey}`
            ];
            if (_keyPassword != null && _keyPassword != '') {
                propertiesValues.push(`keyPassword=${_keyPassword}`);
            }
            let pvalue = propertiesValues.join('\n');
            fs_1.default.writeFileSync(_betterStorePath, pvalue);
            core.exportVariable(`ANDROID_KEY_PROPERTIES`, _betterStorePath);
            core.setOutput('path', _betterStorePath);
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
                return;
            }
            core.setFailed('Unknown error: ' + error);
        }
    });
}
run();
