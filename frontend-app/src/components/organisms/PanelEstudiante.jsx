import React, { useState, useEffect } from 'react';
import {
  obtenerPerfilEstudianteAPI,
  obtenerAsistenciasAPI,
  registrarAsistenciaAPI
} from '../../services/api';

export default function PanelEstudiante({ username, onLogout }) {
  const [alumno, setAlumno] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estados para la Ficha de Asistencia Diaria
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [cargandoAsistencias, setCargandoAsistencias] = useState(false);
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);

  const [nuevaAsistencia, setNuevaAsistencia] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora_entrada: '08:00',
    hora_salida: '14:00',
    actividades: ''
  });

  const cargarPerfil = async () => {
    if (!username) return;
    setCargando(true);
    const res = await obtenerPerfilEstudianteAPI(username);
    if (res.success) {
      setAlumno(res.alumno);
      setExpedientes(res.expedientes || []);
    } else {
      setError(res.message || 'No se pudo cargar tu expediente.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarPerfil();
  }, [username]);

  // Calcular horas automáticamente según hora de entrada y salida
  const calcularHoras = (entrada, salida) => {
    if (!entrada || !salida) return 0;
    const [h1, m1] = entrada.split(':').map(Number);
    const [h2, m2] = salida.split(':').map(Number);
    const diff = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
    return diff > 0 ? Number(diff.toFixed(2)) : 0;
  };

  const horasCalculadas = calcularHoras(
    nuevaAsistencia.hora_entrada,
    nuevaAsistencia.hora_salida
  );

  // Abrir ficha diaria al hacer clic en el botón del módulo
  const handleAbrirFichaAsistencia = async (exp) => {
    setExpedienteSeleccionado(exp);
    setCargandoAsistencias(true);
    const res = await obtenerAsistenciasAPI(exp.id_practicante);
    if (res.success) {
      setAsistencias(res.data || []);
    }
    setCargandoAsistencias(false);
  };

  // Guardar nueva jornada diaria
  const handleGuardarAsistencia = async (e) => {
    e.preventDefault();
    if (horasCalculadas <= 0) {
      return alert('La hora de salida debe ser mayor a la hora de entrada.');
    }

    setGuardandoAsistencia(true);
    const res = await registrarAsistenciaAPI({
      id_practicante: expedienteSeleccionado.id_practicante,
      fecha: nuevaAsistencia.fecha,
      hora_entrada: nuevaAsistencia.hora_entrada,
      hora_salida: nuevaAsistencia.hora_salida,
      horas_sesion: horasCalculadas,
      actividades: nuevaAsistencia.actividades
    });

    if (res.success) {
      setNuevaAsistencia({
        ...nuevaAsistencia,
        actividades: ''
      });
      // Recargar tabla de asistencias y perfil
      const resAsis = await obtenerAsistenciasAPI(expedienteSeleccionado.id_practicante);
      if (resAsis.success) setAsistencias(resAsis.data || []);
      await cargarPerfil();
    } else {
      alert(res.message || 'No se pudo registrar la actividad.');
    }
    setGuardandoAsistencia(false);
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Validado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Observado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  // Calcular total de horas registradas (validadas + pendientes)
  const totalHorasRegistradas = asistencias.reduce(
    (acc, item) => acc + Number(item.horas_sesion),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* BARRA SUPERIOR INSTITUCIONAL */}
      <header className="bg-indigo-950 text-white shadow-lg border-b-4 border-[#C91414]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-indigo-300 font-bold">
              IESTP "A.A.C.D." - Huancayo
            </span>
            <h1 className="text-xl font-black tracking-tight">Portal del Estudiante EFSRT</h1>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-[#C91414] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {cargando ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
            <p className="text-slate-500 font-medium">Cargando tu expediente académico...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-sm font-medium">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* PERFIL DEL ESTUDIANTE */}
            {alumno && (
              <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-900 text-xs font-bold rounded-full mb-2">
                      {alumno.nombre_programa} • Período {alumno.periodo_academico} ({alumno.turno})
                    </span>
                    <h2 className="text-2xl font-black text-indigo-950">
                      {alumno.apellidos}, {alumno.nombres}
                    </h2>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Código Institucional</p>
                    <p className="text-lg font-mono font-bold text-[#C91414]">{alumno.codigo_estudiante}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold uppercase text-slate-400">Documento (DNI)</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{alumno.dni}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                    <p className="text-xs font-bold uppercase text-slate-400">Correo Institucional Asignado</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{alumno.correo}</p>
                  </div>
                </div>
              </section>
            )}

            {/* LISTA DE MÓDULOS ASIGNADOS */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-indigo-950">
                  Mis Expedientes de Prácticas (Fólder EFSRT)
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  Meta requerida: 128 horas por módulo
                </span>
              </div>

              {expedientes.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-sm">
                  <p className="text-indigo-950 font-bold text-base mb-1">
                    Aún no tienes una empresa o módulo asignado
                  </p>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    El Administrador debe asignarte una empresa, docente y módulo en el panel de gestión para habilitar tu ficha diaria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {expedientes.map((exp) => {
                    const metaHoras = exp.horas_requeridas || 128;
                    const porcentajeHoras = Math.min(100, Math.round((exp.horas_certificadas / metaHoras) * 100));
                    const esActivo = expedienteSeleccionado?.id_practicante === exp.id_practicante;

                    return (
                      <div
                        key={exp.id_practicante}
                        className={`bg-white rounded-3xl p-6 shadow-sm border transition flex flex-col justify-between ${
                          esActivo ? 'border-indigo-900 ring-2 ring-indigo-900/10' : 'border-slate-200/80'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-4">
                            <h4 className="text-lg font-black text-indigo-950">
                              Módulo {exp.numero_modulo}: {exp.nombre_modulo}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEstadoBadge(exp.estado_folder)}`}>
                              Fólder {exp.estado_folder}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm text-slate-600 mb-5">
                            <p><strong className="text-slate-800">Empresa:</strong> {exp.razon_social} (RUC: {exp.ruc})</p>
                            <p><strong className="text-slate-800">Docente Supervisor:</strong> {exp.docente_nombre}</p>
                            <p><strong className="text-slate-800">Fecha de Inicio:</strong> {new Date(exp.fecha_inicio).toLocaleDateString('es-PE')}</p>
                          </div>

                          {/* BARRA DE PROGRESO DE LAS 128 HORAS */}
                          <div className="mb-5">
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-slate-500 uppercase">Horas Certificadas (Con Visto Bueno)</span>
                              <span className="text-indigo-950">{exp.horas_certificadas} / {metaHoras} hrs ({porcentajeHoras}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-indigo-900 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${porcentajeHoras}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* BOTÓN PRINCIPAL PARA RELLENAR LA FICHA DIARIA */}
                          <button
                            onClick={() => handleAbrirFichaAsistencia(exp)}
                            className="w-full py-3 bg-[#C91414] hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition cursor-pointer mb-4"
                          >
                            {esActivo ? 'Viendo Ficha de Asistencia ↓' : 'Rellenar Ficha de Control Diario'}
                          </button>
                        </div>

                        {/* RESULTADO DE EVALUACIÓN */}
                        <div className="pt-3 border-t border-slate-100">
                          {exp.puntaje_ficha_100 !== null ? (
                            <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400">Evaluación Ficha 100</p>
                                <p className="text-xs font-bold text-slate-800">
                                  Puntaje: {exp.puntaje_ficha_100} pts ({exp.escala_literal}) • Nota: {exp.nota_final_vigesimal}
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase ${
                                  exp.resultado === 'Aprobado' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                                }`}
                              >
                                {exp.resultado}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic text-center">
                              Pendiente de calificación por el Supervisor de Empresa
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* FICHA DE CONTROL DE ASISTENCIA Y ACTIVIDADES DIARIAS */}
            {expedienteSeleccionado && (
              <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-indigo-950/10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase text-[#C91414]">
                      Formato Oficial de Control Diario
                    </span>
                    <h3 className="text-xl font-black text-indigo-950">
                      Ficha de Asistencia y Actividades — Módulo {expedienteSeleccionado.numero_modulo}: {expedienteSeleccionado.nombre_modulo}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Empresa: {expedienteSeleccionado.razon_social} • Total acumulado registrado: <strong>{totalHorasRegistradas} hrs</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setExpedienteSeleccionado(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    Cerrar Ficha &times;
                  </button>
                </div>

                {/* FORMULARIO PARA REGISTRAR NUEVA JORNADA */}
                {Number(expedienteSeleccionado.horas_certificadas) >= (expedienteSeleccionado.horas_requeridas || 128) ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-bold mb-6">
                    ¡Felicitaciones! Ya has completado las {expedienteSeleccionado.horas_requeridas || 128} horas certificadas requeridas para este módulo.
                  </div>
                ) : (
                  <form onSubmit={handleGuardarAsistencia} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 mb-8 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                      + Registrar Nueva Jornada de Prácticas
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Fecha</label>
                        <input
                          type="date"
                          required
                          value={nuevaAsistencia.fecha}
                          onChange={(e) => setNuevaAsistencia({ ...nuevaAsistencia, fecha: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Hora Entrada</label>
                        <input
                          type="time"
                          required
                          value={nuevaAsistencia.hora_entrada}
                          onChange={(e) => setNuevaAsistencia({ ...nuevaAsistencia, hora_entrada: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Hora Salida</label>
                        <input
                          type="time"
                          required
                          value={nuevaAsistencia.hora_salida}
                          onChange={(e) => setNuevaAsistencia({ ...nuevaAsistencia, hora_salida: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Horas Sesión</label>
                        <div className="w-full bg-indigo-50 border border-indigo-100 text-indigo-950 font-black rounded-xl px-3 py-2 text-sm text-center">
                          {horasCalculadas} hrs
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Descripción de Actividades Realizadas
                      </label>
                      <textarea
                        rows="2"
                        required
                        placeholder="Detalle las tareas técnicas realizadas durante esta jornada..."
                        value={nuevaAsistencia.actividades}
                        onChange={(e) => setNuevaAsistencia({ ...nuevaAsistencia, actividades: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={guardandoAsistencia}
                        className="px-6 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                      >
                        {guardandoAsistencia ? 'Guardando...' : 'Agregar Actividad al Control'}
                      </button>
                    </div>
                  </form>
                )}

                {/* TABLA DE CONTROL DE ASISTENCIA */}
                {cargandoAsistencias ? (
                  <p className="text-sm text-slate-500 text-center py-6">Cargando registros de asistencia...</p>
                ) : asistencias.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">
                    Aún no has registrado actividades en esta ficha. Utiliza el formulario superior para agregar tu primer día.
                  </p>
                ) : (
                  <div className="overflow-x-auto border rounded-2xl">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-indigo-950 text-white text-[11px] uppercase">
                        <tr>
                          <th className="p-3">Ítem</th>
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Entrada</th>
                          <th className="p-3">Salida</th>
                          <th className="p-3 text-center">Horas</th>
                          <th className="p-3">Actividades Realizadas</th>
                          <th className="p-3 text-center">Visto Bueno Docente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {asistencias.map((item, idx) => (
                          <tr key={item.id_asistencia} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-500">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="p-3 whitespace-nowrap font-medium">
                              {new Date(item.fecha).toLocaleDateString('es-PE')}
                            </td>
                            <td className="p-3 whitespace-nowrap">{item.hora_entrada.slice(0, 5)}</td>
                            <td className="p-3 whitespace-nowrap">{item.hora_salida.slice(0, 5)}</td>
                            <td className="p-3 text-center font-bold text-indigo-950">{item.horas_sesion}h</td>
                            <td className="p-3 text-slate-700">{item.actividades}</td>
                            <td className="p-3 text-center whitespace-nowrap">
                              {item.visto_bueno === 1 ? (
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                                  Validado
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                                  Pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
