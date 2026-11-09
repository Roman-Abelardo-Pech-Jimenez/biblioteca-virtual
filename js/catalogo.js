let libros = [];

const contenedor = document.getElementById("contenedor-libros");
const buscador = document.getElementById("buscador");
const mensajeResultados = document.getElementById("mensaje-resultados");

const lectorLibro = document.getElementById("lector-libro");
const tituloLector = document.getElementById("titulo-lector");
const visorPdf = document.getElementById("visor-pdf");

const menuCategorias = document.getElementById("menu-categorias");

let categoriaSeleccionada = "Todos";

// Carga los datos desde libros.json.
async function cargarLibros() {
    try {
        const respuesta = await fetch("datos/libros.json");

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el catálogo.");
        }

        libros = await respuesta.json();
        generarCategorias();
        aplicarFiltros();


    } catch (error) {
        mensajeResultados.textContent =
            "No se pudo cargar el catálogo. " +
            "Abre la biblioteca mediante un servidor local.";
        console.error(error);
    }
}
function generarCategorias() {

    // Obtener las categorías de todos los libros.
    const categorias = libros.map(function(libro) {
        return libro.categoria;
    });

    // Eliminar las categorías repetidas.
    const categoriasUnicas = [...new Set(categorias)];

    // Limpiar el menú antes de generar los botones.
    menuCategorias.replaceChildren();

    // Crear la opción para mostrar todos los libros.
    const botonTodos = document.createElement("button");

    botonTodos.type = "button";
    botonTodos.textContent = "Todos";
    botonTodos.classList.add("boton-categoria");

    if (categoriaSeleccionada === "Todos") {
        botonTodos.classList.add("activa");
    }

    botonTodos.addEventListener("click", function() {
        categoriaSeleccionada = "Todos";
        buscador.value = "";
        aplicarFiltros();
    });

    menuCategorias.append(botonTodos);

    // Crear un botón para cada categoría.
    categoriasUnicas.forEach(function(categoria) {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.textContent = categoria;
        boton.classList.add("boton-categoria");

        if (categoriaSeleccionada === categoria) {
            boton.classList.add("activa");
        }

        boton.addEventListener("click", function() {
            categoriaSeleccionada = categoria;
            buscador.value = "";
            aplicarFiltros();
        });

        menuCategorias.append(boton);

    });
}

function aplicarFiltros() {

    const texto = buscador.value.toLowerCase().trim();

    const resultados = libros.filter(function(libro) {

        const coincideTexto =
            libro.titulo.toLowerCase().includes(texto) ||
            libro.autor.toLowerCase().includes(texto) ||
            libro.categoria.toLowerCase().includes(texto);

        const coincideCategoria =
            categoriaSeleccionada === "Todos" ||
            libro.categoria === categoriaSeleccionada;

        return coincideTexto && coincideCategoria;
    });

    mostrarLibros(resultados);
    generarCategorias();
}


// Genera las tarjetas.
function mostrarLibros(listaLibros) {
    contenedor.replaceChildren();

    listaLibros.forEach(function(libro) {
        const tarjeta = document.createElement("article");
        tarjeta.classList.add("tarjeta-libro");

        const imagen = document.createElement("img");
        imagen.classList.add("imagen-portada");
        imagen.src = libro.portada;
        imagen.alt = "Portada de " + libro.titulo;

        const informacion = document.createElement("div");
        informacion.classList.add("informacion-libro");

        const titulo = document.createElement("h3");
        titulo.textContent = libro.titulo;

        const autor = document.createElement("p");
        autor.textContent = "Autor: " + libro.autor;

        const categoria = document.createElement("p");
        categoria.textContent = "Categoría: " + libro.categoria;

        const descripcion = document.createElement("p");
        descripcion.classList.add("descripcion-libro");
        descripcion.textContent = libro.descripcion || "Sin descripción disponible.";

        informacion.append(titulo, autor, categoria, descripcion);

        tarjeta.append(imagen, informacion);

        // Crear los botones solo si el libro tiene un archivo.
        if (libro.archivos && libro.archivos.length > 0) {

            libro.archivos.forEach(function(archivo) {
                const grupoArchivo = document.createElement("div");
                grupoArchivo.classList.add("grupo-archivo");

                // Crear el botón de lectura.
                const botonLeer = document.createElement("button");
                botonLeer.type = "button";
                botonLeer.textContent = "Leer " + archivo.tipo;
                botonLeer.classList.add("boton-libro");

                // Crear el botón de descarga.
                const botonDescargar = document.createElement("a");
                botonDescargar.textContent = "Descargar " + archivo.tipo;
                botonDescargar.href = archivo.ruta;
                botonDescargar.download = "";
                botonDescargar.classList.add("boton-libro");

                // Acción del botón de lectura.
                botonLeer.addEventListener("click", function() {

                    const tipo = archivo.tipo.toUpperCase();

                    if (tipo === "PDF") {

                        // Abrir el PDF directamente.
                        visorPdf.src = archivo.ruta;

                    } else if (tipo === "DOCX" || tipo === "PPTX") {

                        // Obtener la dirección completa del documento.
                        const urlDocumento = new URL(
                            archivo.ruta,
                            window.location.href
                        ).href;

                        // Construir la dirección del visor de Microsoft.
                        const urlVisor =
                            "https://view.officeapps.live.com/op/embed.aspx?src=" +
                            encodeURIComponent(urlDocumento);

                        visorPdf.src = urlVisor;

                    } else {

                        alert("Este formato todavía no tiene un visor disponible.");
                        return;

                    }

                    // Mostrar el documento seleccionado.
                    tituloLector.textContent = "Leyendo: " + libro.titulo;

                    lectorLibro.hidden = false;
                    contenedor.hidden = true;

                    lectorLibro.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                });

                grupoArchivo.append(botonLeer, botonDescargar);
                tarjeta.append(grupoArchivo);


            });
        }


        contenedor.append(tarjeta);
    });

    mensajeResultados.textContent =
        listaLibros.length === 0
            ? "No se encontraron libros."
            : "Libros encontrados: " + listaLibros.length;
}


// Busca por título, autor o categoría.
function buscarLibros() {
    const texto = buscador.value.toLowerCase().trim();

    const resultados = libros.filter(function(libro) {
        return (
            libro.titulo.toLowerCase().includes(texto) ||
            libro.autor.toLowerCase().includes(texto) ||
            libro.categoria.toLowerCase().includes(texto)
        );
    });

    mostrarLibros(resultados);
}

buscador.addEventListener("input", aplicarFiltros);
document.getElementById("cerrar-lector").addEventListener("click", function() {
    lectorLibro.hidden = true;
    contenedor.hidden = false;

    // Liberar el visor cuando se cierre.
    visorPdf.src = "about:blank";
});

// Inicia la carga del catálogo.
cargarLibros();
