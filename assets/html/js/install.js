const { ipcRenderer, shell } = require('electron');

// Modules Node
const path = require("path")
const fs = require("fs");
const fsExtra = require('fs-extra');
const utilcode = require(path.resolve(__dirname, "../../", "modules", "utilcodes"));


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

function loadElms(items, $artAll, config = {}, template, nextCallback = false) {
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

        if (nextCallback) {
            nextCallback();
        }
    }
}

// Creator Acceso directo
const newFileAcceso = (file, { args, description, icon, appUserModelId, iconIndex = 0 }) => {

    let updatefiles = {};
    let updatelnk = false;
    if (fs.existsSync(file)) {
        const lnk = shell.readShortcutLink(file);
        updatefiles = { ...lnk };
        updatelnk = true;
    }

    const operation = updatelnk ? 'update' : "create";
    const options = {
        ...updatefiles,
        target: process.execPath,
        args,
        description,
        icon,
        appUserModelId,
        iconIndex
    };

    return shell.writeShortcutLink(file, operation, options);
};

// Eliminar .lnk
const nolnk = async (file) => {
    // verificar si existe el file
    const existfile = fs.existsSync(file);
    if (!existfile) {
        return false;
    }
    // action
    let result = null;
    if (path.extname(file) === '.lnk') {
        try {
            await fs.promises.unlink(file);
            result = true;
        } catch (error) {
            console.error(`Error al eliminar el archivo ${file}: ${error.message}`);
            result = false;
        }
    } else {
        console.error(`No se permite eliminar el archivo ${file}. La extensión no es ".lnk".`);
        result = false;
    }

    return result;
};

// Btn
const btn_select = ($btn, text, css = {}, callback = false) => {
    $btn.animate({ bottom: "-80px" }, 500, () => {
        $btn.text(text);
        $btn.css({ ...css });
        if (callback) {
            callback($btn);
        }
        $btn.animate({ bottom: "0" }, 500);
    });
};


