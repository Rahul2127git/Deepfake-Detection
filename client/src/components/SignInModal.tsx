'use client';

import { useState } from 'react';
import { X, Mail, Lock, Chrome, Facebook, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLoginUrl } from '@/const';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMaunsOAuth = () => {
    // Redirect to Manus OAuth
    window.location.href = getLoginUrl();
  };

  const handleGoogleLogin = () => {
    // TODO: Integrate with Google OAuth
    // For now, redirect to Manus OAuth as fallback
    console.log('Google login clicked - integrate with Google OAuth API');
    handleMaunsOAuth();
  };

  const handleFacebookLogin = () => {
    // TODO: Integrate with Facebook OAuth
    console.log('Facebook login clicked - integrate with Facebook OAuth API');
    handleMaunsOAuth();
  };

  const handleAppleLogin = () => {
    // TODO: Integrate with Apple OAuth
    console.log('Apple login clicked - integrate with Apple OAuth API');
    handleMaunsOAuth();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implement email/password authentication
    // For now, redirect to Manus OAuth
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Email login:', { email, password });
      handleMaunsOAuth();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Modal container */}
      <div className="relative w-full max-w-md mx-4 glass-dark rounded-2xl p-8 border border-white/10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Sign in</h2>

        {/* Social login buttons */}
        <div className="space-y-3 mb-6">
          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 text-white font-medium"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>

          {/* Facebook */}
          <button
            onClick={handleFacebookLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 text-white font-medium"
          >
            <Facebook className="w-5 h-5 text-blue-500" />
            Continue with Facebook
          </button>

          {/* Apple */}
          <button
            onClick={handleAppleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 text-white font-medium"
          >
            <Apple className="w-5 h-5" />
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] text-gray-400">
              OR
            </span>
          </div>
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {/* Email input */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all duration-300"
              required
            />
          </div>

          {/* Password input */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all duration-300"
              required
            />
          </div>

          {/* Login button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        {/* Register link */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Don't have an account?{' '}
          <a href="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
