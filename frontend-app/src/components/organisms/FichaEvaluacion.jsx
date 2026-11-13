import React, { useState } from 'react';
import { registrarEvaluacionAPI } from '../../services/api';

const CRITERIOS_EFSRT = [
  {
    titulo: '1. ORGANIZACIÓN Y EJECUCIÓN DEL TRABAJO',
    items: [
      { id: '1a', texto: 'a) Se identifica con la misión y la visión de la empresa.' },
      { id: '1b', texto: 'b) Planifica y ejecuta organizadamente las actividades a realizar.' },
      { id: '1c', texto: 'c) Demuestra habilidad y seguridad en el trabajo.' },
      { id: '1d', texto: 'd) Organiza los materiales, herramientas y equipos a utilizar.' },
    ]
  },
  {
    titulo: '2. CAPACIDAD TÉCNICA Y EMPRESARIAL',
    items: [
      { id: '2a', texto: 'a) Demuestra criterios técnicos en el desarrollo de la actividad.' },
      { id: '2b', texto: 'b) Toma decisiones acertadas y oportunas sobre problemas que se presentan.' },
      { id: '2c', texto: 'c) Emplea equipos, instrumentos y herramientas correctamente.' },
      { id: '2d', texto: 'd) Coopera en la conservación y mantenimiento de equipos.' },
      { id: '2e', texto: 'e) Practica normas de seguridad y salud en el trabajo.' },
      { id: '2f', texto: 'f) Se comunica con propiedad y fluidez.' },
      { id: '2g', texto: 'g) Tiene dominio de los procedimientos empleados en el desarrollo de las actividades.' },
      { id: '2h', texto: 'h) Propone proyectos de producción y/o prestación de servicios.' },
    ]
  },
  {
    titulo: '3. CUMPLIMIENTO EN EL TRABAJO',
    items: [
      { id: '3a', texto: 'a) Es puntual.' },
      { id: '3b', texto: 'b) Cumple con los plazos establecidos para cada tarea.' },
      { id: '3c', texto: 'c) Utiliza indumentaria adecuada.' },
      { id: '3d', texto: 'd) Evita distracciones en el horario de trabajo.' },
    ]
  },
  {
    titulo: '4. CALIDAD EN LA EJECUCIÓN',
    items: [
      { id: '4a', texto: 'a) Aplica normas técnicas en la ejecución de las actividades.' },
      { id: '4b', texto: 'b) Identifica rápidamente las dificultades.' },
      { id: '4c', texto: 'c) Propone mejoras en los procedimientos utilizados.' },
    ]
  },
  {
    titulo: '5. TRABAJO EN EQUIPO',
    items: [
      { id: '5a', texto: 'a) Es capaz de enfrentar cualquier cambio de roles.' },
      { id: '5b', texto: 'b) Reconoce y aprovecha la experiencia de los demás.' },
      { id: '5c', texto: 'c) Fomenta la colaboración oportuna y solidaria.' },
      { id: '5d', texto: 'd) Ejecuta acciones de adiestramiento espontáneo a sus compañeros de trabajo.' },
    ]
  },
  {
    titulo: '6. INICIATIVA',
    items: [
      { id: '6a', texto: 'a) Respeta las iniciativas de los otros miembros del equipo.' },
      { id: '6b', texto: 'b) Admite sus errores y es capaz de aprender de ellos.' },
    ]
  }
];

export default function FichaEvaluacion({ practicante, onClose, onSaved }) {
  const [puntajes, setPuntajes] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSelectPuntaje = (id, valor) => {
    setPuntajes((prev) => ({ ...prev, [id]: Number(valor) }));
  };

  // Cálculos en tiempo real
  const totalRespondidos = Object.keys(puntajes).length;
  const puntajeTotal = Object.values(puntajes).reduce((acc, v) => acc + v, 0);
  const notaVigesimal = (puntajeTotal / 5).toFixed(2);
  const aprobado = puntajeTotal >= 75;

  const getEscala = () => {
    if (puntajeTotal >= 90) return { letra: 'A', texto: 'Muy Buena' };
    if (puntajeTotal >= 75) return { letra: 'B', texto: 'Buena' };
    if (puntajeTotal >= 63) return { letra: 'C', texto: 'Aceptable' };
    return { letra: 'D', texto: 'Deficiente' };
  };

  const escala = getEscala();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalRespondidos < 25) {
      return alert(`Faltan calificar ${25 - totalRespondidos} indicadores.`);
    }

    setGuardando(true);
    try {
      const data = await registrarEvaluacionAPI({
        id_practicante: practicante.id_practicante,
        indicadores: puntajes,
        observaciones_supervisor: observaciones
      });

      if (data.success) {
        alert(data.message);
        if (onSaved) onSaved();
        if (onClose) onClose();
      } else {
        alert(data.message || 'No se pudo guardar la evaluación.');
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-start border-b pb-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase text-[#C91414]">
            Ficha Oficial de Evaluación (25 Indicadores)
          </span>
          <h2 className="text-xl font-black text-indigo-950">
            {practicante?.apellidos}, {practicante?.nombres}
          </h2>
          <p className="text-xs text-slate-500">
            {practicante?.nombre_programa} • Módulo {practicante?.numero_modulo}: {practicante?.nombre_modulo}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Sede: {practicante?.razon_social}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer"
          >
            &times;
          </button>
        )}
      </div>

      {/* RESUMEN EN VIVO DE PUNTAJE Y ESCALA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border">
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-400">Indicadores</p>
          <p className="text-lg font-black text-indigo-950">{totalRespondidos} / 25</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-400">Puntaje Total</p>
          <p className="text-lg font-black text-indigo-950">{puntajeTotal} / 100 pts</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-400">Escala / Nota</p>
          <p className="text-lg font-black text-indigo-950">
            {escala.letra} ({escala.texto}) • {notaVigesimal}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-400">Dictamen (Mín. 75)</p>
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-black uppercase ${
              aprobado ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {aprobado ? 'Aprobado' : 'Desaprobado'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {CRITERIOS_EFSRT.map((grupo) => (
          <div key={grupo.titulo} className="border rounded-2xl overflow-hidden">
            <div className="bg-indigo-950 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
              {grupo.titulo}
            </div>
            <div className="divide-y">
              {grupo.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-700">{item.texto}</span>
                  <div className="flex gap-1.5 shrink-0">
                    {[
                      { val: 4, label: '4 - Muy Buena' },
                      { val: 3, label: '3 - Buena' },
                      { val: 2, label: '2 - Aceptable' },
                      { val: 1, label: '1 - Deficiente' }
                    ].map((op) => (
                      <button
                        type="button"
                        key={op.val}
                        onClick={() => handleSelectPuntaje(item.id, op.val)}
                        title={op.label}
                        className={`w-9 h-9 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          puntajes[item.id] === op.val
                            ? 'bg-[#C91414] text-white border-[#C91414] shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {op.val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
            Apreciación u observaciones del Supervisor de la Empresa
          </label>
          <textarea
            rows="3"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ingrese observaciones sobre el desempeño del practicante..."
            className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-900 outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-600 cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={guardando}
            className="px-6 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-sm font-bold shadow-lg cursor-pointer disabled:opacity-50"
          >
            {guardando ? 'Guardando Calificación...' : 'Guardar Ficha de Evaluación'}
          </button>
        </div>
      </form>
    </div>
  );
}
