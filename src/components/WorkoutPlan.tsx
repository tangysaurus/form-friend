// WorkoutPlan.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Flame, Trophy, Camera, PlayCircle, Loader, XCircle } from "lucide-react";
import { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';

// --- Interfaces ---
interface WorkoutPlanItem {
    day: string;
    focus: string;
    exercises: string[];
    duration: string;
    difficulty: string;
}

interface WorkoutPlanProps {
    healthStats: {
        name?: string;
        age: number; // MADE MANDATORY
        gender?: string;
        weight?: number;
        height?: number;
        medicalConditions?: string;
    };
    goals: {
        primaryGoal: string; // MADE MANDATORY
        workoutFrequency?: string;
        timeframe?: string;
        fitnessLevel: string; // MADE MANDATORY
        availableEquipment?: string;
    };
    onStartWorkout: () => void;
}

const WorkoutPlan = ({ healthStats, goals, onStartWorkout }: WorkoutPlanProps) => {
    const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlanItem[]>([]);
    const [loading, setLoading] = useState(false);
    // Error state will now primarily be for API failures, not missing data
    const [error, setError] = useState<string | null>(null);

    const vapi = useRef<Vapi | null>(null);
    const [isVapiReady, setIsVapiReady] = useState(false);
    const [isVapiSpeaking, setIsVapiSpeaking] = useState(false);

    const hasRequiredUserData =
        healthStats && healthStats.age && healthStats.age > 0 &&
        goals && goals.primaryGoal && goals.primaryGoal.trim() !== '' &&
        goals.fitnessLevel && goals.fitnessLevel.trim() !== '';

    // --- VAPI INITIALIZATION (No changes here, it's independent of mandatory data for the button) ---
    useEffect(() => {
        const vapiPublicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;

        if (vapiPublicKey && vapiPublicKey !== 'YOUR_VAPI_PUBLIC_KEY') {
            const vapiInstance = new Vapi(vapiPublicKey);
            vapi.current = vapiInstance;

            vapi.current.on('call-start', () => {
                console.log('Vapi call has started.');
                setIsVapiSpeaking(true);
            });

            vapi.current.on('call-end', () => {
                console.log('Vapi call has ended.');
                setIsVapiSpeaking(false);
            });

            vapi.current.on('error', (e) => {
                console.error('Vapi error:', e);
                setIsVapiSpeaking(false);
            });

            setIsVapiReady(true);
        } else {
            console.warn("VITE_VAPI_PUBLIC_KEY not found. Audio intro feature will be disabled.");
            setIsVapiReady(false);
        }

        return () => {
            vapi.current?.stop();
        };
    }, []);

    // --- MODIFIED: WORKOUT PLAN FETCHING LOGIC WITH LOCALSTORAGE ---
    useEffect(() => {
        const fetchWorkoutPlan = async () => {
            // Always try to load from localStorage first
            const savedPlanJson = localStorage.getItem('workoutPlan');
            if (savedPlanJson && hasRequiredUserData) { // Only use saved plan if user data matches expectations
                console.log("Found saved personalized workout plan in localStorage.");
                setWorkoutPlan(JSON.parse(savedPlanJson));
                setError(null); // Clear any previous errors if a valid plan is loaded
                return;
            }

            const defaultPlan = [ // Define default plan once
                { day: "Day 1", focus: "Upper Body", exercises: ["Push-ups", "Pull-ups", "Shoulder Press", "Tricep Dips"], duration: "45 min", difficulty: "Intermediate" },
                { day: "Day 2", focus: "Lower Body", exercises: ["Squats", "Lunges", "Deadlifts", "Calf Raises"], duration: "50 min", difficulty: "Intermediate" },
                { day: "Day 3", focus: "Core & Cardio", exercises: ["Planks", "Russian Twists", "Mountain Climbers", "Burpees"], duration: "40 min", difficulty: "Beginner" }
            ];

            // If required data is missing OR no saved plan for personalized data, display default
            if (!hasRequiredUserData) {
                console.log("Required user data missing. Displaying default workout plan.");
                setWorkoutPlan(defaultPlan);
                setError(null); // No error for simply missing optional data
                return;
            }

            // Proceed to API call only if hasRequiredUserData is true and no saved plan for it
            setLoading(true);
            setError(null); // Clear previous errors before new fetch
            try {
                const response = await fetch('https://form-friend-fitness-ai.onrender.com/generate-workout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ healthStats, goals }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.message || 'Failed to fetch workout plan';
                    const rawResponseInfo = errorData.rawResponse ? ` Raw: ${errorData.rawResponse.substring(0, 100)}...` : '';
                    throw new Error(errorMessage + rawResponseInfo);
                }

                const data: WorkoutPlanItem[] = await response.json();
                setWorkoutPlan(data);
                localStorage.setItem('workoutPlan', JSON.stringify(data)); // Save personalized plan
                console.log("New personalized workout plan generated and saved to localStorage.");

            } catch (err: any) {
                console.error("Error fetching personalized workout plan from API:", err);
                setError(err.message || "Failed to generate personalized workout plan. Displaying default plan.");
                setWorkoutPlan(defaultPlan); // Fallback to default plan on API error
            } finally {
                setLoading(false);
            }
        };

        fetchWorkoutPlan();
    }, [healthStats, goals, hasRequiredUserData]);


    const handlePlayIntro = () => {
        if (!vapi.current || isVapiSpeaking) return;

        const name = healthStats.name || 'there';
        const goal = goals.primaryGoal?.replace('-', ' ') || 'improving your general fitness';
        const level = goals.fitnessLevel || 'your current';

        // Message logic updated to reflect if personalization data is available
        const message = hasRequiredUserData
            ? `Hi ${name}, I'm your personal AI trainer, Jackie! Welcome to your custom workout plan. Based on your primary goal of ${goal}, and your ${level} fitness level, we're going to have a great session focused on making you stronger and healthier. I'll be right here to guide you. Let's get started!`
            : "Hi there! I'm your personal AI trainer, Jackie. Welcome to your workout! This plan is designed to give you a fantastic full-body session. I'll be here to guide you on your form. Let's get moving and crush this workout together!";

        const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
        if (!assistantId) {
            console.error("VITE_VAPI_ASSISTANT_ID is not defined.");
            return;
        }

        vapi.current.start(assistantId, { firstMessage: message });
    };

    const renderVapiButton = () => {
        if (isVapiSpeaking) {
            return (
                <Button onClick={() => vapi.current?.stop()} variant="destructive" className="mt-6 font-semibold px-6 py-3 rounded-full text-lg shadow-lg">
                    <XCircle className="w-5 h-5 mr-2" />
                    Stop Intro
                </Button>
            );
        }
        return (
            <Button onClick={handlePlayIntro} disabled={!isVapiReady || loading} className="mt-6 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold px-6 py-3 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                {isVapiReady ? <PlayCircle className="w-5 h-5 mr-2" /> : <Loader className="w-5 h-5 mr-2 animate-spin" />}
                Talk to a Trainer
            </Button>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-6">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        {hasRequiredUserData ? "Your Personalized Workout Plan" : "Default Workout Plan"}
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        {hasRequiredUserData
                            ? "Based on your profile, we've created a custom plan to help you achieve your goals"
                            : "A general workout plan to get you started - customize it anytime by adding your profile." // UPDATED MESSAGE
                        }
                    </p>
                    {renderVapiButton()}
                </div>

                {/* Summary Cards - only show if user has REQUIRED data */}
                {hasRequiredUserData && (
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                            <CardContent className="p-6 text-center">
                                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-800 mb-2">Duration</h3>
                                <p className="text-2xl font-bold text-blue-600">{goals?.timeframe || "Flexible"}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                            <CardContent className="p-6 text-center">
                                <Flame className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-800 mb-2">Frequency</h3>
                                <p className="text-2xl font-bold text-orange-600">{goals?.workoutFrequency || "3-4x/week"}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                            <CardContent className="p-6 text-center">
                                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-800 mb-2">Goal</h3>
                                <p className="text-2xl font-bold text-green-600 capitalize">
                                    {goals?.primaryGoal?.replace('-', ' ') || "General Fitness"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {loading && <div className="text-center text-xl text-gray-700 mb-8">Generating your personalized workout plan...</div>}
                {/* Only show error if there's a real API-related error */}
                {error && <div className="text-center text-red-600 text-lg mb-8">Error: {error}</div>}
                {/* Display workout plan if available, or default message if none and not loading/error */}
                {workoutPlan.length > 0 && (
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {workoutPlan.map((workout, index) => (
                            <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-xl text-gray-800">{workout.day}</CardTitle>
                                        <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">{workout.difficulty}</Badge>
                                    </div>
                                    <CardDescription className="text-lg font-medium text-gray-700">{workout.focus}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-gray-600 mb-4">
                                            <Clock className="w-4 h-4" />
                                            <span>{workout.duration}</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {workout.exercises.map((exercise, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-gray-700">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    {exercise}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
                <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-2xl mb-8">
                    <CardContent className="p-8 text-center">
                        <Camera className="w-12 h-12 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold mb-4">Ready to Start with AI Form Coach?</h2>
                        <p className="text-xl mb-6 opacity-90"> Your AI coach will watch your form in real-time and provide instant feedback to perfect your technique </p>
                        <Button onClick={onStartWorkout} size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" >
                            <Camera className="w-5 h-5 mr-2" />
                            Start AI-Guided Workout
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default WorkoutPlan;