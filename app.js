const et = require('events')
et.EventEmitter.defaultMaxListeners = 0;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Electron
const { app, ipcMain, BrowserWindow, shell, Menu } = require("electron")
const windowStateKeeper = require("electron-window-state");

const ConsoleLogger = require('./modules/console');
const logger = new ConsoleLogger();

// Info Module
const axios = require('axios');

// Modules Node
const path = require("path")
const fs = require("fs")

// Lwte
const ServerBuilder = require("js-expressify")
const serverbuilder = new ServerBuilder()

// Saved
const saved = require('./modules/saved')

// UtilCode
const utilcode = require("./modules/utilcodes")

// Package
const packa = require("./package.json");

// UserData
const userdata = app.getPath("userData");

// Clonar
const fsextra = require('fs-extra');

// prompts
const prompts = require('./modules/prompts');





// Crear Carpetas
async function setFolders(raiz, ruta) {
    await utilcode.createFolderRecursive(raiz, ruta);
}

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

// copy files
async function copyFile(origen, destino) {
    try {
        await fsextra.copy(origen, destino);
        return true;
    } catch (error) {
        console.error(`Error al copiar el archivo: ${error.message}`);
        return false;
    }
}

// Window State
function stateWin(windowId) {
    return windowStateKeeper({
        defaultWidth: 400,
        defaultHeight: 500,
        file: `${windowId}.json`,
        path: app.getPath("userData"),
    });
}

// Cargar todas las apps
async function loadApps() {
    let parsejson = await openFileJson(path.join(userdata, "data", "json", "db.json"), true, { installed: [] });
    if (!saved.hasKey("all-apps")) {
        try {
            // Obtener los datos de las apps
            const response = await axios.get(`https://devlwte.github.io/appshubster/json/apps.json`, { timeout: (1000 * 10) });
            saved.addSaved("all-apps", response.data);

            // Guardarlos
            await utilcode.fsWrite(path.join(userdata, "data", "json", "apps_.json"), JSON.stringify(response.data, null, 2));
        } catch (error) {

            let apps_ = await openFileJson(path.join(userdata, "data", "json", "apps_.json"), true, { apps: [] });
            saved.addSaved("all-apps", apps_);
        }
    }
    if (saved.hasKey("file-db")) {
        saved.removeSaved("file-db");
    }

    saved.addSaved("file-db", parsejson);
}

let mainWindow;
let errorWindow;

function mostrarVentanaDeErrores(error) {
    // Evita abrir múltiples ventanas de errores
    if (errorWindow) {
        return;
    }

    errorWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    // Cargar una página HTML que muestre el error
    errorWindow.loadFile(path.join(__dirname, "assets", "html", "error.html"));

    // Puedes comunicar el error a la ventana utilizando IPC (Inter-Process Communication)
    errorWindow.webContents.on('did-finish-load', () => {
        errorWindow.webContents.send('error', error);
    });

    errorWindow.on('closed', () => {
        errorWindow = null;
    });
}

function veryDependencies(package_main, package_app) {
    // dependencies main
    const dependencies_main = Object.keys(package_main);

    // dependencies app
    const dependencies_app = Object.keys(package_app);

    const missingDependencies = dependencies_app.filter(dependency => !dependencies_main.includes(dependency));

    let result;

    if (missingDependencies.length === 0) {
        console.log('Todas las dependencias de app están en main.');
        result = true;
    } else {
        console.log('Algunas dependencias de app no están en main.');
        result = missingDependencies.reduce((acc, dependency) => {
            acc[dependency] = package_app[dependency];
            return acc;
        }, {});
    }

    return result;
}

function isAsync(callback) {
    // Verifica si la función es asíncrona comparando su prototipo
    return callback.constructor.name === "AsyncFunction";
}

function isUrlOrFile(str) {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    return urlRegex.test(str) ? 'url' : 'archivo';
}


// Eliminar Objectos
const deleteObj = (arrays, key, value) => {
    return arrays.filter((elemento) => elemento[key] !== value);
};

// Update
const updateObj = (array, key, value, update) => {
    return array.map((element) => {
        if (element[key] === value) {
            return { ...element, ...update };
        }
        return element;
    });
};


