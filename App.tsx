import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PlanView from './components/PlanView';
import CreatePlanModal from './components/CreatePlanModal';
import { mockAuth, mockDb } from './services/store';
import { User, SkillPlan } from './types';

const App: React.FC = () => {
  // Application State
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<'dashboard' | 'plan'>('dashboard');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<SkillPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize Auth & Theme
  useEffect(() => {
    const currentUser = mockAuth.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchPlans(currentUser.uid);
    }
    
    // Check local storage for theme
    const savedTheme = localStorage.getItem('learn_flow_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('learn_flow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('learn_flow_theme', 'light');
    }
  };

  const fetchPlans = async (userId: string) => {
    setIsLoadingPlans(true);
    try {
      const userPlans = await mockDb.getPlans(userId);
      setPlans(userPlans);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    fetchPlans(newUser.uid);
  };

  const handleLogout = () => {
    mockAuth.logout();
    setUser(null);
    setPlans([]);
    setActivePage('dashboard');
  };

  const handleCreatePlan = (plan: SkillPlan) => {
    setPlans([...plans, plan]);
    setIsModalOpen(false);
    handleSelectPlan(plan.id);
  };

  const handleUpdatePlan = (updatedPlan: SkillPlan) => {
    setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setActivePage('plan');
  };

  const handleUpdateObjective = async (planId: string, milestoneId: string, objectiveId: string, status: string) => {
    // Optimistic Update
    setPlans(prev => prev.map(p => {
        if (p.id !== planId) return p;
        return {
            ...p,
            milestones: p.milestones.map(m => {
                if (m.id !== milestoneId) return m;
                return {
                    ...m,
                    objectives: m.objectives.map(o => {
                        if (o.id !== objectiveId) return o;
                        return { ...o, status: status as any };
                    })
                };
            })
        };
    }));
    await mockDb.updateObjectiveStatus(planId, milestoneId, objectiveId, status);
  };

  const handleToggleObjectiveFlag = async (planId: string, milestoneId: string, objectiveId: string) => {
    setPlans(prev => prev.map(p => {
        if (p.id !== planId) return p;
        return {
            ...p,
            milestones: p.milestones.map(m => {
                if (m.id !== milestoneId) return m;
                return {
                    ...m,
                    objectives: m.objectives.map(o => {
                        if (o.id !== objectiveId) return o;
                        return { ...o, isFlagged: !o.isFlagged };
                    })
                };
            })
        };
    }));
    await mockDb.toggleObjectiveFlag(planId, milestoneId, objectiveId);
  };

  const handleDeletePlan = async (planId: string) => {
    if(!window.confirm("Are you sure you want to delete this skill tree?")) return;
    
    await mockDb.deletePlan(planId);
    setPlans(prev => prev.filter(p => p.id !== planId));
    setActivePage('dashboard');
    setSelectedPlanId(null);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      onNavigate={(page) => {
        setActivePage(page as any);
        if(page === 'dashboard') setSelectedPlanId(null);
      }}
      currentPage={activePage}
    >
      {activePage === 'dashboard' && (
        <Dashboard 
          plans={plans}
          onSelectPlan={handleSelectPlan}
          onCreateNew={() => setIsModalOpen(true)}
          isLoading={isLoadingPlans}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      )}

      {activePage === 'plan' && selectedPlan && (
        <PlanView 
          plan={selectedPlan}
          onBack={() => {
            setActivePage('dashboard');
            setSelectedPlanId(null);
          }}
          onUpdateObjective={handleUpdateObjective}
          onDeletePlan={handleDeletePlan}
          onUpdatePlan={handleUpdatePlan}
          onToggleObjectiveFlag={handleToggleObjectiveFlag}
        />
      )}

      {isModalOpen && (
        <CreatePlanModal 
          user={user}
          onClose={() => setIsModalOpen(false)}
          onPlanCreated={handleCreatePlan}
        />
      )}
    </Layout>
  );
};

export default App;