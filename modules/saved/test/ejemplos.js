const SavedTemp = require('../saved'); // Asegúrate de reemplazar con la ubicación real de tu módulo

const saved = new SavedTemp();
// Ejemplos 1
// 1. Agregar datos usando addSaved
saved.addSaved('numbers', [1, 2, 3], false);
saved.addSaved('fruits', ['apple', 'banana', 'cherry'], false);
saved.addSaved('user', { username: 'example', email: 'example@example.com' }, false);

// 2. Actualizar datos usando updateSaved
saved.updateSaved('numbers', [4, 5, 6]);
saved.updateSaved('user', { email: 'new@example.com' });

// 3. Actualizar un valor específico en un objeto usando updateValue
saved.updateValue('user', { email: 'updated@example.com' });

// 4. Obtener datos con getSaved
console.log(saved.getSaved('fruits')); // Devuelve ['apple', 'banana', 'cherry']

// 5. Verificar si una clave existe usando hasKey
console.log(saved.hasKey('numbers')); // Devuelve true
console.log(saved.hasKey('colors')); // Devuelve false

// 6. Eliminar una clave completa con removeSaved
saved.removeSaved('numbers');

// 7. Eliminar un valor específico en una clave con removeValue
saved.removeValue('fruits', 'banana');

// 8. Contar elementos en una clave usando count
console.log(saved.count('user')); // Devuelve 1

// 9. Obtener todos los datos como un objeto usando toObject
const dataObject1 = saved.toObject();
console.log(dataObject1);

// 10. Obtener todos los datos como un arreglo usando toArray
const dataArray1 = saved.toArray();
console.log(dataArray1);

// 11. Verificar si el almacén está vacío usando isEmpty
console.log(saved.isEmpty()); // Devuelve false

// 12. Borrar todos los datos con clear
saved.clear();
console.log(saved.isEmpty()); // Devuelve true

// 13. Actualizar un valor específico en un arreglo usando updateValue
saved.addSaved('colors', ['red', 'green', 'blue'], false);
saved.updateValue('colors', 'green', 'yellow');

// 14. Actualizar un valor específico en un objeto dentro de un arreglo usando updateValue
saved.addSaved('users', [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], false);
saved.updateValue('users', { id: 2, name: 'Charlie' });

// 15. Eliminar un valor específico en un objeto dentro de un arreglo con removeValue
saved.removeValue('users', { id: 1, name: 'Alice' });

// 16. Comparar objetos usando isEqualOrPartialMatch
console.log(saved.isEqualOrPartialMatch({ name: 'John' }, { name: 'John', age: 30 })); // Devuelve true
console.log(saved.isEqualOrPartialMatch({ name: 'Alice' }, { name: 'Bob' })); // Devuelve false

// Ejemplos 2
// Ejemplo de uso de hasKey para verificar si una clave existe
console.log(saved.hasKey('numbers')); // Devuelve true
console.log(saved.hasKey('colors')); // Devuelve false

// Ejemplo de uso de clear para borrar todos los datos
saved.clear();
console.log(saved.isEmpty()); // Devuelve true

// Ejemplo de uso de count para contar la cantidad de elementos en una clave
saved.addSaved('fruits', ['apple', 'banana', 'cherry'], false);
console.log(saved.count('fruits')); // Devuelve 3

// Ejemplo de uso de toObject para obtener una copia de los datos como un objeto
const dataObject = saved.toObject();
console.log(dataObject); // Devuelve { fruits: ['apple', 'banana', 'cherry'] }

// Ejemplo de uso de toArray para obtener una copia de los datos como un arreglo
const dataArray = saved.toArray();
console.log(dataArray); // Devuelve [['apple', 'banana', 'cherry']]

// Ejemplo de uso de removeValue con objetos
saved.addSaved('users', [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], false);
saved.removeValue('users', { id: 2 });
console.log(saved.getSaved('users')); // Devuelve [{ id: 1, name: 'Alice' }]

// Ejemplo de uso de isEqualOrPartialMatch
console.log(saved.isEqualOrPartialMatch(42, 42)); // Devuelve true
console.log(saved.isEqualOrPartialMatch({ name: 'John' }, { name: 'John', age: 30 })); // Devuelve true
console.log(saved.isEqualOrPartialMatch({ name: 'Alice' }, { name: 'Bob' })); // Devuelve false

// Ejemplos 3
// Ejemplo de uso de addSaved para agregar datos
saved.addSaved('numbers', [1, 2, 3], false);
console.log(saved.getSaved('numbers')); // Devuelve [1, 2, 3]

// Ejemplo de uso de updateSaved para actualizar datos
saved.updateSaved('numbers', [4, 5, 6]);
console.log(saved.getSaved('numbers')); // Devuelve [4, 5, 6]

// Ejemplo de uso de updateValue para actualizar un valor específico en un objeto
saved.addSaved('data', { name: 'John', age: 30 }, false);
console.log(saved.getSaved('data')); // Devuelve { name: 'John', age: 30 }

saved.updateValue('data', { age: 31, city: 'New York' });
console.log(saved.getSaved('data')); // Devuelve { name: 'John', age: 31, city: 'New York' }

// Ejemplo de uso de removeSaved para eliminar una clave completa
saved.removeSaved('data');
console.log(saved.getSaved('data')); // Devuelve false

// Ejemplo de uso de removeValue para eliminar un valor específico en un objeto o arreglo
saved.addSaved('fruits', ['apple', 'banana', 'cherry'], false);
saved.removeValue('fruits', 'banana');
console.log(saved.getSaved('fruits')); // Devuelve ['apple', 'cherry']

// Otros ejemplos de uso
saved.addSaved('user', { username: 'example', email: 'example@example.com' }, false);
console.log(saved.count('user')); // Devuelve 1
console.log(saved.toArray()); // Devuelve [{ username: 'example', email: 'example@example.com' }]
console.log(saved.getAllKeys()); // Devuelve ['numbers', 'fruits', 'user']

// Prueba de isEmpty y clear
console.log(saved.isEmpty()); // Devuelve false
saved.clear();
console.log(saved.isEmpty()); // Devuelve true