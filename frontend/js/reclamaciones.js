// ============================================================
//  LIBRO DE RECLAMACIONES (reclamaciones.html)
//  Conectado al servidor Node.js: POST /api/reclamaciones
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("form-reclamo");
  const mensaje = document.getElementById("mensaje-reclamo");
  const btnSubmit = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const dni = document.getElementById("dni").value.trim();
    const email = document.getElementById("email").value.trim();
    const tipo = document.getElementById("tipo").value;
    const detalle = document.getElementById("detalle").value.trim();

    // Validaciones iniciales del lado cliente
    const errores = [];
    if (nombre.length < 3) {
      errores.push("El nombre debe tener al menos 3 caracteres.");
    }
    if (!/^\d{8}$/.test(dni)) {
      errores.push("El DNI debe tener exactamente 8 dígitos.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errores.push("Ingresa un correo electrónico válido.");
    }
    if (tipo === "") {
      errores.push("Selecciona el tipo de solicitud (Reclamo o Queja).");
    }
    if (detalle.length < 10) {
      errores.push("El detalle debe tener al menos 10 caracteres.");
    }

    if (errores.length > 0) {
      mensaje.className = "alert alert-danger";
      mensaje.innerHTML =
        "<strong>Revisa lo siguiente:</strong><ul class='mb-0'><li>" +
        errores.join("</li><li>") +
        "</li></ul>";
      mensaje.classList.remove("d-none");
      return;
    }

    // Estado de carga en el botón
    const textoBotonOriginal = btnSubmit ? btnSubmit.innerHTML : "Enviar";
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Registrando en servidor...';
    }

    try {
      const response = await fetch("/api/reclamaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, dni, email, tipo, detalle })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        const mensajeError = (data.errores && data.errores.join(", ")) || data.error || "Ocurrió un error al registrar.";
        throw new Error(mensajeError);
      }

      // Registro exitoso en el servidor Node.js
      mensaje.className = "alert alert-success";
      mensaje.innerHTML =
        "<strong>✓ Reclamo registrado correctamente en el servidor Node.js.</strong><br>" +
        "Número oficial de registro: <strong class='fs-5 text-primary'>" +
        data.codigo +
        "</strong><br>" +
        "Fecha de recepción: <span class='text-muted'>" +
        new Date(data.fecha).toLocaleString("es-PE") +
        "</span><br>" +
        "Nos comunicaremos contigo al correo <strong>" +
        email +
        "</strong> en un plazo máximo de 30 días.";
      mensaje.classList.remove("d-none");
      form.reset();
    } catch (err) {
      mensaje.className = "alert alert-danger";
      mensaje.innerHTML = "<strong>Error del servidor:</strong> " + err.message;
      mensaje.classList.remove("d-none");
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoBotonOriginal;
      }
    }
  });
});
