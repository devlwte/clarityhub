const { ipcRenderer, shell } = require('electron');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require("path");



// UtilCode
const utilcode = require(path.join(__dirname, "../../", "app", "modules/utilcodes"));

// Read Files Json
async function openFileJson(file, existfile = false, value = "") {
    try {
        if (existfile) {
            if (!fs.existsSync(file)) {
                await utilcode.fsWrite(file, JSON.stringify(value, null, 2));
            }
        }
        const filejsontext = await utilcode.fsRead(file)
        return utilcode.jsonParse(filejsontext);
    } catch (error) {
        return false;
    }
}

class isNode {
    static rdJson(...arg) {
        return openFileJson(...arg);
    }
    static async saveJson(...arg) {
        await utilcode.fsWrite(...arg);
    }
}