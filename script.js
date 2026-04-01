const brazos = document.getElementById('brazos');
const escenario = document.getElementById('escenario-virtual');
const objetoEnMano = document.getElementById('objeto-sostenido');
const ledTexto = document.getElementById('texto-led');
const btnListo = document.getElementById('btn-listo');
const zonaDeposito = document.getElementById('zona-deposito');
const lectorTarjeta = document.getElementById('lector-tarjeta');
const btnTarjeta = document.getElementById('btn-tarjeta-uam');
const hotbar = document.getElementById('hotbar-inventario');
const uiControles = document.getElementById('ui-controles');
const circuloLector = document.getElementById('circulo-lector');
const circuloDeposito = document.getElementById('circulo-deposito');
const slots = document.querySelectorAll('.item-slot');
const pantallaSistema = document.getElementById('pantalla-sistema');
const textoPantallaSistema = document.getElementById('texto-sistema'); 
// Detectar si estamos en móvil para ajustar el zoom
const esMovil = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let zoom = 0.745; // Si es móvil, empezamos con menos zoom
let currentIndex = -1;
let tarjetaEscaneada = false; 
let lista = []; 
let saldoHistorico = 442;

window.addEventListener('load', () => {
    if (esMovil) {
        // 1. Forzamos la clase primero
        brazos.classList.add('brazos-derecha-movil');
        
        // 2. IMPORTANTE: Forzamos un zoom inicial bajo para que se note el cambio
        updateZoom(1.8); 

        // 3. Esperamos a que el navegador "respire" y ejecutamos la animación
        setTimeout(() => {
            //console.log("Ejecutando caminata...");
            // En lugar de llamar a moverMovil, vamos a disparar las clases manualmente 
            // para asegurar que no haya errores de funciones no definidas
            //brazos.classList.add('caminando');
            updateZoom(1.8); // Zoom de acercamiento
            
            // Quitamos el tambaleo después de que termine de "caminar"
            setTimeout(() => {
                brazos.classList.remove('caminando');
            }, 1500);
        }, 100); // 1 segundo después de cargar
    }

    // --- CICLO DE MENSAJES DE BIENVENIDA ---
    const ledTexto = document.getElementById('texto-led');
    const mensajesDeBienvenida = [
        "<span style='color: #27ae60; font-weight: bold;' >SOMOS <br>PARTE DEL CICLO</span>",
        "ESCANEA TU TARJETA PARA INGRESAR RESIDUOS"
    ];
    let indexMensajeActual = 0;

    const cambiarMensajeBucle = () => {
        // Si ya se escaneó la tarjeta, detenemos el loop de bienvenida
        if (tarjetaEscaneada) return;

        // Desvanecimiento suave (fade out)
        ledTexto.style.opacity = '0';

        setTimeout(() => {
            // Cambiamos el texto y mostramos de nuevo (fade in)
            indexMensajeActual = (indexMensajeActual + 1) % mensajesDeBienvenida.length;
            ledTexto.innerHTML = mensajesDeBienvenida[indexMensajeActual];
            ledTexto.style.opacity = '1';
        }, 200); // 600ms coincide con la transición de CSS
    };

    // Iniciamos el ciclo cada 4 segundos
    setInterval(cambiarMensajeBucle, 1900);
});

// Aplicamos el zoom inicial
function updateZoom(nuevoZoom) {
    zoom = nuevoZoom;
    document.documentElement.style.setProperty('--zoom-actual', zoom);
    if (escenario) escenario.style.transform = `scale(${zoom})`;
}

// --- 1. PRIMERO DEFINIMOS LA FUNCIÓN PARA QUE EL NAVEGADOR LA CONOZCA ---
function moverMovil(acercar) {
    if (!esMovil) return;
    
    if (acercar) {
        brazos.classList.add('caminando');
        updateZoom(1.8); 
        setTimeout(() => {
            brazos.classList.remove('caminando');
        }, 1200); // Un poco más de tiempo para que se note el tambaleo
    } else {
        brazos.classList.add('caminando');
        updateZoom(1.8);
        setTimeout(() => {
            brazos.classList.remove('caminando');
        }, 1200);
    }
}



