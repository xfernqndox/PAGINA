// ============================================================
//  SERVICIO POST VENTA & GARANTÍAS (postventa.js)
//  Conectado a la API Node.js:
//  - GET  /api/pedidos/:numero
//  - GET  /api/garantias/:codigo
//  - POST /api/garantias
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  inicializarTabsPostventa();
  inicializarRastreoPedido();
  inicializarConsultaGarantia();
  inicializarRegistroGarantia();
  comprobarParametrosURL();
  actualizarContadorCarrito();
});

// ------------------------------------------------------------
// 0. CONTROL DE PESTAÑAS GAMER / TECH
// ------------------------------------------------------------
function inicializarTabsPostventa() {
  const botonesTab = document.querySelectorAll(".postventa-tab-btn");
  const panelesTab = document.querySelectorAll(".postventa-tab-pane");

  botonesTab.forEach((btn) => {
    btn.addEventListener("click", function () {
      const targetId = this.getAttribute("data-tab");
      activarTab(targetId);
    });
  });
}

function activarTab(tabId) {
  const botonesTab = document.querySelectorAll(".postventa-tab-btn");
  const panelesTab = document.querySelectorAll(".postventa-tab-pane");

  botonesTab.forEach((b) => {
    if (b.getAttribute("data-tab") === tabId) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });

  panelesTab.forEach((p) => {
    if (p.id === tabId) {
      p.classList.remove("d-none");
    } else {
      p.classList.add("d-none");
    }
  });
}

// ------------------------------------------------------------
// 1. RASTREO Y SEGUIMIENTO DE PEDIDOS
// ------------------------------------------------------------
function inicializarRastreoPedido() {
  const formRastreo = document.getElementById("form-rastreo-pedido");
  const inputCodigo = document.getElementById("input-codigo-pedido");

  if (!formRastreo) return;

  formRastreo.addEventListener("submit", async function (e) {
    e.preventDefault();
    const codigo = inputCodigo.value.trim().toUpperCase();

    if (!codigo) {
      mostrarAlertaRastreo("Ingresa un código de pedido válido (ej: PED-413842).", "warning");
      return;
    }

    consultarPedido(codigo);
  });
}

async function consultarPedido(codigo) {
  const contenedorResultado = document.getElementById("resultado-rastreo-pedido");
  const btnRastrear = document.getElementById("btn-rastrear-submit");
  const textoOriginal = btnRastrear ? btnRastrear.innerHTML : "Rastrear";

  if (btnRastrear) {
    btnRastrear.disabled = true;
    btnRastrear.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Buscando...';
  }

  contenedorResultado.innerHTML = `
    <div class="card-postventa text-center py-4">
      <div class="spinner-border text-info" role="status"></div>
      <p class="text-muted mt-2 small">Consultando estado del pedido en el servidor...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/pedidos/${encodeURIComponent(codigo)}`);
    const data = await res.json();

    if (!res.ok || !data.ok || !data.pedido) {
      throw new Error(data.error || "Pedido no encontrado. Verifica el código e intenta nuevamente.");
    }

    renderizarDetallePedido(data.pedido);
  } catch (error) {
    contenedorResultado.innerHTML = `
      <div class="card-postventa border border-danger p-4">
        <div class="d-flex align-items-center gap-3">
          <i class="bi bi-exclamation-triangle-fill fs-2 text-danger"></i>
          <div>
            <h5 class="text-white mb-1">Pedido no encontrado</h5>
            <p class="text-muted small mb-2">${error.message}</p>
            <div>
              <span class="text-muted small">¿Quieres probar un pedido de prueba? </span>
              <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="probarPedidoEjemplo('PED-413842')">Probar PED-413842</button>
            </div>
          </div>
        </div>
      </div>
    `;
  } finally {
    if (btnRastrear) {
      btnRastrear.disabled = false;
      btnRastrear.innerHTML = textoOriginal;
    }
  }
}

function probarPedidoEjemplo(codigo) {
  const input = document.getElementById("input-codigo-pedido");
  if (input) {
    input.value = codigo;
    consultarPedido(codigo);
  }
}

