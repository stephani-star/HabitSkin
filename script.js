// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://yrqxopmgwwzrgzwcdusy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kAdWCJcRLBWtS1d2tyzi3Q_dg--5zK4'; // Pega aquí tu llave completa

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// CONFIGURACIÓN DE TELEGRAM
const TELEGRAM_TOKEN = '8979727245:AAGks6dgCdNm9wZ7oM3Z8VOp60FIYB6eTAc';
const TELEGRAM_CHAT_ID = '1879289573';

const formulario = document.querySelector('form');
const contenedorTarjetas = document.getElementById('contenedor-tarjetas');
const momentoSelect = document.getElementById('momento');
const bloqueHoraEspecifica = document.getElementById('bloque-hora-especifica');
const inputHora = document.getElementById('hora');

if (momentoSelect) {
  momentoSelect.addEventListener('change', function() {
    if (momentoSelect.value === 'especifica') {
      bloqueHoraEspecifica.style.display = 'block';
      inputHora.required = true;
    } else {
      bloqueHoraEspecifica.style.display = 'none';
      inputHora.required = false;
      inputHora.value = '';
    }
  });
}

// Cargar medicamentos desde Supabase
async function cargarMedicamentos() {
  const { data, error } = await supabaseClient
    .from('medicamentos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al cargar datos:', error);
    return;
  }

  renderizarTarjetas(data);
}

// Renderizar las tarjetas en la página
function renderizarTarjetas(lista) {
  if (!contenedorTarjetas) return;
  contenedorTarjetas.innerHTML = '';

  if (!lista || lista.length === 0) {
    contenedorTarjetas.innerHTML = '<p>No tienes medicamentos o rutinas registradas.</p>';
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

// Guardar nuevo medicamento en Supabase
if (formulario) {
  formulario.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nuevoItem = {
      nombre: document.getElementById('nombre').value,
      tipo: document.getElementById('tipo').value,
      dosis: document.getElementById('dosis').value,
      momento: document.getElementById('momento').value,
      hora: document.getElementById('hora').value
    };

    const { error } = await supabaseClient
      .from('medicamentos')
      .insert([nuevoItem]);

    if (error) {
      console.error('Error al guardar:', error);
      alert('Ocurrió un error al guardar en la base de datos.');
      return;
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
    return;
  }

  cargarMedicamentos();
}

// Cargar los datos iniciales
cargarMedicamentos();