//Puntos residuos
const puntosResiduos = { 
    'PET': 20, 
    'VIDRIO': 15, 
    'LATA': 10, 
    'MANZANA': 5, 
    'CARTON': 8,
    'TARJETA': 0 
};

// Mapa de nombres de archivos SVG
const rutasSVG = {
    'PET': 'img/b_plastico.svg',
    'VIDRIO':'img/b_vidrio.svg',
    'LATA': 'img/lata.svg',
    'MANZANA': 'img/manzana.svg',
    'CARTON': 'img/v_unicel.svg',
    'TARJETA': 'img/tarjeta.svg'
};

window.onload = () => {
   // ledTexto.innerHTML = "SOMOS<br>Parte del Ciclo";
    circuloLector.classList.add('parpadear-lector-espera');
    
};

// 1. MOVIMIENTO
// --- FUNCIÓN MAESTRA DE MOVIMIENTO MOVIL ---
function ejecutarCaminata(direccion) {
    if (tarjetaEscaneada) return;

    if (direccion === 'arriba') zoom += 0.015;
    if (direccion === 'abajo') zoom -= 0.015;

    // Límites diferenciados
    if (esMovil) {
        zoom = Math.max(1.8, Math.min(3, zoom));
    } else {
        zoom = Math.max(1.8, Math.min(1.8, zoom));
    }

    document.documentElement.style.setProperty('--zoom-actual', zoom);
    escenario.style.transform = `scale(${zoom})`;
    brazos.classList.add('caminando');
    escenario.classList.add('camara-caminando');

    // Lógica de UI y Botones Flotantes
    let umbralUI = esMovil ? 3 : 1.3;
    const panelFlechas = document.getElementById('controles-movil-flotantes');

    if (zoom >= umbralUI) {
        uiControles.classList.add('ui-visible');
        uiControles.style.pointerEvents = 'auto';
        uiControles.style.opacity = '1';
        
        if (esMovil && panelFlechas) {
            panelFlechas.style.opacity = '0';
            panelFlechas.style.visibility = 'hidden';
        }
        if (!tarjetaEscaneada);
    } else {
        uiControles.classList.remove('ui-visible');
        uiControles.style.pointerEvents = 'none';
        if (esMovil && panelFlechas) {
            panelFlechas.style.opacity = '1';
            panelFlechas.style.visibility = 'visible';
        }
    }
}

// 1. MOVIMIENTO
window.addEventListener('keydown', (e) => {
    if (pantallaSistema.classList.contains('pantalla-activa')) return;

    // Si la tarjeta ya se escaneó, NO permitimos mover las flechas
    if (tarjetaEscaneada) {
        // Solo permitimos el golpe si presiona Espacio
        if (e.code === 'Space') {
            dispararGolpe();
        }
        return; // Detiene el resto de la función (flechas)
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (e.key === 'ArrowUp') zoom += 0.015;
        if (e.key === 'ArrowDown') zoom -= 0.015;

        // --- CONDICIONAL ESPECIAL PARA MÓVIL ---
        if (esMovil) {
            // En móvil el límite es 1.185
            zoom = Math.max(1.8, Math.min(3, zoom));
        } else {
            // En web normal el límite sigue siendo 1.8
            zoom = Math.max(0.745, Math.min(1.8, zoom));
        }

        document.documentElement.style.setProperty('--zoom-actual', zoom);
        escenario.style.transform = `scale(${zoom})`;
        brazos.classList.add('caminando');
        escenario.classList.add('camara-caminando');

        // --- LÓGICA DE DESBLOQUEO ---
        // Definimos el umbral de activación dependiendo del dispositivo
        let umbralActivacion = esMovil ? 1.8 : 1.3;

        if (zoom >= umbralActivacion) {
            uiControles.classList.add('ui-visible');
            // Desbloqueamos visualmente los controles (opacidad y clics)
            uiControles.style.pointerEvents = 'auto';
            uiControles.style.opacity = '1';
            
            // Mostramos el inventario solo si ya se escaneó (aunque aquí arriba ya bloqueamos el movimiento post-escaneo)
            hotbar.style.display = tarjetaEscaneada ? 'flex' : 'none';
            
           
        } else {
            uiControles.classList.remove('ui-visible');
            // Si se aleja, bloqueamos clics (opcional, según prefieras)
            uiControles.style.pointerEvents = 'none';
        }
    }
});