// Crear Ventanas
const createWindow = async (config = {}) => {
    const { windowID, urlOrFile, reload = true, webPreferences = {}, extras = false, sendDatas = false, callback = false, ...arg } = config;

    // State ventana
    let state = stateWin(windowID);

    // extra
    if (extras) {
        const async_extra = isAsync(extras);
        if (async_extra === true) {
            await extras();
        } else if (async_extra === false) {
            extras();
        }
    }

    // Ventana
    let mainWin = windowID;
    const windowOptions = {
        width: state.width,
        height: state.height,
        show: false,
        ...arg,
        webPreferences,
    };

    if (arg.center) {
        // Centrar la ventana en caso de que se solicite
        windowOptions.x = undefined;
        windowOptions.y = undefined;
    } else {
        // Usar las coordenadas del estado
        windowOptions.x = state.x;
        windowOptions.y = state.y;
    }

    mainWin = new BrowserWindow(windowOptions);

    logger.setWindow(windowID, mainWin);

    state.manage(mainWin);

    // Cargar Pagina
    let verificar_url_file = isUrlOrFile(urlOrFile);
    if (verificar_url_file === "url") {
        mainWin.loadURL(urlOrFile);
    } else if (verificar_url_file === "archivo") {
        mainWin.loadFile(urlOrFile);
    }

    // Mostrar Ventana
    mainWin.once("ready-to-show", () => {
        mainWin.show();
        // menu
        const newMenu = Menu.buildFromTemplate(reload ? templateMenu : deleteObj(templateMenu, "role", "reload"));
        mainWin.setMenu(newMenu);
        mainWin.setMenuBarVisibility(false);
    });

    if (sendDatas) {
        const async_sendDatas = isAsync(sendDatas);
        if (async_sendDatas === true) {
            await sendDatas(mainWin);
        } else if (async_sendDatas === false) {
            sendDatas(mainWin);
        }
    }

    if (callback) {
        const asincronico = isAsync(callback);
        if (asincronico === true) {
            mainWin.on('close', async (data) => {
                await callback(data);
            });
        } else if (asincronico === false) {
            mainWin.on('close', (data) => {
                callback(data);
            });
        }
    }
};


// Crear server App
async function newServer(search, package_app) {
    // Server App
    let mainServer = await serverbuilder.newServer({
        name: search.name,
        routers: path.join(__dirname, "apps", search.name, package_app.main),
        port: 3000,
        pathViews: path.join(__dirname, "apps", search.name, package_app.server.pathviews),
        pathPublic: path.join(__dirname, "apps", search.name, package_app.server.pathpublic),
    }, "url");

    return mainServer;
}

// Ventana App
async function isApp(search, package_app, urlOrFile) {
    // ID Ventana
    app.setAppUserModelId(`app.${search.name}`);

    // Verificar si hay una pagina de inicio
    let { homepage = false } = search;

    // Inicializador de la app
    await createWindow({
        windowID: search.name,
        minWidth: 536,
        minHeight: 500,
        title: search.title,
        show: false,
        icon: path.join(__dirname, "apps", search.name, `${search.name}.ico`),
        urlOrFile: homepage ? clearLast(urlOrFile, "/") + homepage : urlOrFile,
        webPreferences: { ...package_app.webPreferences },
        callback: (data) => {

        }
    });
}



