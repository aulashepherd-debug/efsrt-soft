import React, { useState, useEffect } from 'react';
import { registrarSolicitudAPI, obtenerProgramasAPI } from '../../services/api';

export default function FormInscripcion({ onClose }) {
  const [programas, setProgramas] = useState([]);
  const [formData, setFormData] = useState({
    id_programa: '',
    codigo_estudiante: '',
    dni: '',
    nombres: '',
    apellidos: '',
    periodo_academico: '2026-II',
    turno: 'Diurno'
  });

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Cargar los 9 Programas de Estudios desde MySQL al abrir el formulario
  useEffect(() => {
    const cargarProgramas = async () => {
      const res = await obtenerProgramasAPI();
      if (res.success && res.data.length > 0) {
        setProgramas(res.data);
        // Seleccionar por defecto Diseño y Programación Web (o el primero)
        const dpw = res.data.find((p) => p.codigo_programa === 'DPW') || res.data[0];
        setFormData((prev) => ({ ...prev, id_programa: dpw.id_programa }));
      }
    };
    cargarProgramas();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    const resultado = await registrarSolicitudAPI(formData);

    if (resultado.success) {
      setMensaje({ tipo: 'exito', texto: resultado.message });
      setTimeout(() => {
        if (onClose) onClose();
      }, 2800);
    } else {
      setMensaje({ tipo: 'error', texto: resultado.message || 'Error al registrar.' });
    }

    setCargando(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mensaje.texto && (
        <div
          className={`p-3.5 rounded-xl text-sm font-semibold ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PROGRAMA DE ESTUDIOS (9 CARRERAS) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-600 uppercase">
            Programa de Estudios (IESTP "A.A.C.D.")
          </label>
          <select
            name="id_programa"
            required
            value={formData.id_programa}
            onChange={handleChange}
            className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-900"
          >
            <option value="">-- Seleccione su Programa de Estudios --</option>
            {programas.map((prog) => (
              <option key={prog.id_programa} value={prog.id_programa}>
                {prog.nombre_programa} ({prog.codigo_programa})
              </option>
            ))}
          </select>
        </div>

        {/* CÓDIGO DE ESTUDIANTE */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase">
            Código de Estudiante
          </label>
          <input
            type="text"
            name="codigo_estudiante"
            maxLength="20"
            required
            placeholder="Ej. 20260037"
            value={formData.codigo_estudiante}
            onChange={handleChange}
            className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900"
          />
        </div>

        {/* DOCUMENTO DE IDENTIDAD (DNI) */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase">
            Documento de Identidad (DNI)
          </label>
          <input
            type="text"
            name="dni"
            maxLength="8"
            pattern="[0-9]{8}"
            title="Debe contener 8 dígitos"
            required
            placeholder="8 dígitos"
            value={formData.dni}
            onChange={handleChange}
            className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900"
          />
        </div>

        {/* NOMBRES */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase">
            Nombres
          </label>
          <input
            type="text"
            name="nombres"
            maxLength="100"
            required
            value={formData.nombres}
            onChange={handleChange}
            className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900"
          />
        </div>

        {/* APELLIDOS */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase">
            Apellidos
          </label>
          <input
            type="text"
            name="apellidos"
            maxLength="100"
            required
            value={formData.apellidos}
            onChange={handleChange}
            className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900"
          />
        </div>

        {/* PERÍODO ACADÉMICO */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase">
            Período Académico
          </label>
          <select
            name="periodo_academico"
            value={formData.periodo_academico}
            onChange={handleChange}
            className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900"
          >
            <option value="2026-I">2026-I</option>
            <option value="2026-II">2026-II</option>
            <option value="2027-I">2027-I</option>
          </select>
        </div>

        {/* TURNO */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase">
            Turno
          </label>
          <select
            name="turno"
            value={formData.turno}
            onChange={handleChange}
            className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900"
          >
            <option value="Diurno">Diurno</option>
            <option value="Vespertino">Vespertino</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition cursor-pointer"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={cargando}
          className="px-6 py-2.5 bg-[#C91414] text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 shadow-md transition cursor-pointer"
        >
          {cargando ? 'Procesando...' : 'Iniciar trámite'}
        </button>
      </div>
    </form>
  );
}