function renderizarDetallePedido(pedido) {
  const contenedor = document.getElementById("resultado-rastreo-pedido");

  // Normalizar el estado
  const estado = pedido.estado || "Completado";
  let pasoActivo = 4;
  let porcentajeBarra = "100%";
  let badgeColor = "bg-success";

  const estadoMin = estado.toLowerCase();
  if (estadoMin.includes("recibido") || estadoMin.includes("pendiente")) {
    pasoActivo = 1;
    porcentajeBarra = "15%";
    badgeColor = "bg-warning text-dark";
  } else if (estadoMin.includes("prepar") || estadoMin.includes("embal")) {
    pasoActivo = 2;
    porcentajeBarra = "45%";
    badgeColor = "bg-info text-dark";
  } else if (estadoMin.includes("camino") || estadoMin.includes("trans") || estadoMin.includes("despach")) {
    pasoActivo = 3;
    porcentajeBarra = "75%";
    badgeColor = "bg-primary";
  } else {
    pasoActivo = 4;
    porcentajeBarra = "100%";
    badgeColor = "bg-success";
  }

  const fechaFormateada = pedido.fecha ? new Date(pedido.fecha).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }) : "Reciente";

  // Generar lista de productos
  let itemsHTML = "";
  if (Array.isArray(pedido.items) && pedido.items.length > 0) {
    itemsHTML = pedido.items.map((item) => `
      <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-cpu-fill text-info"></i>
          <div>
            <div class="fw-semibold text-light">${item.nombre}</div>
            <small class="text-muted">Cantidad: ${item.cantidad} × ${formatearPrecio(item.precioUnitario)}</small>
          </div>
        </div>
        <div class="fw-bold text-cyan">${formatearPrecio(item.subtotal || (item.precioUnitario * item.cantidad))}</div>
      </div>
    `).join("");
  } else {
    itemsHTML = '<p class="text-muted small">Detalle registrado en el sistema central.</p>';
  }

  contenedor.innerHTML = `
    <div class="card-postventa p-4">
      <div class="d-flex flex-wrap justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4 gap-2">
        <div>
          <span class="text-muted small text-uppercase">CÓDIGO DE SEGUIMIENTO OFICIAL</span>
          <h3 class="mb-0 text-cyan fw-bold">${pedido.numeroPedido}</h3>
        </div>
        <div class="text-end">
          <span class="badge ${badgeColor} fs-6 px-3 py-2"><i class="bi bi-patch-check-fill me-1"></i> Estado: ${estado}</span>
          <div class="text-muted small mt-1">Fecha: ${fechaFormateada}</div>
        </div>
      </div>

      <!-- Barra de progreso visual (Stepper Gamer) -->
      <div class="stepper-wrapper mb-4">
        <div class="stepper-progress">
          <div class="stepper-progress-bar" style="width: ${porcentajeBarra};"></div>
        </div>
        <div class="stepper-step ${pasoActivo >= 1 ? 'completed active' : ''}">
          <div class="step-circle"><i class="bi bi-receipt"></i></div>
          <div class="step-label">1. Confirmado</div>
        </div>
        <div class="stepper-step ${pasoActivo >= 2 ? 'completed active' : ''}">
          <div class="step-circle"><i class="bi bi-box-seam"></i></div>
          <div class="step-label">2. Preparación</div>
        </div>
        <div class="stepper-step ${pasoActivo >= 3 ? 'completed active' : ''}">
          <div class="step-circle"><i class="bi bi-truck"></i></div>
          <div class="step-label">3. En Despacho</div>
        </div>
        <div class="stepper-step ${pasoActivo >= 4 ? 'completed active' : ''}">
          <div class="step-circle"><i class="bi bi-house-check-fill"></i></div>
          <div class="step-label">4. Entregado</div>
        </div>
      </div>

      <!-- Resumen del Pedido -->
      <div class="row g-3">
        <div class="col-md-7">
          <h5 class="text-white border-bottom border-secondary pb-2 mb-3"><i class="bi bi-bag-check me-2 text-info"></i>Componentes del pedido</h5>
          <div class="lista-items-pedido">
            ${itemsHTML}
          </div>
        </div>
        <div class="col-md-5">
          <div class="p-3 rounded" style="background: #061426; border: 1px solid #1d3c64;">
            <h5 class="text-white mb-3"><i class="bi bi-info-circle me-2 text-info"></i>Detalles de Despacho</h5>
            <p class="small mb-2 text-muted"><strong>Cliente:</strong> <span class="text-light">${pedido.usuario || 'Cliente PC PE\''}</span></p>
            <p class="small mb-2 text-muted"><strong>Modalidad:</strong> <span class="text-light">Envío Express a Domicilio</span></p>
            <p class="small mb-2 text-muted"><strong>Garantía:</strong> <span class="text-success"><i class="bi bi-shield-check"></i> Cobertura oficial activa</span></p>
            <hr class="border-secondary my-2">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-muted">Total abonado:</span>
              <span class="fs-5 fw-bold text-cyan">${formatearPrecio(pedido.total)}</span>
            </div>
            <a href="https://wa.me/51998877665?text=Hola%20tengo%20una%20consulta%20sobre%20mi%20pedido%20${pedido.numeroPedido}" target="_blank" class="btn btn-whatsapp w-100">
              <i class="bi bi-whatsapp me-1"></i> Asistencia por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function mostrarAlertaRastreo(msg, tipo = "info") {
  const contenedor = document.getElementById("resultado-rastreo-pedido");
  if (!contenedor) return;
  contenedor.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

// ------------------------------------------------------------
// 2. CONSULTA DE TICKET DE GARANTÍA / RMA
// ------------------------------------------------------------
function inicializarConsultaGarantia() {
  const formConsulta = document.getElementById("form-consulta-garantia");
  const inputTicket = document.getElementById("input-codigo-garantia");

  if (!formConsulta) return;

  formConsulta.addEventListener("submit", async function (e) {
    e.preventDefault();
    const codigo = inputTicket.value.trim().toUpperCase();

    if (!codigo) {
      alert("Ingresa un código de ticket (ej: GAR-102938).");
      return;
    }

    consultarTicketGarantia(codigo);
  });
}

async function consultarTicketGarantia(codigo) {
  const contenedor = document.getElementById("resultado-consulta-garantia");
  const btn = document.getElementById("btn-consultar-garantia-submit");
  const textoOriginal = btn ? btn.innerHTML : "Consultar";

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Consultando...';
  }

  contenedor.innerHTML = `
    <div class="card-postventa text-center py-4">
      <div class="spinner-border text-info" role="status"></div>
      <p class="text-muted small mt-2">Buscando ticket de garantía en taller central...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/garantias/${encodeURIComponent(codigo)}`);
    const data = await res.json();

    if (!res.ok || !data.ok || !data.garantia) {
      throw new Error(data.error || "No se encontró el ticket de garantía especificado.");
    }

    renderizarTicketGarantia(data.garantia);
  } catch (error) {
    contenedor.innerHTML = `
      <div class="card-postventa border border-danger p-4">
        <div class="d-flex align-items-center gap-3">
          <i class="bi bi-shield-x fs-2 text-danger"></i>
          <div>
            <h5 class="text-white mb-1">Ticket no encontrado</h5>
            <p class="text-muted small mb-2">${error.message}</p>
            <div>
              <span class="text-muted small">Tickets de prueba: </span>
              <button class="btn btn-sm btn-outline-info py-0 px-2 me-1" onclick="probarTicketEjemplo('GAR-102938')">GAR-102938</button>
              <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="probarTicketEjemplo('GAR-849201')">GAR-849201</button>
            </div>
          </div>
        </div>
      </div>
    `;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = textoOriginal;
    }
  }
}

function probarTicketEjemplo(codigo) {
  const input = document.getElementById("input-codigo-garantia");
  if (input) {
    input.value = codigo;
    consultarTicketGarantia(codigo);
  }
}

function renderizarTicketGarantia(ticket) {
  const contenedor = document.getElementById("resultado-consulta-garantia");

  let badgeColor = "bg-warning text-dark";
  const est = (ticket.estado || "").toLowerCase();
  if (est.includes("listo") || est.includes("completad") || est.includes("entreg")) {
    badgeColor = "bg-success";
  } else if (est.includes("reparación") || est.includes("taller")) {
    badgeColor = "bg-info text-dark";
  } else if (est.includes("rechazad")) {
    badgeColor = "bg-danger";
  }

  contenedor.innerHTML = `
    <div class="card-postventa p-4">
      <div class="d-flex flex-wrap justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3 gap-2">
        <div>
          <span class="text-muted small text-uppercase">TICKET OFICIAL RMA / LABORATORIO</span>
          <h3 class="mb-0 text-cyan fw-bold">${ticket.codigo}</h3>
        </div>
        <div>
          <span class="badge ${badgeColor} fs-6 px-3 py-2"><i class="bi bi-tools me-1"></i> ${ticket.estado}</span>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-6">
          <p class="small mb-1 text-muted"><strong>Titular:</strong> <span class="text-light">${ticket.nombre}</span> (DNI: ${ticket.dni})</p>
          <p class="small mb-1 text-muted"><strong>Producto:</strong> <span class="text-cyan fw-bold">${ticket.producto}</span></p>
          <p class="small mb-1 text-muted"><strong>N° Serie:</strong> <span class="text-light">${ticket.serie || 'No registrado'}</span></p>
          <p class="small mb-1 text-muted"><strong>Servicio:</strong> <span class="text-light">${ticket.tipoServicio}</span></p>
          <p class="small mb-1 text-muted"><strong>Pedido asociado:</strong> <span class="text-light">${ticket.numeroPedido || 'N/A'}</span></p>
        </div>
        <div class="col-md-6">
          <div class="p-3 rounded" style="background: #061426; border: 1px solid #1d3c64;">
            <h6 class="text-cyan small text-uppercase fw-bold mb-2"><i class="bi bi-clipboard2-pulse me-1"></i> Informe Técnico de Laboratorio</h6>
            <p class="small mb-2 text-light">${ticket.diagnosticoTecnico || 'Equipo en revisión en banco de pruebas.'}</p>
            <hr class="border-secondary my-2">
            <small class="text-muted d-block"><strong>Técnico:</strong> ${ticket.tecnicoAsignado || 'Taller Central'}</small>
            <small class="text-muted d-block"><strong>Fecha de ingreso:</strong> ${new Date(ticket.fecha).toLocaleString("es-PE")}</small>
          </div>
        </div>
      </div>

      <div class="mt-3 p-3 rounded" style="background: #061426; border: 1px solid #1d3c64;">
        <strong class="text-muted small">Falla reportada por el usuario:</strong>
        <p class="small mb-0 text-light mt-1">${ticket.descripcion}</p>
      </div>

      <div class="mt-3 text-end">
        <a href="https://wa.me/51998877665?text=Hola%20Lucia%20quisiera%20consultar%20sobre%20mi%20ticket%20de%20garantia%20${ticket.codigo}" target="_blank" class="btn btn-whatsapp">
          <i class="bi bi-whatsapp me-1"></i> Contactar a la Encargada del Taller
        </a>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------
