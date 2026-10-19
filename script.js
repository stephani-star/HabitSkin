// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://yrqxopmgwwzrgzwcdusy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycXhvcG1nd3d6cmd6d2NkdXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODU2MzIsImV4cCI6MjEwNjg2MTYzMn0.ogv_ZIr8STqkMJZhRlQ8XtuXL76IFdnU9t3evJKj78w';

// CONFIGURACIÓN DE TELEGRAM
const TELEGRAM_TOKEN = '8979727245:AAGWbBrvJxppL5e6KwHlzBtrPnw8OgKUaH8';
const TELEGRAM_CHAT_ID = '1879289573';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const formulario = document.querySelector('form');
const contenedorTarjetas = document.getElementById('contenedor-tarjetas');
const momentoSelect = document.getElementById('momento');
const bloqueHoraEspecifica = document.getElementById('bloque-hora-especifica');
const inputHora = document.getElementById('hora');

if (momentoSelect) {
  momentoSelect.addEventListener('change', function() {
    if (momentoSelect.value === 'especifica') {
      if (bloqueHoraEspecifica) bloqueHoraEspecifica.style.display = 'block';
      if (inputHora) inputHora.required = true;
    } else {
      if (bloqueHoraEspecifica) bloqueHoraEspecifica.style.display = 'none';
      if (inputHora) {
        inputHora.required = false;
        inputHora.value = '';
      }
    }
  });
}

// Cargar medicamentos desde Supabase
async function cargarMedicamentos() {
  try {
    const { data, error } = await supabaseClient
      .from('medicamentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar datos:', error);
      return;
    }

    renderizarTarjetas(data);
  } catch (err) {
    console.error('Error inesperado al cargar:', err);
  }
}

// Renderizar las tarjetas en la página
function renderizarTarjetas(lista) {
  if (!contenedorTarjetas) return;
  contenedorTarjetas.innerHTML = '';

  if (!lista || lista.length === 0) {
    contenedorTarjetas.innerHTML = '<p style="text-align:center; color:#666;">No tienes medicamentos o rutinas registradas.</p>';
    return;
  }

  lista.forEach((item) => {
    const tarjeta = document.createElement('div');
    tarjeta.classList.add('tarjeta');
    let textoHorario = item.momento === 'especifica' ? `⏰ ${item.hora}` : item.momento;

    tarjeta.innerHTML = `
      <h3>${item.tipo === 'skincare' ? '🧴' : '💊'} ${item.nombre}</h3>
      <p><strong>Dosis:</strong> ${item.dosis || 'N/A'}</p>
      <p><strong>Horario:</strong> ${textoHorario}</p>
      <button onclick="eliminarMedicamento(${item.id})" style="background:#ff4d4d; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Eliminar</button>
    `;

    contenedorTarjetas.appendChild(tarjeta);
  });
}

// Guardar nuevo medicamento en Supabase y enviar notificación a Telegram
if (formulario) {
  formulario.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Obtención de elementos directa basada en tu HTML
    const tipoVal = document.getElementById('tipo') ? document.getElementById('tipo').value : 'medicina';
    const productoVal = document.getElementById('producto') ? document.getElementById('producto').value.trim() : '';
    const dosisVal = document.getElementById('cantidad') ? document.getElementById('cantidad').value.trim() : '';
    const momentoVal = document.getElementById('momento') ? document.getElementById('momento').value : '';
    const horaVal = document.getElementById('hora') ? document.getElementById('hora').value : '';
    const fechaTerminoVal = document.getElementById('fechaTermino') ? document.getElementById('fechaTermino').value : '';
    const notasVal = document.getElementById('notas') ? document.getElementById('notas').value.trim() : '';

    // Obtener días seleccionados o "Diario"
    const chkDiario = document.getElementById('diario');
    let diasTexto = '';

    if (chkDiario && chkDiario.checked) {
      diasTexto = 'Diario';
    } else {
      const checkboxes = document.querySelectorAll('input[name="dias"]:checked');
      if (checkboxes.length > 0) {
        const diasArr = Array.from(checkboxes).map(cb => cb.value);
        diasTexto = diasArr.join(', ');
      }
    }

    const nuevoItem = {
      nombre: productoVal,
      tipo: tipoVal,
      dosis: dosisVal,
      momento: momentoVal,
      hora: momentoVal === 'especifica' ? horaVal : null
    };

    const { data, error } = await supabaseClient
      .from('medicamentos')
      .insert([nuevoItem]);

    if (error) {
      console.error('Error al guardar en Supabase:', error);
      alert('Error al guardar: ' + error.message);
      return;
    }

    // --- CONSTRUCCIÓN DEL MENSAJE COMPLETO DE TELEGRAM ---
    const emojiTipo = tipoVal === 'skincare' ? '🧴' : '💊';
    
    // Mapeo amigable de momentos
    const opcionesMomento = {
      'desayuno': '☀️ Mañana / Desayuno',
      'comida': '🌤️ Tarde / Comida',
      'cena': '🌙 Noche / Cena',
      'manana-noche': '☀️🌙 Mañana y Noche',
      'especifica': `⏰ ${horaVal}`
    };
    const horarioTexto = opcionesMomento[momentoVal] || momentoVal;

    let mensajeTelegram = `✨ *¡Nuevo Recordatorio Programado!* ✨\n\n` +
      `${emojiTipo} *Producto:* ${productoVal || 'Sin nombre'}\n` +
      `📌 *Dosis:* ${dosisVal || 'Según indicación'}\n` +
      `⏰ *Momento:* ${horarioTexto || 'No especificado'}`;

    if (diasTexto) {
      mensajeTelegram += `\n📅 *Días:* ${diasTexto}`;
    }
    if (fechaTerminoVal) {
      mensajeTelegram += `\n🛑 *Termina:* ${fechaTerminoVal}`;
    }
    if (notasVal) {
      mensajeTelegram += `\n📝 *Notas:* ${notasVal}`;
    }

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: mensajeTelegram,
          parse_mode: 'Markdown'
        })
      });
      console.log('Notificación enviada a Telegram');
    } catch (errTelegram) {
      console.error('Error al enviar mensaje a Telegram:', errTelegram);
    }

    formulario.reset();
    if (bloqueHoraEspecifica) bloqueHoraEspecifica.style.display = 'none';
    cargarMedicamentos();
  });
}

// Eliminar medicamento de Supabase
async function eliminarMedicamento(id) {
  const { error } = await supabaseClient
    .from('medicamentos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar:', error);
    alert('Error al eliminar: ' + error.message);
    return;
  }

  cargarMedicamentos();
}

// Cargar los datos iniciales
cargarMedicamentos();
