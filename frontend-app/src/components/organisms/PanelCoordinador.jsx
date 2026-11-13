import React, { useState, useEffect } from 'react';
import { obtenerPracticantesAPI, obtenerProgramasAPI } from '../../services/api';

const CRITERIOS_TEXTO = {
  '1a': '1.a) Se identifica con la misión y la visión de la empresa.',
  '1b': '1.b) Planifica y ejecuta organizadamente las actividades a realizar.',
  '1c': '1.c) Demuestra habilidad y seguridad en el trabajo.',
  '1d': '1.d) Organiza los materiales, herramientas y equipos a utilizar.',
  '2a': '2.a) Demuestra criterios técnicos en el desarrollo de la actividad.',
  '2b': '2.b) Toma decisiones acertadas y oportunas sobre problemas que se presentan.',
  '2c': '2.c) Emplea equipos, instrumentos y herramientas correctamente.',
  '2d': '2.d) Coopera en la conservación y mantenimiento de equipos.',
  '2e': '2.e) Practica normas de seguridad y salud en el trabajo.',
  '2f': '2.f) Se comunica con propiedad y fluidez.',
  '2g': '2.g) Tiene dominio de los procedimientos empleados en el desarrollo de las actividades.',
  '2h': '2.h) Propone proyectos de producción y/o prestación de servicios.',
  '3a': '3.a) Es puntual.',
  '3b': '3.b) Cumple con los plazos establecidos para cada tarea.',
  '3c': '3.c) Utiliza indumentaria adecuada.',
  '3d': '3.d) Evita distracciones en el horario de trabajo.',
  '4a': '4.a) Aplica normas técnicas en la ejecución de las actividades.',
  '4b': '4.b) Identifica rápidamente las dificultades.',
  '4c': '4.c) Propone mejoras en los procedimientos utilizados.',
  '5a': '5.a) Es capaz de enfrentar cualquier cambio de roles.',
  '5b': '5.b) Reconoce y aprovecha la experiencia de los demás.',
  '5c': '5.c) Fomenta la colaboración oportuna y solidaria.',
  '5d': '5.d) Ejecuta acciones de adiestramiento espontáneo a sus compañeros de trabajo.',
  '6a': '6.a) Respeta las iniciativas de los otros miembros del equipo.',
  '6b': '6.b) Admite sus errores y es capaz de aprender de ellos.'
};