kit.onDOMReady(async () => {
    // All folders
    const folders = await sendMessage("all-folders");

    // Datos
    ipcRenderer.on('data-homes', async (event, info) => {

        // Guardar datos
        saved.addSaved("info_homes", { info, folders })

        const render = async (arrays) => {

            // Css
            const customConfig = {
                customCSS: {
                    opacity: 0,
                    marginLeft: '-100px',
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

            // Cargar Apps Homes
            renderItems($(".apps_home"), customConfig, () => {
                loadElms(arrays, $(".apps_home"), customConfig, (item) => {
                    return `<div class="app_home" id="id_${item.name}">
                            <div class="item z-depth-2" style="background-image: url('../../modules/util-libraries/libraries/apps/iconos/${item.name}.svg')">
                                <div class="footer-item">
                                    <div class="name-item">
                                        ${item.title}
                                    </div>
                                    <div class="version-item">
                                        <span class="icon-user"></span> devlwte
                                    </div>
                                    <div class="version-item">
                                        <span class="icon-code2"></span> ${item.version}
                                    </div>
                                    <div class="line"></div>
                                    <div class="btn_install_select waves-effect waves-light">
                                        Esperando...
                                    </div>
                                </div>
                            </div>
                        </div>`
                }, () => {
                    // children
                    let $children = $(".apps_home").children();

                    // Apps
                    if ($children.length === arrays.length) {
                        for (const item of arrays) {
                            const $btn = $(`#id_${item.name}`);

                            const app_installed = path.resolve(__dirname, "../../", "apps", item.name, "package.json");

                            if (fs.existsSync(app_installed)) {
                                const buscar_installed = fs.existsSync(path.resolve(folders.desktop, `${item.title}.lnk`));
                                if (buscar_installed) {
                                    btn_select($btn.find(".btn_install_select"), "Seleccionado", { backgroundColor: "#651fff" }, (btn) => {
                                        btn.attr("data-type", "deselect");
                                        btn.attr("data-ref", item.ref);
                                    });
                                } else {
                                    btn_select($btn.find(".btn_install_select"), "Seleccionar", {}, (btn) => {
                                        btn.attr("data-type", "select");
                                        btn.attr("data-ref", item.ref);
                                    });
                                }
                            } else {
                                btn_select($btn.find(".btn_install_select"), "Descargar", {}, (btn) => {
                                    btn.attr("data-type", "download");
                                    btn.attr("data-ref", item.ref);
                                });
                            }

                        }

                        // Action
                        $(".btn_install_select").on("click", async (e) => {
                            const $get = $(e.currentTarget);
                            let buscar = saved._search(info.ishome, "ref", $get.attr("data-ref"))[0];
                            if ($get.attr("data-type") == "select") {

                                const filelnk = newFileAcceso(path.resolve(folders.desktop, `${buscar.title}.lnk`), {
                                    args: `${buscar.ref} ${buscar.name}`,
                                    description: buscar.dcp,
                                    icon: path.resolve(__dirname, "../../", "apps", buscar.name, `${buscar.name}.ico`),
                                    appUserModelId: `app.${buscar.name}`,
                                    iconIndex: 0,
                                });

                                if (filelnk) {
                                    btn_select($(e.currentTarget), "Seleccionado", { backgroundColor: "#651fff" }, (btn) => {
                                        btn.attr("data-type", "deselect");
                                        btn.attr("data-ref", buscar.ref);
                                    });
                                }
                            } else if ($get.attr("data-type") == "deselect") {
                                const remove = await nolnk(path.resolve(folders.desktop, `${buscar.title}.lnk`));
                                if (remove) {
                                    btn_select($(e.currentTarget), "Seleccionar", { backgroundColor: "rgba(0, 0, 0, 0.418)" }, (btn) => {
                                        btn.attr("data-type", "select");
                                        btn.attr("data-ref", buscar.ref);
                                    });
                                }
                            } else if ($get.attr("data-type") == "download") {
                                const $btn = $(`#id_${buscar.name}`);
                                const $lineRun = $(`<div class="line-run"></div>`);
                                $lineRun.animate({ width: "50%" }, 300);
                                $btn.find(".line").append($lineRun);
                                const download = await sendMessage("new-app", { repo: buscar.repo, name: buscar.name });
                                if (download) {
                                    $lineRun.animate({ width: "100%" }, 300, () => {
                                        btn_select($(e.currentTarget), "Seleccionar", { backgroundColor: "rgba(0, 0, 0, 0.418)" }, (btn) => {
                                            btn.attr("data-type", "select");
                                            btn.attr("data-ref", buscar.ref);
                                        });

                                        $lineRun.animate({ opacity: 0 }, 300, () => {
                                            $lineRun.remove();
                                        });
                                    });

                                }
                            }
                        });
                    }
                });
            });
        };


        $('#pagination-home').pagination({
            dataSource: info.ishome,
            pageSize: 12,
            prevText: "<span class='btn-back icon-keyboard_arrow_left'></span>",
            nextText: "<span class='btn-next icon-keyboard_arrow_right'></span>",
            afterIsLastPage: () => {
                console.log(true);
            },
            callback: async function (data, pagination) {
                await render(data);
            }
        });


    });


    // Verificar lnk
    const lnkVery = () => {
        kit.createInterval("lnks", async () => {
            // datos
            let isinfo = saved.getSaved("info_homes");

            // children
            let $children = $(".apps_home").children();

            for (const item of $children) {
                const $item = $(item);
                // btn
                const $btn = $item.find(".btn_install_select");

                // buscar
                let getinfo = saved._search(isinfo.info.ishome, "ref", $btn.attr("data-ref"))[0];


                const app_installed = path.resolve(__dirname, "../../", "apps", getinfo.name, "package.json");

                if (fs.existsSync(app_installed)) {
                    const buscar_installed = fs.existsSync(path.resolve(folders.desktop, `${getinfo.title}.lnk`));
                    if (!buscar_installed) {
                        if ($btn.attr("data-type") !== "select") {
                            btn_select($btn, "Seleccionar", { backgroundColor: "rgba(0, 0, 0, 0.418)" }, (btn) => {
                                btn.attr("data-type", "select");
                                btn.attr("data-ref", getinfo.ref);
                            });
                        }

                    }
                } else {
                    if ($btn.attr("data-type") !== "download") {
                        btn_select($btn, "Descargar", { backgroundColor: "rgba(0, 0, 0, 0.418)" }, (btn) => {
                            btn.attr("data-type", "download");
                            btn.attr("data-ref", getinfo.ref);
                        });
                    }

                }
            }


        }, 8000)
    }
    lnkVery();
    // Agregar un event listener al evento "focus"
    window.addEventListener("focus", function () {
        lnkVery();
    });

    // Agregar un event listener al evento "blur" (opcional)
    window.addEventListener("blur", function () {
        kit.removeInterval("lnks");
    });


    // Reload
    $(".reload-app").on("click", () => {
        ipcRenderer.send('reload-app', true);
    });
});
