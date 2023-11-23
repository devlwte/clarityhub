function fadeElement(element, action) {
  if (action === 'show') {
    $(element).fadeIn(200);
  } else if (action === 'hide') {
    $(element).fadeOut(200);
  }
}

async function handleMenuAction(evt, data) {
  if (evt == "copy") {
    await kit.copyToClipboard(false, { text: data.selectedText });
  } else if (evt == "cut") {
    const fun = data.clickedElement();
    kit.cutSelectedText(fun);
  } else if (evt == "paste") {
    const fun = data.clickedElement();
    kit.pasteTextAtCursor(fun);
  } else if (evt == "install_app") {

    winweb.windows(`win_${data.attributes["data-ref"]}`, {
      title: data.attributes["data-title"],
      width: 700,
      height: 500,
      classes: ["ventana_download", "z-depth-3"],
      icon: data.attributes["data-cover"],
      iconClose: `<span class="icon-close"></span>`,
      url: `/download_repo?ref=${data.attributes["data-ref"]}&name=${data.attributes["data-name"]}`
    });

  } else if (evt == "remove_app") {

    try {
      fsExtra.removeSync(path.join(saved.getSaved("folders").appPath, "apps", data.attributes["data-name"]));
      const fun = data.clickedElement();
      // editar app view
      fun.setAttribute("data-installed", "false");

      // icono
      let icon_app = fun.querySelector(".sub-item .icono-very");
      if (icon_app.classList.contains("icon-check")) {
        icon_app.classList.remove("icon-check");
        icon_app.classList.add("icon-file_download");
      }

      // Quitar de anclas y desktop
      deleteAnclas(fun.getAttribute("data-ref"), fun.getAttribute("data-name"), fun.getAttribute("data-title"));

      // remove of installed
      await _ajax("/removejson", "POST", {
        ref: fun.getAttribute("data-ref")
      });

    } catch (error) {
      console.log(error);
    }

  } else if (evt == "ancla_barra") {
    const fun = data.clickedElement();
    await loadanchors("save", fun);
  } else if (evt == "remove_anchor") {
    const fun = data.clickedElement();
    await removeAnchor(fun)
  } else if (evt == "send_desktop") {
    const fun = data.clickedElement();
    newAccLnk(fun.getAttribute("data-ref"), false, saved.getSaved("folders").desktop)
  }




}

let dataMenu = {};

