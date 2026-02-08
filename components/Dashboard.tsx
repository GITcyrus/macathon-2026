import React, { useState } from 'react';
import { SkillPlan } from '../types';
import Button from './Button';
import { getThemeStyles } from '../utils/theme';

interface DashboardProps {
  plans: SkillPlan[];
  onSelectPlan: (planId: string) => void;
  onCreateNew: () => void;
  isLoading: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ plans, onSelectPlan, onCreateNew, isLoading, isDarkMode, onToggleDarkMode }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-violet-400 font-medium">Loading your knowledge base...</div>
        </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">My Skill Trees</h1>
            <p className="text-slate-500 dark:text-slate-400">Track your progress and expand your capabilities.</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="Global Settings"
             >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
             </button>
            <Button onClick={onCreateNew}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Skill
            </Button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-white/50 dark:bg-slate-800/50">
           <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-400">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
             </svg>
           </div>
           <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">No skills tracked yet</h3>
           <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">Start your journey by creating a new AI-generated roadmap for any skill you want to learn.</p>
           <Button variant="secondary" onClick={onCreateNew}>Create First Plan</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
             const styles = getThemeStyles(plan.theme || 'violet');
             const totalObjectives = plan.milestones.reduce((acc, m) => acc + m.objectives.length, 0);
             const completedObjectives = plan.milestones.reduce((acc, m) => acc + m.objectives.filter(t => t.status === 'completed').length, 0);
             const progress = totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;

             return (
                <div 
                    key={plan.id} 
                    onClick={() => onSelectPlan(plan.id)}
                    className={`group bg-white dark:bg-slate-900 border ${styles.border} dark:${styles.borderDark} ${styles.hoverBorder} rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl relative overflow-hidden`}
                >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full bg-gradient-to-r ${styles.gradient} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg transition-colors ${styles.iconBg} ${styles.iconText} dark:bg-opacity-10`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 border border-slate-200 dark:border-slate-700">
                            {plan.estimatedDuration}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">{plan.skillName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{plan.experienceLevel} Level</p>

                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                        <span>{completedObjectives} / {totalObjectives} objectives</span>
                        <span className={`${styles.text} font-bold`}>{progress}%</span>
                    </div>
                </div>
             );
          })}
        </div>
      )}

      {/* Global Settings Modal */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 dark:text-white">General Settings</h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Dark Mode</span>
                        <button 
                            onClick={onToggleDarkMode}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-violet-500 ${isDarkMode ? 'bg-violet-600' : 'bg-slate-200'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                    <div className="pt-2 text-xs text-slate-400 text-center">
                        More settings coming soon.
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;