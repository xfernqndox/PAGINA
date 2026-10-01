// ============================================================
//  UTILIDADES COMPARTIDAS (Soporte Node.js + LocalStorage)
//  Funciones que se usan en varias páginas de la tienda
// ============================================================

// Ruta de la imagen que se muestra cuando no se encuentra la del producto
const IMG_NO_DISPONIBLE = "img/no-disponible.svg";

// Claves usadas en localStorage
const CLAVE_CARRITO = "impacta_carrito";
const CLAVE_SESION = "impacta_sesion";

// Caché en memoria para productos cargados desde la API Node.js
let PRODUCTOS_API_CACHE = [];

function sincronizarProductosCache(lista) {
  if (Array.isArray(lista) && lista.length > 0) {
    PRODUCTOS_API_CACHE = lista;
  }
}

// Cargar catálogo desde la API al iniciar si aún no está en caché
async function precargarProductosDesdeAPI() {
  if (PRODUCTOS_API_CACHE.length === 0) {
    try {
      const res = await fetch("/api/productos");
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.productos)) {
          PRODUCTOS_API_CACHE = data.productos;
        }
      }
    } catch (e) {
      // Si falla la red, el fallback usará PRODUCTOS de productos.js
    }
  }
}

// Ejecutar precarga silenciosa
if (typeof window !== "undefined") {
  precargarProductosDesdeAPI();
}

// ------------------------------------------------------------
//  Formato de precios: 1234.5  ->  "S/ 1,234.50"
// ------------------------------------------------------------
function formatearPrecio(monto) {
  return "S/ " + Number(monto).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ------------------------------------------------------------
//  Manejo de imagen faltante
//  Uso en el HTML: <img ... onerror="imagenNoDisponible(this)">
// ------------------------------------------------------------
function imagenNoDisponible(img) {
  img.onerror = null; // evita bucle si tampoco existe la de reemplazo
  img.src = IMG_NO_DISPONIBLE;
  img.classList.add("img-no-disponible");
}

// ------------------------------------------------------------
//  Buscar un producto por su id (consulta primero la API de Node.js)
// ------------------------------------------------------------
function buscarProducto(id) {
  const numId = Number(id);
  if (PRODUCTOS_API_CACHE.length > 0) {
    const encontrado = PRODUCTOS_API_CACHE.find((p) => p.id === numId);
    if (encontrado) return encontrado;
  }
  if (typeof PRODUCTOS !== "undefined" && Array.isArray(PRODUCTOS)) {
    return PRODUCTOS.find((p) => p.id === numId);
  }
  return null;
}

// ------------------------------------------------------------
//  Precio final (aplica oferta si existe)
// ------------------------------------------------------------
function precioFinal(producto) {
  return producto.precioOferta != null ? producto.precioOferta : producto.precio;
}

// ------------------------------------------------------------
//  CARRITO (se guarda en localStorage como lista de objetos)
//  Estructura: [{ id: 1, cantidad: 2 }, ...]
// ------------------------------------------------------------
function obtenerCarrito() {
  const datos = localStorage.getItem(CLAVE_CARRITO);
  return datos ? JSON.parse(datos) : [];
}

function guardarCarrito(carrito) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  actualizarContadorCarrito();
}

function agregarAlCarrito(id, cantidad) {
  cantidad = cantidad || 1;
  const carrito = obtenerCarrito();
  const item = carrito.find(function (i) {
    return i.id === Number(id);
  });

  if (item) {
    item.cantidad += cantidad;
  } else {
    carrito.push({ id: Number(id), cantidad: cantidad });
  }

  guardarCarrito(carrito);
  mostrarNotificacionToast("Producto añadido al carrito 🛒");
}

function cambiarCantidad(id, cantidad) {
  const carrito = obtenerCarrito();
  const item = carrito.find(function (i) {
    return i.id === Number(id);
  });
  if (!item) return;

  item.cantidad = cantidad;
  if (item.cantidad <= 0) {
    quitarDelCarrito(id);
  } else {
    guardarCarrito(carrito);
  }
}

function quitarDelCarrito(id) {
  let carrito = obtenerCarrito();
  carrito = carrito.filter(function (i) {
    return i.id !== Number(id);
  });
  guardarCarrito(carrito);
}

function vaciarCarrito() {
  localStorage.removeItem(CLAVE_CARRITO);
  actualizarContadorCarrito();
}

// Cantidad total de unidades en el carrito
function contarUnidadesCarrito() {
  return obtenerCarrito().reduce(function (total, i) {
    return total + i.cantidad;
  }, 0);
}

// Monto total del carrito
function totalCarrito() {
  return obtenerCarrito().reduce(function (total, i) {
    const producto = buscarProducto(i.id);
    if (!producto) return total;
    return total + precioFinal(producto) * i.cantidad;
  }, 0);
}

// Actualiza el número que aparece en el ícono del carrito (navbar)
function actualizarContadorCarrito() {
  const contador = document.getElementById("contador-carrito");
  if (contador) {
    contador.textContent = contarUnidadesCarrito();
  }
}

// Toast de notificación ligero
function mostrarNotificacionToast(texto) {
  const existente = document.getElementById("toast-flotante");
  if (existente) existente.remove();

  const toast = document.createElement("div");
  toast.id = "toast-flotante";
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.zIndex = "9999";
  toast.style.backgroundColor = "#0d6efd";
  toast.style.color = "#fff";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  toast.style.fontWeight = "bold";
  toast.style.transition = "opacity 0.3s ease";
  toast.textContent = texto;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// ------------------------------------------------------------
//  SESIÓN DE USUARIO
// ------------------------------------------------------------
function obtenerSesion() {
  const datos = localStorage.getItem(CLAVE_SESION);
  return datos ? JSON.parse(datos) : null;
}

function iniciarSesion(usuarioData) {
  const data = typeof usuarioData === "string" ? { usuario: usuarioData } : usuarioData;
  localStorage.setItem(CLAVE_SESION, JSON.stringify(data));
}

function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}