// 3. REGISTRO DE NUEVA SOLICITUD DE GARANTÍA / RMA
// ------------------------------------------------------------
function inicializarRegistroGarantia() {
  const form = document.getElementById("form-registro-garantia");
  const mensajeDiv = document.getElementById("mensaje-registro-garantia");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("g-nombre").value.trim();
    const dni = document.getElementById("g-dni").value.trim();
    const email = document.getElementById("g-email").value.trim();
    const telefono = document.getElementById("g-telefono").value.trim();
    const numeroPedido = document.getElementById("g-pedido").value.trim();
    const producto = document.getElementById("g-producto").value.trim();
    const serie = document.getElementById("g-serie").value.trim();
    const tipoServicio = document.getElementById("g-tipo").value;
    const descripcion = document.getElementById("g-descripcion").value.trim();

    // Validaciones
    const errores = [];
    if (nombre.length < 3) errores.push("El nombre debe tener al menos 3 caracteres.");
    if (!/^\d{8}$/.test(dni)) errores.push("El DNI debe tener 8 dígitos numéricos.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push("Ingresa un correo electrónico válido.");
    if (producto.length < 2) errores.push("Ingresa el producto o componente a revisar.");
    if (descripcion.length < 10) errores.push("La descripción del problema debe tener al menos 10 caracteres.");

    if (errores.length > 0) {
      mensajeDiv.className = "alert alert-danger";
      mensajeDiv.innerHTML = `<strong>Corrige los siguientes campos:</strong><ul class="mb-0"><li>${errores.join("</li><li>")}</li></ul>`;
      mensajeDiv.classList.remove("d-none");
      return;
    }

    const btnSubmit = form.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit ? btnSubmit.innerHTML : "Enviar Solicitud";

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando en servidor Node.js...';
    }

    try {
      const res = await fetch("/api/garantias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          dni,
          email,
          telefono,
          numeroPedido,
          producto,
          serie,
          tipoServicio,
          descripcion
        })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || (data.errores && data.errores.join(", ")) || "No se pudo registrar la solicitud.");
      }

      // Mensaje de éxito
      mensajeDiv.className = "alert alert-success";
      mensajeDiv.innerHTML = `
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="bi bi-check-circle-fill fs-4 text-success"></i>
          <strong>¡Solicitud de garantía registrada exitosamente!</strong>
        </div>
        <p class="mb-1">Tu número de ticket RMA es: <span class="badge bg-info text-dark fs-6">${data.codigo}</span></p>
        <p class="small text-muted mb-2">Guarda este código para hacerle seguimiento en la pestaña de consultas o cuando entregues el producto al taller.</p>
        <button class="btn btn-sm btn-outline-light mt-1" onclick="consultarTicketCreado('${data.codigo}')">
          <i class="bi bi-search me-1"></i> Ver estado de mi nuevo ticket
        </button>
      `;
      mensajeDiv.classList.remove("d-none");
      form.reset();

      if (typeof Swal !== "undefined") {
        Swal.fire({
          title: "¡Ticket Registrado!",
          html: `<p>Se ha generado el ticket <strong>${data.codigo}</strong> en el sistema técnico de PC PE'.</p><p class="text-muted small">Te enviaremos actualizaciones a tu correo ${email}.</p>`,
          icon: "success",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#38bdf8"
        });
      }
    } catch (error) {
      mensajeDiv.className = "alert alert-danger";
      mensajeDiv.innerHTML = `<strong>Error del servidor:</strong> ${error.message}`;
      mensajeDiv.classList.remove("d-none");
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
      }
    }
  });
}

function consultarTicketCreado(codigo) {
  activarTab("tab-garantias");
  const input = document.getElementById("input-codigo-garantia");
  if (input) {
    input.value = codigo;
    consultarTicketGarantia(codigo);
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// ------------------------------------------------------------
// 4. LEER PARÁMETROS DE LA URL (?pedido=XXX o ?garantia=XXX)
// ------------------------------------------------------------
function comprobarParametrosURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const pedidoParam = urlParams.get("pedido");
  const garantiaParam = urlParams.get("garantia");

  if (pedidoParam) {
    activarTab("tab-rastreo");
    const inputPedido = document.getElementById("input-codigo-pedido");
    if (inputPedido) {
      inputPedido.value = pedidoParam;
      consultarPedido(pedidoParam);
    }
  } else if (garantiaParam) {
    activarTab("tab-garantias");
    const inputGarantia = document.getElementById("input-codigo-garantia");
    if (inputGarantia) {
      inputGarantia.value = garantiaParam;
      consultarTicketGarantia(garantiaParam);
    }
  }
}
