import { SkillPlan, User } from "../types";

const STORAGE_KEY_PLANS = 'learn_flow_plans';
const STORAGE_KEY_USER = 'learn_flow_user';

export const mockAuth = {
  login: async (): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const user: User = {
      uid: 'user_' + Math.random().toString(36).substr(2, 9),
      email: 'demo@example.com',
      displayName: 'Demo User'
    };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    return user;
  },
  logout: async () => {
    localStorage.removeItem(STORAGE_KEY_USER);
  },
  getCurrentUser: (): User | null => {
    const u = localStorage.getItem(STORAGE_KEY_USER);
    return u ? JSON.parse(u) : null;
  }
};

export const mockDb = {
  getPlans: async (userId: string): Promise<SkillPlan[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    const plans: SkillPlan[] = raw ? JSON.parse(raw) : [];
    return plans.filter(p => p.userId === userId);
  },

  createPlan: async (plan: SkillPlan): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    const plans: SkillPlan[] = raw ? JSON.parse(raw) : [];
    plans.push(plan);
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  },

  updatePlan: async (updatedPlan: SkillPlan): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    let plans: SkillPlan[] = raw ? JSON.parse(raw) : [];
    plans = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  },

  updateObjectiveStatus: async (planId: string, milestoneId: string, objectiveId: string, status: string): Promise<void> => {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    let plans: SkillPlan[] = raw ? JSON.parse(raw) : [];
    
    plans = plans.map(p => {
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
    });
    
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  },

  toggleObjectiveFlag: async (planId: string, milestoneId: string, objectiveId: string): Promise<void> => {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    let plans: SkillPlan[] = raw ? JSON.parse(raw) : [];

    plans = plans.map(p => {
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
    });

    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  },

  deletePlan: async (planId: string): Promise<void> => {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    let plans: SkillPlan[] = raw ? JSON.parse(raw) : [];
    plans = plans.filter(p => p.id !== planId);
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  }
};