// 2. EVENTOS TÁCTILES (MÓVIL)
// Agrega esto justo debajo del keydown
if (esMovil) {
    const btnSubir = document.getElementById('btn-subir');
    const btnBajar = document.getElementById('btn-bajar');

    btnSubir.addEventListener('touchstart', (e) => {
        e.preventDefault();
        // Usamos un intervalo para que camine mientras dejas presionado
        window.intervaloCaminar = setInterval(() => ejecutarCaminata('arriba'), 50);
    });

    btnBajar.addEventListener('touchstart', (e) => {
        e.preventDefault();
        window.intervaloCaminar = setInterval(() => ejecutarCaminata('abajo'), 50);
    });

    window.addEventListener('touchend', () => {
        clearInterval(window.intervaloCaminar);
        brazos.classList.remove('caminando');
        escenario.classList.remove('camara-caminando');
    });
}

// Limpiar caminata con teclado
window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        brazos.classList.remove('caminando');
        escenario.classList.remove('camara-caminando');
    }
});

window.addEventListener('keyup', () => {
    brazos.classList.remove('caminando');
    escenario.classList.remove('camara-caminando');
});

// Función para limpiar brillos de objetivos
function limpiarObjetivos() {
    lectorTarjeta.classList.remove('objetivo-activo');
    zonaDeposito.classList.remove('objetivo-activo');
}

// 2. AGARRAR
function agarrar(tipo, color, index) {
    currentIndex = index;
    
    slots.forEach(slot => slot.classList.remove('selected'));
    if (index !== -1) {
        slots[index].classList.add('selected');
    }

    // Limpiamos clases previas y añadimos la clase 'es-tarjeta' solo si es la tarjeta
    objetoEnMano.className = ''; 
    if (tipo === 'TARJETA') {
        objetoEnMano.classList.add('es-tarjeta');
    }

    objetoEnMano.innerHTML = `<img src="${rutasSVG[tipo]}" alt="${tipo}">`;
    objetoEnMano.style.display = 'block';
    objetoEnMano.dataset.tipo = tipo;

    limpiarObjetivos();
    if (tipo === 'TARJETA' && !tarjetaEscaneada) {
        lectorTarjeta.classList.add('objetivo-activo');
    } else if (tarjetaEscaneada && tipo !== 'TARJETA') {
        zonaDeposito.classList.add('objetivo-activo');
    }
}

// 3. SCROLL
window.addEventListener('wheel', (e) => {
    // 1. Validaciones de estado
    if (zoom < 1.3 || !tarjetaEscaneada || pantallaSistema.classList.contains('pantalla-activa')) return;

    // 2. CORRECCIÓN DE NOMBRES: 'UNICEL' debe coincidir con la clave en rutasSVG
    const tipos = ['PET', 'VIDRIO', 'LATA', 'MANZANA', 'CARTON']; 
    const colores = ['transparent', 'transparent', 'transparent', 'transparent', 'transparent'];

    // 3. Lógica de dirección del scroll
    if (e.deltaY > 0) {
        currentIndex = (currentIndex + 1) % 5;
    } else {
        // Corregido el cálculo para que no de saltos extraños (usamos % 5)
        currentIndex = (currentIndex - 1 + 5) % 5;
    }

    // 4. Saltar slots vacíos
    let found = false;
    for (let i = 0; i < 5; i++) {
        let nextIdx = (currentIndex + i) % 5;
        if (!slots[nextIdx].classList.contains('empty')) {
            currentIndex = nextIdx;
            found = true;
            break;
        }
    }

    // 5. Ejecutar la función agarrar con los datos correctos
    if (found) {
        agarrar(tipos[currentIndex], colores[currentIndex], currentIndex);
    }
});

