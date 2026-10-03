// ============================================================
//  DETALLE DE PRODUCTO (producto.html)
//  Conectado a la API Node.js: /api/productos/:id
// ============================================================

document.addEventListener("DOMContentLoaded", async function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const contenedor = document.getElementById("detalle-producto");

  if (!id) {
    contenedor.innerHTML =
      '<div class="alert alert-warning text-center">No se especificó un producto válido. ' +
      '<a href="index.html">Volver al catálogo</a>.</div>';
    return;
  }

  // Spinner de carga mientras responde Node.js
  contenedor.innerHTML =
    '<div class="text-center py-5">' +
    '  <div class="spinner-border text-info" role="status"></div>' +
    '  <p class="text-white mt-2">Cargando producto desde el servidor Node.js...</p>' +
    '</div>';

  let producto = null;

  try {
    const res = await fetch(`http://localhost:3000/api/productos/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.producto) {
        producto = data.producto;
      }
    }
  } catch (err) {
    console.warn("Error al consultar la API de Node.js, intentando contingencia local:", err);
  }

  // Fallback si no hubo respuesta del backend
  if (!producto && typeof buscarProducto === "function") {
    producto = buscarProducto(id);
  }

  if (!producto) {
    contenedor.innerHTML =
      '<div class="alert alert-danger text-center">Producto no encontrado. ' +
      '<a href="index.html">Volver al catálogo</a>.</div>';
    return;
  }

  document.title = producto.nombre + " - PC PE'";

  const enOferta = producto.precioOferta != null;

  // Bloque de precio
  let htmlPrecio;
  if (enOferta) {
    const descuento = Math.round(
      (1 - producto.precioOferta / producto.precio) * 100
    );
    htmlPrecio =
      '<p class="fs-5 text-muted text-decoration-line-through mb-0">' +
      formatearPrecio(producto.precio) +
      "</p>" +
      '<p class="fs-2 fw-bold text-danger">' +
      formatearPrecio(producto.precioOferta) +
      '<span class="badge bg-danger ms-2 align-middle">-' +
      descuento +
      "%</span></p>";
  } else {
    htmlPrecio =
      '<p class="fs-2 fw-bold">' + formatearPrecio(producto.precio) + "</p>";
  }

  // Tabla de especificaciones
  let filasEspecificaciones = "";
  if (producto.especificaciones) {
    for (const clave in producto.especificaciones) {
      filasEspecificaciones +=
        "<tr><th scope=\"row\" class=\"w-25\">" +
        clave +
        "</th><td>" +
        producto.especificaciones[clave] +
        "</td></tr>";
    }
  }

  // Renderizar el detalle del producto con el componente oficial directo
  // Dentro de tu archivo js/producto.js
  let htmlVisual;

  if (producto.modelo3D) {
    // AQUÍ SE DECLARA EL COMPONENTE INTERACTIVO 3D
    htmlVisual = `
    <model-viewer 
      src="${producto.modelo3D}" 
      camera-controls 
      auto-rotate
      camera-orbit="0deg 75deg 105%"
      shadow-intensity="1" 
      style="width: 100%; height: 400px; background-color: #cbe0ec7f; border-radius: 12px; border: 1px solid #202c33;">
    </model-viewer>
    <p class="text-center text-muted small mt-2">✨ Usa el mouse para girar el producto en 360°</p>
  `;
  } else {
    // Si el producto no tiene modelo 3D, muestra la imagen normal
    htmlVisual = `
    <img 
      src="${producto.imagen}" 
      class="img-fluid border rounded p-3 bg-white" 
      alt="${producto.nombre}" 
      onerror="imagenNoDisponible(this)">
  `;
  }

  // Después de esto, tu código debe inyectar "htmlVisual" dentro del contenedor de la página
  // Por ejemplo: document.getElementById('detalle-producto').innerHTML = ...




  contenedor.innerHTML =
    '<div class="row g-4">' +
    '  <div class="col-md-5">' +
    htmlVisual + // Aquí inyectamos dinámicamente el 3D o la imagen estática
    "  </div>" +
    '  <div class="col-md-7">' +
    '    <span class="badge mb-2 categoria-producto">' +
    producto.categoria +
    "</span>" +
    "    <h2>" +
    producto.nombre +
    "</h2>" +
    '    <p class="text-muted">' +
    producto.descripcion +
    "</p>" +
    htmlPrecio +
    '    <div class="d-flex align-items-center gap-2 mb-3">' +
    '      <label for="cantidad" class="form-label mb-0">Cantidad:</label>' +
    '      <input type="number" id="cantidad" class="form-control" style="width:90px" value="1" min="1">' +
    "    </div>" +
    '    <button id="btn-agregar" class="btn btn-lg btn-agregar-carrito">Agregar al carrito</button>' +
    '    <a href="index.html" class="btn btn-link seguir-comprando">Seguir comprando</a>' +
    "  </div>" +
    "</div>" +
    (filasEspecificaciones ? '<h4 class="mt-5">Especificaciones técnicas</h4>' +
      '<table class="table table-striped table-bordered mt-3">' +
      "<tbody>" +
      filasEspecificaciones +
      "</tbody></table>" : "");

  // Botón agregar al carrito
  document.getElementById("btn-agregar").addEventListener("click", function () {
    const cantidad = parseInt(document.getElementById("cantidad").value, 10) || 1;
    agregarAlCarrito(producto.id, cantidad);
    mostrarAviso("Se agregaron " + cantidad + " unidad(es) al carrito.");
  });
});

// Aviso temporal (toast simple)
function mostrarAviso(mensaje) {
  const aviso = document.getElementById("aviso");
  if (!aviso) return;
  aviso.textContent = mensaje;
  aviso.classList.remove("d-none");
  setTimeout(function () {
    aviso.classList.add("d-none");
  }, 2500);
}
