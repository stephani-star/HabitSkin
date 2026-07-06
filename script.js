const formulario = document.querySelector('form');
const contenedorTarjetas = document.getElementById('contenedor-tarjetas');
const momentoSelect = document.getElementById('momento');
const bloqueHoraEspecifica = document.getElementById('bloque-hora-especifica');
const inputHora = document.getElementById('hora');

// LLAVES MAESTRAS DE TELEGRAM
const TELEGRAM_TOKEN = '8979727245:AAGks6dgCdNm9wz7oM3Z8vOp6OFIYB6eTAc';
const TELEGRAM_CHAT_ID = '1879289573';

let listaMedicamentos = [];

// Truco visual: Mostrar u ocultar el reloj según lo que selecciones
momentoSelect.addEventListener('change', function() {
    if (momentoSelect.value === 'especifica') {
        bloqueHoraEspecifica.style.display = 'block';
        inputHora.required = true;
    } else {
        bloqueHoraEspecifica.style.display = 'none';
        inputHora.required = false;
        inputHora.value = ''; // Limpiamos la hora
    }
});

// FUNCIÓN PARA MANDAR MENSAJE DE CONFIRMACIÓN / RECORDATORIO A TELEGRAM
function enviarNotificacionTelegram(item) {
    let emoji = item.tipo === 'skincare' ? '🧴' : '💊';
    
    let textoMomento = '';
    if (item.momento === 'desayuno') textoMomento = '☀️ Mañana / Desayuno';
    else if (item.momento === 'comida') textoMomento = '🌤️ Tarde / Comida';
    else if (item.momento === 'cena') textoMomento = '🌙 Noche / Cena';
    else if (item.momento === 'manana-noche') textoMomento = '☀️🌙 Mañana y Noche';
    else if (item.momento === 'especifica') textoMomento = `⏰ Hora exacta: ${item.hora}`;

    let textoFecha = item.fechaTermino ? item.fechaTermino : '♾️ Uso continuo';

    // Construimos el mensaje con formato lindo usando emojis
    const mensaje = `✨ *¡Nuevo Recordatorio Programado!* ✨\n\n` +
                    `${emoji} *Producto:* ${item.producto}\n` +
                    `✨ *Dosis:* ${item.cantidad}\n` +
                    `⏰ *Momento:* ${textoMomento}\n` +
                    `📅 *Días:* ${item.dias}\n` +
                    `🛑 *Termina:* ${textoFecha}\n` +
                    `${item.notas ? `📝 *Notas:* ${item.notas}` : ''}`;

    // Llamada oficial a la API de Telegram para enviar el mensaje en tiempo real
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: mensaje,
            parse_mode: 'Markdown' // Permite poner letras en negritas
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error('Error al enviar a Telegram');
        } else {
            console.log('¡Notificación enviada con éxito a Telegram!');
        }
    })
    .catch(error => console.error('Error de red:', error));
}

