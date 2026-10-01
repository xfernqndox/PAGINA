// ============================================================
//  CATÁLOGO Y FILTROS (Conectado a API Node.js / Express)
//  Usado en index.html (catálogo completo con búsqueda)
//  y en ofertas.html (solo productos con oferta).
// ============================================================

// ------------------------------------------------------------
//  Genera el HTML de una tarjeta de producto
// ------------------------------------------------------------
function tarjetaProducto(p) {
  const enOferta = p.precioOferta != null;

  // Bloque de precio (con o sin oferta)
  let htmlPrecio;
  if (enOferta) {
    const descuento = Math.round((1 - p.precioOferta / p.precio) * 100);
    htmlPrecio =
      '<span class="text-muted text-decoration-line-through me-2">' +
      formatearPrecio(p.precio) +
      "</span>" +
      '<span class="fw-bold text-danger">' +
      formatearPrecio(p.precioOferta) +
      "</span>" +
      '<span class="badge bg-danger ms-2">-' +
      descuento +
      "%</span>";
  } else {
    htmlPrecio = '<span class="fw-bold">' + formatearPrecio(p.precio) + "</span>";
  }

  return (
    '<div class="col-sm-6 col-lg-4 col-xl-3">' +
    '  <div class="card h-100 shadow-sm">' +
    '    <img src="' +
    p.imagen +
    '" class="card-img-top p-3" alt="' +
    p.nombre +
    '" onerror="imagenNoDisponible(this)">' +
    '    <div class="card-body d-flex flex-column">' +
    '      <span class="badge bg-secondary align-self-start mb-2">' +
    p.categoria +
    "</span>" +
    '      <h6 class="card-title">' +
    p.nombre +
    "</h6>" +
    '      <p class="card-text small text-muted flex-grow-1">' +
    p.descripcion +
    "</p>" +
    '      <div class="mb-2">' +
    htmlPrecio +
    "</div>" +
    '      <div class="d-grid gap-2">' +
    '        <a href="producto.html?id=' +
    p.id +
    '" class="btn btn-outline-primary btn-sm">Ver detalle</a>' +
    '        <button class="btn btn-primary btn-sm" onclick="agregarAlCarrito(' +
    p.id +
    ')">Agregar al carrito</button>' +
    "      </div>" +
    "    </div>" +
    "  </div>" +
    "</div>"
  );
}

// ------------------------------------------------------------
//  Pinta una lista de productos dentro de un contenedor
// ------------------------------------------------------------
function mostrarProductos(lista, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  if (lista.length === 0) {
    contenedor.innerHTML =
      '<div class="col-12"><div class="alert alert-warning text-center">' +
      "No se encontraron productos en el servidor.</div></div>";
    return;
  }

  contenedor.innerHTML = lista.map(tarjetaProducto).join("");
}

