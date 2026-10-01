const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para procesar JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware CORS para permitir peticiones desde cualquier origen (ej. Live Server o directo)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Helpers para lectura y escritura de archivos JSON
const DATA_DIR = path.join(__dirname, 'data');

function leerJSON(archivo) {
  try {
    const ruta = path.join(DATA_DIR, archivo);
    if (!fs.existsSync(ruta)) return [];
    const contenido = fs.readFileSync(ruta, 'utf-8');
    return JSON.parse(contenido);
  } catch (error) {
    console.error(`Error leyendo ${archivo}:`, error);
    return [];
  }
}

function escribirJSON(archivo, datos) {
  try {
    const ruta = path.join(DATA_DIR, archivo);
    fs.writeFileSync(ruta, JSON.stringify(datos, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error escribiendo en ${archivo}:`, error);
    return false;
  }
}

function calcularPrecioFinal(producto) {
  return producto.precioOferta != null ? producto.precioOferta : producto.precio;
}

// ============================================================
//  RUTAS DE LA API
// ============================================================

// ------------------------------------------------------------
// 1. PRODUCTOS Y CATÁLOGO
// ------------------------------------------------------------

// GET /api/productos - Obtener productos con filtros, búsqueda y ordenamiento
app.get('/api/productos', (req, res) => {
  const { buscar, categoria, ofertas, orden } = req.query;
  let productos = leerJSON('productos.json');

  // Filtrado por texto (nombre, descripción, categoría)
  if (buscar && buscar.trim() !== '') {
    const texto = buscar.trim().toLowerCase();
    productos = productos.filter((p) =>
      p.nombre.toLowerCase().includes(texto) ||
      p.descripcion.toLowerCase().includes(texto) ||
      p.categoria.toLowerCase().includes(texto)
    );
  }

  // Filtrado por categoría
  if (categoria && categoria.trim() !== '') {
    productos = productos.filter(
      (p) => p.categoria.toLowerCase() === categoria.trim().toLowerCase()
    );
  }

  // Filtrado por ofertas
  if (ofertas === 'true' || ofertas === '1') {
    productos = productos.filter((p) => p.precioOferta != null);
  }

  // Ordenamiento
  if (orden === 'precio-asc') {
    productos.sort((a, b) => calcularPrecioFinal(a) - calcularPrecioFinal(b));
  } else if (orden === 'precio-desc') {
    productos.sort((a, b) => calcularPrecioFinal(b) - calcularPrecioFinal(a));
  } else if (orden === 'nombre') {
    productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  res.json({
    ok: true,
    total: productos.length,
    productos
  });
});

// GET /api/productos/:id - Obtener un producto por ID
app.get('/api/productos/:id', (req, res) => {
  const id = Number(req.params.id);
  const productos = leerJSON('productos.json');
  const producto = productos.find((p) => p.id === id);

  if (!producto) {
    return res.status(404).json({
      ok: false,
      error: 'Producto no encontrado'
    });
  }

  res.json({
    ok: true,
    producto
  });
});

// GET /api/categorias - Obtener lista de categorías únicas
app.get('/api/categorias', (req, res) => {
  const productos = leerJSON('productos.json');
  const categorias = [...new Set(productos.map((p) => p.categoria))].sort();
  res.json({
    ok: true,
    categorias
  });
});

// ------------------------------------------------------------
// 2. LIBRO DE RECLAMACIONES
// ------------------------------------------------------------

// POST /api/reclamaciones - Registrar una nueva queja o reclamo
app.post('/api/reclamaciones', (req, res) => {
  const { nombre, dni, email, tipo, detalle } = req.body;
  const errores = [];

  if (!nombre || nombre.trim().length < 3) {
    errores.push('El nombre debe tener al menos 3 caracteres.');
  }
  if (!dni || !/^\d{8}$/.test(dni.trim())) {
    errores.push('El DNI debe tener exactamente 8 dígitos.');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errores.push('Ingresa un correo electrónico válido.');
  }
  if (!tipo || (tipo !== 'Reclamo' && tipo !== 'Queja')) {
    errores.push('Selecciona el tipo de solicitud (Reclamo o Queja).');
  }
  if (!detalle || detalle.trim().length < 10) {
    errores.push('El detalle debe tener al menos 10 caracteres.');
  }

  if (errores.length > 0) {
    return res.status(400).json({ ok: false, errores });
  }

  const reclamaciones = leerJSON('reclamaciones.json');
  const codigo = 'REC-' + Date.now().toString().slice(-6);
  const nuevoReclamo = {
    id: reclamaciones.length + 1,
    codigo,
    nombre: nombre.trim(),
    dni: dni.trim(),
    email: email.trim(),
    tipo,
    detalle: detalle.trim(),
    fecha: new Date().toISOString(),
    estado: 'Pendiente de atención'
  };

  reclamaciones.push(nuevoReclamo);
  escribirJSON('reclamaciones.json', reclamaciones);

  res.status(201).json({
    ok: true,
    codigo,
    mensaje: 'Reclamo registrado exitosamente en el servidor.',
    fecha: nuevoReclamo.fecha
  });
});

// GET /api/reclamaciones/:codigo - Consultar estado de reclamo
app.get('/api/reclamaciones/:codigo', (req, res) => {
  const reclamaciones = leerJSON('reclamaciones.json');
  const reclamo = reclamaciones.find(
    (r) => r.codigo.toUpperCase() === req.params.codigo.toUpperCase()
  );

  if (!reclamo) {
    return res.status(404).json({ ok: false, error: 'Reclamo no encontrado.' });
  }

  res.json({ ok: true, reclamo });
});

// ------------------------------------------------------------
// 3. ASESORES Y CONTACTO
// ------------------------------------------------------------

// GET /api/asesores - Obtener lista de asesores
app.get('/api/asesores', (req, res) => {
  const asesores = leerJSON('asesores.json');
  res.json({ ok: true, asesores });
});

// POST /api/contacto - Enviar mensaje de contacto
app.post('/api/contacto', (req, res) => {
  const { nombre, email, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({
      ok: false,
      error: 'Todos los campos son obligatorios.'
    });
  }

  const mensajes = leerJSON('mensajes_contacto.json');
  const nuevoMensaje = {
    id: mensajes.length + 1,
    nombre: nombre.trim(),
    email: email.trim(),
    mensaje: mensaje.trim(),
    fecha: new Date().toISOString()
  };

  mensajes.push(nuevoMensaje);
  escribirJSON('mensajes_contacto.json', mensajes);

  res.status(201).json({
    ok: true,
    mensaje: `¡Gracias ${nombre}! Tu mensaje ha sido recibido por el servidor.`
  });
});

// ------------------------------------------------------------
// 4. AUTENTICACIÓN (LOGIN)
// ------------------------------------------------------------

// POST /api/auth/login - Autenticar usuario
app.post('/api/auth/login', (req, res) => {
  const { usuario, clave } = req.body;

  if (!usuario || !clave) {
    return res.status(400).json({
      ok: false,
      error: 'Usuario y contraseña requeridos.'
    });
  }

  const usuarios = leerJSON('usuarios.json');
  const usuarioEncontrado = usuarios.find(
    (u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase() && u.clave === clave
  );

  if (!usuarioEncontrado) {
    return res.status(401).json({
      ok: false,
      error: 'Usuario o contraseña incorrectos.'
    });
  }

  res.json({
    ok: true,
    usuario: {
      id: usuarioEncontrado.id,
      usuario: usuarioEncontrado.usuario,
      nombre: usuarioEncontrado.nombre,
      rol: usuarioEncontrado.rol
    },
    token: `token_${Date.now()}_${usuarioEncontrado.id}`
  });
});

// ------------------------------------------------------------
// 5. CARRITO Y PEDIDOS (CHECKOUT)
// ------------------------------------------------------------

// POST /api/pedidos - Procesar compra oficial en el servidor
app.post('/api/pedidos', (req, res) => {
  const { usuario, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'El carrito no contiene productos.'
    });
  }

  const productos = leerJSON('productos.json');
  const itemsVerificados = [];
  let totalCalculado = 0;

  for (const item of items) {
    const prod = productos.find((p) => p.id === Number(item.id));
    if (!prod) {
      return res.status(400).json({
        ok: false,
        error: `El producto con ID ${item.id} no existe.`
      });
    }

    const cantidad = Math.max(1, Number(item.cantidad) || 1);
    const precioUnitario = calcularPrecioFinal(prod);
    const subtotal = precioUnitario * cantidad;
    totalCalculado += subtotal;

    itemsVerificados.push({
      id: prod.id,
      nombre: prod.nombre,
      precioUnitario,
      cantidad,
      subtotal
    });
  }

  const pedidos = leerJSON('pedidos.json');
  const numeroPedido = 'PED-' + Date.now().toString().slice(-6);

  const nuevoPedido = {
    id: pedidos.length + 1,
    numeroPedido,
    usuario: usuario || 'invitado',
    items: itemsVerificados,
    total: totalCalculado,
    fecha: new Date().toISOString(),
    estado: 'Completado'
  };

  pedidos.push(nuevoPedido);
  escribirJSON('pedidos.json', pedidos);

  res.status(201).json({
    ok: true,
    numeroPedido,
    total: totalCalculado,
    mensaje: 'Pedido procesado y registrado con éxito.',
    fecha: nuevoPedido.fecha
  });
});

// GET /api/pedidos/:numero - Consultar pedido
app.get('/api/pedidos/:numero', (req, res) => {
  const pedidos = leerJSON('pedidos.json');
  const pedido = pedidos.find(
    (p) => p.numeroPedido.toUpperCase() === req.params.numero.toUpperCase()
  );

  if (!pedido) {
    return res.status(404).json({ ok: false, error: 'Pedido no encontrado.' });
  }

  res.json({ ok: true, pedido });
});

// ============================================================
//  ARCHIVOS ESTÁTICOS DEL FRONTEND
// ============================================================
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback para rutas no coincidentes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'Endpoint API no encontrado' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================================
//  ARRANQUE DEL SERVIDOR
// ============================================================
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`Servidor PC PE' activo en Node.js`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`API de Productos: http://localhost:${PORT}/api/productos`);
  console.log(`===============================================`);
});