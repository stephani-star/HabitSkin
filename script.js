const formulario = document.querySelector('form');
const contenedorTarjetas = document.getElementById('contenedor-tarjetas');
const momentoSelect = document.getElementById('momento');
const bloqueHoraEspecifica = document.getElementById('bloque-hora-especifica');
const inputHora = document.getElementById('hora');

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

// 1. FUNCIÓN PARA DIBUJAR LAS TARJETAS EN PANTALLA
function renderizarTarjetas() {
    contenedorTarjetas.innerHTML = '';

    if (listaMedicamentos.length === 0) {
        contenedorTarjetas.innerHTML = '<p>Tu lista está vacía. ¡Agrega tu primer medicamento o crema arriba!</p>';
        return;
    }

    listaMedicamentos.forEach((item) => {
        let emoji = '💊';
        let colorFondo = '#f3e5f5'; // Morado tierno para medicina
        let colorBorde = '#e1bee7';

        if (item.tipo === 'skincare') {
            emoji = '🧴';
            colorFondo = '#fff0f3'; // Rosa tierno para skincare
            colorBorde = '#ffccd5';
        }

        // LÓGICA DEL MOMENTO DEL DÍA Y EMOJIS
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

        // LÓGICA PARA LA FECHA DE TÉRMINO OPCIONAL
        // Si hay fecha, la muestra; si está vacía, pone Uso Continuo
        let textoFechaTermino = item.fechaTermino ? item.fechaTermino : '♾️ Uso continuo';

        const nuevaTarjeta = document.createElement('div');
        nuevaTarjeta.style.backgroundColor = colorFondo;
        nuevaTarjeta.style.border = `2px dashed ${colorBorde}`;
        nuevaTarjeta.style.borderRadius = '15px';
        nuevaTarjeta.style.padding = '15px';
        nuevaTarjeta.style.marginBottom = '15px';
        nuevaTarjeta.style.textAlign = 'left';

        nuevaTarjeta.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: #5d4d6a; font-size: 1.3rem;">${emoji} ${item.producto}</h3>
            <p style="margin: 0; font-size: 0.95rem; color: #5d4d6a; line-height: 1.4; margin-bottom: 10px;">
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
                <button onclick="editarRecordatorio('${item.id}')" style="width: auto; padding: 5px 12px; font-size: 0.85rem; background-color: #ffe082; border-color: #ffd54f; box-shadow: 0px 2px 0px #ffd54f; margin-right: 5px; color: #5d4d6a;">✏️ Editar</button>
                <button onclick="borrarRecordatorio('${item.id}')" style="width: auto; padding: 5px 12px; font-size: 0.85rem; background-color: #ffab91; border-color: #ff8a65; box-shadow: 0px 2px 0px #ff8a65; color: white;">🗑️ Borrar</button>
            </div>
        `;

        contenedorTarjetas.appendChild(nuevaTarjeta);
    });
}

function guardarEnStorage() {
    localStorage.setItem('misMedicamentosPurosV2', JSON.stringify(listaMedicamentos));
}

function cargarRecordatorios() {
    const datosGuardados = localStorage.getItem('misMedicamentosPurosV2');
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
        fechaTermino, // Puede ir vacío
        notas
    };

    listaMedicamentos.push(nuevoItem);
    guardarEnStorage();
    renderizarTarjetas();
    formulario.reset();
    bloqueHoraEspecifica.style.display = 'none'; // Re-ocultamos el campo de hora
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