// 1. FUNCIÓN PARA DIBUJAR LAS TARJETAS EN PANTALLA
function renderizarTarjetas() {
    contenedorTarjetas.innerHTML = '';

    if (listaMedicamentos.length === 0) {
        contenedorTarjetas.innerHTML = '<p>Tu lista está vacía. ¡Agrega tu primer medicamento o crema arriba!</p>';
        return;
    }

    listaMedicamentos.forEach((item) => {
        let emoji = item.tipo === 'skincare' ? '🧴' : '💊';
        let colorFondo = item.tipo === 'skincare' ? '#ffe0b2' : '#fff9c4'; 
        let colorBorde = item.tipo === 'skincare' ? '#ffcc80' : '#fff59d';

        let textoMomento = '';
        if (item.momento === 'desayuno') textoMomento = '☀️ Mañana / Desayuno';
        else if (item.momento === 'comida') textoMomento = '🌤️ Tarde / Comida';
        else if (item.momento === 'cena') textoMomento = '🌙 Noche / Cena';
        else if (item.momento === 'manana-noche') textoMomento = '☀️🌙 Mañana y Noche';
        else if (item.momento === 'especifica') {
            const horaEntera = parseInt(item.hora.split(':')[0]);
            let emojiSolLuna = (horaEntera >= 6 && horaEntera < 19) ? '☀️' : '🌙';
            textoMomento = `${emojiSolLuna} Hora exacta: ${item.hora}`;
        }

        let textoFechaTermino = item.fechaTermino ? item.fechaTermino : '♾️ Uso continuo';

        const nuevaTarjeta = document.createElement('div');
        nuevaTarjeta.style.backgroundColor = colorFondo;
        nuevaTarjeta.style.border = `2px dashed ${colorBorde}`;
        nuevaTarjeta.style.borderRadius = '15px';
        nuevaTarjeta.style.padding = '15px';
        nuevaTarjeta.style.marginBottom = '15px';
        nuevaTarjeta.style.textAlign = 'left';

        nuevaTarjeta.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: #4e342e; font-size: 1.3rem;">${emoji} ${item.producto}</h3>
            <p style="margin: 0; font-size: 0.95rem; color: #4e342e; line-height: 1.4; margin-bottom: 10px;">
                <strong>✨ Dosis/Aplicación:</strong> ${item.cantidad} <br>
                <strong>⏰ Momento:</strong> ${textoMomento} <br>
                <strong>📅 Días:</strong> ${item.dias} <br>
                <strong>🛑 Termina el:</strong> ${textoFechaTermino}
            </p>
            
            ${item.notas ? `
            <div style="background-color: rgba(255,255,255,0.6); padding: 8px 12px; border-radius: 10px; font-size: 0.85rem; border: 1px solid rgba(0,0,0,0.05); margin-bottom: 12px;">
                <strong>📝 Instrucciones médicas:</strong><br>${item.notas}
            </div>
            ` : ''}

            <div style="text-align: right;">
                <button onclick="editarRecordatorio('${item.id}')" style="width: auto; padding: 5px 12px; font-size: 0.85rem; background-color: #fff9c4; border-color: #fff59d; box-shadow: 0px 2px 0px #fff59d; margin-right: 5px; color: #4e342e; border-style: solid; border-width: 1px; border-radius: 5px; cursor: pointer;">✏️ Editar</button>
                <button onclick="borrarRecordatorio('${item.id}')" style="width: auto; padding: 5px 12px; font-size: 0.85rem; background-color: #ffcc80; border-color: #ffb74d; box-shadow: 0px 2px 0px #ffb74d; color: #4e342e; border-style: solid; border-width: 1px; border-radius: 5px; cursor: pointer;">🗑️ Borrar</button>
            </div>
        `;

        contenedorTarjetas.appendChild(nuevaTarjeta);
    });
}

function guardarEnStorage() {
    localStorage.setItem('misMedicamentosPurosV4', JSON.stringify(listaMedicamentos));
}

function cargarRecordatorios() {
    const datosGuardados = localStorage.getItem('misMedicamentosPurosV4');
    if (datosGuardados) {
        listaMedicamentos = JSON.parse(datosGuardados);
    }
    renderizarTarjetas();
}

formulario.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const tipo = document.getElementById('tipo').value;
    const producto = document.getElementById('producto').value;
    const cantidad = document.getElementById('cantidad').value;
    const momento = document.getElementById('momento').value;
    const hora = document.getElementById('hora').value;
    const fechaTermino = document.getElementById('fechaTermino').value;
    const notas = document.getElementById('notas').value;

    const checkboxesMarcados = document.querySelectorAll('input[name="dias"]:checked');
    const diasSeleccionados = Array.from(checkboxesMarcados).map(cb => cb.value).join(', ');

    if (diasSeleccionados === '') {
        alert('⚠️ Por favor selecciona al menos un día de la semana.');
        return;
    }

    const nuevoItem = {
        id: Date.now().toString(),
        tipo,
        producto,
        cantidad,
        momento,
        hora,
        dias: diasSeleccionados,
        fechaTermino,
        notas
    };

    listaMedicamentos.push(nuevoItem);
    guardarEnStorage();
    renderizarTarjetas();
    
    // 🔥 ENVIAR NOTIFICACIÓN AUTOMÁTICA AL GUARDAR
    enviarNotificacionTelegram(nuevoItem);

    formulario.reset();
    bloqueHoraEspecifica.style.display = 'none';
});

function borrarRecordatorio(idABorrar) {
    listaMedicamentos = listaMedicamentos.filter(item => item.id !== idABorrar);
    guardarEnStorage();
    renderizarTarjetas();
}

function editarRecordatorio(idAEditar) {
    const itemAEditar = listaMedicamentos.find(item => item.id === idAEditar);

    if (itemAEditar) {
        document.getElementById('tipo').value = itemAEditar.tipo;
        document.getElementById('producto').value = itemAEditar.producto;
        document.getElementById('cantidad').value = itemAEditar.cantidad;
        document.getElementById('momento').value = itemAEditar.momento;
        
        if (itemAEditar.momento === 'especifica') {
            bloqueHoraEspecifica.style.display = 'block';
            document.getElementById('hora').value = itemAEditar.hora;
        } else {
            bloqueHoraEspecifica.style.display = 'none';
        }

        document.getElementById('fechaTermino').value = itemAEditar.fechaTermino;
        document.getElementById('notas').value = itemAEditar.notas;

        const todosLosCheckboxes = document.querySelectorAll('input[name="dias"]');
        todosLosCheckboxes.forEach(cb => cb.checked = false);

        const diasArray = itemAEditar.dias.split(', ');
        todosLosCheckboxes.forEach(cb => {
            if (diasArray.includes(cb.value)) {
                cb.checked = true;
            }
        });

        borrarRecordatorio(idAEditar);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

cargarRecordatorios();