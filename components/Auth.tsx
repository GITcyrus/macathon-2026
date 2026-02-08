import React, { useState } from 'react';
import Button from './Button';
import { mockAuth } from '../services/store';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await mockAuth.login();
      onLogin(user);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-slate-50">
        {/* Background blobs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 max-w-md w-full mx-4">
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-2xl shadow-xl text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-violet-500/20">
                     <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-2 text-slate-800 tracking-tight">LearnFlow</h1>
                <p className="text-slate-500 mb-8">Master any skill with AI-generated, structured learning roadmaps.</p>

                <div className="space-y-4">
                    <Button 
                        onClick={handleLogin} 
                        isLoading={isLoading} 
                        className="w-full h-12 text-lg"
                    >
                        Sign in with Google
                    </Button>
                    <div className="text-xs text-slate-400 mt-4">
                        (This is a demo. No real credentials needed.)
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Auth;