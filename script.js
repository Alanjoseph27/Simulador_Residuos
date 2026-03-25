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
const circuloLector = lectorTarjeta.querySelector('.inner-gray-circle');
const slots = document.querySelectorAll('.item-slot');

const pantallaSistema = document.getElementById('pantalla-sistema');
const textoPantallaSistema = document.getElementById('texto-sistema');

let zoom = 0.745;
let currentIndex = -1;
let tarjetaEscaneada = false; 
let lista = []; //lista de objetos

//Puntos residuos
const puntosResiduos = { 
    'PET': 20, 
    'VIDRIO': 15, 
    'LATA': 10, 
    'MANZANA': 5, 
    'UNICEL': 8,
    'TARJETA': 0 
};

// Mapa de nombres de archivos SVG
const rutasSVG = {
    'PET': 'img/b_plastico.svg',
    'VIDRIO':'img/b_vidrio.svg',
    'LATA': 'img/lata.svg',
    'MANZANA': 'img/manzana.svg',
    'UNICEL': 'img/v_unicel.svg',
    'TARJETA': 'img/tarjeta.svg'
};

window.onload = () => {
    ledTexto.innerHTML = "BIENVENIDO<br>COLOQUE SU TARJETA EN EL SENSOR";
    circuloLector.classList.add('parpadear-lector-espera');
};

// 1. MOVIMIENTO
window.addEventListener('keydown', (e) => {
    if (pantallaSistema.classList.contains('pantalla-activa')) return;

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (e.key === 'ArrowUp') zoom += 0.015;
        if (e.key === 'ArrowDown') zoom -= 0.015;
        zoom = Math.max(0.745, Math.min(1.8, zoom));
        document.documentElement.style.setProperty('--zoom-actual', zoom);
        escenario.style.transform = `scale(${zoom})`;
        brazos.classList.add('caminando');
        escenario.classList.add('camara-caminando');

        if (zoom >= 1.3) {
            uiControles.classList.add('ui-visible');
            hotbar.style.display = tarjetaEscaneada ? 'flex' : 'none';
        } else {
            uiControles.classList.remove('ui-visible');
        }
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
    const tipos = ['PET', 'VIDRIO', 'LATA', 'MANZANA', 'UNICEL']; 
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
        // Esperamos un poquito a que la mano "golpee" para desaparecer la tarjeta
        setTimeout(() => {
            tarjetaEscaneada = true;
            objetoEnMano.style.display = 'none';
            btnTarjeta.classList.add('btn-disabled'); 
            hotbar.style.display = 'flex';
            circuloLector.classList.remove('parpadear-lector-espera');
            zonaDeposito.classList.add('parpadear-espera');
            ledTexto.innerText = "GRACIAS USUARIO";
            setTimeout(() => ledTexto.innerText = "INGRESE SUS RESIDUOS", 2000);
        }, 1500); 
    }
});

zonaDeposito.addEventListener('click', () => {
    const tipoEnMano = objetoEnMano.dataset.tipo;
    const tieneObjeto = objetoEnMano.style.display !== 'none';

    if (tarjetaEscaneada && tieneObjeto && tipoEnMano !== 'TARJETA') {
        animarMano();
        limpiarObjetivos(); 

        // ESTA LÍNEA ES LA QUE "LEE" EL OBJETO PARA EL RESUMEN
        lista.push(tipoEnMano); 

        setTimeout(() => {
            objetoEnMano.style.display = 'none';
            zonaDeposito.classList.remove('parpadear-espera');
            zonaDeposito.classList.add('parpadear-exito');

            const puntos = puntosResiduos[tipoEnMano] || 0;
            ledTexto.innerText = `${tipoEnMano}: +${puntos} PTS`;
            btnListo.style.display = 'block'; 

            if (currentIndex !== -1) {
                slots[currentIndex].innerHTML = ""; 
                slots[currentIndex].classList.add('empty');
                slots[currentIndex].classList.remove('selected');
                currentIndex = -1;
            }

            setTimeout(() => {
                zonaDeposito.classList.remove('parpadear-exito');
                zonaDeposito.classList.add('parpadear-espera');
                limpiarObjetivos();
            }, 1500);
        }, 150); 
    }
});

