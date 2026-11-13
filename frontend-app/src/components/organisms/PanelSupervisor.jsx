import React, { useState, useEffect } from 'react';
import { obtenerPracticantesSupervisorAPI } from '../../services/api';
import FichaEvaluacion from './FichaEvaluacion';

export default function PanelSupervisor({ username, onLogout }) {
  const [supervisor, setSupervisor] = useState(null);
  const [practicantes, setPracticantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [practicanteAEvaluar, setPracticanteAEvaluar] = useState(null);

  const cargarDatos = async () => {
    if (!username) return;
    setCargando(true);
    const res = await obtenerPracticantesSupervisorAPI(username);
    if (res.success) {
      setSupervisor(res.supervisor);
      setPracticantes(res.practicantes || []);
    } else {
      setError(res.message || 'No se pudieron cargar los practicantes.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [username]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-indigo-950 text-white shadow-lg border-b-4 border-[#C91414]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-indigo-300 font-bold">
              IESTP "A.A.C.D." - Huancayo • Portal Empresarial
            </span>
            <h1 className="text-xl font-black tracking-tight">Evaluación de Practicantes EFSRT</h1>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-[#C91414] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {cargando ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border">
            <p className="text-slate-500 font-medium">Cargando información de sede y practicantes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-sm font-medium">
            {error}
          </div>
        ) : practicanteAEvaluar ? (
          <FichaEvaluacion
            practicante={practicanteAEvaluar}
            onClose={() => setPracticanteAEvaluar(null)}
            onSaved={() => {
              setPracticanteAEvaluar(null);
              cargarDatos();
            }}
          />
        ) : (
          <div className="space-y-8">
            {supervisor && (
              <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                  <div>
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-900 text-xs font-bold rounded-full mb-2">
                      Supervisor de Empresa • {supervisor.cargo}
                    </span>
                    <h2 className="text-2xl font-black text-indigo-950">
                      {supervisor.apellidos}, {supervisor.nombres}
                    </h2>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                      Convenio {supervisor.estado_convenio || 'Vigente'}
                    </span>
                  </div>
                </div>

                {/* DATOS DE LA EMPRESA (SOLO VISUALIZACIÓN) */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">
                    Datos de la Sede de Prácticas (Solo Visualización)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 font-bold">Razón Social / RUC</p>
                      <p className="font-bold text-indigo-950">{supervisor.razon_social}</p>
                      <p className="text-xs font-mono text-slate-600">RUC: {supervisor.ruc}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold">Dirección</p>
                      <p className="font-medium text-slate-700">{supervisor.direccion || 'No registrada'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold">Contacto Institucional</p>
                      <p className="font-medium text-slate-700">{supervisor.telefono || 'Sin teléfono'}</p>
                      <p className="text-xs text-slate-500">{supervisor.correo_empresa || ''}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-indigo-950">
                  Practicantes Asignados a mi Supervisión
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  Nota mínima aprobatoria: 75 / 100 puntos
                </span>
              </div>

              {practicantes.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-sm">
                  <p className="text-indigo-950 font-bold text-base mb-1">
                    No tiene practicantes asignados actualmente
                  </p>
                  <p className="text-sm text-slate-500">
                    Cuando el Administrador asigne un estudiante a su empresa, aparecerá aquí para ser evaluado.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {practicantes.map((prac) => (
                    <div
                      key={prac.id_practicante}
                      className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div>
                            <span className="text-[11px] font-bold uppercase text-[#C91414]">
                              {prac.nombre_programa}
                            </span>
                            <h4 className="text-lg font-black text-indigo-950">
                              {prac.apellidos}, {prac.nombres}
                            </h4>
                          </div>
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-950 rounded-lg text-xs font-mono font-bold">
                            DNI: {prac.dni}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-sm text-slate-600 mb-5">
                          <p>
                            <strong className="text-slate-800">Módulo {prac.numero_modulo}:</strong> {prac.nombre_modulo}
                          </p>
                          <p>
                            <strong className="text-slate-800">Horas Validadas por Docente:</strong>{' '}
                            <span className="font-mono font-bold text-indigo-950">{prac.horas_certificadas} / 128 hrs</span>
                          </p>
                          <p>
                            <strong className="text-slate-800">Estado Fólder:</strong> {prac.estado_folder}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        {prac.puntaje_ficha_100 !== null ? (
                          <div className="bg-slate-50 rounded-2xl p-3.5 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400">Calificación Emitida</p>
                              <p className="text-sm font-bold text-slate-800">
                                {prac.puntaje_ficha_100} pts ({prac.escala_literal} - {prac.apreciacion_final}) • Nota: {prac.nota_final_vigesimal}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${
                                prac.resultado === 'Aprobado' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                              }`}
                            >
                              {prac.resultado}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl font-medium text-center">
                            Pendiente de evaluación empresarial (25 indicadores)
                          </p>
                        )}

                        <button
                          onClick={() => setPracticanteAEvaluar(prac)}
                          className="w-full py-3 bg-indigo-950 hover:bg-indigo-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition cursor-pointer"
                        >
                          {prac.puntaje_ficha_100 !== null
                            ? 'Revisar / Actualizar Ficha de Evaluación (100 pts)'
                            : 'Calificar Ficha de Evaluación (100 pts)'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
