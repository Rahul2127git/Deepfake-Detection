import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { ArrowRight, Shield } from "lucide-react";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");

  const handleSignupClick = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] flex items-center justify-center p-4 animated-grid">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="w-full max-w-md z-10 relative">
        {/* Header section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full glass mb-6">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Get Started</h1>
          <p className="text-gray-400">Create your DeepShield AI account</p>
        </div>

        {/* Signup card */}
        <div className="glass-dark p-8 mb-6">
          <div className="space-y-6">
            {/* Email input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            {/* Signup button */}
            <Button
              onClick={handleSignupClick}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 glow-blue"
            >
              Create Account
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] text-gray-400">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login link */}
            <Button
              variant="outline"
              onClick={() => setLocation("/login")}
              className="w-full border-white/20 text-white hover:bg-white/5"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Benefits highlight */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
            <p className="text-sm text-gray-400">
              <span className="text-cyan-400 font-semibold">Instant detection</span> of deepfake content
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
            <p className="text-sm text-gray-400">
              <span className="text-purple-400 font-semibold">Detailed analytics</span> and reports
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
            <p className="text-sm text-gray-400">
              <span className="text-blue-400 font-semibold">Secure processing</span> of your media
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
