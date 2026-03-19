import { useState }     from 'react';
import { useNavigate }  from 'react-router-dom';
import { Home, BookOpen, BarChart2, AlertCircle, PlusCircle, Brain, User } from 'lucide-react';

// Tipamos el componente como React.FC (React Functional Component)
export const PatientDashboardterapisth: React.FC = () => {
    return (
         // Contenedor principal: Fondo suave (slate-50) y padding abajo para que el menú no tape el contenido
    <div className="min-h-screen bg-slate-50 font-sans pb-28">

                    {/* ZONA 1: Header */}
        <header className="px-6 pt-10 pb-8 bg-white rounded-b-3xl shadow-sm">
        <div className="flex justify-between items-start">
                <div>
            <h1 className="text-2xl font-bold text-slate-800">Hola, Carlos 👋</h1>
            <p className="text-sm text-slate-500 mt-1">Tu próxima sesión es en 3 días</p>
            </div>
          {/* Avatar temporal */}
            <div className="bg-slate-100 p-2 rounded-full text-slate-400">
            <User size={24} />
            </div>
        </div>

        {/* Radar de Ánimo Rápido (Micro-interacción) */}
        <div className="mt-8 bg-slate-50 p-4 rounded-2xl">
            <p className="text-sm font-medium text-slate-700 mb-3 text-center">¿Cómo está tu energía hoy?</p>
            <div className="flex justify-between px-2">
            {['😫', '😔', '😐', '🙂', '🤩'].map((emoji, idx) => (
                <button 
                key={idx} 
                className="text-3xl hover:scale-125 transition-transform duration-200 focus:outline-none"
                title="Registrar mi ánimo"
                >
                {emoji}
                </button>
            ))}
            </div>
        </div>
        </header>

    {/* =========================================
    ZONA 2: Centro de Acción (Hoy)
      ========================================= */}
<main className="px-6 mt-6 space-y-5">
        
        {/* Tarjeta: Mi Experimento (La "Tarea") */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          {/* Acento visual a la izquierda */}
    <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500 rounded-l-2xl"></div>
    
        <div className="flex justify-between items-start mb-2 pl-2">
            <h2 className="text-lg font-bold text-slate-800">Mi Experimento</h2>
            <span className="bg-teal-50 text-teal-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
        Esta semana
            </span>
        </div>
        <p className="text-slate-600 text-sm mb-5 pl-2 leading-relaxed">
            Ir a la panadería y pedir algo nuevo, observando si ocurre mi predicción negativa.
        </p>
    
        <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors flex justify-center items-center gap-2 border border-slate-200">
            <PlusCircle size={18} className="text-teal-500" /> Registrar Resultado
        </button>
        </div>

        {/* Tarjeta: Gimnasio Cognitivo (Llamativa y empoderadora) */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-2xl shadow-md text-white">
        
        <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-lg">
            <Brain size={24} className="text-white" />
            </div>
            <h2 className="text-lg font-bold">Gimnasio Cognitivo</h2>
        </div>
        <p className="text-teal-50 text-sm mb-5 leading-relaxed">
            ¿Un pensamiento te está molestando? Vamos a atraparlo y cuestionarlo juntos.
        </p>
        <button className="w-full py-3 bg-white text-teal-600 hover:bg-teal-50 font-bold rounded-xl transition-colors shadow-sm">
            Atrapar un Pensamiento
        </button>
        </div>

    </main>

    {/* =========================================
        ZONA 3: Barra de Navegación Inferior Flotante
      ========================================= */}
    <nav className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 bg-white px-6 py-2 flex justify-between items-end z-50 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pb-safe">
        
        <button className="flex flex-col items-center p-2 text-teal-600">
        <Home size={24} />
        <span className="text-[10px] mt-1 font-medium">Inicio</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-slate-400 hover:text-slate-600 transition-colors">
        <BookOpen size={24} />
        <span className="text-[10px] mt-1 font-medium">Biblioteca</span>
        </button>

        {/* EL BOTÓN SOS (Sobresale hacia arriba) */}
        <div className="relative -top-6">
        <button className="bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-full shadow-lg shadow-rose-200 flex flex-col items-center justify-center border-4 border-slate-50 transition-transform hover:scale-105 active:scale-95">
            <AlertCircle size={32} />
        </button>
        </div>

        <button className="flex flex-col items-center p-2 text-slate-400 hover:text-slate-600 transition-colors">
        <BarChart2 size={24} />
        <span className="text-[10px] mt-1 font-medium">Progreso</span>
        </button>

        {/* Espaciador invisible para mantener la simetría con 5 elementos visuales */}
        <div className="w-[40px]"></div>
    </nav>

    </div>
);
};

