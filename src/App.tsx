// App.tsx
import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

// Import your page components
import Hero from "./components/Hero";
import HealthStatsForm from "./components/HealthStatsForm";
import GoalsForm from "./components/GoalsForm";
import WorkoutPlan from "./components/WorkoutPlan";
import AICoachDemo from "./components/AICoachDemo";
import NotFound from "./pages/NotFound";
// Ensure Index.tsx is either removed or repurposed if Hero is your new home page
// import Index from "./pages/Index"; // You might not need this anymore if Hero is '/'

const queryClient = new QueryClient();

// Define interfaces for data types (as before)
interface HealthStatsData {
    name?: string;
    age?: number;
    gender?: string;
    weight?: number;
    height?: number;
    medicalConditions?: string;
}

interface GoalsData {
    primaryGoal?: string;
    targetWeight?: number;
    workoutFrequency?: string;
    muscleGroups?: string[];
    timeframe?: string;
    fitnessLevel?: string;
    availableEquipment?: string;
}

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <AppRoutes /> {/* New component to hold routes and state */}
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

const AppRoutes = () => {
    const navigate = useNavigate();

    const [healthStats, setHealthStats] = useState<HealthStatsData>({});
    const [goals, setGoals] = useState<GoalsData>({});

    // This function is no longer needed since Hero handles navigation internally
    // const handleGetStarted = () => {
    //     navigate("/health-stats");
    // };

    const handleHealthStatsComplete = (stats: any) => {
        const processedStats: HealthStatsData = stats ? {
            name: stats.name || undefined,
            age: stats.age ? parseInt(stats.age) : undefined,
            gender: stats.gender || undefined,
            weight: stats.weight ? parseInt(stats.weight) : undefined,
            height: stats.height ? parseInt(stats.height) : undefined,
            medicalConditions: stats.medicalConditions || undefined,
        } : {};
        setHealthStats(processedStats);
        navigate("/goals");
    };

    const handleGoalsComplete = (userGoals: any) => {
        const processedGoals: GoalsData = userGoals ? {
            primaryGoal: userGoals.primaryGoal || undefined,
            targetWeight: userGoals.targetWeight ? parseInt(userGoals.targetWeight) : undefined,
            workoutFrequency: userGoals.workoutFrequency || undefined,
            muscleGroups: userGoals.muscleGroups || undefined,
            timeframe: userGoals.timeframe || undefined,
            fitnessLevel: userGoals.fitnessLevel || undefined,
            availableEquipment: userGoals.availableEquipment || undefined,
        } : {};
        setGoals(processedGoals);
        navigate("/workout-plan");
    };

    const handleStartWorkout = () => {
        navigate("/ai-coach");
    };

    const handleGoBackToPlan = () => {
        navigate("/workout-plan");
    };

    return (
        <Routes>
            {/* Hero Page - NO onGetStarted prop needed here anymore */}
            <Route path="/" element={<Hero />} /> {/* <-- FIX IS HERE */}

            {/* Health Stats Form Page */}
            <Route path="/health-stats" element={<HealthStatsForm onNext={handleHealthStatsComplete} />} />

            {/* Goals Form Page */}
            <Route path="/goals" element={<GoalsForm onComplete={handleGoalsComplete} />} />

            {/* Workout Plan Page - receives collected data */}
            <Route path="/workout-plan" element={<WorkoutPlan healthStats={healthStats} goals={goals} onStartWorkout={handleStartWorkout} />} />

            {/* AI Coach Demo Page - has button to go back to Workout Plan */}
            <Route path="/ai-coach" element={<AICoachDemo onGoBack={handleGoBackToPlan} />} />

            {/* Catch-all for 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default App;