app.on('ready', async () => {
    // Crear Carpetas
    await setFolders(userdata, "data/json");
    await setFolders(__dirname, "apps");

    // Crear archivo de configuracion
    await openFileJson(path.join(userdata, "data", "json", "config.json"), true, {
        termsandconditions: {}
    });

    // Update is Open apps
    await update();

    // Load Apps
    await loadApps();

    // Manejador de errores no controlados
    process.on('uncaughtException', (error) => {
        console.error('Error no controlado:', error);
        mostrarVentanaDeErrores(error);
    });

    // argv
    const args = process.argv;

    if (args.length < 2) {

        // buscar homes
        let ishome = saved.where("all-apps", { ishome: true });

        await createWindow({
            windowID: 'clarityhub_main',
            minWidth: 536,
            minHeight: 500,
            title: "ClarityHub: Install Home",
            show: false,
            icon: path.join(__dirname, "assets", "iconos", "clarityhub01.ico"),
            urlOrFile: path.join(__dirname, "assets", "html", "install.html"),
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
            extras: async () => {
                // ID Ventana
                app.setAppUserModelId(`app.clarityhub.main`);
            },
            sendDatas: (win) => {

                // Puedes comunicar el error a la ventana utilizando IPC (Inter-Process Communication)
                win.webContents.on('did-finish-load', () => {
                    win.webContents.send('data-homes', {
                        ishome,
                        installed: saved.getSaved("file-db").installed,

                    });
                });

            },
            callback: (data) => {

            }
        });



    } else {

        // buscar app
        let search = saved.where("all-apps", { ref: args[1] })[0];

        // Verificar dependencies
        let package_main = await openFileJson(path.join(__dirname, "package.json"));
        let package_app = await openFileJson(path.join(__dirname, "apps", search.name, "package.json"));

        let dependencias = veryDependencies(package_main.dependencies, package_app.dependencies);

        // add saved
        saved.addSaved("all-data-app-module", dependencias);

        // Inicializador Updates
        await createWindow({
            windowID: 'clarityhubupdate',
            width: 800,
            height: 350,
            resizable: false,
            movable: false,
            center: true,
            title: "ClarityHub Update",
            icon: path.join(__dirname, "assets", "iconos", "claritygubupdate.ico"),
            urlOrFile: path.join(__dirname, "assets", "html", "update.html"),
            reload: true,
            titleBarStyle: "hidden",
            frame: false,
            // transparent: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
            extras: async () => {
                // ID Ventana
                app.setAppUserModelId(`app.clarityhub.update`);

                // Verificar version
                const buscar_installed = saved._search(saved.getSaved("file-db").installed, "ref", search.ref);
                let update_img = false;
                if (buscar_installed.length > 0) {
                    if (buscar_installed[0].version === search.version) {
                        update_img = false;
                    } else {
                        update_img = true;
                    }
                }

                // Verificar si el banner existe en lib
                if (fs.existsSync(path.join(__dirname, "modules", "util-libraries", "libraries", "apps", "banners", search.name + ".jpg"))) {
                    await copyFile(path.join(__dirname, "modules", "util-libraries", "libraries", "apps", "banners", search.name + ".jpg"), path.join(__dirname, "apps", search.name, package_app.server.pathpublic, `${search.name}_banner_app.jpg`));
                } else {
                    // Download Img
                    await prompts.compressIMG(search.banner, {
                        update: update_img,
                        saveIn: path.join(__dirname, "apps", search.name, package_app.server.pathpublic),
                        name: `${search.name}_banner_app`,
                        saveTo: "jpeg",
                        quality: 80,
                        format: "jpeg",
                    });
                }




            },
            sendDatas: (win) => {
                // Puedes comunicar el error a la ventana utilizando IPC (Inter-Process Communication)
                win.webContents.on('did-finish-load', () => {
                    win.webContents.send('data-ventana-app', {
                        modules: saved.getSaved("all-data-app-module"),
                        ...search,
                        pack: {
                            ...package_app
                        },
                        installed: saved.getSaved("file-db").installed
                    });


                });

            },
            callback: (data) => {

            }
        });

    }
})


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Terms
ipcMain.handle('terms', async (e, data) => {
    let { termsandconditions, ...arg } = await openFileJson(path.join(userdata, "data", "json", "config.json"), true, {
        termsandconditions: {}
    });

    try {
        termsandconditions[data] = true;
        // save
        await utilcode.fsWrite(path.join(userdata, "data", "json", "config.json"), JSON.stringify({ termsandconditions, ...arg }, null, 2));

        return true;
    } catch (error) {
        return false;
    }
});

// Eliminar ultmo Character
function clearLast(url, charat) {
    if (url.charAt(url.length - 1) === charat) {
        return url.slice(0, -1);
    }
    return url;
}

// New Server
ipcMain.handle('new-server', async (e, appsl, pack) => {
    const runserver = await newServer(appsl, pack);
    if (runserver) {
        return runserver;
    } else {
        return false;
    }
})

// New Server
ipcMain.handle('new-window', async (e, appsl, pack, urlserver) => {
    await isApp(appsl, pack, urlserver);
    return true;
})

// Update App
ipcMain.handle('update-app', async (e, appInfo) => {
    const clonar = await clonarRepositorioGit(appInfo.repo, path.join(__dirname, "temp", appInfo.name));
    return clonar;
})

// Install App
ipcMain.handle('new-app', async (e, appInfo) => {
    const clonar = await clonarRepositorioGit(appInfo.repo, path.join(__dirname, "apps", appInfo.name));
    return clonar;
})

// Update Info
ipcMain.handle('update-info', async (e, appInfo) => {
    // info
    let { installed, ...arg } = saved.getSaved("file-db");

    // Update info
    const updatedArray = updateObj(installed, "ref", appInfo.ref, { version: appInfo.version });
    installed = updatedArray;

    // Save
    await utilcode.fsWrite(path.join(userdata, "data", "json", "db.json"), JSON.stringify({ ...arg, installed }, null, 2));

    // Load Apps
    await loadApps();

    return true;
})

// App Select
ipcMain.handle('isopen-app', async () => {
    return process.argv.slice(1);
});

// Open App
ipcMain.handle('open-app', async (e, data) => {
    const desktopShortcutPath = path.join(app.getPath('desktop'), `${data.title}.lnk`);
    const existingShortcut = shell.readShortcutLink(desktopShortcutPath);

    const operation = 'update';
    const options = {
        ...existingShortcut,
        args: [data.ref, data.name].join(" "),
        description: data.dcp,
        icon: path.resolve(__dirname, "apps", data.name, `${data.name}.ico`),
        appUserModelId: "app." + data.name,
        iconIndex: 0
    };

    const accesodirect = shell.writeShortcutLink(desktopShortcutPath, operation, options);

    if (accesodirect) {
        shell.openPath(desktopShortcutPath)
    }
    return accesodirect;
});


// Stop Server
ipcMain.handle('stop-server', async (e, data) => {
    try {
        await serverbuilder.stopServer(data);
        return true;
    } catch (error) {
        return false;
    }
})

async function update() {
    // Verificar si ya existe una instancia de la aplicación en ejecución
    const singleInstanceLock = app.requestSingleInstanceLock();
    if (singleInstanceLock !== false) {
        await utilcode.fsWrite(path.join(userdata, "data", "json", "isopen.json"), JSON.stringify({}, null, 2));
    }
}


// Action Windows
ipcMain.on("action-win", (e, data) => {
    const ventana = e.sender.getOwnerBrowserWindow();

    if (!ventana) {
        return;
    }

    if (data === "minimize") {
        ventana.minimize();
    } else if (data === "maximize") {
        if (ventana.isMaximized()) {
            ventana.unmaximize();
        } else {
            ventana.maximize();
        }
    } else if (data === "close") {
        ventana.close();
    }
});


// Info Json
ipcMain.handle('json-saved', async () => {
    const filejsontext = await utilcode.fsRead(path.join(userdata, "data", "json", "db.json"))
    let { ...arg } = utilcode.jsonParse(filejsontext);
    return { apps: saved.getSaved("all-apps"), ...arg };
});

// clonar
async function clonarRepositorioGit(repoURL, destinoLocal) {
    try {
        if (fs.existsSync(destinoLocal)) {
            await fsextra.emptyDir(destinoLocal);
        }
        const gitExecutable = path.join(__dirname, "bin", 'git', "cmd", "git.exe");
        const command = `${gitExecutable} clone ${repoURL} ${destinoLocal}`;
        const { stdout, stderr } = await exec(command);
        console.log('Repositorio clonado exitosamente:\n', stdout);
        return true;
    } catch (error) {
        logger.error("mainwin", error);
        console.error('Error al clonar el repositorio:', error);
        return false;
    }
}



// Install App
ipcMain.handle('install-app', async (e, appInfo) => {
    // Load Apps
    await loadApps();

    let resp = false;
    const clonar = await clonarRepositorioGit(appInfo.repo, path.join(__dirname, "apps", appInfo.name));

    if (clonar) {
        const desktopShortcutPath = path.join(app.getPath('desktop'), `${appInfo.title}.lnk`);

        const operation = 'create';
        const options = {
            target: process.execPath,
            args: [appInfo.ref, appInfo.name].join(" "),
            description: appInfo.dcp,
            icon: path.resolve(__dirname, "apps", appInfo.name, `${appInfo.name}.ico`),
            appUserModelId: "app." + appInfo.name,
            iconIndex: 0
        };

        shell.writeShortcutLink(desktopShortcutPath, operation, options);

        // Install in apps is installed
        let { installed = [], ...arg } = saved.getSaved("file-db");

        if (installed.length > 0) {
            // Verify if it already exists
            let very = saved._search(installed, "ref", appInfo.name);
            if (very.length > 0) {
                let updateValue = very[0];
                updateValue.ref = appInfo.ref;
                updateValue.name = appInfo.name;
                updateValue.dev = appInfo.dev;
                updateValue.version = appInfo.version;

                // Set Update
                for (let i = 0; i < installed.length; i++) {
                    if (installed[i].ref == appInfo.ref) {
                        installed[i] = updateValue;
                        break;
                    }
                }
            } else {
                installed.push({
                    ref: appInfo.ref,
                    name: appInfo.name,
                    dev: appInfo.dev,
                    version: appInfo.version
                });
            }
        } else {
            installed.push({
                ref: appInfo.ref,
                name: appInfo.name,
                dev: appInfo.dev,
                version: appInfo.version
            });
        }

        // Save new data
        await utilcode.fsWrite(path.join(userdata, "data", "json", "db.json"), JSON.stringify({ ...arg, installed }, null, 2));

        // Load Apps
        await loadApps();

        resp = true;
    } else {
        resp = "false_clonar";
    }

    return resp;
});

// Uninstall
ipcMain.handle('uninstall-app', async (e, uninstall) => {
    // Load Apps
    await loadApps();

    try {
        // Install in apps is installed
        let { installed, ...arg } = saved.getSaved("file-db");

        await utilcode.deleteFolder(path.join(__dirname, "apps", uninstall.name));
        for (let i = 0; i < installed.length; i++) {
            if (installed[i].ref === uninstall.ref) {
                installed.splice(i, 1);
                break;
            }
        }

        // Save new data
        await utilcode.fsWrite(path.join(userdata, "data", "json", "db.json"), JSON.stringify({ ...arg, installed }, null, 2));

        // Load Apps
        await loadApps();


        // Eliminar acceso directo
        const desktopShortcutPath = path.join(app.getPath('desktop'), `${uninstall.title}.lnk`);
        if (fs.existsSync(desktopShortcutPath)) {
            try {
                await fs.promises.unlink(desktopShortcutPath);
            } catch (err) {
                console.error('Something wrong happened removing the file', err)
            }
        }

        return true;
    } catch (error) {
        return false;
    }
})

// Info
// ipcMain.handle('get-info-module', async (e, name) => {
//     try {
//         const response = await axios.get(`https://registry.npmjs.org/${name}`);
//         const moduleInfo = response.data;
//         return moduleInfo;
//     } catch (error) {
//         console.error('Error al obtener información del módulo:', error);
//         return false;
//     }
// });

ipcMain.handle('install-module', async (e, name, id) => {
    const installModuleApp = await installModule(name, path.resolve(__dirname));
    if (installModuleApp) {
        let all_module = saved.getSaved("all-data-app-module");
        delete all_module[id];

        if (saved.hasKey("all-data-app-module")) {
            saved.removeSaved("all-data-app-module");
        }

        saved.addSaved("all-data-app-module", Object.keys(all_module).length === 0 ? true : all_module);
    }
    return installModuleApp;
});

// Ruta al ejecutable de Node.js específico

// Install
async function installModule(name, targetDirectory) {
    try {
        const npmExecutable = path.join(__dirname, "bin", 'node18', 'npm');
        const command = `${npmExecutable} install ${name} --prefix ${targetDirectory}`;
        const { stdout, stderr } = await exec(command);
        return true;
    } catch (error) {
        mainWindow.webContents.send('data-error', error);
        return false;
    }
}

ipcMain.handle('all-folders', async (e) => {
    const allFolders = {
        appData: app.getPath('appData'),
        appPath: app.getAppPath(),
        userData: app.getPath('userData'),
        downloads: app.getPath('downloads'),
        desktop: app.getPath('desktop'),
        documents: app.getPath('documents'),
        music: app.getPath('music'),
        pictures: app.getPath('pictures'),
    };

    return allFolders;
});

// Reload
ipcMain.on("reload-app", (e, data) => {
    if (data == true) {
        app.relaunch();
        app.quit();
    }
});

Menu.setApplicationMenu(null);

/*Menu*/
var templateMenu = [
    {
        role: "reload",
    },
    {
        label: "Update",
        accelerator: process.platform == "darwin" ? "Comand+alt+R" : "Ctrl+alt+R",
        click() {
            app.relaunch();
            app.quit();
        },
    }
];

// Reload in Development for Browser Windows
var DevTools = process.env.APP_DEV
    ? process.env.APP_DEV.trim() == "true"
    : true;

if (DevTools) {
    templateMenu.push({
        label: "DevTools",
        submenu: [
            {
                label: "Show/Hide Dev Tools",
                accelerator: process.platform == "darwin" ? "Comand+D" : "Ctrl+D",
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                },
            },
        ],
    });
}
