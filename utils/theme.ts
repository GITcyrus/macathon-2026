import { PlanTheme } from "../types";

export const THEME_COLORS: Record<PlanTheme, string> = {
  violet: 'bg-violet-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500'
};

export const getThemeStyles = (theme: PlanTheme = 'violet') => {
  switch (theme) {
    case 'blue': return {
      name: 'Blue',
      primary: 'bg-blue-500',
      text: 'text-blue-600',
      textDark: 'text-blue-400',
      bgSoft: 'bg-blue-50',
      bgSoftDark: 'dark:bg-blue-900/20',
      border: 'border-blue-200',
      borderDark: 'dark:border-blue-800',
      hoverBorder: 'hover:border-blue-300',
      ring: 'focus:ring-blue-500',
      gradient: 'from-blue-400 to-cyan-400',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-500'
    };
    case 'emerald': return {
      name: 'Emerald',
      primary: 'bg-emerald-500',
      text: 'text-emerald-600',
      textDark: 'text-emerald-400',
      bgSoft: 'bg-emerald-50',
      bgSoftDark: 'dark:bg-emerald-900/20',
      border: 'border-emerald-200',
      borderDark: 'dark:border-emerald-800',
      hoverBorder: 'hover:border-emerald-300',
      ring: 'focus:ring-emerald-500',
      gradient: 'from-emerald-400 to-teal-400',
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-500'
    };
    case 'amber': return {
      name: 'Amber',
      primary: 'bg-amber-500',
      text: 'text-amber-600',
      textDark: 'text-amber-400',
      bgSoft: 'bg-amber-50',
      bgSoftDark: 'dark:bg-amber-900/20',
      border: 'border-amber-200',
      borderDark: 'dark:border-amber-800',
      hoverBorder: 'hover:border-amber-300',
      ring: 'focus:ring-amber-500',
      gradient: 'from-amber-400 to-orange-400',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-500'
    };
    case 'rose': return {
      name: 'Rose',
      primary: 'bg-rose-500',
      text: 'text-rose-600',
      textDark: 'text-rose-400',
      bgSoft: 'bg-rose-50',
      bgSoftDark: 'dark:bg-rose-900/20',
      border: 'border-rose-200',
      borderDark: 'dark:border-rose-800',
      hoverBorder: 'hover:border-rose-300',
      ring: 'focus:ring-rose-500',
      gradient: 'from-rose-400 to-pink-400',
      iconBg: 'bg-rose-100',
      iconText: 'text-rose-500'
    };
    case 'cyan': return {
      name: 'Cyan',
      primary: 'bg-cyan-500',
      text: 'text-cyan-600',
      textDark: 'text-cyan-400',
      bgSoft: 'bg-cyan-50',
      bgSoftDark: 'dark:bg-cyan-900/20',
      border: 'border-cyan-200',
      borderDark: 'dark:border-cyan-800',
      hoverBorder: 'hover:border-cyan-300',
      ring: 'focus:ring-cyan-500',
      gradient: 'from-cyan-400 to-sky-400',
      iconBg: 'bg-cyan-100',
      iconText: 'text-cyan-500'
    };
    default: return { // Violet
      name: 'Violet',
      primary: 'bg-violet-500',
      text: 'text-violet-600',
      textDark: 'text-violet-400',
      bgSoft: 'bg-violet-50',
      bgSoftDark: 'dark:bg-violet-900/20',
      border: 'border-violet-200',
      borderDark: 'dark:border-violet-800',
      hoverBorder: 'hover:border-violet-300',
      ring: 'focus:ring-violet-500',
      gradient: 'from-violet-400 to-fuchsia-400',
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-500'
    };
  }
};