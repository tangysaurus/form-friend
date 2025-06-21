
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Target, Activity } from "lucide-react";

const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your AI
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"> Coach</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience the future of fitness with AI-powered form tracking. 
            Get real-time feedback on your exercise technique and personalized workout plans.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-12">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <Activity className="text-cyan-400 w-8 h-8" />
            <div className="text-left">
              <h3 className="text-white font-semibold">Real-time Form Analysis</h3>
              <p className="text-gray-300 text-sm">AI tracks your body angles</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <Target className="text-purple-400 w-8 h-8" />
            <div className="text-left">
              <h3 className="text-white font-semibold">Personalized Plans</h3>
              <p className="text-gray-300 text-sm">Workouts tailored to you</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <Zap className="text-yellow-400 w-8 h-8" />
            <div className="text-left">
              <h3 className="text-white font-semibold">Instant Feedback</h3>
              <p className="text-gray-300 text-sm">Improve form immediately</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={onGetStarted}
          size="lg" 
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-full text-lg shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
        >
          Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Hero;
