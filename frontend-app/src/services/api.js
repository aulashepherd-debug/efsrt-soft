// frontend-app/src/services/api.js
const API_URL = 'http://localhost:5000/api';

const getHeaders = (role = '', userId = '', isJson = true) => {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (role) headers['x-user-role'] = role;
  if (userId) headers['x-user-id'] = String(userId);
  return headers;
};

// =========================================================================
// 1. AUTENTICACIÓN Y PRIMER INGRESO
// =========================================================================

export const loginAPI = async (username, password, role) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password, role }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error en la petición API:", error);
    return { success: false, message: 'No se pudo conectar con el servidor.' };
  }
};

export const cambiarPasswordAPI = async (id_usuario, dni_actual, nueva_password) => {
  try {
    const response = await fetch(`${API_URL}/auth/cambiar-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id_usuario, dni_actual, nueva_password }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'No se pudo conectar con el servidor.' };
  }
};

// =========================================================================
// 2. INSCRIPCIÓN EN LÍNEA Y PORTAL ESTUDIANTE
// =========================================================================

export const registrarSolicitudAPI = async (datosAlumno) => {
  try {
    const response = await fetch(`${API_URL}/solicitudes/registrar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datosAlumno),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'No se pudo conectar con el servidor.' };
  }
};

export const obtenerPerfilEstudianteAPI = async (username) => {
  try {
    const res = await fetch(`${API_URL}/estudiantes/mi-perfil/${username}`);
    return await res.json();
  } catch (error) {
    return { success: false, message: 'No se pudo conectar con el servidor.' };
  }
};

// =========================================================================
// 3. CATÁLOGO ACADÉMICO (9 PROGRAMAS, MÓDULOS, UC E INDICADORES)
// =========================================================================

export const obtenerProgramasAPI = async () => {
  try {
    const res = await fetch(`${API_URL}/programas`);
    return await res.json();
  } catch (error) {
    return { success: false, message: 'Error al obtener programas.' };
  }
};

export const obtenerModulosAPI = async () => {
  try {
    const res = await fetch(`${API_URL}/modulos`);
    return await res.json();
  } catch (error) {
    return { success: false, message: 'Error al obtener módulos.' };
  }
};

export const obtenerCurriculaProgramaAPI = async (id_programa) => {
  try {
    const res = await fetch(`${API_URL}/curricula/${id_programa}`);
    return await res.json();
  } catch (error) {
    return { success: false, message: 'Error al obtener currícula.' };
  }
};