// 4. DRAG
objetoEnMano.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text', objetoEnMano.dataset.tipo);
    const ghost = objetoEnMano.cloneNode(true);
    ghost.style.position = "absolute"; ghost.style.top = "-1000px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 35, 50);
    setTimeout(() => ghost.remove(), 0);
});

// Función auxiliar para la animación de la mano
function animarMano() {
    brazos.classList.remove('golpe-minecraft');
    void brazos.offsetWidth; // Truco para reiniciar la animación de CSS
    brazos.classList.add('golpe-minecraft');
}

// 3. LECTOR DE TARJETA (Ahora por Clic)
lectorTarjeta.addEventListener('click', () => {
    const tipoEnMano = objetoEnMano.dataset.tipo;
    
    if (tipoEnMano === 'TARJETA' && !tarjetaEscaneada) {
        animarMano(); // Hace el movimiento tipo Minecraft
        limpiarObjetivos(); // Se quita el brillo al activarlo
       
        // 1. Quitamos el parpadeo amarillo de espera
        circuloLector.classList.remove('parpadear-lector-espera');
        
        // 2. Forzamos un reinicio de flujo para que el navegador note el cambio
        void circuloLector.offsetWidth; 
        
        // 3. Ponemos el parpadeo verde de éxito
        circuloLector.classList.add('lector-exito-anim');
        
        
        setTimeout(() => {
            tarjetaEscaneada = true;
            objetoEnMano.style.display = 'none';
            // Limpiamos todo para que el lector se quede apagado
            circuloLector.classList.remove('lector-exito-anim');
            circuloLector.style.fill = "#383d3e";

            btnTarjeta.classList.add('btn-disabled'); 
            hotbar.style.display = 'flex';
            circuloLector.classList.remove('parpadear-lector-espera');
            zonaDeposito.classList.add('parpadear-espera');
            ledTexto.innerHTML = `-GRACIAS USUARIO-<br>INGRESE SUS RESIDUOS <br><br>PUNTOS: ${saldoHistorico} PTS`;
           // setTimeout(() => ledTexto.innerHTML = "GRACIAS USUARIO <br> INGRESE SUS RESIDUOS", 500);
        }, 1000); 
    }
});



zonaDeposito.addEventListener('click', () => {
    const tipoEnMano = objetoEnMano.dataset.tipo;
    const tieneObjeto = objetoEnMano.style.display !== 'none';

    if (tarjetaEscaneada && tieneObjeto && tipoEnMano !== 'TARJETA') {
        objetoEnMano.style.display = 'none';
        btnListo.style.display = 'none'; 
        // --- CAMBIO CLAVE: LIMPIAR EL SLOT DEL INVENTARIO AL INSTANTE ---
        if (currentIndex !== -1) {
            slots[currentIndex].innerHTML = ""; // Quita la imagen del slot
            slots[currentIndex].classList.add('empty'); // Lo vuelve inactivo
            slots[currentIndex].classList.remove('selected'); // Quita el borde verde
            currentIndex = -1; // Resetea el índice para que no se pueda re-seleccionar
        }

        animarMano();
        limpiarObjetivos(); 
        //lista.push(tipoEnMano); 
        
        const puntosDelResiduo = puntosResiduos[tipoEnMano] || 0;
        
        // Guardamos el saldo ANTES de sumar para el mensaje
        const saldoAntes = saldoHistorico;
        lista.push(tipoEnMano); 
        saldoHistorico += puntosDelResiduo; // Sumamos al saldo real inmediatamente

        // --- SOLUCIÓN AL PARPADEO (FORZAR REINICIO) ---
        // Primero quitamos cualquier rastro de la animación
        circuloDeposito.classList.remove('lector-exito-anim');
        circuloDeposito.style.animation = 'none';
        
        // Usamos un pequeño timeout para que el navegador "olvide" la animación anterior
        setTimeout(() => {
            circuloDeposito.style.animation = ''; // Limpiamos el estilo inline
            circuloDeposito.classList.add('lector-exito-anim'); // Ponemos la clase de nuevo
        }, 10);

        setTimeout(() => {
            ledTexto.innerText = "PROCESANDO...";
            ledTexto.style.opacity = '1'; // FADE IN de "Procesando"

            // 3. Esperamos un momento procesando y luego FADE OUT otra vez
            setTimeout(() => {
                ledTexto.style.opacity = '0';

                setTimeout(() => {
                    
                    //const puntos = puntosResiduos[tipoEnMano] || 0;
                    
                   // MENSAJE ACUMULADO DINÁMICO
                    ledTexto.innerHTML = `PUNTOS: ${saldoAntes} PTS<br>${tipoEnMano} + ${puntosDelResiduo} PTS`;
                    ledTexto.style.opacity = '1';
                    btnListo.style.display = 'block';

                    //Al terminar el éxito, volvemos a poner el parpadeo de espera suave
                    circuloDeposito.classList.add('parpadear-espera')

                    if (currentIndex !== -1) {
                        slots[currentIndex].innerHTML = ""; 
                        slots[currentIndex].classList.add('empty');
                        slots[currentIndex].classList.remove('selected');
                        
                    }
                }, 100); // Tiempo del desvanecimiento
            }, 1500); // Tiempo que se queda leyendo "Procesando"
        }, 100); 
    }
});

