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


async function renderItems($artAll, config = {}, callback) {
    const {
        customCSS = {},
    } = config;

    // Verificar si existen elementos
    const $existingItems = $artAll.children();
    if ($existingItems.length > 0) {
        let animationDelay = 0;

        // Animación para reducir el ancho, alto, padding y margin de los elementos existentes
        $existingItems.each(function (index) {
            const $item = $(this);
            $item.animate(customCSS, 500, function () {
                $item.remove();
                if (index === $existingItems.length - 1) {
                    if (callback) {
                        callback();
                    }
                }
            });
            animationDelay += 100;
        });
    } else {
        if (callback) {
            callback();
        }
    }
}

function r(input) {
    const words = input.split('-');
    const result = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return result;
}

function loadElms(items, $artAll, config = {}, template) {
    // show
    kit.show(".page-art-show", 200);
    // add
    const {
        before = {},
        after = {},
    } = config;
    let animationDelay = 0;

    for (const item of items) {
        const newItem = template(item, items.length);
        const $newItem = $(newItem)
            .css({ ...before }) // Aplicar estilos personalizados
            .animate({ ...after }, 500);

        $artAll.append($newItem);
        animationDelay += 100;
    }
}

let animates = ($artAll) => {
    const $existingItems = $artAll.children();
    if ($existingItems.length > 0) {
        let animationDelay = 0;


        $existingItems.each(function (index) {
            const $item = $(this);
            $item.css({ opacity: 0, marginTop: "-20px", }).animate({ opacity: 1, marginTop: 0 }, 500, function () {
                if (index === $existingItems.length - 1) {
                    let read = $(".read_terms");
                    $(`.btn_click[data-btn='${read.attr("data-read")}']`).addClass("active");
                }
            });
            animationDelay += 100;
        });
    }
};


async function moveFileWithProgress(sourcePath, destinationPath) {
    return new Promise(async (resolve, reject) => {
        const sourceStats = await fs.promises.stat(sourcePath);
        const sourceSize = sourceStats.size;
        let bytesCopied = 0;

        const sourceStream = fs.createReadStream(sourcePath);
        const destinationStream = fs.createWriteStream(destinationPath);

        sourceStream.on('data', (chunk) => {
            bytesCopied += chunk.length;
            const progress = (bytesCopied / sourceSize) * 100;
            console.log(`Progress: ${progress.toFixed(2)}% - Copied ${bytesCopied} bytes`);

            destinationStream.write(chunk);
        });

        sourceStream.on('end', () => {
            sourceStream.close();
            destinationStream.end();
            console.log('File has been successfully moved.');
            resolve();
        });

        sourceStream.on('error', (err) => {
            reject(`Error copying file: ${err}`);
        });
    });
}


async function moveFolderWithProgress(sourceDir, destinationDir, callback) {
    try {
        const files = await fsExtra.readdir(sourceDir);
        const totalItems = files.length;
        let copiedItems = 0;
        let globalProgress = 0;

        for (const file of files) {
            const sourcePath = path.join(sourceDir, file);
            const destinationPath = path.join(destinationDir, file);

            const stats = await fsExtra.stat(sourcePath);

            if (stats.isFile()) {
                await fsExtra.copy(sourcePath, destinationPath);
            } else if (stats.isDirectory()) {
                await moveFolderWithProgress(sourcePath, destinationPath);
            }

            copiedItems++;
            globalProgress = (copiedItems / totalItems) * 100;

            if (callback) {
                callback(globalProgress, "running");
            }
        }

        if (callback) {
            callback(100, "end");
        }
    } catch (error) {
        console.error(`Error moving folder: ${error}`);
        if (callback) {
            callback(0, "error");
        }
    }
}


