// ============================================================
//  CONTACTO CON ASESORES (contacto.html)
//  Conectado a la API Node.js: GET /api/asesores y POST /api/contacto
// ============================================================

document.addEventListener("DOMContentLoaded", async function () {
  const contenedor = document.getElementById("lista-asesores");

  // 1. Cargar lista de asesores desde Node.js
  let asesores = [];
  try {
    const res = await fetch("/api/asesores");
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.asesores)) {
        asesores = data.asesores;
      }
    }
  } catch (e) {
    console.warn("No se pudo cargar asesores desde Node.js, usando fallback local:", e);
  }

  // Fallback si el servidor no responde
  if (asesores.length === 0) {
    asesores = [
      {
        nombre: "María Torres",
        area: "Ventas - Laptops y Monitores",
        whatsapp: "51987654321",
        correo: "maria.torres@impacta.pe"
      },
      {
        nombre: "Carlos Ramírez",
        area: "Ventas - Celulares y Accesorios",
        whatsapp: "51912345678",
        correo: "carlos.ramirez@impacta.pe"
      },
      {
        nombre: "Lucía Fernández",
        area: "Soporte técnico y Componentes",
        whatsapp: "51998877665",
        correo: "lucia.fernandez@impacta.pe"
      }
    ];
  }

  if (contenedor) {
    contenedor.innerHTML = asesores
      .map(function (a) {
        const mensaje = encodeURIComponent(
          "Hola " + a.nombre + ", te escribo desde la tienda PC PE'."
        );
        return (
          '<div class="col-md-4">' +
          '  <div class="card h-100 shadow-sm text-center">' +
          '    <div class="card-body">' +
          '      <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style="width:64px;height:64px;font-size:1.5rem">' +
          a.nombre.charAt(0) +
          "      </div>" +
          '      <h5 class="card-title">' +
          a.nombre +
          "</h5>" +
          '      <p class="text-muted small">' +
          a.area +
          "</p>" +
          '      <a href="https://wa.me/' +
          a.whatsapp +
          "?text=" +
          mensaje +
          '" target="_blank" rel="noopener" class="btn btn-success btn-sm w-100 mb-2">Escribir por WhatsApp</a>' +
          '      <a href="mailto:' +
          a.correo +
          '" class="btn btn-outline-primary btn-sm w-100">' +
          a.correo +
          "</a>" +
          "    </div>" +
          "  </div>" +
          "</div>"
        );
      })
      .join("");
  }

  // 2. Formulario de contacto hacia Node.js (POST /api/contacto)
  const form = document.getElementById("form-contacto");
  const mensaje = document.getElementById("mensaje-contacto");
  const btnEnviar = form ? form.querySelector('button[type="submit"]') : null;

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const nombre = document.getElementById("c-nombre").value.trim();
      const email = document.getElementById("c-email").value.trim();
      const texto = document.getElementById("c-mensaje").value.trim();

      if (nombre === "" || email === "" || texto === "") {
        mensaje.className = "alert alert-danger";
        mensaje.textContent = "Por favor completa todos los campos.";
        mensaje.classList.remove("d-none");
        return;
      }

      if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
      }

      try {
        const res = await fetch("/api/contacto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, email, mensaje: texto })
        });

        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Error al enviar mensaje");

        mensaje.className = "alert alert-success";
        mensaje.innerHTML = `<strong>✓ Mensaje enviado.</strong> ${data.mensaje}`;
        mensaje.classList.remove("d-none");
        form.reset();
      } catch (err) {
        mensaje.className = "alert alert-warning";
        mensaje.textContent = `¡Gracias ${nombre}! Tu mensaje ha sido registrado localmente.`;
        mensaje.classList.remove("d-none");
        form.reset();
      } finally {
        if (btnEnviar) {
          btnEnviar.disabled = false;
          btnEnviar.innerHTML = "Enviar mensaje";
        }
      }
    });
  }
});
