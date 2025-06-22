// WorkoutPlan.tsx (No major changes needed, just verify its logic)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Flame, Trophy, Camera, Zap } from "lucide-react";
import { useState, useEffect } from 'react';

interface WorkoutPlanItem {
    day: string;
    focus: string;
    exercises: string[];
    duration: string;
    difficulty: string;
}

interface WorkoutPlanProps {
    healthStats: {
        age?: number;
        gender?: string;
        weight?: number;
        height?: number;
        medicalConditions?: string;
        // ... other health stats
    };
    goals: {
        primaryGoal?: string;
        workoutFrequency?: string;
        timeframe?: string;
        fitnessLevel?: string;
        availableEquipment?: string;
        // ... other goals
    };
    onStartWorkout: () => void;
}

const WorkoutPlan = ({ healthStats, goals, onStartWorkout }: WorkoutPlanProps) => {
    const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlanItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasUserData = healthStats && Object.keys(healthStats).length > 0 && goals && Object.keys(goals).length > 0;

    useEffect(() => {
        const fetchWorkoutPlan = async () => {
            if (!hasUserData) {
                // Default plan if no user data
                setWorkoutPlan([
                    {
                        day: "Day 1",
                        focus: "Upper Body",
                        exercises: ["Push-ups", "Pull-ups", "Shoulder Press", "Tricep Dips"],
                        duration: "45 min",
                        difficulty: "Intermediate"
                    },
                    {
                        day: "Day 2",
                        focus: "Lower Body",
                        exercises: ["Squats", "Lunges", "Deadlifts", "Calf Raises"],
                        duration: "50 min",
                        difficulty: "Intermediate"
                    },
                    {
                        day: "Day 3",
                        focus: "Core & Cardio",
                        exercises: ["Planks", "Russian Twists", "Mountain Climbers", "Burpees"],
                        duration: "40 min",
                        difficulty: "Beginner"
                    }
                ]);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await fetch('https://form-friend-fitness-ai.onrender.com/generate-workout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ healthStats, goals }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    // Include rawResponse if provided by backend for better debugging
                    const errorMessage = errorData.message || 'Failed to fetch workout plan';
                    const rawResponseInfo = errorData.rawResponse ? ` Raw: ${errorData.rawResponse.substring(0, 100)}...` : '';
                    throw new Error(errorMessage + rawResponseInfo);
                }

                const data: WorkoutPlanItem[] = await response.json();
                setWorkoutPlan(data);
            } catch (err: any) {
                console.error("Error fetching workout plan:", err);
                setError(err.message || "Failed to generate workout plan. Please try again.");
                // Fallback to default plan on error
                setWorkoutPlan([
                    {
                        day: "Day 1",
                        focus: "Upper Body",
                        exercises: ["Push-ups", "Pull-ups", "Shoulder Press", "Tricep Dips"],
                        duration: "45 min",
                        difficulty: "Intermediate"
                    },
                    {
                        day: "Day 2",
                        focus: "Lower Body",
                        exercises: ["Squats", "Lunges", "Deadlifts", "Calf Raises"],
                        duration: "50 min",
                        difficulty: "Intermediate"
                    },
                    {
                        day: "Day 3",
                        focus: "Core & Cardio",
                        exercises: ["Planks", "Russian Twists", "Mountain Climbers", "Burpees"],
                        duration: "40 min",
                        difficulty: "Beginner"
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkoutPlan();
    }, [healthStats, goals, hasUserData]); // Re-fetch when healthStats or goals change

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-6">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        {hasUserData ? "Your Personalized Workout Plan" : "Default Workout Plan"}
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        {hasUserData
                            ? "Based on your profile, we've created a custom plan to help you achieve your goals"
                            : "A general workout plan to get you started - customize it anytime by adding your profile"
                        }
                    </p>
                </div>

                {/* Summary Cards - only show if user has data */}
                {hasUserData && (
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

                {loading && (
                    <div className="text-center text-xl text-gray-700 mb-8">
                        Generating your personalized workout plan...
                    </div>
                )}

                {error && (
                    <div className="text-center text-red-600 text-lg mb-8">
                        Error: {error}
                    </div>
                )}

                {/* Workout Plan */}
                {workoutPlan.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {workoutPlan.map((workout, index) => (
                            <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-xl text-gray-800">{workout.day}</CardTitle>
                                        <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                                            {workout.difficulty}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-lg font-medium text-gray-700">
                                        {workout.focus}
                                    </CardDescription>
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
                ) : (
                    !loading && !error && (
                        <div className="text-center text-gray-600 text-lg mb-8">
                            No workout plan generated yet. Please provide your health stats and goals.
                        </div>
                    )
                )}

                {/* AI Coach Feature - Second Card for clarity, though it's similar */}
                <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-2xl mb-8">
                    <CardContent className="p-8 text-center">
                        <Camera className="w-12 h-12 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold mb-4">Ready to Start with AI Form Tracking?</h2>
                        <p className="text-xl mb-6 opacity-90">
                            Your AI coach will watch your form in real-time and provide instant feedback to perfect your technique
                        </p>
                        <Button
                            onClick={onStartWorkout}
                            size="lg"
                            className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
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