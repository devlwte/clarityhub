const sqlite3 = require("sqlite3").verbose();
const moment = require('moment');
const axios = require('axios');
const path = require("path");
const fs = require("fs");


class Database {
    constructor() {
        this.dbs = {}
        this.isDownload = {};
    }

    async databaseNew(ruta) {
        await fs.promises.writeFile(ruta, '');
    }

    async newFile(ruta) {
        const rutaSqlite = ruta.replace(/\.lw$/g, '.sqlite');
        const read = fs.readFileSync(ruta);
        await fs.promises.writeFile(rutaSqlite, read);
        return rutaSqlite;
    }

    async db(namedatabase, ruta, initializer = null) {
        let db = this.dbs[namedatabase];

        if (!db) {

            this.dbs[namedatabase] = new sqlite3.Database(ruta);

            if (initializer === null) {
                return this.dbs[namedatabase];
            } else {
                return true;
            }
            
        } else {
            if (initializer === null) {
                return this.dbs[namedatabase];
            } else {
                return false;
            }
        }
    }


    async downloadDatabase(url, localPath, veryDownload = false) {
        if (veryDownload) {
            if (this.isDownload[veryDownload]) {
                return
            }
        }
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const data = Buffer.from(response.data, 'binary');
            await fs.promises.writeFile(localPath, data);
            if (veryDownload) {
                if (this.isDownload[veryDownload]) {
                    this.isDownload[veryDownload] = url;
                }
            }
            return true;
        } catch (err) {
            return false;
        }
    }

    dateNow() {
        const fechaActual = moment();
        const fechaFormateada = fechaActual.format('D [de] MMM. YYYY');

        return fechaFormateada;
    }

    async run(namedb, query, params = []) {
        const db = await this.db(namedb);
        return new Promise((resolve, reject) => {
            db.run(query, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }

    async get(namedb, query, params = []) {
        const db = await this.db(namedb);
        return new Promise((resolve, reject) => {
            db.get(query, params, function (err, row) {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(namedb, query, params = []) {
        const db = await this.db(namedb);
        return new Promise((resolve, reject) => {
            db.all(query, params, function (err, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async add(namedb, tableName, values, dateis = true) {
        if (dateis) {
            if (!values.datearticle) {
                values.datearticle = this.dateNow();
            }
        }

        try {
            const columns = Object.keys(values);
            const columnValues = Object.values(values);

            const query = `INSERT INTO ${tableName} (${columns.join(
                ", "
            )}) VALUES (${columns.map(() => "?").join(", ")});`;

            // const db = await this.db(namedb);
            await this.run(namedb, query, [...columnValues]);

            return true;
        } catch (err) {
            console.log(err);
            const setError = new Error("Se produjo un error al intentar de insertar un registros");
            setError.title = 'Error al Agregar Registros';
            throw setError;
        }
    }

    /*
      Example
      Insertar un registro en la tabla 'users' con fecha automática:
      await db.add('mydb', 'users', { name: 'John Doe', age: 25 });
      
      Insertar un registro en la tabla 'articles' con fecha proporcionada:
      await db.add('mydb', 'articles', { title: 'Sample Article', datearticle: '25 de jun., 2022' });
    */

    async getAll(namedb, tableName, data) {
        // orderBy, columnName
        let [orderBy, columnName] = data;
        try {
            let query = `SELECT * FROM ${tableName}`;
            let orderClause = "";

            if (orderBy === "az") {
                orderClause = `ORDER BY ${columnName} ASC`;
            } else if (orderBy === "za") {
                orderClause = `ORDER BY ${columnName} DESC`;
            } else if (orderBy === "id") {
                orderClause = "ORDER BY id ASC";
            } else if (orderBy === "desc") {
                orderClause = "ORDER BY id DESC";
            } else if (orderBy === "date") {
                orderClause = `ORDER BY strftime("%d de %b., %Y", ${columnName}) ASC`;
            } else if (orderBy === "desc-limit") {
                orderClause = `ORDER BY id DESC LIMIT ${columnName}`;
            }
            query += ` ${orderClause}`;
            // const db = await this.db(namedb);
            const results = await this.all(namedb, query);
            return results;
        } catch (err) {
            const setError = new Error("Se produjo un error al intentar obtener los registros");
            setError.title = 'Error al Obtener Registros';
            throw setError;
        }
    }

    /*
      Example
      Obtener todos los registros de la tabla 'users' ordenados por nombre de A a Z:
      const resultsAZ = await db.getAll('mydb', 'users', ['az', 'name']);
  
      Obtener todos los registros de la tabla 'articles' ordenados por fecha de forma descendente:
      const resultsByDateDesc = await db.getAll('mydb', 'articles', ['desc', 'datearticle']);
    */

    async edit(namedb, tableName, columnValues, condition) {
        try {
            const columns = Object.keys(columnValues);
            const values = Object.values(columnValues);

            const setValues = columns.map((column) => `${column} = ?`);
            const query = `UPDATE ${tableName} SET ${setValues.join(
                ", "
            )} WHERE ${condition}`;

            // const db = await this.db(namedb);
            await this.run(namedb, query, values);
            return true;
        } catch (err) {
            const setError = new Error("Se produjo un error al intentar actualizar los datos");
            setError.title = 'Error de actualización';
            throw setError;
        }
    }

    /*
      Example
      Actualizar un registro en la tabla 'users' donde id es igual a 1:
      const dataToUpdate = { name: 'Jane Smith', age: 30 };
      await db.edit('mydb', 'users', dataToUpdate, 'id = 1');
    */

    async where(namedb, tableName, conditions) {
        try {
            let query = `SELECT DISTINCT * FROM ${tableName} WHERE `;
            const columns = Object.keys(conditions);
            const columnValues = Object.values(conditions);
            const conditionsArr = columns.map((column) => `${column} = ?`);

            query += conditionsArr.join(" AND ");

            // const db = await this.db(namedb);
            const results = await this.all(namedb, query, columnValues);
            return results;
        } catch (err) {
            const setError = err.message;
            setError.title = 'Error';
            throw setError;
        }
    }

    /*
      Example
      Consultar registros en la tabla 'users' con múltiples condiciones:
      const results1 = await db.where('mydb', 'users', { age: 25, city: 'New York', name: 'John Doe' });
      const results2 = await db.where('mydb', 'users', { name: 'John Doe' });
  
      Imprimir los resultados:
      results1.forEach((row) => {
          console.log(row);
      });
  
      results2.forEach((row) => {
          console.log(row);
      });
    */

    async delete(namedb, tableName, conditions) {
        try {
            let query = `DELETE FROM ${tableName} WHERE `;
            const columns = Object.keys(conditions);
            const columnValues = Object.values(conditions);
            const conditionsArr = columns.map((column) => `${column} = ?`);

            query += conditionsArr.join(" AND ");

            // const db = await this.db(namedb);
            const result = await this.run(namedb, query, columnValues);
            return result.changes;
        } catch (err) {
            const setError = err.message;
            setError.title = 'Error';
            throw setError;
        }
    }

    /*
      Example
      Eliminar registros en la tabla 'users' que cumplan ciertas condiciones:
      const result1 = await db.delete('mydb', 'users', { age: 25, city: 'New York' });
  
      Eliminar un registro en la tabla 'users' donde id es igual a 1:
      const result2 = await db.delete('mydb', 'users', { id: 1 });
    */

    coefi(conjunto1, conjunto2) {
        const interseccion = new Set([...conjunto1].filter(element => conjunto2.has(element)));
        const union = new Set([...conjunto1, ...conjunto2]);
        const coeficienteJaccard = interseccion.size / union.size;
        return coeficienteJaccard;
    }

    similitud(texto1, texto2) {
        const conjunto1 = new Set(texto1.toLowerCase());
        const conjunto2 = new Set(texto2.toLowerCase());
        const coeficienteJaccard = this.coefi(conjunto1, conjunto2);
        return coeficienteJaccard;
    }

    async search(namedb, tableName, columns, keyword) {
        const resultsByID = await this.getAll(namedb, tableName, ['id']);
        const similitud = resultsByID.map((resultado) => ({
            resultado,
            similitud: this.similitud(keyword, resultado[columns[0]]), // Cambiado a columns[0]
        }));

        const similitudMinima = 0.7;
        let arts = similitud.filter((resultado) => resultado.similitud >= similitudMinima);
        arts.sort((a, b) => b.similitud - a.similitud);

        return arts;
    }

    /*
      Example
      Buscar registros en la tabla 'articles' que coincidan con una palabra clave:
      const searchColumns = ['title', 'description']; // Columnas en las que buscar
      const keyword = 'sample'; // Palabra clave a buscar
  
      const searchResults = await db.search('mydb', 'articles', searchColumns, keyword);
    */

    calculateMatchScore(result, keyword, columns) {
        // Puedes implementar tu propia lógica para calcular la puntuación de coincidencia aquí
        let score = 0;

        for (const col of columns) {
            const columnValue = result[col];
            const matchCount = (columnValue.match(new RegExp(keyword, 'gi')) || []).length;
            score += matchCount;
        }

        return score;
    }

    async getPrimaryKeyColumn(namedb, tableName) {
        const db = await this.db(namedb);
        return new Promise((resolve, reject) => {
            db.get(`PRAGMA table_info(${tableName})`, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.name);
                }
            });
        });
    }

    async getTableColumns(namedb, tableName) {
        const db = await this.db(namedb);
        return new Promise((resolve, reject) => {
            db.all(`PRAGMA table_info(${tableName})`, function (err, rows) {
                if (err) {
                    reject(err);
                } else {
                    const columns = rows.map((row) => row.name);
                    resolve(columns);
                }
            });
        });
    }

    async tableExists(namedb, tableName) {
        const db = await this.db(namedb);
        return new Promise((resolve, reject) => {
            db.get(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                [tableName],
                function (err, row) {
                    if (err) {
                        reject(err);
                    } else {
                        const tableExists = !!row;
                        resolve(tableExists);
                    }
                }
            );
        });
    }

    veryElmn(array, query) {
        return array.some(item => item.name === query);
    }

    async createTable(namedb, tableName, columns, dateif = true) {
        if (dateif) {
            if (!this.veryElmn(columns, "datearticle")) {
                columns.push({ name: 'datearticle', type: 'TEXT' });
            }
        }

        try {
            const tableExists = await this.tableExists(namedb, tableName);

            if (tableExists) {
                const existingColumns = await this.getTableColumns(namedb, tableName);

                for (const columnObj of columns) {
                    const columnName = columnObj.name;

                    if (!existingColumns.includes(columnName)) {
                        const columnType = columnObj.type;
                        const query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
                        // const db = await this.db(namedb);
                        await this.run(namedb, query);
                        // console.log(`Added column '${columnName}' to table '${tableName}'`);
                    }
                }
            } else {
                const columnDefs = columns
                    .map((columnObj) => `${columnObj.name} ${columnObj.type}`)
                    .join(", ");
                const query = `CREATE TABLE ${tableName} (${columnDefs})`;
                // const db = await this.db(namedb);
                await this.run(namedb, query);
                console.log(`Created table '${tableName}'`);

            }
        } catch (err) {
            const setError = new Error("Ocurrió un error al crear la tabla.");
            setError.title = 'Error al crear la tabla';
            throw setError;
        }
    }

    /*
      Example
      Crear una tabla 'users' con columnas específicas:
      await db.createTable('mydb', 'users', [
        { name: 'id', type: 'INTEGER PRIMARY KEY' },
        { name: 'name', type: 'TEXT' },
        { name: 'age', type: 'INTEGER' },
      ]);
    */

    async deleteColumns(namedb, tableName, columns = "*") {
        try {
            const primaryKeyColumn = await this.getPrimaryKeyColumn(namedb, tableName);
            const existingColumns = await this.getTableColumns(namedb, tableName);

            if (columns === "*") {
                // Eliminar todas las columnas, excepto la columna PRIMARY KEY
                const nonPrimaryKeyColumns = existingColumns.filter(
                    (column) => column !== primaryKeyColumn
                );

                for (const column of nonPrimaryKeyColumns) {
                    const query = `ALTER TABLE ${tableName} DROP COLUMN ${column}`;
                    // const db = await this.db(namedb);
                    await this.run(namedb, query);
                    console.log(`Deleted column '${column}' from table '${tableName}'`);
                }

                console.log(
                    `Deleted all non-primary key columns from table '${tableName}'`
                );
            } else {
                // Eliminar columnas específicas, excepto la columna PRIMARY KEY
                const columnsToDelete = existingColumns.filter(
                    (column) => column !== primaryKeyColumn && columns.includes(column)
                );

                for (const column of columnsToDelete) {
                    const query = `ALTER TABLE ${tableName} DROP COLUMN ${column}`;
                    // const db = await this.db(namedb);
                    await this.run(namedb, query);
                    console.log(`Deleted column '${column}' from table '${tableName}'`);
                }

                console.log(`Deleted specified columns from table '${tableName}'`);
            }
        } catch (err) {
            console.error(err);
        }
    }

    /*
        Example
        Eliminar todas las columnas, excepto la columna PRIMARY KEY, de la tabla 'users':
        await db.deleteColumns('mydb', 'users');
  
        Eliminar solo las columnas 'name' y 'age' de la tabla 'users':
        await db.deleteColumns('mydb', 'users', ['name', 'age']);
      */

    async getColumns(namedb, tableName) {
        // const db = await this.db(namedb);
        try {
            const query = `PRAGMA table_info(${tableName})`;
            const columns = await this.all(namedb, query);
            return columns.map((column) => column.name);
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    close(namedb) {
        this.db(namedb).close();
    }
}

module.exports = Database;
