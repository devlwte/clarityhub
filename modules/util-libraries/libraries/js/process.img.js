class ImgProcess {
    constructor() {
        this.s2dplano = {};
    }
    loadImg(url, id, callback) {
        const pageactive = saved.getSaved("searchText");
        this._ajax("/saveimg", "POST", {
            url,
            id,
            name: pageactive.searchText + "_" + pageactive.page,
            width: 600,
            height: 400,
            quality: 40
        });
    }

    _ajax(url, method, data) {
        return new Promise((resolve, reject) => {
            kit.send({
                url: url,
                method: method,
                data,
                success: (respuesta) => {
                    resolve(respuesta);
                },
                error: (codigo, respuesta) => {
                    reject({ codigo, respuesta });
                }
            });
        });
    }


}
