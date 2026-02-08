import React, { useState } from 'react';
import { SkillPlan, Milestone, Objective } from '../types';
import Button from './Button';
import TaskDetailModal from './TaskDetailModal';
import EditPlanModal from './EditPlanModal';
import ObjectiveQuizModal from './ObjectiveQuizModal';
import { getThemeStyles } from '../utils/theme';

interface PlanViewProps {
  plan: SkillPlan;
  onBack: () => void;
  onUpdateObjective: (planId: string, milestoneId: string, objectiveId: string, status: string) => void;
  onDeletePlan: (planId: string) => void;
  onUpdatePlan: (plan: SkillPlan) => void;
  onToggleObjectiveFlag: (planId: string, milestoneId: string, objectiveId: string) => void;
}

const PlanView: React.FC<PlanViewProps> = ({ 
  plan, 
  onBack, 
  onUpdateObjective, 
  onDeletePlan, 
  onUpdatePlan,
  onToggleObjectiveFlag 
}) => {
  const [focusedMilestoneId, setFocusedMilestoneId] = useState<string | null>(null);
  const [elaboratingObjective, setElaboratingObjective] = useState<Objective | null>(null);
  const [activeQuizObjective, setActiveQuizObjective] = useState<Objective | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const styles = getThemeStyles(plan.theme || 'violet');

  // Sort milestones by order
  const sortedMilestones = [...plan.milestones].sort((a, b) => a.order - b.order);

  // --- Helpers ---
  const getMilestoneProgress = (milestone: Milestone) => {
    const total = milestone.objectives.length;
    const completed = milestone.objectives.filter(t => t.status === 'completed').length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };
  
  const overallProgress = (() => {
    const total = plan.milestones.reduce((acc, m) => acc + m.objectives.length, 0);
    const done = plan.milestones.reduce((acc, m) => acc + m.objectives.filter(t => t.status === 'completed').length, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  })();

  // --- Detail View (Zoomed In Milestone) ---
  const activeMilestone = plan.milestones.find(m => m.id === focusedMilestoneId);
  const handleObjectiveClick = (milestoneId: string, objective: Objective) => {
    const nextStatus = {
        'not_started': 'in_progress',
        'in_progress': 'completed',
        'completed': 'not_started'
    }[objective.status];
    onUpdateObjective(plan.id, milestoneId, objective.id, nextStatus);
  };

  if (activeMilestone) {
    const progress = getMilestoneProgress(activeMilestone);
    const activeIndex = sortedMilestones.findIndex(m => m.id === activeMilestone.id);
    const prevMilestone = sortedMilestones[activeIndex - 1];
    const nextMilestone = sortedMilestones[activeIndex + 1];

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
             <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={() => setFocusedMilestoneId(null)} 
                    className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Roadmap
                </button>
            </div>
            
             <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 relative overflow-hidden`}>
                <div className="absolute top-0 left-0 h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full bg-gradient-to-r ${styles.gradient} transition-all duration-700`} style={{ width: `${progress}%` }}></div>
                </div>
                
                <div className="flex justify-between items-end mb-8">
                     <div>
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${styles.text}`}>Milestone {activeIndex + 1}</div>
                        <h2 className={`text-3xl font-bold ${styles.text}`}>{activeMilestone.title}</h2>
                     </div>
                     <span className={`${styles.text} font-bold`}>{progress}% Complete</span>
                </div>

                <div className="space-y-6">
                    {activeMilestone.objectives.map((obj) => (
                        <div key={obj.id} className={`relative p-6 rounded-2xl border-2 transition-all ${obj.status === 'completed' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900' : obj.status === 'in_progress' ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                            {/* Header Row */}
                            <div className="flex items-start gap-4">
                                 {/* Status Checkbox */}
                                 <button 
                                    onClick={() => handleObjectiveClick(activeMilestone.id, obj)}
                                    className={`mt-1 w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                        obj.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 
                                        obj.status === 'in_progress' ? 'bg-amber-100 border-amber-500 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 
                                        'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent hover:border-slate-400'
                                    }`}
                                 >
                                    {obj.status === 'completed' ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    ) : obj.status === 'in_progress' ? (
                                        <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                                    ) : null}
                                 </button>

                                 <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-xl font-bold mb-1 ${obj.status === 'completed' ? 'text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-800 dark:text-slate-100'}`}>
                                            {obj.title}
                                        </h3>
                                        
                                        {/* Bookmark Button (on Objective) */}
                                        <button 
                                            onClick={() => onToggleObjectiveFlag(plan.id, activeMilestone.id, obj.id)}
                                            className={`ml-4 p-1.5 rounded-lg transition-colors ${obj.isFlagged ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'text-slate-300 dark:text-slate-600 hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            title={obj.isFlagged ? "Remove bookmark" : "Bookmark for review"}
                                        >
                                            <svg className="w-6 h-6" fill={obj.isFlagged ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">{obj.description} {obj.duration && `• ${obj.duration}`}</p>
                                    
                                    {/* Detailed Tasks List */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specific Tasks</h4>
                                        <ul className="space-y-2">
                                            {obj.tasks.map((t, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${styles.primary} flex-shrink-0`}></span>
                                                    <span className={obj.status === 'completed' ? 'text-slate-400 line-through' : ''}>{t}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                     
                                     {/* Action Buttons */}
                                    <div className="mt-3 flex justify-between items-center">
                                        {/* Quiz Button */}
                                        <button 
                                            onClick={() => setActiveQuizObjective(obj)}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border ${styles.border} ${styles.iconText} ${styles.iconBg} hover:opacity-80 flex items-center gap-1.5`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            Take Quiz
                                        </button>

                                        {/* Deep Dive */}
                                        <button 
                                            onClick={() => setElaboratingObjective(obj)}
                                            className={`text-xs font-semibold ${styles.text} hover:opacity-80 flex items-center gap-1`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Get Help / Deep Dive
                                        </button>
                                    </div>
                                 </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                     <Button variant="ghost" disabled={!prevMilestone} onClick={() => setFocusedMilestoneId(prevMilestone?.id || null)}>&larr; Previous</Button>
                     <Button variant="ghost" disabled={!nextMilestone} onClick={() => setFocusedMilestoneId(nextMilestone?.id || null)}>Next &rarr;</Button>
                </div>
            </div>

            {elaboratingObjective && (
                <TaskDetailModal 
                    task={{ id: elaboratingObjective.id, description: elaboratingObjective.title, checkpoint: "", scheduledTime: "", status: elaboratingObjective.status }} 
                    skillName={plan.skillName} 
                    onClose={() => setElaboratingObjective(null)} 
                />
            )}

            {activeQuizObjective && (
                <ObjectiveQuizModal 
                    skillName={plan.skillName}
                    objectiveTitle={activeQuizObjective.title}
                    onClose={() => setActiveQuizObjective(null)}
                />
            )}
        </div>
    );
  }

  // --- Central Timeline / "Snake" View ---
  return (
    <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-12 text-center relative z-20">
            <div className="inline-flex items-center justify-center p-1.5 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                    &larr; Dashboard
                </button>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-2"></div>
                <button onClick={() => setIsEditModalOpen(true)} className={`flex items-center text-slate-500 dark:text-slate-400 hover:${styles.text} px-4 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium`}>
                    Settings
                </button>
            </div>
            <h1 className={`text-4xl font-extrabold mb-2 ${styles.text}`}>{plan.skillName}</h1>
            <p className="text-sm font-medium text-slate-400 mt-2 uppercase tracking-wide">
                {overallProgress}% Mastery
            </p>
        </div>

        {/* The Timeline Container */}
        <div className="relative pb-32">
            
            {/* Central Spine (The "Snake" Body) */}
            <div className="absolute left-1/2 top-4 bottom-0 w-2 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 rounded-full overflow-hidden">
                <div 
                    className={`w-full bg-gradient-to-b ${styles.gradient} transition-all duration-1000 ease-out`}
                    style={{ height: `${overallProgress}%` }}
                ></div>
            </div>

            {/* Milestones */}
            <div className="space-y-12 relative z-10">
                {sortedMilestones.map((milestone, index) => {
                    const progress = getMilestoneProgress(milestone);
                    const isCompleted = progress === 100;
                    const isEven = index % 2 === 0;
                    const hasFlaggedObjectives = milestone.objectives.some(o => o.isFlagged);

                    // Determine connector style
                    const isActiveInSpine = (overallProgress / 100) * sortedMilestones.length > index;

                    return (
                        <div key={milestone.id} className="relative flex items-center w-full">
                            {/* Connector Line */}
                            <div 
                                className={`absolute top-1/2 -translate-y-1/2 h-1 w-1/2 transition-colors duration-500 ${isActiveInSpine ? styles.primary.replace('bg-', 'bg-').replace('500', '200') : 'bg-transparent'}`}
                                style={{ 
                                    left: isEven ? 'auto' : '50%', 
                                    right: isEven ? '50%' : 'auto',
                                    width: '20px', 
                                }}
                            ></div>
                            
                            {/* Card Container */}
                            <div className={`w-[45%] ${isEven ? 'mr-auto text-right pr-4' : 'ml-auto text-left pl-4'} relative`}>
                                
                                <div 
                                    onClick={() => setFocusedMilestoneId(milestone.id)}
                                    className={`
                                        bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border-2 cursor-pointer transition-all duration-300
                                        hover:-translate-y-1 hover:shadow-xl group relative inline-block w-full
                                        ${isCompleted ? 'border-emerald-400 shadow-emerald-50 dark:shadow-emerald-900/10' : `${styles.border} ${styles.hoverBorder}`}
                                    `}
                                >
                                    {/* Milestone Number */}
                                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${styles.text}`}>
                                        Milestone {index + 1}
                                    </div>

                                    {/* Milestone Title */}
                                    <h3 className={`text-lg font-bold mb-3 ${styles.text}`}>
                                        {milestone.title}
                                    </h3>
                                    
                                    {/* Objectives Dots Grid */}
                                    <div className={`flex flex-wrap gap-2 ${isEven ? 'justify-end' : 'justify-start'}`}>
                                        {milestone.objectives.map(obj => (
                                            <div 
                                                key={obj.id} 
                                                className={`
                                                    w-3 h-3 rounded-full transition-all duration-300 relative
                                                    ${obj.status === 'completed' ? 'bg-emerald-400' : obj.status === 'in_progress' ? 'bg-amber-400 scale-125' : 'bg-slate-200 dark:bg-slate-700'}
                                                    ${obj.isFlagged ? 'ring-2 ring-red-400 ring-offset-1' : ''}
                                                `}
                                                title={obj.title}
                                            ></div>
                                        ))}
                                    </div>

                                    {/* Mini Flag Indicator if any objective inside is flagged */}
                                    {hasFlaggedObjectives && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Final Mastery Badge */}
            <div className="flex justify-center mt-12 relative z-10">
                <div className={`
                    w-20 h-20 rounded-full border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 relative
                    ${overallProgress === 100 ? 'bg-emerald-500 text-white animate-bounce' : 'text-slate-300 dark:text-slate-600'}
                `}>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-2 h-12 bg-slate-200 dark:bg-slate-800 -z-10">
                        <div 
                             className={`w-full bg-emerald-400 transition-all duration-1000`}
                             style={{ height: overallProgress === 100 ? '100%' : '0%' }}
                        ></div>
                    </div>
                    
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
        </div>

        {isEditModalOpen && (
            <EditPlanModal 
              plan={plan}
              onClose={() => setIsEditModalOpen(false)}
              onPlanUpdated={onUpdatePlan}
            />
        )}
    </div>
  );
};

export default PlanView;