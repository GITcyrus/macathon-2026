import React, { useEffect, useState } from 'react';
import { getTaskDetailsAI, TaskDetails } from '../services/gemini';
import { Task } from '../types';
import Button from './Button';

interface TaskDetailModalProps {
  task: Task;
  skillName: string;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, skillName, onClose }) => {
  const [details, setDetails] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchDetails = async () => {
      try {
        const data = await getTaskDetailsAI(skillName, task.description);
        if (mounted) {
            setDetails(data);
            setLoading(false);
        }
      } catch (err) {
        if (mounted) {
            console.error(err);
            setError("Failed to load details. The AI might be busy.");
            setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => { mounted = false; };
  }, [task, skillName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-start">
            <div>
                <div className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-1">Deep Dive</div>
                <h2 className="text-2xl font-bold text-slate-800 leading-tight">{task.description}</h2>
            </div>
            <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Consulting the archives...</p>
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <div className="text-red-500 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-slate-600">{error}</p>
                    <Button variant="secondary" onClick={onClose} className="mt-4">Close</Button>
                </div>
            ) : details ? (
                <>
                    {/* Explanation Section */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="bg-violet-100 p-1.5 rounded-lg text-violet-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            Concept Overview
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            {details.explanation}
                        </p>
                    </section>

                    {/* Steps Section */}
                    <section className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <span className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </span>
                            Step-by-Step Breakdown
                        </h3>
                        <ul className="space-y-4">
                            {details.steps.map((step, idx) => (
                                <li key={idx} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-sm">
                                        {idx + 1}
                                    </div>
                                    <p className="text-slate-700 mt-1">{step}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Visual Aid */}
                    <section>
                         <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                             <span className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </span>
                            Visual Aid / Example
                        </h3>
                        <div className="bg-slate-900 rounded-xl p-6 text-slate-300 font-mono text-sm overflow-x-auto shadow-inner">
                            <pre className="whitespace-pre-wrap">{details.visualAid}</pre>
                        </div>
                    </section>

                    {/* Links */}
                    <section>
                         <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                             <span className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </span>
                            Recommended Resources
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {details.searchQueries.map((query, idx) => (
                                <a 
                                    key={idx}
                                    href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all group"
                                >
                                    <span className="font-medium text-slate-700 group-hover:text-violet-700">{query}</span>
                                    <svg className="w-5 h-5 text-slate-400 group-hover:text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </section>
                </>
            ) : null}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;