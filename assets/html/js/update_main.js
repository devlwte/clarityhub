const { ipcRenderer } = require('electron');

// Modules Node
const path = require("path")
const fs = require("fs");
const fsExtra = require('fs-extra');
const utilcode = require(path.resolve(__dirname, "../../", "modules", "utilcodes"));


// Función para enviar mensajes al proceso principal
async function sendMessage(ipc, ...message) {
    try {
        const reply = await ipcRenderer.invoke(ipc, ...message);
        return reply;
    } catch (error) {
        console.error(error);
        return false;
    }
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

function getItems(array, cantidadInicio, cantidadFinal, pathFile) {
    // Verificar si hay suficientes elementos en el array
    if (array.length < cantidadInicio + cantidadFinal) {
        if (pathFile) {
            return array.join(path.sep); // Devuelve la ruta completa si no hay suficientes elementos y pathFile es true
        } else {
            return array; // Devuelve el array completo si no hay suficientes elementos y pathFile es false
        }
    }

    // Seleccionar los elementos del inicio y final
    const elementosInicio = array.slice(0, cantidadInicio);
    const elementosFinal = array.slice(-cantidadFinal);

    // Combinar con "..." en la mitad
    const longitudTotal = cantidadInicio + cantidadFinal;
    const longitudArray = array.length;

    if (longitudTotal < longitudArray) {
        const mitad = ['...'];
        const rutaAcortada = elementosInicio.concat(mitad).concat(elementosFinal);

        if (pathFile) {
            return rutaAcortada.join(path.sep); // Devuelve la ruta con "..." en la mitad si pathFile es true
        } else {
            return rutaAcortada; // Devuelve el array con "..." en la mitad si pathFile es false
        }
    }

    if (pathFile) {
        return elementosInicio.concat(elementosFinal).join(path.sep); // Devuelve la ruta completa si pathFile es true
    } else {
        return elementosInicio.concat(elementosFinal); // Devuelve el array seleccionado si pathFile es false
    }
}
async function countItemsInDirectory(dirPath) {
    let folders = 0;
    let files = 0;

    async function countItemsRecursively(currentDir) {
        const items = await fsExtra.readdir(currentDir);

        for (const item of items) {
            const itemPath = path.join(currentDir, item);
            const itemStats = await fsExtra.stat(itemPath);

            if (itemStats.isDirectory()) {
                folders += 1;
                await countItemsRecursively(itemPath); // Recursivamente contar elementos en subcarpetas
            } else {
                files += 1;
            }
        }
    }

    await countItemsRecursively(dirPath);
    return { folders, files };
}

async function copyFiles(folderCopy, destino, progressCallback) {
    const { folders = 0, files = 0 } = await countItemsInDirectory(path.resolve(folderCopy));
    let total_items = (folders + files);
    let all_finish = 0;

    function copyRecursively(sourcePath, destPath) {
        fsExtra.ensureDir(destPath, (err) => {
            if (err) {
                progressCallback(0, '', 'Error al crear el directorio de destino');
                return;
            }

            fsExtra.readdir(sourcePath, (err, files) => {
                if (err) {
                    progressCallback(0, '', `Error al leer el directorio: ${err}`);
                    return;
                }

                const totalFiles = files.length;

                function copyNextFile(index) {
                    if (index >= totalFiles) {
                        // currentProgress = 100;
                        // progressCallback(currentProgress, destPath, 'Copia completada exitosamente');
                        return;
                    }

                    const filename = files[index];
                    const sourceFile = path.join(sourcePath, filename);
                    const destFile = path.join(destPath, filename);

                    fsExtra.copy(sourceFile, destFile, (err) => {
                        if (err) {
                            progressCallback(0, destFile, `Error al copiar el archivo: ${err}`);
                            return;
                        }

                        fsExtra.stat(sourceFile, (err, stats) => {
                            if (err) {
                                console.error(`Error al obtener información del elemento: ${err}`);
                            } else if (stats.isDirectory()) {
                                copyRecursively(sourceFile, destFile);
                            }
                        });

                        copyNextFile(index + 1);

                        all_finish++;
                        progressCallback((all_finish / total_items) * 100, destFile, 'Copia exitosa');

                        // end
                        if (all_finish == total_items) {
                            progressCallback((all_finish / total_items) * 100, destFile, 'finish');
                        }
                    });
                }

                copyNextFile(0);

            });


        });


    }

    const sourcePath = path.resolve(folderCopy);
    const destPath = path.resolve(destino);

    copyRecursively(sourcePath, destPath);

}

function compareVersions(versionA, versionB) {
    const segmentsA = versionA.split('.').map(Number);
    const segmentsB = versionB.split('.').map(Number);

    const maxLength = Math.max(segmentsA.length, segmentsB.length);

    for (let i = 0; i < maxLength; i++) {
        const segmentA = segmentsA[i] || 0;
        const segmentB = segmentsB[i] || 0;

        if (segmentA > segmentB) {
            return "err_no_igual"; // Versión A es mayor
        } else if (segmentA < segmentB) {
            return "ancient"; // Versión B es mayor
        }
    }

    return "last";
}


kit.onDOMReady(async () => {
    // All folders
    const folders = await sendMessage("all-folders");


    // configuracion
    let config = path.join(folders.userData, "data", "json", "config.json");
    let json_config = await openFileJson(config, true, {
        update: {
            repo: "https://github.com/devlwte/clarityhub.git",
            name: "update_main"
        },
        termsandconditions: {}
    });


    // title
    const title_banner = $(".title_footer");

    // Vcode
    let vcode = await openFileJson(path.join(folders.userData, "data", "json", "vcode_.json"));

    // Package Main
    const path_package = path.join(__dirname, "../../", "package.json");
    const package_main = await openFileJson(path_package);

    // Verificar version
    const isversion = compareVersions(package_main.vcode, vcode.vcode);

    // Open Ventana
    const openmain = async (update_package) => {
        if (update_package) {
            package_main.vcode = vcode.vcode;
            await utilcode.fsWrite(path_package, JSON.stringify(package_main, null, 2));

            // reload
            ipcRenderer.send('reload-app', true);
            return;
        }
        const open_main = await sendMessage("open-main", true);
        if (open_main) {
            ipcRenderer.send('action-win', "close");
        }
    };

    if (isversion === "ancient") {
        title_banner.animate({ opacity: 0 }, () => {
            title_banner.text("Actualizando...");
            title_banner.animate({ opacity: 1 }, 500, async () => {
                // Update
                const update = await sendMessage("update-app", { repo: json_config.update.repo, name: json_config.update.name });

                // Install
                if (update) {
                    await copyFiles(path.resolve(__dirname, "../../", "temp", json_config.update.name), path.resolve(__dirname, "../../", "pre"), (progress, path_file_copy, status) => {
                        if (status !== "finish") {
                            title_banner.text(getItems(path_file_copy.split("\\"), 1, 4, true));
                            $(".progres_update_run").css({ width: `${progress.toFixed(0)}%` });
                        }

                        if (status == "finish") {
                            title_banner.animate({ opacity: 0 }, () => {
                                title_banner.text("Finalizado...");
                                title_banner.animate({ opacity: 1 }, 500, async () => {
                                    await openmain(true);
                                })
                            })
                        }
                    });
                } else {
                    title_banner.animate({ opacity: 0 }, () => {
                        title_banner.text("No se pudieron actualizar los archivos (Conexion / Enlace)");
                        title_banner.animate({ opacity: 1 }, 500, () => {

                        })
                    })
                }
            })
        })

    } else if (isversion === "last") {
        title_banner.animate({ opacity: 0 }, () => {
            title_banner.text("Ultima Version");
            title_banner.animate({ opacity: 1 }, 500, () => {
                openmain();
            })
        })
    }


})