// --- FUNCIÓN PARA GENERAR NÚMERO DE TARJETA ALEATORIO ---
function generarNumeroTarjeta() {
    const p1 = Math.floor(Math.random() * 900) + 100;
    const p2 = Math.floor(Math.random() * 900) + 100;
    const p3 = Math.floor(Math.random() * 900) + 100;
    return `${p1}-${p2}-${p3}`;
}

// 7. FINALIZAR (CON RESUMEN DETALLADO Y RECOMPENSAS)
function finalizarSesion() {
    ledTexto.innerText = "PROCESANDO...";
    btnListo.style.display = 'none';

    let totalPuntos = 0;
    let listaDetalladaHTML = "";
    const numTarjeta = generarNumeroTarjeta();

    // Generamos la lista de objetos + sus puntos
    if (lista.length === 0) {
        listaDetalladaHTML = "<p>No se depositaron residuos.</p>";
    } else {
        lista.forEach(item => {
            const pts = puntosResiduos[item] || 0;
            totalPuntos += pts;
            listaDetalladaHTML += `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.1); padding: 5px 0;">
                    <span>${item}</span>
                    <span style="font-weight: bold;">+${pts} pts</span>
                </div>`;
        });
    }

    setTimeout(() => {
        escenario.classList.add('escenario-oscuro');
        brazos.style.opacity = '0';
        uiControles.style.opacity = '0';
        pantallaSistema.style.display = 'flex';
        
        setTimeout(() => {
            pantallaSistema.classList.add('pantalla-activa');
            textoPantallaSistema.innerHTML = `
                <div style="text-align: center; width: 100%;">
                    <h1 style="font-size: 2.5rem; margin-bottom: 10px;">RESUMEN DE DEPÓSITO</h1>
                    <p style="color: #666; margin-bottom: 20px;">Tarjeta ID: <strong>${numTarjeta}</strong></p>
                    
                    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: inset 0 0 10px rgba(0,0,0,0.05); margin-bottom: 20px; text-align: left; max-height: 200px; overflow-y: auto;">
                        ${listaDetalladaHTML}
                    </div>

                    <h2 style="font-size: 2.2rem; color: #27ae60; margin-bottom: 25px;">TOTAL: ${totalPuntos} PUNTOS</h2>
                    
                    <div id="contenedor-botones-final">
                        <button onclick="mostrarRecompensas()" style="padding: 15px 35px; font-size: 1.2rem; cursor: pointer; border-radius: 50px; border: none; background: #2980b9; color: white; font-weight: bold; transition: 0.3s;">
                            VER RECOMPENSAS
                        </button>
                    </div>
                </div>
            `;
        }, 50); 
    }, 800);
}

// --- FUNCIÓN PARA MOSTRAR OPCIONES DE RECOMPENSA ---
function mostrarRecompensas() {
    const contenedor = document.getElementById('contenedor-botones-final');
    
    // Cambiamos el botón anterior por las dos nuevas opciones
    contenedor.innerHTML = `
        <div style="display: flex; gap: 15px; justify-content: center; animation: fadeIn 0.5s ease;">
            <button onclick="alert('Saldo actual de la tarjeta actualizado')" style="padding: 15px 25px; cursor: pointer; border-radius: 10px; border: 2px solid #27ae60; background: white; color: #27ae60; font-weight: bold;">
                SALDO DE TARJETA
            </button>
            <button onclick="alert('Generando código QR de descuento...')" style="padding: 15px 25px; cursor: pointer; border-radius: 10px; border: none; background: #27ae60; color: white; font-weight: bold;">
                DESCUENTO CON QR
            </button>
        </div>
        <br>
        <button onclick="location.reload()" style="margin-top: 20px; background: none; border: none; color: #7f8c8d; text-decoration: underline; cursor: pointer;">
            Finalizar y Salir
        </button>
    `;
}