export default function PanelCoordinador({ session, userRole, onLogout }) {
  const rolActivo = userRole || session?.role || 'Coordinador';
  const [expedientes, setExpedientes] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [filtroPrograma, setFiltroPrograma] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);
  const [constanciaSeleccionada, setConstanciaSeleccionada] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      const [resExp, resProg] = await Promise.all([
        obtenerPracticantesAPI(),
        obtenerProgramasAPI()
      ]);
      if (resExp.success) setExpedientes(resExp.data || []);
      if (resProg.success) setProgramas(resProg.data || []);
      setCargando(false);
    };
    cargarDatos();
  }, []);

  const expedientesFiltrados = expedientes.filter((exp) => {
    const coincideProg =
      filtroPrograma === 'TODOS' || exp.nombre_programa === filtroPrograma;
    const texto = `${exp.apellidos} ${exp.nombres} ${exp.dni} ${exp.codigo_estudiante}`.toLowerCase();
    const coincideBusq = texto.includes(busqueda.toLowerCase());
    return coincideProg && coincideBusq;
  });

  const puedeEmitirConstancia = (exp) => {
    return (
      Number(exp.horas_certificadas) >= Number(exp.horas_requeridas || 128) &&
      exp.estado_folder === 'Validado' &&
      exp.resultado === 'Aprobado'
    );
  };

  const parseIndicadores = (detalle) => {
    if (!detalle) return {};
    if (typeof detalle === 'object') return detalle;
    try {
      return JSON.parse(detalle);
    } catch {
      return {};
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* BARRA SUPERIOR (Oculta al imprimir) */}
      <header className="bg-indigo-950 text-white shadow-lg border-b-4 border-[#C91414] print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-indigo-300 font-bold">
              IESTP "Andrés Avelino Cáceres Dorregaray" — Huancayo
            </span>
            <h1 className="text-xl font-black tracking-tight">
              Portal de Consulta Académica ({rolActivo})
            </h1>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 print:p-0">
        {/* FILTROS Y BUSCADOR (Oculto al imprimir) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 mb-6 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-indigo-950">
                Fichas de Evaluación y Constancias de EFSRT
              </h2>
              <p className="text-xs text-slate-500">
                Vista de solo lectura autorizada para {rolActivo}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filtroPrograma}
                onChange={(e) => setFiltroPrograma(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
              >
                <option value="TODOS">Todos los Programas (9)</option>
                {programas.map((p) => (
                  <option key={p.id_programa} value={p.nombre_programa}>
                    {p.nombre_programa}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Buscar estudiante, DNI o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* TABLA DE EXPEDIENTES (Oculta al imprimir) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden print:hidden">
          {cargando ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Cargando expedientes académicos...
            </div>
          ) : expedientesFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm italic">
              No se encontraron registros con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-indigo-950 text-white text-[11px] uppercase">
                  <tr>
                    <th className="p-4">Estudiante</th>
                    <th className="p-4">Programa / Módulo</th>
                    <th className="p-4">Empresa</th>
                    <th className="p-4 text-center">Horas / Fólder</th>
                    <th className="p-4 text-center">Calificación</th>
                    <th className="p-4 text-right">Documentos Oficiales</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expedientesFiltrados.map((exp) => {
                    const aptoConstancia = puedeEmitirConstancia(exp);
                    return (
                      <tr key={exp.id_practicante} className="hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-bold text-indigo-950">
                            {exp.apellidos}, {exp.nombres}
                          </p>
                          <p className="text-xs text-slate-500">
                            Cód: {exp.codigo_estudiante} • DNI: {exp.dni}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold text-slate-700">{exp.nombre_programa}</p>
                          <p className="text-xs text-slate-500">
                            Módulo {exp.numero_modulo}: {exp.nombre_modulo}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-semibold text-slate-800">{exp.razon_social}</p>
                          <p className="text-[11px] text-slate-400">RUC: {exp.ruc}</p>
                        </td>
                        <td className="p-4 text-center">
                          <p className="text-xs font-bold text-indigo-950">
                            {exp.horas_certificadas} / {exp.horas_requeridas || 128}h
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              exp.estado_folder === 'Validado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Fólder {exp.estado_folder}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {exp.puntaje_ficha_100 !== null ? (
                            <div>
                              <span className="font-black text-indigo-950 text-sm">
                                {exp.puntaje_ficha_100} pts
                              </span>
                              <span className="block text-[11px] text-slate-500">
                                Escala {exp.escala_literal} ({exp.resultado})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin evaluar</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            disabled={exp.puntaje_ficha_100 === null}
                            onClick={() => setFichaSeleccionada(exp)}
                            className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed"
                          >
                            Ver Ficha 100
                          </button>

                          <button
                            disabled={!aptoConstancia}
                            onClick={() => setConstanciaSeleccionada(exp)}
                            title={
                              aptoConstancia
                                ? 'Ver e imprimir Constancia EFSRT'
                                : 'Requiere 128h validadas, fólder validado y nota aprobatoria (>=75)'
                            }
                            className="px-3 py-1.5 bg-[#C91414] hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed"
                          >
                            Constancia EFSRT
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL: VISTA DE FICHA DE EVALUACIÓN (100 PUNTOS) */}
        {fichaSeleccionada && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl my-8 print:shadow-none print:my-0 print:rounded-none">
              <div className="flex justify-between items-start border-b-2 border-indigo-950 pb-4 mb-6">
                <div>
                  <p className="text-xs font-bold uppercase text-[#C91414]">
                    IESTP "Andrés Avelino Cáceres Dorregaray" — Huancayo
                  </p>
                  <h3 className="text-xl font-black text-indigo-950">
                    FICHA OFICIAL DE EVALUACIÓN DE LAS EFSRT
                  </h3>
                </div>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-indigo-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Imprimir Ficha
                  </button>
                  <button
                    onClick={() => setFichaSeleccionada(null)}
                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border mb-6">
                <p><strong>Estudiante:</strong> {fichaSeleccionada.apellidos}, {fichaSeleccionada.nombres}</p>
                <p><strong>DNI / Código:</strong> {fichaSeleccionada.dni} / {fichaSeleccionada.codigo_estudiante}</p>
                <p><strong>Programa de Estudios:</strong> {fichaSeleccionada.nombre_programa}</p>
                <p><strong>Módulo Técnico:</strong> {fichaSeleccionada.numero_modulo} - {fichaSeleccionada.nombre_modulo}</p>
                <p><strong>Empresa:</strong> {fichaSeleccionada.razon_social} (RUC: {fichaSeleccionada.ruc})</p>
                <p><strong>Supervisor Empresa:</strong> {fichaSeleccionada.supervisor_nombre || 'No asignado'}</p>
                <p><strong>Docente Supervisor:</strong> {fichaSeleccionada.docente_nombre}</p>
                <p><strong>Horas Certificadas:</strong> {fichaSeleccionada.horas_certificadas} hrs</p>
              </div>

              {/* TABLA DE 25 INDICADORES CALIFICADOS */}
              <div className="border rounded-2xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-indigo-950 text-white">
                    <tr>
                      <th className="p-2.5">Criterios e Indicadores de Evaluación (25)</th>
                      <th className="p-2.5 text-center w-24">Puntaje (1-4)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(CRITERIOS_TEXTO).map(([clave, texto]) => {
                      const detalle = parseIndicadores(fichaSeleccionada.detalle_indicadores);
                      return (
                        <tr key={clave}>
                          <td className="p-2 text-slate-700">{texto}</td>
                          <td className="p-2 text-center font-bold text-indigo-950">
                            {detalle[clave] || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center mb-4">
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-500">Puntaje Total</p>
                  <p className="text-xl font-black text-indigo-950">{fichaSeleccionada.puntaje_ficha_100} / 100</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-500">Escala / Vigesimal</p>
                  <p className="text-xl font-black text-indigo-950">
                    {fichaSeleccionada.escala_literal} ({fichaSeleccionada.apreciacion_final}) • {fichaSeleccionada.nota_final_vigesimal}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-500">Dictamen Final</p>
                  <p className="text-xl font-black text-emerald-700">{fichaSeleccionada.resultado}</p>
                </div>
              </div>

              {fichaSeleccionada.observaciones_supervisor && (
                <p className="text-xs text-slate-600 italic">
                  <strong>Observaciones del Supervisor:</strong> {fichaSeleccionada.observaciones_supervisor}
                </p>
              )}
            </div>
          </div>
        )}

        {/* MODAL: CONSTANCIA OFICIAL DE EFSRT */}
        {constanciaSeleccionada && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-10 shadow-2xl my-8 border-4 border-double border-indigo-950 print:shadow-none print:my-0">
              <div className="flex justify-end gap-2 mb-4 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#C91414] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Imprimir Constancia
                </button>
                <button
                  onClick={() => setConstanciaSeleccionada(null)}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              <div className="text-center border-b-2 border-slate-300 pb-6 mb-8">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Ministerio de Educación — Dirección Regional de Educación Junín
                </p>
                <h2 className="text-lg font-black text-indigo-950 uppercase mt-1">
                  Instituto de Educación Superior Tecnológico Público
                </h2>
                <h3 className="text-xl font-black text-[#C91414] uppercase">
                  "Andrés Avelino Cáceres Dorregaray" — Huancayo
                </h3>
              </div>

              <h1 className="text-2xl font-black text-center text-indigo-950 underline tracking-wide mb-8">
                CONSTANCIA DE EXPERIENCIAS FORMATIVAS EN SITUACIONES REALES DE TRABAJO
              </h1>

              <div className="space-y-4 text-sm text-slate-800 leading-relaxed text-justify">
                <p>
                  La Coordinación del Programa de Estudios de{' '}
                  <strong className="uppercase">{constanciaSeleccionada.nombre_programa}</strong> y la Jefatura de
                  Unidad Académica del IESTP "Andrés Avelino Cáceres Dorregaray", hacen constar que:
                </p>

                <p className="text-center text-lg font-black text-indigo-950 py-2 uppercase">
                  {constanciaSeleccionada.apellidos}, {constanciaSeleccionada.nombres}
                </p>

                <p>
                  Identificado(a) con DNI N° <strong>{constanciaSeleccionada.dni}</strong> y Código de Estudiante{' '}
                  <strong>{constanciaSeleccionada.codigo_estudiante}</strong>, ha cumplido satisfactoriamente con
                  sus Experiencias Formativas en Situaciones Reales de Trabajo (EFSRT) correspondientes al{' '}
                  <strong>
                    Módulo Técnico Profesional {constanciaSeleccionada.numero_modulo}: {constanciaSeleccionada.nombre_modulo}
                  </strong>
                  , acumulando un total de <strong>{constanciaSeleccionada.horas_certificadas} horas</strong>{' '}
                  certificadas en la empresa <strong>{constanciaSeleccionada.razon_social}</strong> (RUC N°{' '}
                  {constanciaSeleccionada.ruc}).
                </p>

                <p>
                  Habiendo obtenido una calificación final de{' '}
                  <strong>{constanciaSeleccionada.puntaje_ficha_100} puntos</strong> en la Ficha de Evaluación
                  Empresarial (Equivalente vigesimal: <strong>{constanciaSeleccionada.nota_final_vigesimal}</strong> —
                  Escala <strong>"{constanciaSeleccionada.escala_literal}" {constanciaSeleccionada.apreciacion_final}</strong>),
                  obteniendo la condición de <strong>APROBADO</strong>.
                </p>

                <p className="pt-2">
                  Se expide la presente constancia a solicitud del interesado(a) para los fines académicos y de
                  titulación que estime conveniente.
                </p>
              </div>

              <div className="text-right text-xs text-slate-600 mt-8">
                Huancayo, {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              <div className="grid grid-cols-2 gap-12 mt-20 pt-4 text-center text-xs font-bold text-slate-700">
                <div className="border-t border-slate-400 pt-2">
                  Coordinador(a) del Programa de Estudios
                </div>
                <div className="border-t border-slate-400 pt-2">
                  Jefatura de Unidad Académica
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
