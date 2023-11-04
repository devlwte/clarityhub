// Importa la clase SavedTemp
const SavedTemp = require('../saved');

// Agregar datos de prueba a SavedTemp
SavedTemp.addSaved('nombre', ['Juan', 'Pedro']);
SavedTemp.addSaved('direcciones', [{ calle: '123 Main St', ciudad: 'Ciudad Ejemplo' }, { calle: '125 Main St', ciudad: 'Ciudad Ejemplo' }]);
SavedTemp.addSaved('amigos', [{ name: 'Ana' }, { name: 'Pedro' }]);
SavedTemp.addSaved('edad', [30, 50, 60]);

// Eliminar un valor simple
SavedTemp.removeValue('nombre', 'Juan');

// Eliminar un objeto de un arreglo
// SavedTemp.removeValue('direcciones', { calle: '123 Main St', ciudad: 'Ciudad Ejemplo' });

// Eliminar un objeto de un objeto
SavedTemp.removeValue('direcciones', { calle: '125 Main St' });

// Eliminar un valor simple
SavedTemp.removeValue('edad', 30);

// Obtener los datos actualizados
console.log(SavedTemp.getSaved('nombre')); // Debería ser undefined
console.log(SavedTemp.getSaved('direcciones')); // Debería ser un arreglo sin el objeto eliminado
console.log(SavedTemp.getSaved('amigos')); // Debería ser un arreglo sin el objeto eliminado
console.log(SavedTemp.getSaved('edad')); // Debería ser undefined

// // Importa la clase SavedTemp
// const SavedTemp = require('../saved');

// // Agregar datos
// SavedTemp.addSaved('nombre', 'Juan');
// SavedTemp.addSaved('edad', 30);
// SavedTemp.addSaved('amigos', ['Ana', 'Pedro']);

// // Obtener datos
// console.log(SavedTemp.getSaved('nombre')); // 'Juan'
// // console.log(SavedTemp.getSaved('amigos')); // ['Ana', 'Pedro']
// SavedTemp.addSaved('amigos', [{ name: 'Ana' }, { name: 'Juan' }, { name: 'Pedro' }]);

// // Verificar si una clave existe
// console.log(SavedTemp.hasKey('nombre')); // true
// console.log(SavedTemp.hasKey('ciudad')); // false

// // Contar elementos bajo una clave (en este caso, la clave 'amigos' es una lista)
// console.log(SavedTemp.count('amigos')); // 2

// // Agregar más datos bajo una clave existente
// // SavedTemp.addSaved('amigos', 'María');
// SavedTemp.addSaved('amigos', {name: "Pedro"});
// console.log(SavedTemp.getSaved('amigos')); // ['Ana', 'Pedro', 'María']

// // Eliminar un valor específico bajo una clave
// SavedTemp.removeValue('amigos', {name: "Juan"});
// console.log(SavedTemp.getSaved('amigos')); // ['Ana', 'María']

// // Eliminar una clave completa
// SavedTemp.removeSaved('edad');
// console.log(SavedTemp.getSaved('edad')); // false

// // Obtener todas las claves
// console.log(SavedTemp.getAllKeys()); // ['nombre', 'amigos']

// // Convertir los datos a un objeto
// const dataObject = SavedTemp.toObject();
// console.log(dataObject); // { nombre: 'Juan', amigos: ['Ana', 'María'] }

// // Convertir los datos a un arreglo
// const dataArray = SavedTemp.toArray();
// console.log(dataArray); // ['Juan', ['Ana', 'María']]
