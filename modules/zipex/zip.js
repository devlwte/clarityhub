const path = require("path");
const fs = require('fs');

const AdmZip = require('adm-zip');


class ZipEx {
  constructor() {
    this.dataex = {};
  }


  async extractZip({zipFilePath, extractPath}) {
    try {
      const zip = new AdmZip(zipFilePath);
      zip.extractAllTo(extractPath, true);
      return true;
    } catch (error) {
      console.error('Error al extraer archivos:', error);
      return false;
    }
  }

}

module.exports = ZipEx;