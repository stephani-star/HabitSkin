// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://yrqxopmgwwzrgzwcdusy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycXhvcG1nd3d6cmd6d2NkdXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODU2MzIsImV4cCI6MjEwNjg2MTYzMn0.ogv_ZIr8STqkMJZhRlQ8XtuXL76IFdnU9t3evJKj78w'; // Pega tu llave completa aquí

// CONFIGURACIÓN DE TELEGRAM
const TELEGRAM_TOKEN = '8979727245:AAGWbBrvJxppL5e6KwHlzBtrPnw8OgKUaH8'; // Pega aquí tu token ACTIVO de BotFather
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

    // Función auxiliar para obtener valores probando varios IDs posibles en tu HTML
    const obtenerValor = (ids) => {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.value.trim() !== '') return el.value.trim();
      }
      return '';
    };

    // Lectura de campos
    const nombreVal = obtenerValor(['nombre', 'producto', 'nombreMedicamento', 'medicamento']);
    const tipoVal = obtenerValor(['tipo', 'categoria']) || 'medicamento';
    const dosisVal = obtenerValor(['dosis', 'dosisAplicacion']);
    const momentoVal = obtenerValor(['momento', 'horario']);
    const horaVal = obtenerValor(['hora', 'horaEspecifica']);
    const diasVal = obtenerValor(['dias', 'diasUso', 'frecuencia']);
    const terminaVal = obtenerValor(['termina', 'fechaFin', 'fechaTermino']);
    const notasVal = obtenerValor(['notas', 'observaciones', 'indicaciones']);

    const nuevoItem = {
      nombre: nombreVal,
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
    const horarioTexto = momentoVal === 'especifica' ? `⏰ ${horaVal}` : momentoVal;

    let mensajeTelegram = `✨ *¡Nuevo Recordatorio Programado!* ✨\n\n` +
      `${emojiTipo} *Producto:* ${nombreVal || 'Sin nombre'}\n` +
      `📌 *Dosis:* ${dosisVal || 'Según indicación'}\n` +
      `⏰ *Momento:* ${horarioTexto || 'No especificado'}`;

    if (diasVal) {
      mensajeTelegram += `\n📅 *Días:* ${diasVal}`;
    }
    if (terminaVal) {
      mensajeTelegram += `\n🛑 *Termina:* ${terminaVal}`;
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
      console.log('Notificación enviada a Telegram con formato completo');
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
