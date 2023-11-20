/* Avoiding jQuery || git.io/zQuery */
function onDOMReady(f) { /in/.test(document.readyState) ? setTimeout(arguments.callee.name + '(' + f + ')', 9) : f() }
function isNotBatman(a, h) { for (; a && a !== document; a = a.parentNode) { if (a.classList.contains(h.substr(1))) { return 1 } } }
function fadeElement(a, b) { if (b !== 'show') { return a.style.opacity = setTimeout(function () { a.style.display = 'none' }, 200) * 0 } a.style.display = 'block'; setTimeout(function () { a.style.opacity = 1 }, 30) }
function addListener(a, b, c) { ((typeof a == "string") ? document.querySelector(a) : a).addEventListener(b, c) }

/* The actual jCtx code || git.io/justContext.js */
onDOMReady(function () {

    let dataMenu = {};

    Array.from(document.querySelectorAll(".jctx-host")).forEach((z, i) => {
        addListener(z, "contextmenu", function (event) {

            Array.from(document.querySelectorAll(".jctx")).forEach((k, i) => { k.style.display = 'none' });
            event.preventDefault();


            var clickedElement = event.target;

            // Crear un objeto JSON para almacenar los datos
            var jsonData = {};

            // Obtener todas las clases del elemento y convertirlas en un arreglo
            jsonData.classes = Array.from(clickedElement.classList);

            // Obtener el ID del elemento
            jsonData.id = clickedElement.id;

            // Obtener los atributos del elemento y almacenarlos en un objeto
            jsonData.attributes = {};
            for (var attr of clickedElement.attributes) {
                jsonData.attributes[attr.name] = attr.value;
            }

            // Obtener el texto seleccionado (si hay)
            var selectedText = window.getSelection().toString();
            if (selectedText) {
                jsonData.selectedText = selectedText;
            }

            // Convertir el objeto JSON a una cadena JSON
            var jsonString = JSON.stringify(jsonData, null, 2);

            // Mostrar la cadena JSON en la consola
            dataMenu = JSON.parse(jsonString);


            // Texto
            const istext = (elm, isCut = false) => {
                if (isCut) {
                    if (elm.contentEditable === "true") {
                        if (elm.classList.contains("el-disabled")) {
                            elm.classList.remove("el-disabled");
                        }
                    } else {
                        elm.classList.add("el-disabled");
                    }
                    return;
                }
                if (!dataMenu.selectedText) {
                    elm.classList.add("el-disabled");
                } else {
                    if (elm.classList.contains("el-disabled")) {
                        elm.classList.remove("el-disabled");
                    }
                }
            };

            let elms = document.querySelectorAll(".jctx");
            elms.forEach(element => {
                const dataChildren = element.children;
                for (const lis of dataChildren) {
                    const tipo = lis.getAttribute("data-action");
                    if (tipo) {
                        if (tipo == "cut") {
                            istext(lis, "cut");
                        } else if (tipo == "copy") {
                            istext(lis);
                        } else if (tipo == "paste") {
                            istext(lis, "cut");
                        }
                    }
                }
            });


            var mID = '';
            Array.from(z.classList).forEach((y, i) => { if (~y.indexOf("jctx-id-")) { mID = '.' + y } });

            const x = document.querySelector(".jctx" + mID);

            fadeElement(x, 'show');

            // Especifica el margen desde los bordes izquierdo y superior
            const margenIzquierdo = 30;
            const margenSuperior = 30;

            // Calcula la posición x e y iniciales del menú contextual
            const curx = event.clientX;
            const cury = event.clientY;

            // Calcula la posición x del menú contextual
            let xMenu = curx;
            let calculoX = xMenu + x.offsetWidth + margenIzquierdo > window.innerWidth;
            if (xMenu + x.offsetWidth + margenIzquierdo > window.innerWidth) {
                // Si el menú se sale del borde derecho de la ventana, ajústalo a la izquierda
                xMenu = window.innerWidth - x.offsetWidth - margenIzquierdo;
                if (xMenu < margenIzquierdo) {
                    // Si aún se sale del borde izquierdo, ajústalo al mínimo valor a la izquierda
                    xMenu = margenIzquierdo;
                }
            }

            // Calcula la posición y del menú contextual
            let yMenu = cury;

            if (yMenu + x.offsetHeight + margenSuperior > window.innerHeight) {
                // Si el menú se sale del borde inferior de la ventana, ajústalo hacia arriba
                yMenu = window.innerHeight - x.offsetHeight - margenSuperior;
                if (yMenu < margenSuperior) {
                    // Si aún se sale del borde superior, ajústalo al mínimo valor en la parte superior
                    yMenu = margenSuperior;
                }


            }


            x.style.left = xMenu + "px";
            x.style.top = yMenu + "px";


            // Agrega la clase "left" al submenú si se desborda a la derecha

            const subMenu = x.querySelectorAll('.submenu-body');
            subMenu.forEach(elm => {
                elm.addEventListener("mouseenter", function () {
                    if (calculoX) {
                        const subMenu = elm.querySelector('.submenu-items');
                        subMenu.classList.add('sub-left');
                        subMenu.style.left = `-${subMenu.offsetWidth}px`;
                    }

                });
            });




            // const subMenu = x.querySelectorAll('.submenu-items');
            // subMenu.forEach(subs => {
            //     if (calculoX) {
            //         subs.classList.add('sub-left');

            //     } else {
            //         subs.classList.remove('sub-left');

            //     }
            // });

            // console.log(calculoX);


        })




    });

    Array.from(document.querySelectorAll(".jctx li")).forEach((x, i) => {

        addListener(x, "click", function (event) {
            event.preventDefault();

            var action = x.getAttribute("data-action");

            if (action === "submenu") {
                // // Si se hace clic en el elemento "Submenu", muestra el submenú correspondiente
                // var submenu = x.querySelector(".submenu-items");
                // if (submenu) {
                //     submenu.style.display = "block";
                //     submenu.style.opacity = 1;
                // }
            } else {
                if (eval("typeof(handleMenuAction)==typeof(Function)") && !x.classList.contains("disabled")) handleMenuAction(x.getAttribute("data-action"), dataMenu);
                fadeElement(x.parentElement, 'hide')
            }
        })

        // addListener(x, "click", function () {
        //     if (eval("typeof(handleMenuAction)==typeof(Function)") && !x.classList.contains("disabled")) handleMenuAction(x.getAttribute("data-action"), dataMenu);
        //     fadeElement(x.parentElement, 'hide')
        // })
    });

    document.addEventListener('click', function (event) {
        var menu = document.querySelector(".jctx.jctx-id-foo"); // Reemplaza "jctx-id-foo" con la clase correcta del menú
        if (menu && !menu.contains(event.target)) {
            // Si el menú está visible y el clic no ocurrió dentro del menú, oculta el menú
            fadeElement(menu, 'hide');
        }
    });

});