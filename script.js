// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://yrqxopmgwwzrgzwcdusy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kAdWCJcRLBWtS1d2tyzi3Q_dg--5zK4'; // Pega tu llave completa aquí

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

// Guardar nuevo medicamento en Supabase
if (formulario) {
  formulario.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Obtener elementos con verificación para evitar errores de null
    const elemNombre = document.getElementById('nombre');
    const elemTipo = document.getElementById('tipo');
    const elemDosis = document.getElementById('dosis');
    const elemMomento = document.getElementById('momento');
    const elemHora = document.getElementById('hora');

    const nuevoItem = {
      nombre: elemNombre ? elemNombre.value : '',
      tipo: elemTipo ? elemTipo.value : 'medicamento',
      dosis: elemDosis ? elemDosis.value : '',
      momento: elemMomento ? elemMomento.value : '',
      hora: (elemHora && elemHora.value) ? elemHora.value : null
    };

    const { data, error } = await supabaseClient
      .from('medicamentos')
      .insert([nuevoItem]);

    if (error) {
      console.error('Error al guardar en Supabase:', error);
      alert('Error al guardar: ' + error.message);
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
    alert('Error al eliminar: ' + error.message);
    return;
  }

  cargarMedicamentos();
}

// Cargar los datos iniciales
cargarMedicamentos();
