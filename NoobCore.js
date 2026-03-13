const log = require('./core/logger/log.js');
const path = require("path");
const axios = require("axios");
const fs = require("fs-extra");
const google = require("googleapis").google;
const nodemailer = require("nodemailer");
const { execSync } = require('child_process');

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0;

function getConfigPath(baseName, ext = ".json") {
        try {
                const devPath = path.join(__dirname, `${baseName}.dev${ext}`);
                const normalPath = path.join(__dirname, `${baseName}${ext}`);
                if (fs.existsSync(devPath)) {
                        console.log(`☑️ Loaded ${baseName}.dev${ext}`);
                        return devPath;
                } else if (fs.existsSync(normalPath)) {
                        console.log(`☑️ Loaded ${baseName}${ext}`);
                        return normalPath;
                } else {
                        throw new Error(`❌ Missing ${baseName}${ext} or ${baseName}.dev${ext}`);
                }
        } catch (err) {
                throw new Error(err.message);
        }
}

function validJSON(pathDir) {
        try {
                if (!fs.existsSync(pathDir))
                        throw new Error(`File "${pathDir}" not found`);
                execSync(`npx jsonlint "${pathDir}"`, { stdio: 'pipe' });
                return true;
        }
        catch (err) {
                let msgError = err.message;
                msgError = msgError.split("\n").slice(1).join("\n");
                const indexPos = msgError.indexOf("    at");
                msgError = msgError.slice(0, indexPos != -1 ? indexPos - 1 : msgError.length);
                throw new Error(msgError);
        }
}

const dirConfig = getConfigPath("config", ".json");
const dirConfigCommands = getConfigPath("configCommands", ".json");
const dirAccount = getConfigPath("ncstate", ".json");

for (const pathDir of [dirConfig, dirConfigCommands]) {
        try {
                validJSON(pathDir);
        }
        catch (err) {
                log.error("CONFIG", `Invalid JSON file "${pathDir.replace(__dirname, "")}":\n${err.message.split("\n").map(line => `  ${line}`).join("\n")}\nPlease fix it and restart bot`);
                process.exit(0);
        }
}

const config = require(dirConfig);
if (config.whiteListMode?.whiteListIds && Array.isArray(config.whiteListMode.whiteListIds))
        config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.map(id => id.toString());
const configCommands = require(dirConfigCommands);

global.noobCore = {
        startTime: Date.now() - process.uptime() * 1000,
        commands: new Map(),
        eventCommands: new Map(),
        commandFilesPath: [],
        eventCommandsFilesPath: [],
        aliases: new Map(),
        ncFirstChat: [],
        ncPrefix: [],
        ncEvent: [],
        ncReply: new Map(),
        ncReaction: new Map(),
        ncAnyEvent: [],
        ncsetting: config,
        config,
        configCommands,
        envCommands: {},
        envEvents: {},
        envGlobal: {},
        reLoginBot: function () { },
        Listening: null,
        oldListening: [],
        callbackListenTime: {},
        storage5Message: [],
        fcaApi: null,
        botID: null
};

global.db = {
        allThreadData: [],
        allUserData: [],
        allDashBoardData: [],
        allGlobalData: [],
        threadModel: null,
        userModel: null,
        dashboardModel: null,
        globalModel: null,
        threadsData: null,
        usersData: null,
        dashBoardData: null,
        globalData: null,
        receivedTheFirstMessage: {}
};

global.client = {
        dirConfig,
        dirConfigCommands,
        dirAccount,
        countDown: {},
        cache: {},
        database: {
                creatingThreadData: [],
                creatingUserData: [],
                creatingDashBoardData: [],
                creatingGlobalData: []
        },
        commandBanned: configCommands.commandBanned
};

const utils = require("./utils.js");
global.utils = utils;
const { colors } = utils;

global.temp = {
        createThreadData: [],
        createUserData: [],
        createThreadDataError: [],
        filesOfGoogleDrive: {
                arraybuffer: {},
                stream: {},
                fileNames: {}
        },
        contentScripts: {
                cmds: {},
                events: {}
        }
};

const watchAndReloadConfig = (dir, type, prop, logName) => {
        let lastModified = fs.statSync(dir).mtimeMs;
        let isFirstModified = true;
        fs.watch(dir, (eventType) => {
                if (eventType === type) {
                        const oldConfig = global.noobCore[prop];
                        setTimeout(() => {
                                try {
                                        if (isFirstModified) {
                                                isFirstModified = false;
                                                return;
                                        }
                                        if (lastModified === fs.statSync(dir).mtimeMs) return;
                                        global.noobCore[prop] = JSON.parse(fs.readFileSync(dir, 'utf-8'));
                                        log.success(logName, `Reloaded ${dir.replace(process.cwd(), "")}`);
                                }
                                catch (err) {
                                        log.warn(logName, `Can't reload ${dir.replace(process.cwd(), "")}`);
                                        global.noobCore[prop] = oldConfig;
                                }
                                finally {
                                        lastModified = fs.statSync(dir).mtimeMs;
                                }
                        }, 200);
                }
        });
};

watchAndReloadConfig(dirConfigCommands, 'change', 'configCommands', 'CONFIG COMMANDS');
watchAndReloadConfig(dirConfig, 'change', 'config', 'CONFIG');

global.noobCore.envGlobal = global.noobCore.configCommands.envGlobal;
global.noobCore.envCommands = global.noobCore.configCommands.envCommands;
global.noobCore.envEvents = global.noobCore.configCommands.envEvents;

const getText = global.utils.getText;

(async () => {
        let version = "0.0.0";
        try {
                const response = await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2/main/package.json");
                version = response.data.version;
        } catch (e) {
                // Ignore error if remote version cannot be fetched
        }
        const currentVersion = require("./package.json").version;
        if (compareVersion(version, currentVersion) === 1)
                utils.log.master("NEW VERSION", getText(
                        "NoobCore",
                        "newVersionDetected",
                        colors.gray(currentVersion),
                        colors.hex("#eb6a07", version),
                        colors.hex("#eb6a07", "node update")
                ));

        const parentIdGoogleDrive = "";
        utils.drive.parentID = parentIdGoogleDrive;

        require(`./core/login/login.js`);
})();

function compareVersion(version1, version2) {
        const v1 = version1.split(".");
        const v2 = version2.split(".");
        for (let i = 0; i < 3; i++) {
                if (parseInt(v1[i]) > parseInt(v2[i])) return 1;
                if (parseInt(v1[i]) < parseInt(v2[i])) return -1;
        }
        return 0;
}
