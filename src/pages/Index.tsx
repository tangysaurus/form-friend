
import { useState } from "react";
import Hero from "@/components/Hero";
import HealthStatsForm from "@/components/HealthStatsForm";
import GoalsForm from "@/components/GoalsForm";
import WorkoutPlan from "@/components/WorkoutPlan";
import AICoachDemo from "@/components/AICoachDemo";

type Step = "hero" | "health-stats" | "goals" | "workout-plan" | "ai-coach";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>("hero");
  const [healthStats, setHealthStats] = useState(null);
  const [goals, setGoals] = useState(null);

  const handleGetStarted = () => {
    setCurrentStep("health-stats");
  };

  const handleHealthStatsNext = (stats: any) => {
    setHealthStats(stats);
    setCurrentStep("goals");
  };

  const handleGoalsComplete = (goalData: any) => {
    setGoals(goalData);
    setCurrentStep("workout-plan");
  };

  const handleStartWorkout = () => {
    setCurrentStep("ai-coach");
  };

  const handleBackToWorkoutPlan = () => {
    setCurrentStep("workout-plan");
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "hero":
        return <Hero onGetStarted={handleGetStarted} />;
      case "health-stats":
        return <HealthStatsForm onNext={handleHealthStatsNext} />;
      case "goals":
        return <GoalsForm onComplete={handleGoalsComplete} />;
      case "workout-plan":
        return (
          <WorkoutPlan 
            healthStats={healthStats} 
            goals={goals} 
            onStartWorkout={handleStartWorkout}
          />
        );
      case "ai-coach":
        return <AICoachDemo onBack={handleBackToWorkoutPlan} />;
      default:
        return <Hero onGetStarted={handleGetStarted} />;
    }
  };

  return <div className="min-h-screen">{renderCurrentStep()}</div>;
};

export default Index;