kit.onDOMReady(async () => {
    // All folders
    const folders = await sendMessage("all-folders");


    ipcRenderer.on('data-ventana-app', async (event, message) => {

        // configuracion
        let config = path.join(folders.userData, "data", "json", "config.json");
        let json_config = await openFileJson(config, true, {
            update: {
                repo: "https://github.com/devlwte/clarityhub.git",
                name: "update_main"
            },
            termsandconditions: {}
        });


        // fondo
        let fondo = "";
        let img_banner = path.resolve(folders.appPath, "apps", message.name, message.pack.server.pathpublic, `${message.name}_banner_app.jpg`);
        if (fs.existsSync(img_banner)) {
            let bufferBanner = fs.readFileSync(img_banner);
            fondo = `url("data:image/jpeg;base64,${bufferBanner.toString('base64')}")`;
        }

        // cover
        let cover = "";
        let img_cover = path.resolve(folders.appPath, "apps", message.name, message.pack.server.pathpublic, `favicon.svg`);
        if (fs.existsSync(img_cover)) {
            let bufferCover = fs.readFileSync(img_cover);
            // Crear la URL de fondo CSS
            cover = `url("data:image/svg+xml;base64,${bufferCover.toString('base64')}")`;
        }

        // cover
        let icono = "";
        let img_icono = path.resolve(folders.appPath, "apps", message.name, message.pack.server.pathpublic, `favicon.svg`);
        if (fs.existsSync(img_icono)) {
            let bufferIcono = fs.readFileSync(img_icono);
            // Crear la URL de fondo CSS
            icono = `url("data:image/svg+xml;base64,${bufferIcono.toString('base64')}")`;
        }




        let ispage = kit.existsElm(".update_page");
        if (ispage) {
            if (!json_config.termsandconditions[message.name]) {
                window.location.href = "terms_and_conditions.html";
                return;
            }
            $(".body").css({ opacity: 0, "background-image": `${fondo}` }).animate({ opacity: 1 });

            $(".info_app").height($(".info_app").height());
            $(".cover").css({ opacity: 0, "background-image": `url('img/terms.jpg')` }).animate({ opacity: 1 }, 500, () => {
                $(".icono").css({ opacity: 0, marginTop: "-20px", "background-image": `${icono}` }).animate({ opacity: 1, marginTop: 0 }, 400, () => {
                    $(".name_app").html(message.pack.title).css({ opacity: 0, marginTop: "-20px", }).animate({ opacity: 1, marginTop: 0 }, 400);
                    // verificar version
                    let getInstalled = saved._search(message.installed, "ref", message.ref)[0];
                    const isver = getInstalled.version === message.version ? message.version : `${getInstalled.version} a ${message.version}`;

                    $(".version_app").html(isver).css({ opacity: 0, marginTop: "-20px", }).animate({ opacity: 1, marginTop: 0 }, 600);

                    $(".banner").css({ opacity: 0, "background-image": `${fondo}` }).animate({ opacity: 1 }, 400);


                    const title_banner = $(".title_footer");
                    if (getInstalled.version !== message.version) {
                        title_banner.animate({ opacity: 0 }, 300, () => {
                            title_banner.text("Actualizando...");
                            title_banner.animate({ opacity: 1 }, 400, async () => {
                                const update = await sendMessage("update-app", { repo: message.repo, name: message.name });
                                if (update) {
                                    moveFolderWithProgress(path.resolve(__dirname, "../../", "temp", message.name), path.resolve(__dirname, "../../", "apps", message.name), (progress, status) => {
                                        if (status == "running") {
                                            $(".progres_update_run").animate({ width: `${progress.toFixed(2)}%` }, () => {
                                                if ($(".progres_update_run").width() === $(".progres_update_run").parent().width()) {
                                                    $(".version_app").animate({ opacity: 0 }, 300, () => {
                                                        $(".version_app").text(message.version);
                                                        $(".version_app").animate({ opacity: 1 }, 400, async () => {

                                                            // Actualizar version
                                                            const update_info = await sendMessage("update-info", { ref: message.ref, version: message.version });

                                                            if (!update_info) {
                                                                return;
                                                            }

                                                            // Toast
                                                            M.toast({
                                                                html: `Actualizado a ${message.version}`,
                                                                classes: 'rounded blue',
                                                                displayLength: 6000
                                                            })

                                                            // Inicar Servidor Local
                                                            title_banner.animate({ opacity: 0 }, 300, () => {
                                                                title_banner.text("Iniciando Servidor...");
                                                                title_banner.animate({ opacity: 1 }, 400, () => {
                                                                    $(".progres_update_run").animate({ width: "50%" }, async () => {
                                                                        const { pack, installed, modules, ...arg } = message;
                                                                        const update_info = await sendMessage("new-server", { ...arg }, pack);
                                                                        if (update_info) {
                                                                            $(".progres_update_run").animate({ width: "100%" }, async () => {
                                                                                const open_win = await sendMessage("new-window", { ...arg }, pack, update_info);
                                                                                if (open_win) {
                                                                                    ipcRenderer.send('action-win', "close");
                                                                                }
                                                                            });
                                                                            
                                                                        }
                                                                    })
                                                                });
                                                            });

                                                        });
                                                    });

                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        })

                    } else {
                        title_banner.animate({ opacity: 0 }, 300, () => {
                            title_banner.text("Iniciando Servidor...");
                            title_banner.animate({ opacity: 1 }, 400, () => {
                                $(".progres_update_run").animate({ width: "50%" }, async () => {
                                    const { pack, installed, modules, ...arg } = message;
                                    const update_info = await sendMessage("new-server", { ...arg }, pack);
                                    if (update_info) {
                                        $(".progres_update_run").animate({ width: "100%" }, async () => {
                                            const open_win = await sendMessage("new-window", { ...arg }, pack, update_info);
                                            if (open_win) {
                                                ipcRenderer.send('action-win', "close");
                                            }
                                        });
                                        
                                    }
                                })
                            })
                        })
                    }

                });
            });

            // verificar modules
            if (message.modules == true) {

            } else {
                window.location.href = "modules.html";
                // let moduls = Object.keys(message.modules);
            }


        }

        let modules = kit.existsElm(".modules");
        if (modules) {

            $(".body").css({ opacity: 0, "background-image": `url('img/terms.jpg')` }).animate({ opacity: 1 });

            $(".info_app").height($(".info_app").height());
            $(".cover").css({ opacity: 0, "background-image": `${fondo}` }).animate({ opacity: 1 }, 500, () => {
                $(".icono").css({ opacity: 0, marginTop: "-20px", "background-image": `${icono}` }).animate({ opacity: 1, marginTop: 0 }, 400, () => {
                    $(".name_app").html(message.pack.title).css({ opacity: 0, marginTop: "-20px", }).animate({ opacity: 1, marginTop: 0 }, 400);
                    $(".version_app").html(message.pack.version).css({ opacity: 0, marginTop: "-20px", }).animate({ opacity: 1, marginTop: 0 }, 600, () => {
                        animates($(".btns_show"))
                    });

                });
            });

            // verificar modules
            let moduls = Object.keys(message.modules);

            const customConfig = {
                customCSS: {
                    opacity: 0,
                    marginLeft: '-20px',
                },
                before: {
                    opacity: 0,
                    marginLeft: '-20px',
                },
                after: {
                    opacity: 1,
                    marginLeft: '0',
                },
            };

            // iconos
            let iconos_json = await openFileJson(path.resolve(folders.appPath, "assets", "html", "img", "iconos", `iconos.json`), true, {});

            renderItems($(".requiere_modules_list"), customConfig, () => {
                loadElms(moduls, $(".requiere_modules_list"), customConfig, (item) => {
                    return `
                    <div class="modules-re-down" id="id_${kit.clearSymbols(item)}">
                        <div class="item">
                            <div class="icon_item" style="background-image: url(${iconos_json[kit.clearSymbols(item)] ? iconos_json[kit.clearSymbols(item)] : "img/iconos/modules.svg"})"></div>
                        </div>
                        <div class="name-module">${r(item)}</div>
                    </div>
                    `
                });
            });

            const isversion = (name, version) => {
                if (!version.includes('^')) {
                    // Descargar la versión exacta
                    return `${name}@${version}`;
                } else {
                    // Descargar solo el nombre del módulo
                    return name;
                }
            }


            // Install
            $(".install_modules").on("click", async () => {
                // open progress
                $(".run_progress").animate({ opacity: 1 });

                // Inicializa el contador y la animación antes del bucle
                let count = 0;
                let mod = message.modules;
                let mod_array = Object.keys(mod);
                let progressContainer = $(".run_progress").find(".progress-run");
                progressContainer.width(0); // Inicializa el ancho a 0



                for (const md of mod_array) {
                    let download_version = isversion(md, mod[md]);
                    const is_installed = await sendMessage("install-module", download_version, md);
                    if (is_installed) {
                        $(".requiere_modules_list").find(`#id_${kit.clearSymbols(md)}`).animate({ opacity: 0, marginLeft: "-20px" }, 500, () => {
                            $(".requiere_modules_list").find(`#id_${kit.clearSymbols(md)}`).remove();
                        })

                        // Actualiza el contador
                        count++;

                        // Calcula el progreso y actualiza el ancho
                        let progress = (count / mod_array.length) * 100;
                        progressContainer.animate({ width: progress.toFixed(2) + "%" }, 500, () => {
                            if (mod_array.length == count) {
                                window.location.href = "update.html";
                            }
                        });

                    }

                }

            });


            // load iconos
            let iconos = $(".icono-js");
            for (let i = 0; i < iconos.length; i++) {
                const elmt = iconos[i];
                // icon
                const ic = $(elmt).attr("data-icon");
                $(elmt).css({ "background-image": `url(${iconos_json[ic] ? iconos_json[ic] : "img/iconos/modules.svg"})` });
            }

        }

        // terminos
        let terminos = kit.existsElm(".terminos");
        if (terminos) {

            $(".body").css({ opacity: 0 }).animate({ opacity: 1 });

            $(".info_app").height($(".info_app").height());
            $(".cover").css({ opacity: 0, "background-image": `${fondo}` }).animate({ opacity: 1 }, 500, () => {
                $(".icono").css({ opacity: 0, marginTop: "-20px", "background-image": `${icono}` }).animate({ opacity: 1, marginTop: 0 }, 400, () => {
                    $(".name_app").html(message.pack.title).css({ opacity: 0, marginTop: "-20px", }).animate({ opacity: 1, marginTop: 0 }, 400);
                    $(".version_app").html(message.pack.version).css({ opacity: 0, marginTop: "-20px", }).animate({ opacity: 1, marginTop: 0 }, 600, () => {
                        animates($(".btns_show"))
                    });

                });
            });

            const loadMD = (selector, file) => {
                const text = fs.readFileSync(file, "utf-8");
                const html = marked.parse(text);
                let read_terms = document.querySelector(selector);

                read_terms.innerHTML = html;

                Prism.highlightAll();
            }

            // btn_click
            $(".btn_click").on("click", (evnt) => {
                $(".btn_click").removeClass("active");
                // data
                let attrs = $(evnt.currentTarget).attr("data-btn");
                if (attrs == "lic") {
                    $(evnt.currentTarget).addClass("active");
                    // load lic
                    loadMD(".read_terms", path.resolve(folders.appPath, "apps", message.name, "LICENSE"));

                    // load attr
                    $(".read_terms").attr("data-read", attrs);
                } else if (attrs == "terms") {
                    // load attr
                    $(".read_terms").attr("data-read", attrs);
                    $(evnt.currentTarget).addClass("active");
                    // load terminos
                    loadMD(".read_terms", path.resolve(folders.appPath, "apps", message.name, "terminos_condiciones.md"));
                }
            });

            // load terminos
            loadMD(".read_terms", path.resolve(folders.appPath, "apps", message.name, "terminos_condiciones.md"));


            const scroll_read = document.querySelector(".read_terms");
            scroll_read.addEventListener("scroll", function () {
                if (scroll_read.scrollHeight - scroll_read.scrollTop === scroll_read.clientHeight) {
                    if (!$(".sub_body").is(".active")) {
                        if (scroll_read.getAttribute("data-read") === "terms") {
                            $(".sub_body").addClass("active");
                        }
                    }
                }
            });


            // save datos
            $(".next").on("click", async (evnt) => {
                let attrs = $(evnt.currentTarget).attr("data-next");
                if (attrs == "no") {
                    ipcRenderer.send('action-win', "close");
                } else if (attrs == "yes") {
                    const terms = await sendMessage("terms", message.name);
                    if (terms) {
                        window.location.href = "update.html";
                    }
                }
            });

        }

    });
})