import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import ReglamentoView from './pages/ReglamentoView';
import PanelAdmin from './components/organisms/PanelAdmin';
import PanelEstudiante from './components/organisms/PanelEstudiante';
import PanelSupervisor from './components/organisms/PanelSupervisor';
import PanelCoordinador from './components/organisms/PanelCoordinador';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [session, setSession] = useState(null);

  const handleLoginSuccess = (userData) => {
    setSession(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentView('landing');
  };

  const renderDashboardByRole = () => {
    const role = session?.role;

    if (role === 'Estudiante') {
      return <PanelEstudiante username={session.user} onLogout={handleLogout} />;
    }

    if (role === 'Supervisor de Empresa') {
      return <PanelSupervisor username={session.user} onLogout={handleLogout} />;
    }

    if (role === 'Coordinador' || role === 'Unidad Academica') {
      return <PanelCoordinador session={session} onLogout={handleLogout} />;
    }

    // Administrador o Docente Supervisor
    return (
      <PanelAdmin 
        session={session} 
        userRole={role}
        onLogout={handleLogout} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      {currentView === 'landing' && (
        <LandingPage 
          onViewReglamento={() => setCurrentView('reglamento')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentView === 'reglamento' && (
        <ReglamentoView 
          onBack={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'dashboard' && session && renderDashboardByRole()}
    </div>
  );
}
