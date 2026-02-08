import React, { useState, useEffect } from 'react';
import { generateObjectiveQuiz } from '../services/gemini';
import { ObjectiveQuizQuestion } from '../types';
import Button from './Button';

interface ObjectiveQuizModalProps {
  skillName: string;
  objectiveTitle: string;
  onClose: () => void;
}

const ObjectiveQuizModal: React.FC<ObjectiveQuizModalProps> = ({ skillName, objectiveTitle, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ObjectiveQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // Index -> Option Index
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState<boolean>(false); // Toggle explanation for current question in review

  useEffect(() => {
    let mounted = true;
    const fetchQuiz = async () => {
      try {
        const data = await generateObjectiveQuiz(skillName, objectiveTitle);
        if (mounted) {
          if (data && data.length > 0) {
              setQuestions(data);
          } else {
              setError("No questions generated.");
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error(err);
          setError("Failed to generate quiz. AI service might be busy.");
          setLoading(false);
        }
      }
    };
    fetchQuiz();
    return () => { mounted = false; };
  }, [skillName, objectiveTitle]);

  const handleOptionSelect = (optionIdx: number) => {
    if (isSubmitted) return; // Read-only after submit
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIdx }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setCurrentQuestionIndex(0); // Go back to start for review
    setShowWhy(false);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowWhy(false);
    } else if (!isSubmitted) {
      handleSubmit();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswerIndex) correct++;
    });
    return correct;
  };

  // Render Logic
  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        
        {/* Header & Number Bar - Compacted */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-0.5">
                {isSubmitted ? `Score: ${calculateScore()}/${questions.length}` : 'Objective Quiz'}
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight line-clamp-1">{objectiveTitle}</h2>
            </div>
            <button 
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>

          {/* Number Bar - Compacted */}
          {!loading && !error && questions.length > 0 && (
            <div className="flex gap-1.5 justify-center flex-wrap">
              {questions.map((_, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const hasAnswer = answers[idx] !== undefined;
                let bgClass = "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
                
                if (isSubmitted) {
                    const isCorrect = answers[idx] === questions[idx].correctAnswerIndex;
                    bgClass = isCorrect 
                        ? "bg-emerald-500 text-white" 
                        : "bg-red-500 text-white";
                } else if (isCurrent) {
                    bgClass = "bg-violet-500 text-white shadow-lg shadow-violet-500/30 scale-110";
                } else if (hasAnswer) {
                    bgClass = "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setShowWhy(false);
                    }}
                    className={`w-7 h-7 rounded-md text-xs font-bold transition-all duration-200 ${bgClass} hover:opacity-90`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Area - Compacted */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-4 flex-1">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Generating questions...</p>
             </div>
           ) : error || !currentQ ? (
             <div className="text-center py-12 flex-1">
                <p className="text-red-500 mb-4">{error || "Something went wrong loading the question."}</p>
                <Button variant="secondary" onClick={onClose}>Close</Button>
             </div>
           ) : (
             <div className="max-w-xl mx-auto w-full flex-1 flex flex-col">
                <p className="text-base font-medium text-slate-800 dark:text-slate-100 mb-4 mt-2 leading-relaxed">
                    {currentQ.question}
                </p>

                <div className="space-y-2 mb-4">
                    {currentQ.options.map((opt, optIdx) => {
                        let btnClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20";
                        
                        if (isSubmitted) {
                            if (optIdx === currentQ.correctAnswerIndex) {
                                btnClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium ring-1 ring-emerald-500";
                            } else if (answers[currentQuestionIndex] === optIdx) {
                                btnClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-1 ring-red-500";
                            } else {
                                btnClass = "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 opacity-60";
                            }
                        } else if (answers[currentQuestionIndex] === optIdx) {
                            btnClass = "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500";
                        }

                        return (
                            <button
                                key={optIdx}
                                onClick={() => handleOptionSelect(optIdx)}
                                disabled={isSubmitted}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center ${btnClass}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                    isSubmitted && optIdx === currentQ.correctAnswerIndex ? 'border-emerald-500 text-emerald-600' :
                                    isSubmitted && answers[currentQuestionIndex] === optIdx ? 'border-red-500 text-red-600' :
                                    answers[currentQuestionIndex] === optIdx ? 'border-violet-500 text-violet-600' :
                                    'border-slate-300 dark:border-slate-600 text-slate-400'
                                }`}>
                                    {String.fromCharCode(65 + optIdx)}
                                </div>
                                <span className="text-sm font-medium leading-snug">{opt}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Show Why Section (Review Mode Only) */}
                {isSubmitted && answers[currentQuestionIndex] !== currentQ.correctAnswerIndex && (
                    <div className="mt-1 mb-4">
                        {!showWhy ? (
                            <button 
                                onClick={() => setShowWhy(true)}
                                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Show Why?
                            </button>
                        ) : (
                            <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-0.5">Explanation</h4>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{currentQ.explanation}</p>
                            </div>
                        )}
                    </div>
                )}
             </div>
           )}
        </div>

        {/* Footer - Compacted */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            {!loading && !error && currentQ && (
                <Button 
                    onClick={handleNext} 
                    className="w-full text-sm py-2"
                >
                    {isSubmitted 
                        ? (currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Review") 
                        : (currentQuestionIndex < questions.length - 1 ? "Next Question" : "Submit Quiz")}
                </Button>
            )}
        </div>

      </div>
    </div>
  );
};

export default ObjectiveQuizModal;