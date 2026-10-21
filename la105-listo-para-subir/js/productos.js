/* ===== Productos (precios de la carta) =====
   Para cambiar una foto, guardá la imagen en la carpeta img/ y poné su nombre en "img". */
const productos = [
  // Hamburguesa + papas
  { id: 1, nombre: 'Simple + Papas', categoria: 'combos', precio: 6000, emoji: '🍔',
    desc: '1 hamburguesa simple + 1 porción de papas fritas.', img: 'img/simple-papas.jpg' },
  { id: 2, nombre: 'Completa + Papas', categoria: 'combos', precio: 7000, emoji: '🍔',
    desc: '1 hamburguesa completa + 1 porción de papas fritas.', img: '' },
  { id: 3, nombre: 'Doble Carne + Papas', categoria: 'combos', precio: 8000, emoji: '🍔',
    desc: '1 hamburguesa doble carne + 1 porción de papas fritas.', img: '' },
  // Solo burger
  { id: 4, nombre: 'Hamburguesa Simple', categoria: 'solo', precio: 4000, emoji: '🍔',
    desc: 'Hamburguesa simple, sola.', img: '' },
  { id: 5, nombre: 'Hamburguesa Completa', categoria: 'solo', precio: 5000, emoji: '🍔',
    desc: 'Hamburguesa completa, sola.', img: '' },
  { id: 6, nombre: 'Hamburguesa Doble Carne', categoria: 'solo', precio: 6000, emoji: '🍔',
    desc: 'Hamburguesa con doble carne, sola.', img: '' },
  { id: 7, nombre: 'Papas Fritas', categoria: 'solo', precio: 3000, emoji: '🍟',
    desc: 'Porción de papas fritas.', img: '' },
  // Para compartir
  { id: 8, nombre: '2 Completas + Papas', categoria: 'compartir', precio: 12000, emoji: '🍔🍟',
    desc: '2 hamburguesas completas + 1 porción de papas.', img: '' },
  { id: 9, nombre: '4 Completas + 2 Papas', categoria: 'compartir', precio: 23000, emoji: '🍔🍟',
    desc: '4 hamburguesas completas + 2 porciones de papas.', img: '' },
  // Pizzas
  { id: 10, nombre: 'Pizza Muzzarella', categoria: 'pizzas', precio: 9000, emoji: '🍕',
    desc: 'Clásica pizza de muzzarella.', img: 'img/pizza-muzzarella.jpg' },
  { id: 11, nombre: 'Pizza Jamón y Queso', categoria: 'pizzas', precio: 12000, emoji: '🍕',
    desc: 'Muzzarella con jamón.', img: 'img/pizza-jamon.jpg' },
  { id: 12, nombre: 'Pizza Napolitana', categoria: 'pizzas', precio: 12000, emoji: '🍕',
    desc: 'Muzzarella con rodajas de tomate y albahaca.', img: 'img/pizza-napolitana.jpg' },
];
