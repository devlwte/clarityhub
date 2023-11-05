class SavedTemp {
    constructor() {
        this.saved = {};
    }

    addSaved(key, value, reset, callback) {
        if (reset) {
            this.saved[key] = value;
            return;
        }
        if (!this.saved[key]) {
            this.saved[key] = value;
        } else {
            if (typeof this.saved[key] === 'object') {
                if (Array.isArray(this.saved[key])) {
                    this.saved[key].push(value);
                } else {
                    this.saved[key] = [this.saved[key], value];
                }
            } else {
                this.saved[key] = { 0: this.saved[key], 1: value };
            }
        }

        if (callback) {
            callback(this.saved[key]);
        }
    }

    updateSaved(key, value) {
        if (this.saved[key] !== undefined) {
            if (typeof this.saved[key] === 'object') {
                if (Array.isArray(this.saved[key]) && Array.isArray(value)) {
                    this.saved[key] = value;
                } else if (!Array.isArray(this.saved[key]) && !Array.isArray(value)) {
                    this.saved[key] = value;
                } else {
                    throw new Error('Incompatible data types for update.');
                }
            } else {
                this.saved[key] = value;
            }
        } else {
            throw new Error('Key not found.');
        }
    }

    updateValue(key, value) {
        const currentData = this.getSaved(key);
        if (currentData !== false && typeof currentData === 'object' && typeof value === 'object') {
            try {
                this.updateSaved(key, { ...currentData, ...value });
            } catch (error) {
                console.error(error);
            }
        } else {
            console.error('Key not found or incompatible data types for update.');
        }
    }

    getSaved(key) {
        return this.saved[key] || false;
    }

    where(key, action) {
        let result = this.saved[key];
        let results = [];
        if (result) {
            const keys = Object.keys(action);
            for (const clave of keys) {
                let search = this._search(result, clave, action[clave]);
                for (const item of search) {
                    results.unshift(item);
                }                
            }

            return results;
        } else {
            return false;
        }
    }
    _search(array, obj, value, num) {
        const resultados = array.filter((elemento) => {
            return elemento[obj] === value;
        });

        let result = resultados;
        if (num) {
            result = (resultados.length > 0) ? resultados[0] : false;
        }
        return result;
    }

    removeSaved(key) {
        if (this.saved[key]) {
            delete this.saved[key];
            return true;
        } else {
            return false;
        }
    }

    removeValue(key, value) {
        if (this.saved[key] !== undefined) {
            if (Array.isArray(this.saved[key])) {
                if (Array.isArray(value)) {
                    this.saved[key] = this.saved[key].filter(item => !value.includes(item));
                } else {
                    this.saved[key] = this.saved[key].filter(item => !this.isEqualOrPartialMatch(item, value));
                }
            } else if (typeof this.saved[key] === 'object') {
                if (typeof value !== 'object') {
                    if (this.isObjectEqual(this.saved[key], value)) {
                        delete this.saved[key];
                    }
                }
            } else {
                if (this.saved[key] === value) {
                    delete this.saved[key];
                } else {
                    this.saved[key] = this.saved[key].filter(item => !this.isEqualOrPartialMatch(item, value));
                }
            }
        }
    }

    isEqualOrPartialMatch(obj1, obj2) {
        if (typeof obj2 === 'object') {
            for (const key in obj2) {
                if (obj2.hasOwnProperty(key) && obj1.hasOwnProperty(key) && obj1[key] === obj2[key]) {
                    return true; // Coincidencia parcial encontrada
                }
            }
            return false; // No se encontraron coincidencias parciales
        }
        return obj1 === obj2; // Comparación de valores individuales
    }

    isObjectEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    isEmpty() {
        return Object.keys(this.saved).length === 0;
    }

    clear() {
        this.saved = {};
    }

    getAllKeys() {
        return Object.keys(this.saved);
    }

    count(key) {
        if (this.saved[key]) {
            if (Array.isArray(this.saved[key])) {
                return this.saved[key].length;
            } else {
                return 1;
            }
        } else {
            return 0;
        }
    }

    toArray() {
        return Object.values(this.saved);
    }

    toObject() {
        return { ...this.saved };
    }

    hasKey(key) {
        return key in this.saved;
    }
}

module.exports = new SavedTemp();
