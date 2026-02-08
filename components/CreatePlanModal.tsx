import React, { useState } from 'react';
import { generateAssessmentQuiz, generatePlanFromAssessment } from '../services/gemini';
import { mockDb } from '../services/store';
import { User, SkillPlan, QuizQuestion, QuizResult, PlanTheme } from '../types';
import Button from './Button';
import Input from './Input';
import { THEME_COLORS, getThemeStyles } from '../utils/theme';

interface CreatePlanModalProps {
  user: User;
  onClose: () => void;
  onPlanCreated: (plan: SkillPlan) => void;
}

type Step = 'input' | 'loading_quiz' | 'taking_quiz' | 'generating_plan';

const CreatePlanModal: React.FC<CreatePlanModalProps> = ({ user, onClose, onPlanCreated }) => {
  const [step, setStep] = useState<Step>('input');
  const [skill, setSkill] = useState('');
  const [time, setTime] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<PlanTheme>('violet');
  const [error, setError] = useState<string | null>(null);

  // Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // QuestionIndex -> OptionIndex (4 represents 'I don't know')

  // --- Handlers ---

  const handleStartAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill) return;

    setStep('loading_quiz');
    setError(null);

    try {
      const quiz = await generateAssessmentQuiz(skill);
      if (quiz && quiz.length > 0) {
        setQuestions(quiz);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setStep('taking_quiz');
      } else {
        throw new Error("No questions generated");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate assessment. Please try again.");
      setStep('input');
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: optionIndex };
    setAnswers(newAnswers);
    
    // Auto advance with a small delay for visual feedback
    setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmitQuiz(newAnswers);
        }
    }, 300);
  };

  const handleSubmitQuiz = async (finalAnswers = answers) => {
    setStep('generating_plan');
    setError(null);

    try {
        // Compile results
        const results: QuizResult[] = questions.map((q, idx) => {
            const selectedIdx = finalAnswers[idx];
            // Check if user selected "I don't know" (index 4) or skipped
            if (selectedIdx === 4 || selectedIdx === undefined) {
                 return {
                    question: q.question,
                    userAnswer: "I don't know / Unsure",
                    isCorrect: false
                 };
            }
            return {
                question: q.question,
                userAnswer: q.options[selectedIdx],
                isCorrect: selectedIdx === q.correctAnswerIndex
            };
        });

        const aiPlan = await generatePlanFromAssessment(skill, time, results);
        
        const newPlan: SkillPlan = {
            ...aiPlan as SkillPlan,
            id: Math.random().toString(36).substr(2, 9),
            userId: user.uid,
            theme: selectedTheme, // Use the selected theme
            createdAt: Date.now()
        };

        await mockDb.createPlan(newPlan);
        onPlanCreated(newPlan);

    } catch (err) {
        console.error(err);
        setError("Failed to generate your personalized roadmap. Please try again.");
        setStep('taking_quiz'); // Go back so they don't lose answers
    }
  };

  // --- Render Steps ---

  const renderInputStep = () => (
    <form onSubmit={handleStartAssessment} className="p-6 space-y-6">
        <div className="bg-violet-50 dark:bg-violet-900/10 p-4 rounded-xl border border-violet-100 dark:border-violet-800 mb-6">
            <h3 className="font-semibold text-violet-800 dark:text-violet-300 mb-1">Let's Assess Your Level</h3>
            <p className="text-sm text-violet-600 dark:text-violet-400">
                Instead of guessing your experience, our AI will generate a quick 5-question quiz to determine exactly where you should start.
            </p>
        </div>

        <Input 
            label="What skill do you want to learn?"
            placeholder="e.g. Astrophysics, React Native, French Cooking..."
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            required
            autoFocus
        />
        
        <Input 
            label="Time Constraint (Optional)"
            placeholder="e.g. 4 weeks, 2 months"
            value={time}
            onChange={(e) => setTime(e.target.value)}
        />

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

        <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Assess Skill Level &rarr;</Button>
        </div>
    </form>
  );

  const renderLoadingQuiz = () => (
    <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Generating Assessment...</h3>
        <p className="text-slate-500 dark:text-slate-400">Curating questions to test your knowledge of {skill}.</p>
    </div>
  );

  const renderTakingQuiz = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return null; // Safety check

    const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900">
            {/* Header with Progress Bar - Compacted */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <div className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-0.5">Skill Assessment</div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight line-clamp-1">{skill}</h2>
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {currentQuestionIndex + 1} / {questions.length}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-violet-500 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
            
            {/* Content Area - Compacted */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center">
                <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center">
                    <p className="text-base font-medium text-slate-800 dark:text-slate-100 mb-4 mt-2 leading-relaxed">
                        {currentQ.question}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                        {currentQ.options.map((opt, optIdx) => {
                            const isSelected = answers[currentQuestionIndex] === optIdx;
                            
                            let btnClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20";
                            if (isSelected) {
                                btnClass = "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500";
                            }

                            return (
                                <button
                                    key={optIdx}
                                    onClick={() => handleOptionSelect(optIdx)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center group ${btnClass}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors
                                        ${isSelected 
                                            ? 'border-violet-500 text-violet-600' 
                                            : 'border-slate-300 dark:border-slate-600 text-slate-400 group-hover:border-violet-400'
                                        }`}>
                                        {String.fromCharCode(65 + optIdx)}
                                    </div>
                                    <span className="font-medium text-sm leading-snug">{opt}</span>
                                </button>
                            );
                        })}
                        
                        {/* I Don't Know Option */}
                        <button
                            onClick={() => handleOptionSelect(4)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg border border-dashed transition-all duration-200 flex items-center mt-2
                            ${answers[currentQuestionIndex] === 4
                                ? 'border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 ring-1 ring-slate-400'
                                : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400'
                            }`}
                        >
                             <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors
                                ${answers[currentQuestionIndex] === 4 ? 'border-slate-500 text-slate-600' : 'border-slate-300 dark:border-slate-600 text-slate-400'}`}>
                                ?
                             </div>
                            <span className="font-medium text-xs">I'm not sure / I don't know</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <Button 
                    variant="ghost" 
                    className="text-xs px-3 py-1.5"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                >
                    &larr; Back
                </Button>
                <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">
                    Cancel
                </button>
            </div>
        </div>
    );
  };

  const renderGeneratingPlan = () => (
    <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Analyzing Results...</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
            We're identifying your knowledge gaps and crafting a granular {skill} roadmap for you.
        </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col ${step === 'taking_quiz' ? 'max-w-4xl h-[85vh]' : 'max-w-lg'}`}>
        
        {step === 'input' && (
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">New Skill Roadmap</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        )}

        {step === 'input' && renderInputStep()}
        {step === 'loading_quiz' && renderLoadingQuiz()}
        {step === 'taking_quiz' && renderTakingQuiz()}
        {step === 'generating_plan' && renderGeneratingPlan()}

      </div>
    </div>
  );
};

export default CreatePlanModal;