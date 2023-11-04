const path = require("path")
const fs = require("fs")
const { v4: uuidv4 } = require('uuid');

class UtilCodes {
    constructor() { }

    async createFolderRecursive(currentPath, targetPath) {
        const parts = targetPath.split(path.sep);

        for (const part of parts) {
            currentPath = path.join(currentPath, part);

            try {
                await fs.promises.mkdir(currentPath, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.error(`Error al crear la carpeta "${currentPath}":`, error);
                    throw error; // Lanzar la excepción para manejarla más arriba si es necesario
                }
            }
        }
    }

    async createFileRecursive(filePath, fileContent) {
        const parts = filePath.split(path.sep);
        const fileName = parts.pop();
        const folderPath = parts.join(path.sep);

        await createFolderRecursive(folderPath);

        try {
            await fs.promises.writeFile(filePath, fileContent || '');
        } catch (error) {
            console.error(`Error al crear el archivo "${filePath}":`, error);
            throw error;
        }
    }

    async deleteFolderFiles(rutaCarpeta) {
        try {
            const archivos = await fs.promises.readdir(rutaCarpeta);

            for (const archivo of archivos) {
                const rutaArchivo = path.join(rutaCarpeta, archivo);
                const stats = await fs.promises.lstat(rutaArchivo);

                if (stats.isDirectory()) {
                    await this.deleteFolderFiles(rutaArchivo);
                } else {
                    await fs.promises.unlink(rutaArchivo);
                }
            }

            await fs.promises.rmdir(rutaCarpeta);
            return true;
        } catch (error) {
            const setError = new Error("Se produjo un error al intentar eliminar archivos/carpetas");
            setError.title = 'Error al eliminar';
            throw setError;
        }
    }

    async deleteFolder(folder) {
        const rutaCarpetaAEliminar = path.resolve(folder)

        try {
            await this.deleteFolderFiles(rutaCarpetaAEliminar);
            return true
        } catch (error) {
            console.log(error);
            throw error;
        }

    }

    async fsRead(ruta) {
        try {
            const fileContent = await fs.promises.readFile(ruta, 'utf-8');
            return fileContent;
        } catch (error) {
            throw error;
        }
    }

    async fsWrite(ruta, text) {
        try {
            await fs.promises.writeFile(ruta, text);
            return true;
        } catch (error) {
            throw error;
        }
    }

    jsonParse(text) {
        try {
            const jsonparse = JSON.parse(text);
            return jsonparse;
        } catch (error) {
            throw error;
        }
    }

    fsSystem({ type = "read", pathFile, value = "" }, ...arg) {
        if (this.fs) {
            const fs = this.fs;
            if (type == "read") {
                return fs.readFileSync(pathFile, ...arg);
            } else if (type == "write") {
                fs.writeFileSync(pathFile, value, ...arg);
            }
        }
    }
    clearSymbols(text, type = "namefile") {
        const invalidCharacters = /[~“#%&*:<>\?\/\\{|}'´\*\+`']/g;
        const cleanedText = text.replace(invalidCharacters, '');

        switch (type) {
            case "namefile":
                return cleanedText.replace(/\s+/g, '_').toLowerCase();

            case "toLowerCase":
                return cleanedText.toLowerCase();

            case "toUpperCase":
                return cleanedText.toUpperCase();

            default:
                return cleanedText;
        }
    }
    randoChar(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // Caracteres válidos (letras mayúsculas, letras minúsculas y dígitos)
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }
        return result;
    }
    replaceCharsWithRandom(inputString, groupSize, randomSize) {
        const gruposDe4 = inputString.match(new RegExp(`.{1,${groupSize}}`, 'g'));
        let newData = [];
        gruposDe4.forEach((element, index) => {
            if (index !== gruposDe4.length - 1) {
                newData.push(element + this.randoChar(randomSize));
            } else {
                newData.push(element);
            }
        });
        return this.randoChar(6) + newData.join('');
    }
    extractOriginalString(inputString, groupSize, randomSize) {
        inputString = inputString.slice(6)
        const groups = inputString.match(new RegExp(`.{1,${groupSize + randomSize}}`, 'g'));
        let originalData = [];
        groups.forEach((group, index) => {
            if (index !== groups.length - 1) {
                originalData.push(group.substr(0, groupSize));
            } else {
                originalData.push(group);
            }
        });
        return originalData.join('');
    }
    getUUID(partNumber) {
        const parts = uuidv4().split("-");
        if (partNumber === 0) {
            return uuidv4();
        } else if (partNumber >= 1 && partNumber <= 5) {
            return parts[partNumber - 1];
        } else {
            throw new Error("Part number out of range (0-5)");
        }
    }
    insertText(inputString, textToInsert) {
        const characters = inputString.split('');
        const result = characters.join(textToInsert);

        return this.randoChar(6) + result;
    }
}

module.exports = new UtilCodes();