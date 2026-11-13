import React, { useState, useEffect } from 'react';
import {
  obtenerEstudiantesAPI,
  actualizarEstudianteAPI,
  eliminarEstudianteAPI,
  obtenerDocentesAPI,
  crearDocenteAPI,
  actualizarDocenteAPI,
  eliminarDocenteAPI,
  obtenerEmpresasAPI,
  crearEmpresaAPI,
  actualizarEmpresaAPI,
  eliminarEmpresaAPI,
  obtenerSupervisoresAPI,
  crearSupervisorAPI,
  actualizarSupervisorAPI,
  eliminarSupervisorAPI,
  obtenerPracticantesAPI,
  crearPracticanteAPI,
  eliminarPracticanteAPI,
  darVistoBuenoFolderAPI,
  obtenerProgramasAPI,
  obtenerModulosAPI,
  obtenerCurriculaProgramaAPI,
  crearModuloAPI,
  crearUCAPI,
  crearIndicadorAPI,
  obtenerAsistenciasAPI,
  validarAsistenciaAPI,
  validarTodasAsistenciasAPI
} from '../../services/api';

export default function PanelAdmin({ session, userRole, onLogout }) {
  const rolActual = userRole || session?.role || 'Administrador';
  const idUsuarioActual = session?.id_usuario || '';
  const esAdmin = rolActual === 'Administrador';

  const [seccion, setSeccion] = useState('estudiantes');
  const [cargando, setCargando] = useState(false);

  const [programas, setProgramas] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [practicantes, setPracticantes] = useState([]);

  const [nuevoDocente, setNuevoDocente] = useState({
    id_programa: '',
    codigo_docente: '',
    dni: '',
    nombres: '',
    apellidos: ''
  });
  const [editandoDocente, setEditandoDocente] = useState(null);

  const [nuevaEmpresa, setNuevaEmpresa] = useState({
    ruc: '',
    razon_social: '',
    direccion: '',
    telefono: '',
    correo_empresa: '',
    representante: '',
    estado_convenio: 'Vigente'
  });
  const [editandoEmpresa, setEditandoEmpresa] = useState(null);

  const [nuevoSupervisor, setNuevoSupervisor] = useState({
    id_empresa: '',
    dni: '',
    nombres: '',
    apellidos: '',
    cargo: ''
  });
  const [editandoSupervisor, setEditandoSupervisor] = useState(null);

  const [nuevoPracticante, setNuevoPracticante] = useState({
    id_alumno: '',
    id_docente: '',
    id_empresa: '',
    id_supervisor: '',
    id_modulo: '',
    area_ejecucion: '',
    fecha_inicio: new Date().toISOString().split('T')[0]
  });

  const [modalAsistenciaPracticante, setModalAsistenciaPracticante] = useState(null);
  const [listaAsistencias, setListaAsistencias] = useState([]);
  const [cargandoAsis, setCargandoAsis] = useState(false);

  const [programaCurricula, setProgramaCurricula] = useState('2');
  const [curricula, setCurricula] = useState({ modulos: [], ucs: [], indicadores: [] });
  const [formModulo, setFormModulo] = useState({ numero_modulo: '', nombre_modulo: '', horas_requeridas: 128 });
  const [formUC, setFormUC] = useState({ id_modulo: '', codigo_uc: '', descripcion_uc: '' });
  const [formIndicador, setFormIndicador] = useState({ id_uc: '', codigo_indicador: '', descripcion_indicador: '' });

  const cargarTodo = async () => {
    setCargando(true);
    const [resProg, resMod, resEst, resDoc, resEmp, resSup, resPrac] = await Promise.all([
      obtenerProgramasAPI(),
      obtenerModulosAPI(),
      obtenerEstudiantesAPI(),
      obtenerDocentesAPI(),
      obtenerEmpresasAPI(),
      obtenerSupervisoresAPI(),
      obtenerPracticantesAPI(rolActual, idUsuarioActual)
    ]);

    if (resProg.success) setProgramas(resProg.data || []);
    if (resMod.success) setModulos(resMod.data || []);
    if (resEst.success) setEstudiantes(resEst.data || []);
    if (resDoc.success) setDocentes(resDoc.data || []);
    if (resEmp.success) setEmpresas(resEmp.data || []);
    if (resSup.success) setSupervisores(resSup.data || []);
    if (resPrac.success) setPracticantes(resPrac.data || []);
    setCargando(false);
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  useEffect(() => {
    if (seccion === 'curricula' && programaCurricula) {
      cargarCurricula(programaCurricula);
    }
  }, [seccion, programaCurricula]);

  const cargarCurricula = async (idProg) => {
    const res = await obtenerCurriculaProgramaAPI(idProg);
    if (res.success) {
      setCurricula({
        modulos: res.modulos || [],
        ucs: res.ucs || [],
        indicadores: res.indicadores || []
      });
    }
  };
  const handleAprobarEstudiante = async (est) => {
    if (!esAdmin) return;
    const res = await actualizarEstudianteAPI(est.id_alumno, { ...est, estado: 1 }, rolActual);
    if (res.success) cargarTodo();
    else alert(res.message);
  };

  const handleEliminarEstudiante = async (id_usuario) => {
    if (!esAdmin) return;
    if (!window.confirm('¿Seguro que deseas eliminar este estudiante y su usuario?')) return;
    const res = await eliminarEstudianteAPI(id_usuario, rolActual);
    if (res.success) cargarTodo();
    else alert(res.message);
  };

  const handleGuardarDocente = async (e) => {
    e.preventDefault();
    if (!esAdmin) return;
    if (editandoDocente) {
      const res = await actualizarDocenteAPI(editandoDocente.id_docente, nuevoDocente, rolActual);
      if (res.success) {
        setEditandoDocente(null);
        setNuevoDocente({ id_programa: '', codigo_docente: '', dni: '', nombres: '', apellidos: '' });
        cargarTodo();
      } else alert(res.message);
    } else {
      const res = await crearDocenteAPI(nuevoDocente, rolActual);
      if (res.success) {
        setNuevoDocente({ id_programa: '', codigo_docente: '', dni: '', nombres: '', apellidos: '' });
        cargarTodo();
      } else alert(res.message);
    }
  };

  const handleEliminarDocente = async (id_usuario) => {
    if (!esAdmin) return;
    if (!window.confirm('¿Eliminar este docente supervisor?')) return;
    const res = await eliminarDocenteAPI(id_usuario, rolActual);
    if (res.success) cargarTodo();
    else alert(res.message);
  };

  const handleGuardarEmpresa = async (e) => {
    e.preventDefault();
    if (editandoEmpresa) {
      if (!esAdmin) return alert('Solo el Administrador puede editar empresas.');
      const res = await actualizarEmpresaAPI(editandoEmpresa.id_empresa, nuevaEmpresa, rolActual);
      if (res.success) {
        setEditandoEmpresa(null);
        setNuevaEmpresa({ ruc: '', razon_social: '', direccion: '', telefono: '', correo_empresa: '', representante: '', estado_convenio: 'Vigente' });
        cargarTodo();
      } else alert(res.message);
    } else {
      const res = await crearEmpresaAPI(nuevaEmpresa, rolActual, idUsuarioActual);
      if (res.success) {
        setNuevaEmpresa({ ruc: '', razon_social: '', direccion: '', telefono: '', correo_empresa: '', representante: '', estado_convenio: 'Vigente' });
        cargarTodo();
      } else alert(res.message);
    }
  };

  const handleEliminarEmpresa = async (id_empresa) => {
    if (!esAdmin) return;
    if (!window.confirm('¿Eliminar esta empresa?')) return;
    const res = await eliminarEmpresaAPI(id_empresa, rolActual);
    if (res.success) cargarTodo();
    else alert(res.message);
  };

  const handleGuardarSupervisor = async (e) => {
    e.preventDefault();
    if (editandoSupervisor) {
      if (!esAdmin) return alert('Solo el Administrador puede editar supervisores.');
      const res = await actualizarSupervisorAPI(editandoSupervisor.id_supervisor, nuevoSupervisor, rolActual);
      if (res.success) {
        setEditandoSupervisor(null);
        setNuevoSupervisor({ id_empresa: '', dni: '', nombres: '', apellidos: '', cargo: '' });
        cargarTodo();
      } else alert(res.message);
    } else {
      const res = await crearSupervisorAPI(nuevoSupervisor, rolActual, idUsuarioActual);
      if (res.success) {
        setNuevoSupervisor({ id_empresa: '', dni: '', nombres: '', apellidos: '', cargo: '' });
        cargarTodo();
      } else alert(res.message);
    }
  };

  const handleEliminarSupervisor = async (id_usuario) => {
    if (!esAdmin) return;
    if (!window.confirm('¿Eliminar este supervisor de empresa?')) return;
    const res = await eliminarSupervisorAPI(id_usuario, rolActual);
    if (res.success) cargarTodo();
    else alert(res.message);
  };

  const handleAsignarPracticante = async (e) => {
    e.preventDefault();
    if (!esAdmin) return;
    const res = await crearPracticanteAPI(nuevoPracticante, rolActual);
    if (res.success) {
      setNuevoPracticante({
        id_alumno: '',
        id_docente: '',
        id_empresa: '',
        id_supervisor: '',
        id_modulo: '',
        area_ejecucion: '',
        fecha_inicio: new Date().toISOString().split('T')[0]
      });
      cargarTodo();
    } else alert(res.message);
  };

  const handleEliminarPracticante = async (id_practicante) => {
    if (!esAdmin) return;
    if (!window.confirm('¿Eliminar este expediente de prácticas?')) return;
    const res = await eliminarPracticanteAPI(id_practicante, rolActual);
    if (res.success) cargarTodo();
    else alert(res.message);
  };

  const handleVistoBuenoFolder = async (id_practicante) => {
    if (!window.confirm('¿Otorgar Visto Bueno final al fólder de este estudiante?')) return;
    const res = await darVistoBuenoFolderAPI(id_practicante, rolActual);
    if (res.success) {
      alert(res.message);
      cargarTodo();
    } else alert(res.message);
  };

  const abrirModalAsistencias = async (prac) => {
    setModalAsistenciaPracticante(prac);
    setCargandoAsis(true);
    const res = await obtenerAsistenciasAPI(prac.id_practicante);
    if (res.success) setListaAsistencias(res.data || []);
    setCargandoAsis(false);
  };

  const handleValidarUnaAsistencia = async (item) => {
    const nuevoEstado = item.visto_bueno === 1 ? 0 : 1;
    const res = await validarAsistenciaAPI(item.id_asistencia, modalAsistenciaPracticante.id_practicante, nuevoEstado);
    if (res.success) {
      const resAsis = await obtenerAsistenciasAPI(modalAsistenciaPracticante.id_practicante);
      if (resAsis.success) setListaAsistencias(resAsis.data || []);
      cargarTodo();
    }
  };

  const handleValidarTodo = async () => {
    if (!modalAsistenciaPracticante) return;
    const res = await validarTodasAsistenciasAPI(modalAsistenciaPracticante.id_practicante);
    if (res.success) {
      alert(res.message);
      const resAsis = await obtenerAsistenciasAPI(modalAsistenciaPracticante.id_practicante);
      if (resAsis.success) setListaAsistencias(resAsis.data || []);
      cargarTodo();
    }
  };

  const handleAgregarModulo = async (e) => {
    e.preventDefault();
    const res = await crearModuloAPI({ ...formModulo, id_programa: programaCurricula }, rolActual);
    if (res.success) {
      setFormModulo({ numero_modulo: '', nombre_modulo: '', horas_requeridas: 128 });
      cargarCurricula(programaCurricula);
      cargarTodo();
    } else alert(res.message);
  };

  const handleAgregarUC = async (e) => {
    e.preventDefault();
    const res = await crearUCAPI(formUC, rolActual);
    if (res.success) {
      setFormUC({ id_modulo: '', codigo_uc: '', descripcion_uc: '' });
      cargarCurricula(programaCurricula);
    } else alert(res.message);
  };

  const handleAgregarIndicador = async (e) => {
    e.preventDefault();
    const res = await crearIndicadorAPI(formIndicador, rolActual);
    if (res.success) {
      setFormIndicador({ id_uc: '', codigo_indicador: '', descripcion_indicador: '' });
      cargarCurricula(programaCurricula);
    } else alert(res.message);
  };

  const alumnoSeleccionadoObj = estudiantes.find((e) => String(e.id_alumno) === String(nuevoPracticante.id_alumno));
  const modulosFiltrados = alumnoSeleccionadoObj
    ? modulos.filter((m) => String(m.id_programa) === String(alumnoSeleccionadoObj.id_programa))
    : modulos;
  const docentesFiltrados = alumnoSeleccionadoObj
    ? docentes.filter((d) => String(d.id_programa) === String(alumnoSeleccionadoObj.id_programa))
    : docentes;
  const supervisoresFiltrados = nuevoPracticante.id_empresa
    ? supervisores.filter((s) => String(s.id_empresa) === String(nuevoPracticante.id_empresa))
    : supervisores;

  const listaEstudiantesVisibles = esAdmin
    ? estudiantes
    : estudiantes.filter((e) => e.estado === 0);
  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-indigo-950 text-white flex flex-col justify-between p-5 shrink-0">
        <div>
          <div className="border-b border-indigo-900 pb-4 mb-5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
              IESTP "A.A.C.D." - Huancayo
            </span>
            <h2 className="text-lg font-black tracking-tight">Gestión EFSRT</h2>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#C91414] text-white text-[11px] font-bold rounded-full">
              {rolActual}
            </span>
          </div>

          <nav className="space-y-1.5 text-sm">
            {[
              { id: 'estudiantes', label: esAdmin ? 'Estudiantes' : 'Estudiantes Pendientes' },
              { id: 'empresas', label: 'Empresas' },
              { id: 'supervisores', label: 'Supervisores Empresa' },
              { id: 'docentes', label: 'Docentes Supervisores' },
              { id: 'expedientes', label: esAdmin ? 'Expedientes / Fólder' : 'Mis Asignados' },
              ...(esAdmin ? [{ id: 'curricula', label: 'Currícula (9 Carreras)' }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSeccion(tab.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold transition cursor-pointer ${
                  seccion === tab.id ? 'bg-[#C91414] text-white shadow' : 'text-indigo-200 hover:bg-indigo-900/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2.5 bg-indigo-900 hover:bg-indigo-800 rounded-xl text-xs font-bold uppercase tracking-wider text-indigo-200 cursor-pointer"
        >
          Cerrar Sesión
        </button>
      </aside>

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {cargando ? (
          <p className="text-slate-500 font-medium">Cargando información del sistema...</p>
        ) : (
          <>
            {seccion === 'estudiantes' && (
              <div>
                <h1 className="text-2xl font-black text-indigo-950 mb-1">
                  {esAdmin ? 'Registro de Estudiantes' : 'Estudiantes Pendientes de Aprobación'}
                </h1>
                <p className="text-xs text-slate-500 mb-6">
                  {esAdmin
                    ? 'Aprueba solicitudes pendientes o gestiona los datos de los estudiantes.'
                    : 'Lista de estudiantes pendientes de aprobación por el Administrador (Solo lectura).'}
                </p>
                <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 border-b text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="p-3.5">Código</th>
                        <th className="p-3.5">DNI</th>
                        <th className="p-3.5">Apellidos y Nombres</th>
                        <th className="p-3.5">Programa de Estudios</th>
                        <th className="p-3.5">Período / Turno</th>
                        <th className="p-3.5">Estado</th>
                        {esAdmin && <th className="p-3.5 text-right">Acciones (Solo Admin)</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {listaEstudiantesVisibles.map((est) => (
                        <tr key={est.id_alumno} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-bold text-indigo-950">{est.codigo_estudiante}</td>
                          <td className="p-3.5">{est.dni}</td>
                          <td className="p-3.5 font-medium">
                            {est.apellidos}, {est.nombres}
                            <span className="block text-xs text-slate-400">{est.correo}</span>
                          </td>
                          <td className="p-3.5 text-xs font-semibold text-slate-700">{est.nombre_programa}</td>
                          <td className="p-3.5 text-xs">{est.periodo_academico} • {est.turno}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${est.estado === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {est.estado === 1 ? 'Activo' : 'Pendiente'}
                            </span>
                          </td>
                          {esAdmin && (
                            <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                              {est.estado === 0 && (
                                <button onClick={() => handleAprobarEstudiante(est)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                                  Aprobar Acceso
                                </button>
                              )}
                              <button onClick={() => handleEliminarEstudiante(est.id_usuario)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                                Eliminar
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {seccion === 'empresas' && (
              <div>
                <h1 className="text-2xl font-black text-indigo-950 mb-1">Sedes de Prácticas (Empresas)</h1>
                <p className="text-xs text-slate-500 mb-6">
                  Los Docentes y el Administrador pueden registrar nuevas empresas. Solo el Administrador puede editar o eliminar.
                </p>

                <form onSubmit={handleGuardarEmpresa} className="bg-white p-5 rounded-2xl shadow-sm border mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="text" maxLength="11" required placeholder="RUC (11 dígitos)" value={nuevaEmpresa.ruc} onChange={(e) => setNuevaEmpresa({ ...nuevaEmpresa, ruc: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                  <input type="text" required placeholder="Razón Social" value={nuevaEmpresa.razon_social} onChange={(e) => setNuevaEmpresa({ ...nuevaEmpresa, razon_social: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                  <input type="text" placeholder="Dirección" value={nuevaEmpresa.direccion} onChange={(e) => setNuevaEmpresa({ ...nuevaEmpresa, direccion: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                  <input type="text" placeholder="Teléfono" value={nuevaEmpresa.telefono} onChange={(e) => setNuevaEmpresa({ ...nuevaEmpresa, telefono: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                  <input type="email" placeholder="Correo / Página Web" value={nuevaEmpresa.correo_empresa} onChange={(e) => setNuevaEmpresa({ ...nuevaEmpresa, correo_empresa: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">
                      {editandoEmpresa ? 'Guardar Cambios' : '+ Registrar Empresa'}
                    </button>
                    {editandoEmpresa && (
                      <button type="button" onClick={() => { setEditandoEmpresa(null); setNuevaEmpresa({ ruc: '', razon_social: '', direccion: '', telefono: '', correo_empresa: '', representante: '', estado_convenio: 'Vigente' }); }} className="px-3 bg-slate-200 rounded-xl text-xs font-bold">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
                <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 border-b text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="p-3.5">RUC</th>
                        <th className="p-3.5">Razón Social</th>
                        <th className="p-3.5">Dirección</th>
                        <th className="p-3.5">Contacto</th>
                        <th className="p-3.5">Registrado por</th>
                        <th className="p-3.5">Convenio</th>
                        {esAdmin && <th className="p-3.5 text-right">Acciones (Solo Admin)</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {empresas.map((emp) => (
                        <tr key={emp.id_empresa} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-bold">{emp.ruc}</td>
                          <td className="p-3.5 font-semibold text-indigo-950">{emp.razon_social}</td>
                          <td className="p-3.5 text-xs text-slate-600">{emp.direccion}</td>
                          <td className="p-3.5 text-xs">{emp.telefono} <span className="block text-slate-400">{emp.correo_empresa}</span></td>
                          <td className="p-3.5 text-xs text-slate-500">{emp.registrado_por}</td>
                          <td className="p-3.5"><span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">{emp.estado_convenio}</span></td>
                          {esAdmin && (
                            <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                              <button onClick={() => { setEditandoEmpresa(emp); setNuevaEmpresa(emp); }} className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer">Editar</button>
                              <button onClick={() => handleEliminarEmpresa(emp.id_empresa)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer">Eliminar</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {seccion === 'supervisores' && (
              <div>
                <h1 className="text-2xl font-black text-indigo-950 mb-1">Supervisores de Empresa</h1>
                <p className="text-xs text-slate-500 mb-6">Quienes evalúan la Ficha a 100 puntos. Su usuario y clave inicial es su DNI.</p>

                <form onSubmit={handleGuardarSupervisor} className="bg-white p-5 rounded-2xl shadow-sm border mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select required value={nuevoSupervisor.id_empresa} onChange={(e) => setNuevoSupervisor({ ...nuevoSupervisor, id_empresa: e.target.value })} className="border rounded-xl p-2.5 text-sm bg-white">
                    <option value="">-- Seleccione Empresa --</option>
                    {empresas.map((e) => <option key={e.id_empresa} value={e.id_empresa}>{e.razon_social} ({e.ruc})</option>)}
                  </select>
                  {!editandoSupervisor && (
                    <input type="text" maxLength="8" required placeholder="DNI del Supervisor" value={nuevoSupervisor.dni} onChange={(e) => setNuevoSupervisor({ ...nuevoSupervisor, dni: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                  )}
                  <input type="text" required placeholder="Nombres" value={nuevoSupervisor.nombres} onChange={(e) => setNuevoSupervisor({ ...nuevoSupervisor, nombres: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                  <input type="text" required placeholder="Apellidos" value={nuevoSupervisor.apellidos} onChange={(e) => setNuevoSupervisor({ ...nuevoSupervisor, apellidos: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                  <input type="text" required placeholder="Cargo" value={nuevoSupervisor.cargo} onChange={(e) => setNuevoSupervisor({ ...nuevoSupervisor, cargo: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">
                      {editandoSupervisor ? 'Actualizar' : '+ Registrar Supervisor'}
                    </button>
                    {editandoSupervisor && (
                      <button type="button" onClick={() => { setEditandoSupervisor(null); setNuevoSupervisor({ id_empresa: '', dni: '', nombres: '', apellidos: '', cargo: '' }); }} className="px-3 bg-slate-200 rounded-xl text-xs font-bold">Cancelar</button>
                    )}
                  </div>
                </form>
                <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 border-b text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="p-3.5">DNI (Usuario)</th>
                        <th className="p-3.5">Apellidos y Nombres</th>
                        <th className="p-3.5">Cargo</th>
                        <th className="p-3.5">Empresa</th>
                        <th className="p-3.5">Registrado por</th>
                        {esAdmin && <th className="p-3.5 text-right">Acciones (Solo Admin)</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {supervisores.map((sup) => (
                        <tr key={sup.id_supervisor} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-bold">{sup.dni}</td>
                          <td className="p-3.5 font-medium">{sup.apellidos}, {sup.nombres}</td>
                          <td className="p-3.5 text-xs">{sup.cargo}</td>
                          <td className="p-3.5 text-xs font-semibold text-indigo-950">{sup.razon_social}</td>
                          <td className="p-3.5 text-xs text-slate-500">{sup.registrado_por}</td>
                          {esAdmin && (
                            <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                              <button onClick={() => { setEditandoSupervisor(sup); setNuevoSupervisor(sup); }} className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer">Editar</button>
                              <button onClick={() => handleEliminarSupervisor(sup.id_usuario)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer">Eliminar</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {seccion === 'docentes' && (
              <div>
                <h1 className="text-2xl font-black text-indigo-950 mb-1">Docentes Supervisores</h1>
                <p className="text-xs text-slate-500 mb-6">{esAdmin ? 'Únicamente el Administrador crea, edita o elimina registros de docentes.' : 'Vista de consulta de docentes supervisores.'}</p>

                {esAdmin && (
                  <form onSubmit={handleGuardarDocente} className="bg-white p-5 rounded-2xl shadow-sm border mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select required value={nuevoDocente.id_programa} onChange={(e) => setNuevoDocente({ ...nuevoDocente, id_programa: e.target.value })} className="border rounded-xl p-2.5 text-sm bg-white">
                      <option value="">-- Programa de Estudios --</option>
                      {programas.map((p) => <option key={p.id_programa} value={p.id_programa}>{p.nombre_programa}</option>)}
                    </select>
                    <input type="text" required placeholder="Código Docente" value={nuevoDocente.codigo_docente} onChange={(e) => setNuevoDocente({ ...nuevoDocente, codigo_docente: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                    {!editandoDocente && (
                      <input type="text" maxLength="8" required placeholder="DNI (Usuario/Clave)" value={nuevoDocente.dni} onChange={(e) => setNuevoDocente({ ...nuevoDocente, dni: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                    )}
                    <input type="text" required placeholder="Nombres" value={nuevoDocente.nombres} onChange={(e) => setNuevoDocente({ ...nuevoDocente, nombres: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                    <input type="text" required placeholder="Apellidos" value={nuevoDocente.apellidos} onChange={(e) => setNuevoDocente({ ...nuevoDocente, apellidos: e.target.value })} className="border rounded-xl p-2.5 text-sm" />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">
                        {editandoDocente ? 'Actualizar Docente' : '+ Registrar Docente'}
                      </button>
                      {editandoDocente && (
                        <button type="button" onClick={() => { setEditandoDocente(null); setNuevoDocente({ id_programa: '', codigo_docente: '', dni: '', nombres: '', apellidos: '' }); }} className="px-3 bg-slate-200 rounded-xl text-xs font-bold">Cancelar</button>
                      )}
                    </div>
                  </form>
                )}

                <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 border-b text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="p-3.5">Código</th>
                        <th className="p-3.5">DNI</th>
                        <th className="p-3.5">Apellidos y Nombres</th>
                        <th className="p-3.5">Programa de Estudios</th>
                        {esAdmin && <th className="p-3.5 text-right">Acciones (Solo Admin)</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {docentes.map((doc) => (
                        <tr key={doc.id_docente} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-bold">{doc.codigo_docente}</td>
                          <td className="p-3.5">{doc.dni}</td>
                          <td className="p-3.5 font-medium">{doc.apellidos}, {doc.nombres}</td>
                          <td className="p-3.5 text-xs font-semibold text-indigo-950">{doc.nombre_programa}</td>
                          {esAdmin && (
                            <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                              <button onClick={() => { setEditandoDocente(doc); setNuevoDocente(doc); }} className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer">Editar</button>
                              <button onClick={() => handleEliminarDocente(doc.id_usuario)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer">Eliminar</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {seccion === 'expedientes' && (
              <div>
                <h1 className="text-2xl font-black text-indigo-950 mb-1">
                  {esAdmin ? 'Expedientes y Validación EFSRT' : 'Mis Estudiantes Asignados'}
                </h1>
                <p className="text-xs text-slate-500 mb-6">
                  {esAdmin
                    ? 'Asigna Docente, Empresa, Supervisor y Módulo a cada estudiante activo.'
                    : 'Valida el control de asistencia diaria (128h) y otorga el Visto Bueno final al fólder de tus estudiantes a cargo.'}
                </p>

                {esAdmin && (
                  <form onSubmit={handleAsignarPracticante} className="bg-white p-5 rounded-2xl shadow-sm border mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select required value={nuevoPracticante.id_alumno} onChange={(e) => setNuevoPracticante({ ...nuevoPracticante, id_alumno: e.target.value, id_modulo: '', id_docente: '' })} className="border rounded-xl p-2.5 text-sm bg-white">
                      <option value="">1. Seleccione Estudiante Activo</option>
                      {estudiantes.filter((e) => e.estado === 1).map((e) => (
                        <option key={e.id_alumno} value={e.id_alumno}>{e.apellidos}, {e.nombres} ({e.nombre_programa})</option>
                      ))}
                    </select>
                    <select required value={nuevoPracticante.id_modulo} onChange={(e) => setNuevoPracticante({ ...nuevoPracticante, id_modulo: e.target.value })} className="border rounded-xl p-2.5 text-sm bg-white">
                      <option value="">2. Seleccione Módulo Técnico</option>
                      {modulosFiltrados.map((m) => <option key={m.id_modulo} value={m.id_modulo}>Mód. {m.numero_modulo}: {m.nombre_modulo}</option>)}
                    </select>
                    <select required value={nuevoPracticante.id_docente} onChange={(e) => setNuevoPracticante({ ...nuevoPracticante, id_docente: e.target.value })} className="border rounded-xl p-2.5 text-sm bg-white">
                      <option value="">3. Asignar Docente Supervisor</option>
                      {docentesFiltrados.map((d) => <option key={d.id_docente} value={d.id_docente}>{d.apellidos}, {d.nombres}</option>)}
                    </select>
                    <select required value={nuevoPracticante.id_empresa} onChange={(e) => setNuevoPracticante({ ...nuevoPracticante, id_empresa: e.target.value, id_supervisor: '' })} className="border rounded-xl p-2.5 text-sm bg-white">
                      <option value="">4. Seleccione Empresa</option>
                      {empresas.map((emp) => <option key={emp.id_empresa} value={emp.id_empresa}>{emp.razon_social} ({emp.ruc})</option>)}
                    </select>
                    <select value={nuevoPracticante.id_supervisor} onChange={(e) => setNuevoPracticante({ ...nuevoPracticante, id_supervisor: e.target.value })} className="border rounded-xl p-2.5 text-sm bg-white">
                      <option value="">5. Supervisor de Empresa (Opcional)</option>
                      {supervisoresFiltrados.map((s) => <option key={s.id_supervisor} value={s.id_supervisor}>{s.apellidos}, {s.nombres} ({s.cargo})</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input type="date" required value={nuevoPracticante.fecha_inicio} onChange={(e) => setNuevoPracticante({ ...nuevoPracticante, fecha_inicio: e.target.value })} className="border rounded-xl p-2.5 text-sm w-1/2" />
                      <button type="submit" className="w-1/2 bg-[#C91414] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">+ Asignar</button>
                    </div>
                  </form>
                )}

                <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 border-b text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="p-3.5">Estudiante</th>
                        <th className="p-3.5">Módulo / Empresa</th>
                        <th className="p-3.5">Docente / Supervisor</th>
                        <th className="p-3.5 text-center">Horas (128h)</th>
                        <th className="p-3.5 text-center">Nota Empresa</th>
                        <th className="p-3.5 text-center">Fólder</th>
                        <th className="p-3.5 text-right">Validación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {practicantes.map((p) => (
                        <tr key={p.id_practicante} className="hover:bg-slate-50">
                          <td className="p-3.5">
                            <p className="font-bold text-indigo-950">{p.apellidos}, {p.nombres}</p>
                            <span className="text-[11px] text-slate-400">{p.nombre_programa}</span>
                          </td>
                          <td className="p-3.5 text-xs">
                            <p className="font-semibold">Mód. {p.numero_modulo}: {p.nombre_modulo}</p>
                            <span className="text-slate-500">{p.razon_social}</span>
                          </td>
                          <td className="p-3.5 text-xs">
                            <p><strong>Doc:</strong> {p.docente_nombre}</p>
                            <p className="text-slate-500"><strong>Sup:</strong> {p.supervisor_nombre || 'Sin asignar'}</p>
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-indigo-950">{p.horas_certificadas} / 128h</td>
                          <td className="p-3.5 text-center text-xs">
                            {p.puntaje_ficha_100 !== null ? (
                              <span className="font-bold text-emerald-700">{p.puntaje_ficha_100} pts ({p.resultado})</span>
                            ) : (
                              <span className="text-slate-400 italic">Pendiente Sup.</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.estado_folder === 'Validado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {p.estado_folder}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button onClick={() => abrirModalAsistencias(p)} className="px-2.5 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold cursor-pointer">
                              Validar Horas
                            </button>
                            {p.estado_folder !== 'Validado' && (
                              <button onClick={() => handleVistoBuenoFolder(p.id_practicante)} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                                V°B° Fólder
                              </button>
                            )}
                            {esAdmin && (
                              <button onClick={() => handleEliminarPracticante(p.id_practicante)} className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {seccion === 'curricula' && esAdmin && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-indigo-950">Currícula Multiprograma (9 Carreras)</h1>
                    <p className="text-xs text-slate-500">Configura los Módulos, Unidades de Competencia (UC) e Indicadores de Logro por carrera.</p>
                  </div>
                  <select value={programaCurricula} onChange={(e) => setProgramaCurricula(e.target.value)} className="bg-white border-2 border-indigo-950 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-950">
                    {programas.map((p) => <option key={p.id_programa} value={p.id_programa}>{p.id_programa}. {p.nombre_programa}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <form onSubmit={handleAgregarModulo} className="bg-white p-4 rounded-2xl border shadow-sm space-y-2.5">
                    <h3 className="text-xs font-black uppercase text-indigo-950">1. Nuevo Módulo Técnico</h3>
                    <input type="text" required placeholder="N° Módulo (Ej: I, II, III)" value={formModulo.numero_modulo} onChange={(e) => setFormModulo({ ...formModulo, numero_modulo: e.target.value })} className="w-full border rounded-xl p-2 text-xs" />
                    <input type="text" required placeholder="Nombre del Módulo Profesional" value={formModulo.nombre_modulo} onChange={(e) => setFormModulo({ ...formModulo, nombre_modulo: e.target.value })} className="w-full border rounded-xl p-2 text-xs" />
                    <button type="submit" className="w-full py-2 bg-indigo-950 text-white rounded-xl text-xs font-bold cursor-pointer">+ Agregar Módulo</button>
                  </form>

                  <form onSubmit={handleAgregarUC} className="bg-white p-4 rounded-2xl border shadow-sm space-y-2.5">
                    <h3 className="text-xs font-black uppercase text-indigo-950">2. Nueva Unidad de Competencia</h3>
                    <select required value={formUC.id_modulo} onChange={(e) => setFormUC({ ...formUC, id_modulo: e.target.value })} className="w-full border rounded-xl p-2 text-xs bg-white">
                      <option value="">-- Seleccione Módulo --</option>
                      {curricula.modulos.map((m) => <option key={m.id_modulo} value={m.id_modulo}>Mód. {m.numero_modulo}: {m.nombre_modulo}</option>)}
                    </select>
                    <input type="text" required placeholder="Código (Ej: UC1)" value={formUC.codigo_uc} onChange={(e) => setFormUC({ ...formUC, codigo_uc: e.target.value })} className="w-full border rounded-xl p-2 text-xs" />
                    <input type="text" required placeholder="Descripción de la UC" value={formUC.descripcion_uc} onChange={(e) => setFormUC({ ...formUC, descripcion_uc: e.target.value })} className="w-full border rounded-xl p-2 text-xs" />
                    <button type="submit" className="w-full py-2 bg-indigo-950 text-white rounded-xl text-xs font-bold cursor-pointer">+ Agregar UC</button>
                  </form>

                  <form onSubmit={handleAgregarIndicador} className="bg-white p-4 rounded-2xl border shadow-sm space-y-2.5">
                    <h3 className="text-xs font-black uppercase text-indigo-950">3. Nuevo Indicador de Logro</h3>
                    <select required value={formIndicador.id_uc} onChange={(e) => setFormIndicador({ ...formIndicador, id_uc: e.target.value })} className="w-full border rounded-xl p-2 text-xs bg-white">
                      <option value="">-- Seleccione UC --</option>
                      {curricula.ucs.map((u) => <option key={u.id_uc} value={u.id_uc}>{u.codigo_uc}: {u.descripcion_uc.slice(0, 35)}...</option>)}
                    </select>
                    <input type="text" required placeholder="Código (Ej: IL1)" value={formIndicador.codigo_indicador} onChange={(e) => setFormIndicador({ ...formIndicador, codigo_indicador: e.target.value })} className="w-full border rounded-xl p-2 text-xs" />
                    <input type="text" required placeholder="Descripción del Indicador" value={formIndicador.descripcion_indicador} onChange={(e) => setFormIndicador({ ...formIndicador, descripcion_indicador: e.target.value })} className="w-full border rounded-xl p-2 text-xs" />
                    <button type="submit" className="w-full py-2 bg-[#C91414] text-white rounded-xl text-xs font-bold cursor-pointer">+ Agregar Indicador</button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-indigo-950">Estructura Registrada del Programa</h3>
                  {curricula.modulos.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aún no hay módulos registrados para esta carrera.</p>
                  ) : (
                    curricula.modulos.map((mod) => (
                      <div key={mod.id_modulo} className="border rounded-xl p-4 bg-slate-50/60">
                        <h4 className="font-bold text-indigo-950 text-sm">Módulo {mod.numero_modulo}: {mod.nombre_modulo} ({mod.horas_requeridas} hrs)</h4>
                        <div className="mt-2 space-y-2 pl-4 border-l-2 border-indigo-200">
                          {curricula.ucs.filter((u) => u.id_modulo === mod.id_modulo).map((uc) => (
                            <div key={uc.id_uc} className="text-xs">
                              <p className="font-bold text-slate-800">{uc.codigo_uc}: {uc.descripcion_uc}</p>
                              <ul className="list-disc pl-5 text-slate-600 mt-1">
                                {curricula.indicadores.filter((il) => il.id_uc === uc.id_uc).map((il) => (
                                  <li key={il.id_indicador}><strong>{il.codigo_indicador}:</strong> {il.descripcion_indicador}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      {modalAsistenciaPracticante && (
        <div className="fixed inset-0 z-50 bg-indigo-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#C91414]">Control de Asistencia y Actividades (Meta: 128 horas)</span>
                <h3 className="text-xl font-black text-indigo-950">{modalAsistenciaPracticante.apellidos}, {modalAsistenciaPracticante.nombres}</h3>
                <p className="text-xs text-slate-500">Módulo {modalAsistenciaPracticante.numero_modulo}: {modalAsistenciaPracticante.nombre_modulo}</p>
              </div>
              <div className="flex items-center gap-2">
                {listaAsistencias.length > 0 && (
                  <button onClick={handleValidarTodo} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl shadow cursor-pointer">
                    ✓ Validar Todo
                  </button>
                )}
                <button onClick={() => setModalAsistenciaPracticante(null)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer">
                  Cerrar &times;
                </button>
              </div>
            </div>

            {cargandoAsis ? (
              <p className="text-center py-6 text-sm text-slate-500">Cargando jornadas...</p>
            ) : listaAsistencias.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400 italic">El estudiante aún no ha registrado actividades en su ficha diaria.</p>
            ) : (
              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-indigo-950 text-white uppercase">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Horario</th>
                      <th className="p-3 text-center">Horas</th>
                      <th className="p-3">Actividades Realizadas</th>
                      <th className="p-3 text-center">Visto Bueno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {listaAsistencias.map((item) => (
                      <tr key={item.id_asistencia} className="hover:bg-slate-50">
                        <td className="p-3 font-medium whitespace-nowrap">{new Date(item.fecha).toLocaleDateString('es-PE')}</td>
                        <td className="p-3 whitespace-nowrap">{item.hora_entrada.slice(0, 5)} - {item.hora_salida.slice(0, 5)}</td>
                        <td className="p-3 text-center font-bold text-indigo-950">{item.horas_sesion}h</td>
                        <td className="p-3 text-slate-700">{item.actividades}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleValidarUnaAsistencia(item)}
                            className={`px-3 py-1 rounded-full font-bold cursor-pointer transition ${
                              item.visto_bueno === 1 ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            {item.visto_bueno === 1 ? '✓ Validado' : 'Pendiente (Validar)'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