$(".jctx-host").on("contextmenu", function (event) {

  $(".jctx").css("display", "none");
  event.preventDefault();

  var clickedElement = event.target;

  // Crear un objeto JSON para almacenar los datos
  var jsonData = {};

  // console.log($(clickedElement));

  // Obtener todas las clases del elemento y convertirlas en un arreglo
  jsonData.classes = Array.from(clickedElement.classList);

  // Obtener el ID del elemento
  jsonData.id = clickedElement.id;
  jsonData.nodeName = clickedElement.nodeName;


  // Obtener los atributos del elemento y almacenarlos en un objeto
  jsonData.attributes = {};
  $.each(clickedElement.attributes, function (i, attr) {
    jsonData.attributes[attr.name] = attr.value;
  });

  // Obtener el texto seleccionado (si hay)
  var selectedText = window.getSelection().toString();
  if (selectedText) {
    jsonData.selectedText = selectedText;
  }

  // Convertir el objeto JSON a una cadena JSON
  var jsonString = JSON.stringify(jsonData, null, 2);

  // Mostrar la cadena JSON en la consola
  dataMenu = JSON.parse(jsonString);
  dataMenu.clickedElement = () => {
    return clickedElement;
  };

  // Texto
  const istext = async (elm, action = "") => {
    if (action === "cut") {
      elm.css({ display: "none" });
      if (clickedElement.nodeName === "INPUT" || clickedElement.nodeName === "TEXTAREA") {
        if (dataMenu.selectedText) {
          elm.css({ display: "" });
        }
      } else {
        elm.css({ display: "none" });
      }
    } else if (action === "paste") {
      elm.css({ display: "none" });
      if (clickedElement.nodeName === "INPUT" || clickedElement.nodeName === "TEXTAREA") {
        const isTextInClipboard = await kit.isClipboardEmptyText();
        if (isTextInClipboard) {
          elm.css({ display: "" });
        }
      }
    } else if (action === "copy") {
      elm.css({ display: "none" });
      if (dataMenu.selectedText) {
        elm.css({ display: "" });
      }
    }
  };

  const elms = $(".jctx");

  // Action Web
  elms.find(".web_action").each(function (index, element) {
    const dataChildren = element.children;

    let numNoview = 0;

    $(this).css({ display: "" });

    for (const lis of dataChildren) {
      const tipo = $(lis).data("action");
      istext($(lis), tipo);

      if ($(lis).css("display") == "none") {
        numNoview++;
      }

      if (dataChildren.length == numNoview) {
        $(this).css({ display: "none" });
      }

    }
  })



  elms.each(function (index, element) {
    const dataChildren = element.children;
    let count_num = 0;

    for (const lis of dataChildren) {
      const tipo = $(lis).data("action");

      if (tipo === "app-select") {
        if (!dataMenu.attributes["data-type"]) {
          $(lis).css({ display: "none" });
        } else {
          $(lis).css({ display: "" });
        }
      } else {
        istext($(lis), tipo);
      }

      // hide global
      count_num++;
      if (tipo === "cut" || tipo === "copy" || tipo === "paste" || tipo === "app-select") {
        if (dataChildren.length === count_num) {
          // Realizar cualquier acción adicional si es necesario
        }
      }
    }
  });

  // Modificar Menu App
  const app_menu = ($menu) => {
    let list_menu_app = $menu.find("ul").children();
    list_menu_app.each(function (index, element) {
      const tipo = $(element).data("action");

      if (tipo == "install_app") {
        if (dataMenu.attributes["data-installed"] && dataMenu.attributes["data-installed"] == "true") {
          $(element).css({ display: "none" });
        } else {
          $(element).css({ display: "" });
        }
      }

      if (tipo == "remove_app") {
        if (dataMenu.attributes["data-installed"] && dataMenu.attributes["data-installed"] == "true") {
          $(element).css({ display: "" });
        } else {
          $(element).css({ display: "none" });
        }
      }

    })
  };

  // Action App
  elms.find(".app_action").each(function (index, element) {

    if ($(this).css("display") !== "none") {
      const chin = element.children;
      for (let i = 0; i < chin.length; i++) {
        const elm = chin[i];
        const tipo = $(elm).data("action");

        if (tipo === "get_app") {
          app_menu($(elm));
        } else if (tipo === "atajos") {
          if (dataMenu.attributes["data-installed"] && dataMenu.attributes["data-installed"] == "true") {
            $(elm).css({ display: "" });
          } else {
            $(elm).css({ display: "none" });
          }
        }

      }

    }

  })

  // Action Anchors
  elms.find(".data-anchors").each(function (index, element) {

    $(this).css({ display: "none" });
    if (dataMenu.attributes["data-anchrs"] && dataMenu.attributes["data-anchrs"] === "true") {
      $(this).css({ display: "" });
    }


  })


  // Add Border Top
  let firstVisibleElement = true;
  elms.children().each(function (index, element) {
    $(element).css({ borderTop: "" });
    if ($(element).css("display") !== "none") {
      if (!firstVisibleElement) {
        // Eliminar el borde superior si ya está presente
        $(element).css({ borderTop: "1px solid rgba(89, 89, 89, 0.521)" });
      }
      firstVisibleElement = false;
    }
  });

  var mID = '';
  $.each($(this).attr("class").split(' '), function (index, y) {
    if (~y.indexOf("jctx-id-")) {
      mID = '.' + y;
    }
  });

  const x = $(".jctx" + mID);

  fadeElement(x, 'show');

  // Especifica el margen desde los bordes izquierdo y superior
  const margenIzquierdo = 110;
  const margenSuperior = 30;

  // Calcula la posición x e y iniciales del menú contextual
  const curx = event.clientX;
  const cury = event.clientY;

  // Calcula la posición x del menú contextual
  let xMenu = curx;
  let calculoX = xMenu + x.width() + margenIzquierdo > window.innerWidth;

  if (xMenu + x.width() + margenIzquierdo > window.innerWidth) {
    // Si el menú se sale del borde derecho de la ventana, ajústalo a la izquierda
    xMenu = window.innerWidth - x.width() - margenIzquierdo;
    if (xMenu < margenIzquierdo) {
      // Si aún se sale del borde izquierdo, ajústalo al mínimo valor a la izquierda
      xMenu = margenIzquierdo;
    }
  }

  // Calcula la posición y del menú contextual
  let yMenu = cury;
  let calculoY = yMenu + x.height() + margenSuperior > window.innerHeight;
  if (yMenu + x.height() + margenSuperior > window.innerHeight) {
    // Si el menú se sale del borde inferior de la ventana, ajústalo hacia arriba
    yMenu = window.innerHeight - x.height() - margenSuperior;
    if (yMenu < margenSuperior) {
      // Si aún se sale del borde superior, ajústalo al mínimo valor en la parte superior
      yMenu = margenSuperior;
    }
  }

  x.css({
    left: xMenu + "px",
    top: yMenu + "px"
  });

  // Agrega la clase "left" al submenú si se desborda a la derecha
  const subMenu = x.find('.submenu-body');
  subMenu.each(function () {
    if (calculoY) {
      const subMenu = $(this).find('.submenu-items');
      subMenu.css('top', `-${subMenu.height()}px`);
    } else {
      const subMenu = $(this).find('.submenu-items');
      subMenu.css('top', '');
    }
    if (calculoX) {
      const subMenu = $(this).find('.submenu-items');
      subMenu.css('left', `-${subMenu.width()}px`);
    } else {
      const subMenu = $(this).find('.submenu-items');
      subMenu.css('left', '');
    }
  });

});

$(".jctx .data-anchors li").on("click", function (event) {
  event.preventDefault();
  var action = $(this).data("action");
  if (action !== "submenu" || action !== "atajos" || action !== "sprts" || action !== "app-select") {
    if (typeof handleMenuAction === "function" && !$(this).hasClass("disabled")) {
      handleMenuAction($(this).data("action"), dataMenu);
    }
    fadeElement($(this).parent().parent(), "hide");
  }
});

$(".submenu-body ul li").on("click", function (event) {
  event.preventDefault();
  var action = $(this).data("action");
  if (typeof handleMenuAction === "function" && !$(this).hasClass("disabled")) {
    handleMenuAction($(this).data("action"), dataMenu);
  }
  fadeElement($(this).parent().parent().parent().parent(), "hide");
});


$(document).on("click", function (event) {
  var menu = $(".jctx.jctx-id-foo"); // Reemplaza "jctx-id-foo" con la clase correcta del menú
  if (menu && !menu.is(event.target) && menu.has(event.target).length === 0) {
    // Si el menú está visible y el clic no ocurrió dentro del menú, oculta el menú
    fadeElement(menu, "hide");
  }
});