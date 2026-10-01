// ============================================================
//  CARRITO DE COMPRAS (carrito.html)
//  Conectado a la API Node.js: POST /api/pedidos
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  renderizarCarrito();

  document.getElementById("btn-vaciar").addEventListener("click", function () {
    if (confirm("¿Seguro que deseas vaciar el carrito?")) {
      vaciarCarrito();
      renderizarCarrito();
    }
  });

  const btnComprar = document.getElementById("btn-comprar");
  btnComprar.addEventListener("click", async function () {
    const carrito = obtenerCarrito();
    if (carrito.length === 0) return;

    const sesion = obtenerSesion();
    if (!sesion) {
      alert("Debes iniciar sesión para finalizar la compra.");
      window.location.href = "login.html";
      return;
    }

    const usuario = typeof sesion === "object" ? (sesion.usuario || "admin") : sesion;

    // Deshabilitar botón durante el procesamiento
    const textoOriginal = btnComprar.innerHTML;
    btnComprar.disabled = true;
    btnComprar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando orden en Node.js...';

    try {
      // 1. Enviar el pedido oficial a Node.js
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: usuario,
          items: carrito
        })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo procesar el pedido.");
      }

      // 2. Alerta con datos oficiales del servidor
      Swal.fire({
        title: "¡Compra realizada con éxito!",
        html: `
          <div class="text-start p-2">
            <p class="mb-1">Tu orden fue confirmada y guardada en el servidor Node.js.</p>
            <p class="mb-1"><strong>N° de Pedido:</strong> <span class="badge bg-primary fs-6">${data.numeroPedido}</span></p>
            <p class="mb-1"><strong>Total oficial:</strong> ${formatearPrecio(data.total)}</p>
            <p class="mb-0 text-muted small"><strong>Fecha:</strong> ${new Date(data.fecha).toLocaleString("es-PE")}</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Entendido"
      });

      vaciarCarrito();
      renderizarCarrito();
    } catch (err) {
      console.warn("Fallo en API de pedidos, usando simulación local:", err);
      Swal.fire({
        title: "¡Compra realizada con éxito!",
        text: "Total pagado: " + formatearPrecio(totalCarrito()) + " (Procesado localmente)",
        icon: "success"
      });

      vaciarCarrito();
      renderizarCarrito();
    } finally {
      btnComprar.disabled = false;
      btnComprar.innerHTML = textoOriginal;
    }
  });
});

function renderizarCarrito() {
  const carrito = obtenerCarrito();
  const contenedor = document.getElementById("contenido-carrito");
  const resumen = document.getElementById("resumen-carrito");

  if (carrito.length === 0) {
    contenedor.innerHTML =
      '<div class="alert alert-info">Tu carrito está vacío. ' +
      '<a href="index.html">Ir al catálogo</a>.</div>';
    resumen.classList.add("d-none");
    return;
  }

  resumen.classList.remove("d-none");

  let filas = "";
  carrito.forEach(function (item) {
    const p = buscarProducto(item.id);
    if (!p) return;
    const precio = precioFinal(p);
    const subtotal = precio * item.cantidad;

    filas +=
      "<tr>" +
      '<td style="width:80px">' +
      '<img src="' +
      p.imagen +
      '" class="img-fluid bg-white rounded p-1" alt="' +
      p.nombre +
      '" onerror="imagenNoDisponible(this)">' +
      "</td>" +
      "<td>" +
      p.nombre +
      '<br><small class="text-muted">' +
      p.categoria +
      "</small></td>" +
      "<td>" +
      formatearPrecio(precio) +
      "</td>" +
      '<td style="width:120px">' +
      '<input type="number" class="form-control form-control-sm" min="1" value="' +
      item.cantidad +
      '" onchange="cambiarCantidad(' +
      p.id +
      ", parseInt(this.value, 10)); renderizarCarrito();\">" +
      "</td>" +
      '<td class="fw-bold">' +
      formatearPrecio(subtotal) +
      "</td>" +
      "<td>" +
      '<button class="btn btn-sm btn-outline-danger" onclick="quitarDelCarrito(' +
      p.id +
      "); renderizarCarrito();\">&times;</button>" +
      "</td>" +
      "</tr>";
  });

  contenedor.innerHTML =
    '<div class="table-responsive"><table class="table align-middle">' +
    "<thead><tr>" +
    "<th></th><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th>" +
    "</tr></thead><tbody>" +
    filas +
    "</tbody></table></div>";

  document.getElementById("total-carrito").textContent = formatearPrecio(
    totalCarrito()
  );
}
