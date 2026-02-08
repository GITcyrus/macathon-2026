import React, { useState } from 'react';
import { generateSkillPlanAI, adaptSkillPlanAI } from '../services/gemini';
import { mockDb } from '../services/store';
import { PlanTheme, SkillPlan } from '../types';
import Button from './Button';
import Input from './Input';
import { THEME_COLORS } from '../utils/theme';

interface EditPlanModalProps {
  plan: SkillPlan;
  onClose: () => void;
  onPlanUpdated: (plan: SkillPlan) => void;
}

const EditPlanModal: React.FC<EditPlanModalProps> = ({ plan, onClose, onPlanUpdated }) => {
  const [skill, setSkill] = useState(plan.skillName);
  const [experience, setExperience] = useState(plan.experienceLevel);
  const [time, setTime] = useState(plan.estimatedDuration);
  const [selectedTheme, setSelectedTheme] = useState<PlanTheme>(plan.theme || 'violet');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there is any progress to preserve
  const completedObjectivesCount = plan.milestones.reduce(
    (acc, m) => acc + m.objectives.filter(o => o.status === 'completed').length, 
    0
  );
  const hasProgress = completedObjectivesCount > 0;

  const handleUpdateThemeOnly = async () => {
     // If only theme changed, just update local DB and return
     const updatedPlan: SkillPlan = {
         ...plan,
         theme: selectedTheme
     };
     await mockDb.updatePlan(updatedPlan);
     onPlanUpdated(updatedPlan);
     onClose();
  };

  const handleAdapt = async () => {
    setIsGenerating(true);
    setError(null);

    try {
        const aiPlan = await adaptSkillPlanAI(plan, experience, time);

        const updatedPlan: SkillPlan = {
            ...plan,
            skillName: aiPlan.skillName || skill,
            experienceLevel: aiPlan.experienceLevel || experience,
            estimatedDuration: aiPlan.estimatedDuration || time,
            milestones: aiPlan.milestones || [],
            theme: selectedTheme, // Ensure theme is updated
            createdAt: Date.now()
        };

        await mockDb.updatePlan(updatedPlan);
        onPlanUpdated(updatedPlan);
        onClose();
    } catch (err) {
        console.error(err);
        setError("Failed to adapt plan. AI service might be busy.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
     if (!window.confirm("Warning: This will completely wipe all your progress and create a brand new roadmap. Are you sure?")) {
        return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const aiPlan = await generateSkillPlanAI(skill, experience, time);
      
      const updatedPlan: SkillPlan = {
        ...plan,
        skillName: aiPlan.skillName || skill,
        experienceLevel: aiPlan.experienceLevel || experience,
        estimatedDuration: aiPlan.estimatedDuration || time,
        milestones: aiPlan.milestones || [],
        theme: selectedTheme,
        createdAt: Date.now()
      };

      await mockDb.updatePlan(updatedPlan);
      onPlanUpdated(updatedPlan);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to regenerate plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill) return;

    // If context details haven't changed but theme has, just update theme
    if (skill === plan.skillName && experience === plan.experienceLevel && time === plan.estimatedDuration && selectedTheme !== plan.theme) {
        handleUpdateThemeOnly();
        return;
    }
    
    // If context didn't change and theme didn't change, just close
    if (skill === plan.skillName && experience === plan.experienceLevel && time === plan.estimatedDuration && selectedTheme === plan.theme) {
        onClose();
        return;
    }

    if (hasProgress) {
        handleAdapt();
    } else {
        handleRegenerate(); // Effectively a regen if no progress
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Roadmap Settings</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <Input 
            label="Skill / Topic"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            required
            disabled // Skill name usually shouldn't change for an adapt, or it becomes a new plan
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input
                label="Experience / Context"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. Grade 12 Math, Expert in Python"
             />
             <Input 
                label="Time Constraint"
                placeholder="e.g. 4 weeks"
                value={time}
                onChange={(e) => setTime(e.target.value)}
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Color Theme</label>
            <div className="flex gap-3">
                {(Object.keys(THEME_COLORS) as PlanTheme[]).map((themeKey) => (
                    <button
                        key={themeKey}
                        type="button"
                        onClick={() => setSelectedTheme(themeKey)}
                        className={`w-8 h-8 rounded-full ${THEME_COLORS[themeKey]} transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${selectedTheme === themeKey ? 'ring-slate-400 scale-110' : 'ring-transparent'}`}
                    />
                ))}
            </div>
          </div>

          {/* Info / Warning Box */}
          <div className={`p-4 rounded-lg border ${hasProgress ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex gap-3">
                  {hasProgress ? (
                      <svg className="w-5 h-5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                  ) : (
                      <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  )}
                  
                  <div className="text-sm">
                      {hasProgress ? (
                          <>
                            <p className="text-violet-800 dark:text-violet-300 font-semibold mb-1">Adaptive Mode Active</p>
                            <p className="text-violet-700 dark:text-violet-400 leading-snug">
                                You have completed <strong>{completedObjectivesCount} objectives</strong>. 
                                The AI will adapt the remaining roadmap to your new timeline while preserving your progress.
                            </p>
                          </>
                      ) : (
                          <p className="text-slate-600 dark:text-slate-400">
                              Updating contexts (Experience/Time) will regenerate the entire roadmap. Updating theme only is safe.
                          </p>
                      )}
                  </div>
              </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
                 {hasProgress && (
                    <button 
                        type="button" 
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className="text-sm text-red-400 hover:text-red-600 underline decoration-red-200 hover:decoration-red-400 underline-offset-2 transition-colors"
                    >
                        Reset & Regenerate (Destructive)
                    </button>
                 )}
            </div>
            <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isGenerating}>Cancel</Button>
                <Button type="submit" isLoading={isGenerating}>
                    {isGenerating ? (hasProgress ? 'Adapting...' : 'Regenerating...') : (hasProgress ? 'Adapt Plan' : 'Update Plan')}
                </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlanModal;