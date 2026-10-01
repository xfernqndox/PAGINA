// ============================================================
//  LOGIN DE USUARIO (login.html)
//  Conectado a la API Node.js: POST /api/auth/login
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  // Si ya hay sesión activa, redirige al inicio
  if (obtenerSesion()) {
    window.location.href = "index.html";
    return;
  }

  const form = document.getElementById("form-login");
  const mensaje = document.getElementById("mensaje-login");
  const btnIngresar = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const clave = document.getElementById("clave").value;

    // Validación básica en el cliente
    if (usuario === "" || clave === "") {
      mostrarMensaje("Completa todos los campos.", "danger");
      return;
    }

    if (btnIngresar) {
      btnIngresar.disabled = true;
      btnIngresar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Validando en servidor...';
    }

    try {
      // 1. Petición al endpoint de autenticación de Node.js
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        iniciarSesion(data.usuario);
        mostrarMensaje(`¡Bienvenido ${data.usuario.nombre || data.usuario.usuario}! Redirigiendo...`, "success");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 800);
      } else {
        mostrarMensaje(data.error || "Usuario o contraseña incorrectos.", "danger");
      }
    } catch (err) {
      console.warn("Fallo de conexión con Node.js, usando validación local de respaldo:", err);
      // Fallback de contingencia (admin / admin)
      if (usuario.toLowerCase() === "admin" && clave === "admin") {
        iniciarSesion({ usuario: "admin", nombre: "Administrador PC PE" });
        mostrarMensaje("¡Bienvenido! (Modo local) Redirigiendo...", "success");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 800);
      } else {
        mostrarMensaje("Usuario o contraseña incorrectos.", "danger");
      }
    } finally {
      if (btnIngresar) {
        btnIngresar.disabled = false;
        btnIngresar.innerHTML = "Ingresar";
      }
    }
  });

  function mostrarMensaje(texto, tipo) {
    mensaje.className = "alert alert-" + tipo;
    mensaje.textContent = texto;
    mensaje.classList.remove("d-none");
  }
});
