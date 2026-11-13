import React from 'react';

export default function FooterDesarrollador() {
  return (
    <section className="bg-slate-900 border-t border-slate-800 text-slate-300">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Bloque Izquierdo: Foto + Identidad */}
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="relative shrink-0">
            <img
              src="/desarrollador.png"
              alt="Mg. Edgard Michael Montes Shepherd"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#C91414] shadow-lg shadow-red-950/50"
            />
            <span 
              title="Docente & Desarrollador Full Stack"
              className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"
            ></span>
          </div>

          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#C91414] bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-900/40 mb-1">
              Arquitectura & Desarrollo de Software
            </span>
            <h4 className="text-base font-black text-white tracking-tight">
              Proff. Edgard Michael Montes Shepherd
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Docente • Prof. Téc. y Profesor en Computación e Informática • Maestrías en Docencia en Educación Superior y Didáctica en TIC
            </p>
          </div>
        </div>

        {/* Bloque Derecho: Sello Técnico Compacto */}
        <div className="text-center sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 w-full sm:w-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
            Plataforma SOFT-EFSRT
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Innovación Tecnológica Institucional
          </p>
        </div>

      </div>
    </section>
  );
}
