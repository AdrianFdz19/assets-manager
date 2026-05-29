import React from 'react';
import { Lock, PlayCircle, Github, X } from 'lucide-react';

interface DemoRestrictionModalProps {
  onClose: () => void;
}

export default function DemoRestrictionModal({ onClose }: DemoRestrictionModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop con desenfoque extra para resaltar el mensaje */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Botón cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icono animado de candado */}
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner animate-pulse">
            <Lock size={40} />
          </div>

          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">
            Portfolio Demo Mode
          </h2>
          
          <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
            To maintain database integrity and prevent spam, <span className="text-amber-600 font-bold">create, edit, and delete</span> actions are disabled in this public preview.
          </p>

          <div className="w-full space-y-3">
            {/* Botón principal al Video */}
            <a 
              href="https://youtu.be/IwF-IAzvDDg?si=SaJ3ouOvWnkrymfv" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 uppercase text-xs tracking-widest"
            >
              <PlayCircle size={18} />
              Watch Full Demo Video
            </a>

            {/* Botón secundario al Código */}
            <a 
              href="https://github.com/AdrianFdz19/asset-management-system" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-white border-2 border-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all uppercase text-[10px] tracking-widest"
            >
              <Github size={16} />
              Review Source Code
            </a>
          </div>

          <button 
            onClick={onClose}
            className="mt-6 text-[10px] font-black text-gray-300 hover:text-gray-400 uppercase tracking-[0.2em] transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}