// ============================================================
//  PÁGINA: CATÁLOGO (index.html)
// ============================================================
async function initCatalogo() {
  const inputBuscar = document.getElementById("buscar");
  const selectCategoria = document.getElementById("filtro-categoria");
  const selectOrden = document.getElementById("filtro-orden");
  const soloOfertas = document.getElementById("filtro-ofertas");
  const contadorResultados = document.getElementById("contador-resultados");
  const contenedor = document.getElementById("lista-productos");

  // 1. Cargar las categorías dinámicamente desde el backend Node.js
  try {
    const resCategorias = await fetch("/api/categorias");
    if (resCategorias.ok) {
      const dataCat = await resCategorias.json();
      if (dataCat.ok && Array.isArray(dataCat.categorias)) {
        // Limpiar opciones previas excepto "Todas"
        selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
        dataCat.categorias.forEach(function (cat) {
          const opcion = document.createElement("option");
          opcion.value = cat;
          opcion.textContent = cat;
          selectCategoria.appendChild(opcion);
        });
      }
    }
  } catch (e) {
    console.warn("No se pudo cargar categorías desde Node.js, usando respaldo si existe.", e);
  }

  // 2. Función para consultar productos a la API de Node.js
  let debounceTimeout = null;

  async function consultarProductosAPI() {
    const texto = inputBuscar.value.trim();
    const categoria = selectCategoria.value;
    const orden = selectOrden.value;
    const ofertas = soloOfertas.checked;

    // Mostrar spinner de carga
    if (contenedor) {
      contenedor.innerHTML =
        '<div class="col-12 text-center py-5">' +
        '  <div class="spinner-border text-info" role="status"></div>' +
        '  <p class="text-white small mt-2">Consultando catálogo en Node.js...</p>' +
        '</div>';
    }

    const params = new URLSearchParams();
    if (texto) params.append("buscar", texto);
    if (categoria) params.append("categoria", categoria);
    if (orden) params.append("orden", orden);
    if (ofertas) params.append("ofertas", "true");

    try {
      const res = await fetch("/api/productos?" + params.toString());
      if (!res.ok) throw new Error("Error en la respuesta del servidor");

      const data = await res.json();
      if (data.ok && Array.isArray(data.productos)) {
        // Actualizar cache global en utils si existe
        if (typeof sincronizarProductosCache === "function") {
          sincronizarProductosCache(data.productos);
        }

        mostrarProductos(data.productos, "lista-productos");
        if (contadorResultados) {
          contadorResultados.textContent =
            data.productos.length +
            (data.productos.length === 1 ? " producto" : " productos");
        }
      } else {
        throw new Error("Formato de respuesta no válido");
      }
    } catch (err) {
      console.error("Error al obtener productos desde Node.js:", err);

      // Fallback de contingencia: si el servidor no está disponible, usar variable PRODUCTOS si existe
      if (typeof PRODUCTOS !== "undefined" && Array.isArray(PRODUCTOS)) {
        console.warn("Utilizando catálogo local de contingencia.");
        let resultado = PRODUCTOS.filter(function (p) {
          const coincideTexto =
            !texto ||
            p.nombre.toLowerCase().includes(texto.toLowerCase()) ||
            p.descripcion.toLowerCase().includes(texto.toLowerCase()) ||
            p.categoria.toLowerCase().includes(texto.toLowerCase());
          const coincideCategoria = categoria === "" || p.categoria === categoria;
          const coincideOferta = !ofertas || p.precioOferta != null;
          return coincideTexto && coincideCategoria && coincideOferta;
        });

        if (orden === "precio-asc") {
          resultado.sort((a, b) => precioFinal(a) - precioFinal(b));
        } else if (orden === "precio-desc") {
          resultado.sort((a, b) => precioFinal(b) - precioFinal(a));
        } else if (orden === "nombre") {
          resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
        }

        mostrarProductos(resultado, "lista-productos");
        if (contadorResultados) {
          contadorResultados.textContent =
            resultado.length + (resultado.length === 1 ? " producto" : " productos");
        }
      } else {
        contenedor.innerHTML =
          '<div class="col-12"><div class="alert alert-danger text-center">' +
          'No se pudo conectar con el servidor Node.js. Asegúrate de ejecutar <code>npm start</code>.' +
          '</div></div>';
      }
    }
  }

  function aplicarFiltrosConDebounce() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(consultarProductosAPI, 200);
  }

  // Escuchar cambios en los filtros del catálogo
  inputBuscar.addEventListener("input", aplicarFiltrosConDebounce);
  selectCategoria.addEventListener("change", consultarProductosAPI);
  selectOrden.addEventListener("change", consultarProductosAPI);
  soloOfertas.addEventListener("change", consultarProductosAPI);

  // Carga inicial
  consultarProductosAPI();
}

// ============================================================
//  PÁGINA: OFERTAS (ofertas.html)
// ============================================================
async function initOfertas() {
  const contenedor = document.getElementById("lista-ofertas");
  if (contenedor) {
    contenedor.innerHTML =
      '<div class="col-12 text-center py-5">' +
      '  <div class="spinner-border text-danger" role="status"></div>' +
      '  <p class="text-white small mt-2">Cargando ofertas desde el servidor...</p>' +
      '</div>';
  }

  try {
    const res = await fetch("/api/productos?ofertas=true");
    const data = await res.json();
    if (data.ok && Array.isArray(data.productos)) {
      mostrarProductos(data.productos, "lista-ofertas");
    } else {
      throw new Error("No se recibieron ofertas válidas");
    }
  } catch (e) {
    console.warn("Fallo al conectar con la API de ofertas, usando contingencia local:", e);
    if (typeof PRODUCTOS !== "undefined") {
      const ofertas = PRODUCTOS.filter((p) => p.precioOferta != null);
      mostrarProductos(ofertas, "lista-ofertas");
    }
  }
}