// --- FUNCIÓN PARA GENERAR NÚMERO DE TARJETA ALEATORIO ---
function generarNumeroTarjeta() {
    const p1 = Math.floor(Math.random() * 900) + 100;
    const p2 = Math.floor(Math.random() * 900) + 100;
    const p3 = Math.floor(Math.random() * 900) + 100;
    return `${p1}-${p2}-${p3}`;
}

function finalizarSesion() {
    ledTexto.innerText = "GENERANDO RESUMEN...";
    btnListo.style.display = 'none';

    let puntosNuevos = 0;
    let listaDetalladaHTML = "";
    const numTarjeta = generarNumeroTarjeta();
    
    // Calculamos solo lo ganado en esta sesión
    lista.forEach(item => {
        const pts = puntosResiduos[item] || 0;
        puntosNuevos += pts;
        listaDetalladaHTML += `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.1); padding: 5px 0;">
                <span>${item}</span>
                <span style="font-weight: bold;">+${pts} pts</span>
            </div>`;
    });

    // El saldoHistorico ya tiene la suma total porque la hicimos en el clic del depósito
    const saldoAnterior = saldoHistorico - puntosNuevos;

    setTimeout(() => {
        escenario.classList.add('escenario-oscuro');
        brazos.style.opacity = '0';
        uiControles.style.opacity = '0';
        pantallaSistema.style.display = 'flex';
        
        setTimeout(() => {
            pantallaSistema.classList.add('pantalla-activa');
            textoPantallaSistema.innerHTML = `
                <div style="text-align: center; width: 100%;">
                    <h1 style="font-size: 2.2rem; margin-bottom: 10px;">RESUMEN DE DEPÓSITO</h1>
                    <p style="color: #666;">Puntos anteriores: ${saldoAnterior} pts</p>
                    <p style="color: #27ae60; font-weight: bold;">Ganado hoy: +${puntosNuevos} pts</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0; text-align: left; max-height: 150px; overflow-y: auto;">
                        ${listaDetalladaHTML}
                    </div>

                    <h2 style="font-size: 1.5rem; margin-bottom: 20px;">TOTAL ACTUAL: ${saldoHistorico} PTS</h2>
                    
                    <div id="contenedor-botones-final">
                        <button onclick="mostrarRecompensas(${puntosNuevos})" style="padding: 15px 35px; border-radius: 50px; border: none; background: #393a3b; color: white; font-weight: bold; cursor: pointer;">
                            VER RECOMPENSAS
                        </button>
                    </div>
                </div>
            `;
        }, 50); 
    }, 800);
}

