export type Status = 'not_started' | 'in_progress' | 'completed';

export type PlanTheme = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan';

export interface Task {
  id: string;
  description: string;
  status: Status;
  checkpoint?: string;
  scheduledTime?: string;
}

export interface Objective {
  id: string;
  title: string;
  description?: string; // Short summary
  status: Status;
  isFlagged?: boolean;
  tasks: string[]; // Specific actionable steps
  duration?: string;
}

export interface Milestone {
  id: string;
  title: string;
  order: number;
  objectives: Objective[];
}

export interface SkillPlan {
  id: string;
  userId: string;
  skillName: string;
  experienceLevel: string;
  estimatedDuration: string;
  theme: PlanTheme;
  createdAt: number;
  milestones: Milestone[];
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface CreatePlanRequest {
  skillName: string;
  experienceLevel: string;
  timeConstraint?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
}

export interface ObjectiveQuizQuestion extends QuizQuestion {
  explanation: string; // For the "Show Why" feature
}

export interface QuizResult {
  question: string;
  userAnswer: string;
  isCorrect: boolean;
}