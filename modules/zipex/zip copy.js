const path = require("path");
const fs = require("fs");
const util = require('util');
const extract = util.promisify(require('extract-zip'));

class ZipEx {
    constructor() {
        this.dataex = {};
    }

    async ex({zipFilePath, extractPath, nameid, fun = false}) {
        try {
            const zipSize = fs.statSync(zipFilePath).size;
            let extractedSize = 0;

            const extractOptions = {
                dir: extractPath,
                onEntry: (entry, zipfile) => {
                    const entrySize = entry.compressedSize;

                    extractedSize += entrySize;

                    // const percentage = ((extractedSize / zipSize) * 100).toFixed(0);
                    const percentage = ((zipfile.entriesRead / zipfile.entryCount) * 100).toFixed(0);
                    let dataset = {
                        fileName: entry.fileName,
                        extractedSize: extractedSize,
                        totalSize: zipSize,
                        progress: parseInt(percentage)
                    }
                    this.dataex[nameid] = dataset;

                    if (typeof fun === 'function'){
                        fun(zipfile, entry.fileName);
                    }
                    
                    
                }
                
            };

            extract(zipFilePath, extractOptions);


        } catch (err) {
            console.error('Error al extraer archivos:', err);
        }
    }

    delete(name){
        delete this.dataex[name];
    }
}

module.exports = ZipEx;