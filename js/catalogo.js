
let libros = [];

const contenedor = document.getElementById("contenedor-libros");
const buscador = document.getElementById("buscador");
const mensajeResultados = document.getElementById("mensaje-resultados");

const lectorLibro = document.getElementById("lector-libro");
const tituloLector = document.getElementById("titulo-lector");
const visorPdf = document.getElementById("visor-pdf");

const menuCategorias = document.getElementById("menu-categorias");

const modal = document.getElementById("modal-libro");
const modalArchivos = document.getElementById("modal-archivos");

let categoriaSeleccionada = "Todos";
let ultimoFoco = null;

// =====================================
// NORMALIZAR TEXTO PARA BUSQUEDA
// =====================================

function normalizarTexto(valor) {
    return String(valor ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// =====================================
// CARGAR LIBROS DESDE JSON
// =====================================

async function cargarLibros() {
    try {
        const respuesta = await fetch("./datos/libros.json");

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el catálogo.");
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
            throw new Error("El catálogo debe ser un arreglo.");
        }

        libros = datos;

        generarCategorias();
        aplicarFiltros();

        const totalLibros = document.getElementById("total-libros");
        const totalCategorias = document.getElementById("total-categorias");

        if (totalLibros) {
            totalLibros.textContent = libros.length;
        }

        if (totalCategorias) {
            totalCategorias.textContent = new Set(
                libros.map(libro => libro.categoria).filter(Boolean)
            ).size;
        }

    } catch (error) {
        mensajeResultados.textContent =
            "No se pudo cargar el catálogo. Verifica libros.json y Live Server.";

        console.error("Error al cargar libros:", error);
    }
}

// =====================================
// GENERAR CATEGORIAS
// =====================================

function generarCategorias() {
    const categoriasUnicas = [
        ...new Set(
            libros.map(libro => libro.categoria).filter(Boolean)
        )
    ];

    menuCategorias.replaceChildren();

    const categorias = ["Todos", ...categoriasUnicas];

    categorias.forEach(function(categoria) {
        const boton = document.createElement("button");

        boton.type = "button";
        boton.textContent = categoria;
        boton.className = "boton-categoria";

        if (categoriaSeleccionada === categoria) {
            boton.classList.add("activa");
        }

        boton.addEventListener("click", function() {
            categoriaSeleccionada = categoria;
            aplicarFiltros();
        });

        menuCategorias.append(boton);
    });
}

// =====================================
// BUSQUEDA Y FILTROS
// =====================================

function aplicarFiltros() {
    const texto = normalizarTexto(buscador.value);

    const resultados = libros.filter(function(libro) {

        const informacion = [
            libro.titulo,
            libro.autor,
            libro.ua,
            libro.categoria,
            libro.descripcion
        ];

        const contenido = normalizarTexto(
            informacion.join(" ")
        );

        const coincideTexto = contenido.includes(texto);

        const coincideCategoria =
            categoriaSeleccionada === "Todos" ||
            libro.categoria === categoriaSeleccionada;

        return coincideTexto && coincideCategoria;
    });

    mostrarLibros(resultados);
    actualizarCategorias();
}

// =====================================
// ACTUALIZAR BOTONES DE CATEGORIAS
// =====================================

function actualizarCategorias() {
    const botones = menuCategorias.querySelectorAll("button");

    botones.forEach(function(boton) {
        boton.classList.toggle(
            "activa",
            boton.textContent === categoriaSeleccionada
        );
    });
}

// =====================================
// MOSTRAR TARJETAS DE LIBROS
// =====================================

function mostrarLibros(listaLibros) {
    contenedor.replaceChildren();

    listaLibros.forEach(function(libro) {

        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-libro";

        const imagen = document.createElement("img");
        imagen.className = "imagen-portada";
        imagen.src = libro.portada;
        imagen.alt = "Portada de " + libro.titulo;
        imagen.loading = "lazy";

        const informacion = document.createElement("div");
        informacion.className = "informacion-libro";

        const categoria = document.createElement("span");
        categoria.className = "categoria-etiqueta";
        categoria.textContent = libro.categoria || "";

        const titulo = document.createElement("h3");
        titulo.textContent = libro.titulo || "Sin título";

        const autor = document.createElement("p");
        autor.className = "autor-libro";
        autor.textContent = libro.autor || "Autor no disponible";

        const au = document.createElement("p");
        au.className = "autor-libro";
        au.textContent = libro.ua || "";

        const boton = document.createElement("button");
        boton.className = "ver-libro";
        boton.type = "button";
        boton.textContent = "Ver libro →";

        boton.addEventListener("click", function() {
            abrirModal(libro);
        });

        informacion.append(
            categoria,
            titulo,
            autor,
            boton
        );

        tarjeta.append(imagen, informacion, au);
        contenedor.append(tarjeta);
    });

    mensajeResultados.textContent =
        listaLibros.length === 0
            ? "No se encontraron libros."
            : "Libros encontrados: " + listaLibros.length;
}

// =====================================
// ABRIR VENTANA DEL LIBRO
// =====================================

function abrirModal(libro) {
    ultimoFoco = document.activeElement;

    const imagen = document.getElementById("modal-imagen");

    imagen.src = libro.portada;
    imagen.alt = "Portada de " + libro.titulo;

    document.getElementById("modal-categoria").textContent =
        libro.categoria || "";

    document.getElementById("modal-titulo").textContent =
        libro.titulo || "";

    document.getElementById("modal-autor").textContent =
        "por " + (libro.autor || "Autor no disponible");

    document.getElementById("modal-descripcion").textContent =
        libro.descripcion || "Sin descripción disponible.";

    modalArchivos.replaceChildren();

    (libro.archivos || []).forEach(function(archivo) {

        // BOTON LEER
        const botonLeer = document.createElement("button");

        botonLeer.type = "button";
        botonLeer.className = "boton-libro boton-leer";
        botonLeer.textContent = "Leer " + archivo.tipo + " →";

        botonLeer.addEventListener("click", function() {
            abrirDocumento(libro, archivo);
        });

        // BOTON DESCARGAR
        const descargar = document.createElement("a");

        descargar.className = "boton-libro boton-descargar";
        descargar.textContent = "Descargar " + archivo.tipo;
        descargar.href = archivo.ruta;
        descargar.download = "";

        modalArchivos.append(botonLeer, descargar);
    });

    modal.hidden = false;
    document.body.style.overflow = "hidden";

    document.getElementById("cerrar-modal").focus();
}

// =====================================
// CERRAR VENTANA DEL LIBRO
// =====================================

function cerrarModal() {
    modal.hidden = true;
    document.body.style.overflow = "";

    if (ultimoFoco && ultimoFoco.isConnected) {
        ultimoFoco.focus();
    }
}

document.getElementById("cerrar-modal")
    .addEventListener("click", cerrarModal);

modal.addEventListener("click", function(event) {
    if (event.target === modal) {
        cerrarModal();
    }
});

// Cerrar con Escape y controlar el foco
document.addEventListener("keydown", function(event) {

    if (modal.hidden) return;

    if (event.key === "Escape") {
        cerrarModal();
        return;
    }

    if (event.key === "Tab") {
        const elementos = [
            ...modal.querySelectorAll("button, a[href]")
        ];

        if (elementos.length === 0) return;

        const primero = elementos[0];
        const ultimo = elementos[elementos.length - 1];

        if (event.shiftKey && document.activeElement === primero) {
            event.preventDefault();
            ultimo.focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === ultimo
        ) {
            event.preventDefault();
            primero.focus();
        }
    }
});

// =====================================
// ABRIR DOCUMENTOS
// =====================================

function abrirDocumento(libro, archivo) {
    const tipo = String(archivo.tipo || "").toUpperCase();

    if (tipo === "PDF") {
        visorPdf.src = archivo.ruta;

    } else if (tipo === "DOCX" || tipo === "PPTX") {

        const urlDocumento = new URL(
            archivo.ruta,
            window.location.href
        ).href;

        visorPdf.src =
            "https://view.officeapps.live.com/op/embed.aspx?src=" +
            encodeURIComponent(urlDocumento);

    } else {
        alert("Este formato todavía no tiene un visor disponible.");
        return;
    }

    cerrarModal();

    tituloLector.textContent =
        "Leyendo: " + libro.titulo + " (" + archivo.tipo + ")";

    lectorLibro.hidden = false;
    contenedor.hidden = true;
    menuCategorias.hidden = true;

    lectorLibro.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// =====================================
// CERRAR LECTOR
// =====================================

document.getElementById("cerrar-lector")
    .addEventListener("click", function() {

        lectorLibro.hidden = true;
        contenedor.hidden = false;
        menuCategorias.hidden = false;

        visorPdf.src = "about:blank";
    });

// =====================================
// BUSQUEDA EN TIEMPO REAL
// =====================================

buscador.addEventListener("input", aplicarFiltros);

// =====================================
// MENU MOVIL
// =====================================

const menuMovil = document.getElementById("menu-movil");
const navegacion = document.getElementById("navegacion");

if (menuMovil && navegacion) {

    menuMovil.addEventListener("click", function() {
        const abierta = navegacion.classList.toggle("abierta");

        menuMovil.setAttribute(
            "aria-expanded",
            String(abierta)
        );
    });

    navegacion.querySelectorAll("a").forEach(function(enlace) {

        enlace.addEventListener("click", function() {
            navegacion.classList.remove("abierta");
            menuMovil.setAttribute("aria-expanded", "false");
        });

    });
}


// INICIAR BIBLIOTECA

cargarLibros();
