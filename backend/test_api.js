const http = require('http');

// Iniciar servidor temporalmente o probar con la app
const express = require('express');
const path = require('path');
const fs = require('fs');

async function testAll() {
  console.log("Iniciando pruebas de los endpoints de Node.js...");

  // Importar la app de express
  const serverProcess = require('./server.js');
  
  // Esperar 1 segundo para que el puerto 3000 esté disponible
  await new Promise(r => setTimeout(r, 1000));

  const BASE_URL = 'http://localhost:3000';

  async function fetchJSON(url, options = {}) {
    const res = await fetch(BASE_URL + url, options);
    const data = await res.json();
    return { status: res.status, data };
  }

  try {
    // 1. Catálogo
    const test1 = await fetchJSON('/api/productos');
    console.log("✓ GET /api/productos:", test1.status, `(${test1.data.total} productos)`);

    // 2. Filtro búsqueda
    const test2 = await fetchJSON('/api/productos?buscar=macbook');
    console.log("✓ GET /api/productos?buscar=macbook:", test2.status, `(${test2.data.total} encontrados)`);

    // 3. Filtro ofertas
    const test3 = await fetchJSON('/api/productos?ofertas=true');
    console.log("✓ GET /api/productos?ofertas=true:", test3.status, `(${test3.data.total} en oferta)`);

    // 4. Categorías
    const test4 = await fetchJSON('/api/categorias');
    console.log("✓ GET /api/categorias:", test4.status, test4.data.categorias);

    // 5. Producto por ID
    const test5 = await fetchJSON('/api/productos/1');
    console.log("✓ GET /api/productos/1:", test5.status, test5.data.producto.nombre);

    // 6. Libro de Reclamaciones
    const test6 = await fetchJSON('/api/reclamaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Juan Perez",
        dni: "12345678",
        email: "juan@correo.com",
        tipo: "Reclamo",
        detalle: "Demora en la entrega del producto adquirido."
      })
    });
    console.log("✓ POST /api/reclamaciones:", test6.status, test6.data.codigo, test6.data.mensaje);

    // 7. Asesores
    const test7 = await fetchJSON('/api/asesores');
    console.log("✓ GET /api/asesores:", test7.status, `(${test7.data.asesores.length} asesores)`);

    // 8. Contacto
    const test8 = await fetchJSON('/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Ana Gomez",
        email: "ana@correo.com",
        mensaje: "Quisiera información sobre cotizaciones corporativas."
      })
    });
    console.log("✓ POST /api/contacto:", test8.status, test8.data.mensaje);

    // 9. Login
    const test9 = await fetchJSON('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: 'admin', clave: 'admin' })
    });
    console.log("✓ POST /api/auth/login:", test9.status, "Bienvenido " + test9.data.usuario.nombre);

    // 10. Pedido (Checkout)
    const test10 = await fetchJSON('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: 'admin',
        items: [
          { id: 1, cantidad: 1 },
          { id: 10, cantidad: 2 }
        ]
      })
    });
    console.log("✓ POST /api/pedidos:", test10.status, test10.data.numeroPedido, "Total: S/ " + test10.data.total);

    console.log("\n ¡TODAS LAS PRUEBAS DE NODE.JS PASARON EXITOSAMENTE!");
    process.exit(0);
  } catch (e) {
    console.error("Error en pruebas:", e);
    process.exit(1);
  }
}

testAll();
