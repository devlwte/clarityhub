const path = require("path");
const fs = require("fs");

class UtilNode {
  constructor(options = {}) {
    this.uuid = options.uuid || null;
    this.electron = options.electron || null;
    this.si = options.si || null;
    this.parseTorrent = options.parseTorrent || null
    this.database = options.database || null

    this.intervals = {};
  }

  join(...paths) {
    return path.join(...paths);
  }
  fileName(filePath) {
    return path.basename(filePath);
  }
  fileExtension(filePath) {
    return path.extname(filePath);
  }
  normalize(filePath) {
    return path.normalize(filePath);
  }

  dirname(filePath) {
    return path.dirname(filePath);
  }

  absolutePath(relativePath) {
    return path.resolve(relativePath);
  }
  isAbsolutePath(filePath) {
    return path.isAbsolute(filePath);
  }

  async veryFolderAndCrator(folders) {
    for (const folder of folders) {
      const folderPath = path.join(folder.path, folder.name);

      if (path.extname(folder.name)) {
        if (!fs.existsSync(folderPath)) {
          try {
            await fs.promises.writeFile(folderPath, '');
          } catch (error) {
            console.error(`Error al crear el archivo en ${folderPath}:`, error);
          }
        }

      } else {
        if (!fs.existsSync(folderPath)) {
          try {
            await fs.promises.mkdir(folderPath);
          } catch (error) {
            console.error(`Error al crear la carpeta en ${folderPath}:`, error);
          }
        }
      }
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

  fsSystem(operation, ...args) {
    switch (operation) {
      case "read":
        const filePath = path.join(...args);
        try {
          const data = fs.readFileSync(filePath, "utf8");
          return data;
        } catch (err) {
          throw err;
        }
      case "write":
        const writeFilePath = args[0];
        const writeContent = args[1];
        try {
          fs.writeFileSync(writeFilePath, writeContent, "utf8");
        } catch (err) {
          throw err;
        }
        break;
      case "readAsync":
        const asyncReadFilePath = args[0];
        const asyncReadCallback = args[1];
        fs.readFile(asyncReadFilePath, "utf8", (err, data) => {
          if (err) {
            asyncReadCallback(err, null);
          } else {
            asyncReadCallback(null, data);
          }
        });
        break;
      case "writeAsync":
        const asyncWriteFilePath = args[0];
        const asyncWriteContent = args[1];
        const asyncWriteCallback = args[2];
        fs.writeFile(asyncWriteFilePath, asyncWriteContent, "utf8", (err) => {
          if (err) {
            asyncWriteCallback(err);
          } else {
            asyncWriteCallback(null);
          }
        });
        break;
      case "exists":
        const checkPath = args[0];
        return fs.existsSync(checkPath);
      default:
        throw new Error("Invalid operation");
    }
  }

  deleteFileSync(path) {
    fs.unlinkSync(path);
  }

  deleteFileAsync(path, callback) {
    fs.unlink(path, (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    });
  }

  createDirectorySync(path) {
    fs.mkdirSync(path);
  }

  createDirectoryAsync(path, callback) {
    fs.mkdir(path, (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    });
  }

  readDirectorySync(path) {
    return fs.readdirSync(path);
  }

  readDirectoryAsync(path, callback) {
    fs.readdir(path, (err, files) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, files);
      }
    });
  }

  moveFileSync(oldPath, newPath) {
    fs.renameSync(oldPath, newPath);
  }

  moveFileAsync(oldPath, newPath, callback) {
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    });
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

  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  sleep(milliseconds) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
  }

  async sleepAsync(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  getDate() {
    return new Date();
  }

  parseJson(jsonString) {
    return JSON.parse(jsonString);
  }

  stringifyJson(object) {
    return JSON.stringify(object);
  }

  async openFile(options = {}) {
    if (this.electron) {
      const { dialog, BrowserWindow } = this.electron;
      try {
        const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
          properties: ['openFile'],
          ...options,
        });
        return result.filePaths[0] || null;
      } catch (error) {
        console.error('Error opening file dialog:', error);
        return null;
      }
    } else {
      return null;
    }
  }

  async openFolder() {
    if (this.electron) {
      const { dialog, BrowserWindow } = this.electron;
      return new Promise((resolve, reject) => {
        const mainWindow = BrowserWindow.getFocusedWindow();

        dialog.showOpenDialog(mainWindow, {
          properties: ['openDirectory'],
        }).then((result) => {
          if (result.canceled) {

            const cancelError = new Error('Folder search was canceled');
            cancelError.title = 'Search canceled';
            reject(cancelError);
          } else {
            const selectedDirectory = result.filePaths[0];
            resolve(selectedDirectory);
          }
        }).catch((error) => {
          reject(error);
        });
      });
    } else {
      return null;
    }
  }

  getUUID(partNumber) {
    if (this.uuid) {
      const { uuidv4 } = this.uuid;
      const parts = uuidv4().split("-");
      if (partNumber === 0) {
        return uuid;
      } else if (partNumber >= 1 && partNumber <= 5) {
        return parts[partNumber - 1];
      } else {
        throw new Error("Part number out of range (0-5)");
      }
    } else {
      return null;
    }
  }

  async getSystemInfo() {
    if (this.si) {
      const si = this.si;
      try {
        return await si.system();
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  }

  async getCpuInfo() {
    if (this.si) {
      const si = this.si;
      try {
        return await si.cpu();
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  }

  async getMemoryInfo() {
    if (this.si) {
      const si = this.si;
      try {
        return await si.mem();
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  }

  async fsSize() {
    if (this.si) {
      const si = this.si;
      try {
        return await si.fsSize();
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  }

  async getInfoTorrent(input) {
    if (this.parseTorrent) {
      try {
        let parsedInfo;
        if (input.startsWith('magnet:')) {
          parsedInfo = this.parseTorrent(input);
        } else {
          const torrentFileData = await fs.promises.readFile(input);
          parsedInfo = this.parseTorrent(torrentFileData);
        }

        return {
          name: parsedInfo.name,
          infoHash: parsedInfo.infoHash,
          announce: parsedInfo.announce,
          createdBy: parsedInfo.createdBy || null,
          created: parsedInfo.created || null,
          files: parsedInfo.files || null,
          length: parsedInfo.length || null,
          magnet: this.parseTorrent.toMagnetURI(parsedInfo)
        };
      } catch (error) {
        console.error('Error parsing torrent information:', error);
        return null;
      }
    } else {
      return null;
    }
  }

  createMagnetFromFile(filePath) {
    if (this.parseTorrent) {
      try {
        const parsedInfo = this.parseTorrent(fs.readFileSync(filePath));
        return this.parseTorrent.toMagnetURI(parsedInfo);
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  }

  editMagnetLink(magnetLink, options) {
    if (this.parseTorrent) {
      try {
        const parsedInfo = this.parseTorrent(magnetLink);
        const editedInfo = { ...parsedInfo, ...options };
        return this.parseTorrent.toMagnetURI(editedInfo);
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  }

  createInterval(name, callback, intervalTime) {
    if (this.intervals[name] == undefined) {
      const interval = setInterval(callback, intervalTime);
      this.intervals[name] = interval;
      return interval;
    }
  }

  pauseInterval(name) {
    const interval = this.intervals[name];
    if (interval) {
      clearInterval(interval);
    }
  }

  removeInterval(name) {
    const interval = this.intervals[name];
    if (interval) {
      this.pauseInterval(name);
      delete this.intervals[name];
    }
  }

  newTable(namedb, tabla, data, dateif = true) {
    if (this.database) {
      const db = this.database;
      return new Promise((resolve, reject) => {

        try {
          db.createTable(namedb, tabla, data, dateif);
          resolve(true);
        } catch (error) {
          const setError = new Error(error.message);
          setError.title = error.title;
          reject(setError);
        }


      })


    } else {
      return null;
    }
  }

  whereDB(namedb, tableName, conditions) {
    if (this.database) {
      const db = this.database;
      return new Promise((resolve, reject) => {

        try {
          let all = db.where(namedb, tableName, conditions);
          resolve(all);
        } catch (error) {
          const setError = new Error(error.message);
          setError.title = error.title;
          reject(setError);
        }


      })


    } else {
      return null;
    }
  }

  getTable(namedb, tabla, data) {
    if (this.database) {
      const db = this.database;
      return new Promise((resolve, reject) => {

        try {
          let all = db.getAll(namedb, tabla, data);
          resolve(all);
        } catch (error) {
          const setError = new Error(error.message);
          setError.title = error.title;
          reject(setError);
        }


      })


    } else {
      return null;
    }
  }

  insertData(namedb, tabla, data, dateis) {
    if (this.database) {
      const db = this.database;
      return new Promise((resolve, reject) => {

        try {
          let all = db.add(namedb, tabla, data, dateis);
          resolve(all);
        } catch (error) {
          const setError = new Error(error.message);
          setError.title = error.title;
          reject(setError);
        }


      })


    } else {
      return null;
    }
  }

  updateData(namedb, tableName, columnValues, condition) {
    if (this.database) {
      const db = this.database;
      return new Promise((resolve, reject) => {

        try {
          let all = db.edit(namedb, tableName, columnValues, condition);
          resolve(all);
        } catch (error) {
          const setError = new Error(error.message);
          setError.title = error.title;
          reject(setError);
        }


      })


    } else {
      return null;
    }
  }

  deleteDataDB(namedb, tableName, conditions) {
    if (this.database) {
      const db = this.database;
      return new Promise((resolve, reject) => {

        try {
          let all = db.delete(namedb, tableName, conditions);
          resolve(all);
        } catch (error) {
          const setError = new Error(error.message);
          setError.title = error.title;
          reject(setError);
        }


      })


    } else {
      return null;
    }
  }

  clearSymbols(text, type) {
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
}

module.exports = UtilNode;