function mostrarRecompensas(puntosSesion) {
    // IMPORTANTE: saldoHistorico YA incluye los puntosSesion porque los sumamos en el click del depósito
    const totalReal = Number(saldoHistorico);
    const contenedor = document.getElementById('contenedor-botones-final');
    
    // La condición ahora es limpia y directa
    const tieneSuficiente = totalReal >= 500;

    contenedor.innerHTML = `
        <div style="text-align: center; font-family: 'Plus Jakarta Sans', sans-serif;">
            <h3 style="margin-bottom: 5px;">CATÁLOGO DE RECOMPENSAS</h3>
            <p style="font-size: 0.9rem; color: #666; margin-bottom: 15px;">
                Meta: 500 pts = $5.00 MXN o Descuentos
            </p>

            <div style="display: flex; flex-direction: column; gap: 0px; align-items: center;">
                
                <button onclick="acumularPuntos(${puntosSesion})" 
                    style="width: 280px; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 50px; font-weight: bold; cursor: pointer;">
                    ACUMULAR PUNTOS (+${puntosSesion} pts)
                </button>

                <hr style="width: 80%; border: 0; border-top: 1px solid #eee; margin: 5px 0;">

                <button onclick="${tieneSuficiente ? "alert('¡Felicidades! Se ha abonado $5.00 MXN a tu tarjeta del METRO')" : "alert('Aún no tienes suficientes puntos')"}" 
                    class="${tieneSuficiente ? 'btn-premio-activo' : 'btn-premio-bloqueado'}"
                    style="width: 280px; padding: 10px; border-radius: 50px; font-weight: bold; border: none;">
                    SALDO A TARJETA ($5.00 MXN) 
                    ${!tieneSuficiente ? `<br><span style="font-size: 0.7rem;">Faltan ${500 - totalReal} pts</span>` : ""}
                </button>

                <hr style="width: 80%; border: 0; border-top: 1px solid #eee; margin: 5px 0;">

                <button onclick="${tieneSuficiente ? "alert('225-6965-2705-5825 - Código de Descuento del 5% en OXXO, 7-Eleven o Circle K')" : "alert('Aún no tienes suficientes puntos')"}" 
                    class="${tieneSuficiente ? 'btn-premio-activo' : 'btn-premio-bloqueado'}"
                    style="width: 280px; padding: 10px; border-radius: 50px; font-weight: bold; border: none;">
                    DESCUENTO 5% (OXXO / 7-E / C-K)
                </button>
            </div>

            <button onclick="location.reload()" style="margin-top: 20px; background: none; border: none; color: #7f8c8d; text-decoration: underline; cursor: pointer;">
                Finalizar y Salir
            </button>
        </div>
    `;
}

function acumularPuntos(nuevosPuntos) {
    
    // en el evento 'click' de la zonaDeposito.
    
    // El saldoHistorico ya es 487 (en tu ejemplo)
    const saldoFinal = Number(saldoHistorico); 
    // El saldo anterior real era el actual menos lo que acabamos de ganar
    const saldoAnteriorReal = saldoFinal - Number(nuevosPuntos);
    
    const contenedor = document.getElementById('contenedor-botones-final');
    contenedor.innerHTML = `
        <div style="animation: fadeIn 0.5s ease; text-align: center;">
            <h2 style="color: #27ae60;">¡PUNTOS ACUMULADOS!</h2>
            <p style="font-size: 1.1rem;">Tu saldo anterior: ${saldoAnteriorReal} pts</p>
            <p style="font-size: 1.3rem; font-weight: 800;">Nuevo Saldo: ${saldoFinal} pts</p>
            
            ${saldoFinal >= 500 
                ? '<p style="color: #f1c40f; font-weight: bold;">¡YA TIENES PREMIOS DISPONIBLES!</p>' 
                : `<p style="color: #666;">Te faltan ${500 - saldoFinal} pts para obtener $5.00 MXN o Un Código de Descuento del %5 en (OXXO / 7-E / C-K).</p>`}
            
            <button onclick="location.reload()" style="margin-top: 20px; padding: 12px 40px; background: #393a3b; color: white; border-radius: 50px; border: none; cursor: pointer;">
                ACEPTAR Y SALIR
            </button>
        </div>
    `;
}
