// Referencias a elementos del DOM
const loginSection = document.getElementById('login-section');
const mallaSection = document.getElementById('malla-section');
const nameInput = document.getElementById('name-input');
const ruInput = document.getElementById('ru-input');
const loginBtn = document.getElementById('login-btn');
const changeUserBtn = document.getElementById('change-user');
const currentRuSpan = document.getElementById('current-ru');
const currentUserSpan = document.getElementById('current-user');
const mallaContainer = document.getElementById('malla-container');

// Estado actual
let currentRu = '';
let currentUserName = '';
let userStates = {};

// Eventos
loginBtn.addEventListener('click', handleLogin);
changeUserBtn.addEventListener('click', handleChangeUser);

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay un usuario guardado
    const savedRu = localStorage.getItem('currentRu');
    const savedName = localStorage.getItem('currentUserName');
    
    if (savedRu && savedName) {
        ruInput.value = savedRu;
        nameInput.value = savedName;
        handleLogin();
    }
});

// Manejar el inicio de sesión
function handleLogin() {
    const ru = ruInput.value.trim();
    const name = nameInput.value.trim();
    
    if (!ru || ru.length !== 9) {
        alert('Por favor ingresa un Numero de registro válido de 9 dígitos.');
        return;
    }
    
    if (!name) {
        alert('Por favor ingresa tu nombre completo.');
        return;
    }
    
    currentRu = ru;
    currentUserName = name;
    currentRuSpan.textContent = ru;
    currentUserSpan.textContent = name;
    
    // Cargar estados guardados
    loadUserStates();
    
    // Construir la malla curricular
    buildMalla();
    
    // Mostrar la sección de malla y ocultar el login
    loginSection.style.display = 'none';
    mallaSection.style.display = 'block';
    
    // Guardar el usuario actual
    localStorage.setItem('currentRu', ru);
    localStorage.setItem('currentUserName', name);
}

// Cambiar de usuario
function handleChangeUser() {
    // Limpiar los inputs
    nameInput.value = '';
    ruInput.value = '';
    
    // Mostrar login y ocultar malla
    mallaSection.style.display = 'none';
    loginSection.style.display = 'block';
    
    // Quitar el foco del botón
    changeUserBtn.blur();
    
    // Enfocar el input
    nameInput.focus();
}

// Cargar estados del usuario desde localStorage
function loadUserStates() {
    const savedStates = localStorage.getItem(`mallaStates_${currentRu}`);
    userStates = savedStates ? JSON.parse(savedStates) : {};
}

// Guardar estados del usuario en localStorage
function saveUserStates() {
    localStorage.setItem(`mallaStates_${currentRu}`, JSON.stringify(userStates));
}

// Construir la malla curricular
function buildMalla() {
    fetch('materias.json')
        .then(response => response.json())
        .then(data => {
            renderMalla(data);
        })
        .catch(error => console.error('Error cargando materias.json:', error));
}

function renderMalla(materiasData) {
    mallaContainer.innerHTML = '';
    
    materiasData.semestres.forEach(semestre => {
        const semesterDiv = document.createElement('div');
        semesterDiv.className = 'semester';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'semester-header';
        headerDiv.innerHTML = `
            <h3>Semestre ${semestre.numero}</h3>
            <span>${semestre.cursos.length} curso${semestre.cursos.length > 1 ? 's' : ''}</span>
        `;
        
        const coursesGrid = document.createElement('div');
        coursesGrid.className = 'courses-grid';
        
        semestre.cursos.forEach(curso => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.dataset.code = curso.codigo;
            
            // Estado actual del curso
            const estado = userStates[curso.codigo] || 'pending';
            courseCard.classList.add(estado);
            
            let requisitosHTML = '';
            if (curso.requisitos && curso.requisitos.length > 0) {
                requisitosHTML = `<p class="course-req">Requisitos: ${curso.requisitos.join(', ')}</p>`;
            }
            
            courseCard.innerHTML = `
                <h3>${curso.nombre}</h3>
                <p class="course-code">${curso.codigo}</p>
                ${requisitosHTML}
                <span class="course-state">${getEstadoText(estado)}</span>
            `;
            
            // Evento para cambiar estado
            courseCard.addEventListener('click', () => {
                changeCourseState(courseCard, curso.codigo);
            });
            
            coursesGrid.appendChild(courseCard);
        });
        
        semesterDiv.appendChild(headerDiv);
        semesterDiv.appendChild(coursesGrid);
        mallaContainer.appendChild(semesterDiv);
    });
}

// Cambiar el estado de un curso
function changeCourseState(courseCard, codigo) {
    const estados = ['pending', 'approved', 'failed', 'studying'];
    const currentEstado = estados.find(e => courseCard.classList.contains(e)) || 'pending';
    const currentIndex = estados.indexOf(currentEstado);
    const nextIndex = (currentIndex + 1) % estados.length;
    const nextEstado = estados[nextIndex];
    
    // Eliminar clases de estado anteriores
    courseCard.classList.remove('pending', 'approved', 'failed', 'studying');
    
    // Añadir nuevo estado
    courseCard.classList.add(nextEstado);
    
    // Actualizar texto del estado
    const stateSpan = courseCard.querySelector('.course-state');
    if (stateSpan) {
        stateSpan.textContent = getEstadoText(nextEstado);
    }
    
    // Actualizar estado en memoria
    userStates[codigo] = nextEstado;
    
    // Guardar cambios
    saveUserStates();
}

// Obtener texto para el estado
function getEstadoText(estado) {
    switch(estado) {
        case 'pending': return 'Pendiente';
        case 'approved': return 'Aprobada';
        case 'failed': return 'Aplazada';
        case 'studying': return 'Icrito';
        default: return 'Pendiente';
    }
}