export const crearModuloAPI = async (datos, role) => {
  const res = await fetch(`${API_URL}/curricula/modulo`, {
    method: 'POST',
    headers: getHeaders(role),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const crearUCAPI = async (datos, role) => {
  const res = await fetch(`${API_URL}/curricula/uc`, {
    method: 'POST',
    headers: getHeaders(role),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const crearIndicadorAPI = async (datos, role) => {
  const res = await fetch(`${API_URL}/curricula/indicador`, {
    method: 'POST',
    headers: getHeaders(role),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

// =========================================================================
// 4. GESTIÓN DE ESTUDIANTES
// =========================================================================

export const obtenerEstudiantesAPI = async () => {
  const res = await fetch(`${API_URL}/estudiantes`);
  return await res.json();
};

export const actualizarEstudianteAPI = async (id_alumno, datos, role) => {
  const res = await fetch(`${API_URL}/estudiantes/${id_alumno}`, {
    method: 'PUT',
    headers: getHeaders(role),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const eliminarEstudianteAPI = async (id_usuario, role) => {
  const res = await fetch(`${API_URL}/estudiantes/${id_usuario}`, {
    method: 'DELETE',
    headers: getHeaders(role, '', false),
  });
  return await res.json();
};

// =========================================================================
// 5. GESTIÓN DE DOCENTES SUPERVISORES
// =========================================================================

export const obtenerDocentesAPI = async () => {
  const res = await fetch(`${API_URL}/docentes`);
  return await res.json();
};

export const crearDocenteAPI = async (datos, role) => {
  const res = await fetch(`${API_URL}/docentes`, {
    method: 'POST',
    headers: getHeaders(role),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const actualizarDocenteAPI = async (id_docente, datos, role) => {
  const res = await fetch(`${API_URL}/docentes/${id_docente}`, {
    method: 'PUT',
    headers: getHeaders(role),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const eliminarDocenteAPI = async (id_usuario, role) => {
  const res = await fetch(`${API_URL}/docentes/${id_usuario}`, {
    method: 'DELETE',
    headers: getHeaders(role, '', false),
  });
  return await res.json();
};

// =========================================================================
// 6. GESTIÓN DE EMPRESAS (Con auditoría x-user-id)
// =========================================================================

export const obtenerEmpresasAPI = async () => {
  const res = await fetch(`${API_URL}/empresas`);
  return await res.json();
};

export const crearEmpresaAPI = async (datos, role, userId) => {
  const res = await fetch(`${API_URL}/empresas`, {
    method: 'POST',
    headers: getHeaders(role, userId),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const actualizarEmpresaAPI = async (id_empresa, datos, role) => {
  const res = await fetch(`${API_URL}/empresas/${id_empresa}`, {
    method: 'PUT',
    headers: getHeaders(role),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const eliminarEmpresaAPI = async (id_empresa, role) => {
  const res = await fetch(`${API_URL}/empresas/${id_empresa}`, {
    method: 'DELETE',
    headers: getHeaders(role, '', false),
  });
  return await res.json();
};

// =========================================================================
// 7. GESTIÓN DE SUPERVISORES DE EMPRESA (Con auditoría x-user-id)
// =========================================================================

export const obtenerSupervisoresAPI = async () => {
  const res = await fetch(`${API_URL}/supervisores`);
  return await res.json();
};

export const crearSupervisorAPI = async (datos, role, userId) => {
  const res = await fetch(`${API_URL}/supervisores`, {
    method: 'POST',
    headers: getHeaders(role, userId),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const actualizarSupervisorAPI = async (id_supervisor, datos, role) => {
  const res = await fetch(`${API_URL}/supervisores/${id_supervisor}`, {
    method: 'PUT',
    headers: getHeaders(role),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const eliminarSupervisorAPI = async (id_usuario, role) => {
  const res = await fetch(`${API_URL}/supervisores/${id_usuario}`, {
    method: 'DELETE',
    headers: getHeaders(role, '', false),
  });
  return await res.json();
};

// =========================================================================
// 8. EXPEDIENTES EFSRT / PRACTICANTES
// =========================================================================

export const obtenerPracticantesAPI = async (role = '', userId = '') => {
  const res = await fetch(`${API_URL}/practicantes`, {
    headers: getHeaders(role, userId, false),
  });
  return await res.json();
};

export const crearPracticanteAPI = async (datos, role) => {
  const res = await fetch(`${API_URL}/practicantes`, {
    method: 'POST',
    headers: getHeaders(role),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const asignarPracticanteAPI = crearPracticanteAPI;

export const darVistoBuenoFolderAPI = async (id_practicante, role) => {
  const res = await fetch(`${API_URL}/practicantes/visto-bueno/${id_practicante}`, {
    method: 'PUT',
    headers: getHeaders(role, '', false),
  });
  return await res.json();
};

export const eliminarPracticanteAPI = async (id_practicante, role) => {
  const res = await fetch(`${API_URL}/practicantes/${id_practicante}`, {
    method: 'DELETE',
    headers: getHeaders(role, '', false),
  });
  return await res.json();
};

// =========================================================================
// 9. ASISTENCIAS DIARIAS (128 HORAS)
// =========================================================================

export const obtenerAsistenciasAPI = async (id_practicante) => {
  const res = await fetch(`${API_URL}/asistencias/${id_practicante}`);
  return await res.json();
};

export const registrarAsistenciaAPI = async (datos) => {
  const res = await fetch(`${API_URL}/asistencias`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const validarAsistenciaAPI = async (id_asistencia, id_practicante, visto_bueno) => {
  const res = await fetch(`${API_URL}/asistencias/validar/${id_asistencia}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ id_practicante, visto_bueno }),
  });
  return await res.json();
};

export const validarTodasAsistenciasAPI = async (id_practicante) => {
  const res = await fetch(`${API_URL}/asistencias/validar-todo/${id_practicante}`, {
    method: 'PUT',
    headers: getHeaders(),
  });
  return await res.json();
};

// =========================================================================
// 10. PORTAL SUPERVISOR DE EMPRESA Y FICHA 100 PUNTOS
// =========================================================================

export const obtenerPracticantesSupervisorAPI = async (username) => {
  const res = await fetch(`${API_URL}/supervisor/mis-practicantes/${username}`);
  return await res.json();
};

export const registrarEvaluacionAPI = async (datos, role) => {
  const res = await fetch(`${API_URL}/evaluaciones/registrar`, {
    method: 'POST',
    headers: getHeaders(role),
    body: JSON.stringify(datos),
  });
  return await res.json();
};
