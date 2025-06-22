import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, Calendar, Dumbbell, SkipForward, HardHat } from "lucide-react";

interface Goals {
    primaryGoal: string;
    targetWeight?: string;
    workoutFrequency?: string;
    muscleGroups: string[];
    timeframe?: string;
    fitnessLevel: string;
    availableEquipment?: string;
}

const GoalsForm = ({ onComplete }: { onComplete: (goals: Goals | null) => void }) => {
    const [goals, setGoals] = useState<Goals>({
        primaryGoal: "",
        workoutFrequency: "",
        fitnessLevel: "",
        muscleGroups: [],
        targetWeight: undefined,
        timeframe: undefined,
        availableEquipment: undefined,
    });

    const [errors, setErrors] = useState<{
        primaryGoal?: string;
        fitnessLevel?: string;
    }>({});

    const muscleGroupOptions = [
        "Chest", "Back", "Shoulders", "Arms", "Core", "Legs", "Glutes", "Full Body"
    ];

    const handleMuscleGroupChange = (muscleGroup: string, checked: boolean) => {
        if (checked) {
            setGoals({...goals, muscleGroups: [...goals.muscleGroups, muscleGroup]});
        } else {
            setGoals({...goals, muscleGroups: goals.muscleGroups.filter(mg => mg !== muscleGroup)});
        }
    };

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!goals.primaryGoal || goals.primaryGoal.trim() === "") {
            newErrors.primaryGoal = "Primary Goal is required.";
        }
        if (!goals.fitnessLevel || goals.fitnessLevel.trim() === "") {
            newErrors.fitnessLevel = "Fitness Level is required.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            const submittedGoals: Goals = {
                ...goals,
                targetWeight: goals.targetWeight || undefined,
                workoutFrequency: goals.workoutFrequency || undefined,
                timeframe: goals.timeframe || undefined,
                availableEquipment: goals.availableEquipment || undefined,
            };
            onComplete(submittedGoals);
        }
    };

    const handleSkip = () => {
        onComplete(null);
    };

    const canSubmit = goals.primaryGoal.trim() !== "" && goals.fitnessLevel.trim() !== "";

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6">
            <Card className="w-full max-w-3xl shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
                        <Target className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-800">What are your goals?</CardTitle>
                    {/* ORIGINAL CardDescription */}
                    <CardDescription className="text-lg text-gray-600">
                        Let's create a workout plan that matches your aspirations
                    </CardDescription>
                    {/* NEW PARAGRAPH FOR MANDATORY MESSAGE */}
                    <p className="text-lg text-red-500 mt-2">
                        * Primary Goal and Fitness Level fields are mandatory for personal plan.
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                {/* PRIMARY GOAL - MANDATORY */}
                                <Label className="text-sm font-medium text-gray-700">
                                    Primary Goal <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    onValueChange={(value) => {
                                        setGoals(prev => ({...prev, primaryGoal: value}));
                                        setErrors(prev => ({...prev, primaryGoal: undefined}));
                                    }}
                                    value={goals.primaryGoal}
                                    onOpenChange={(open) => { if (!open) validateForm(); }}
                                >
                                    <SelectTrigger className={`h-12 border-2 ${errors.primaryGoal ? 'border-red-500' : 'border-gray-200'} focus:border-purple-500`}>
                                        <SelectValue placeholder="Choose your main goal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weight-loss">Weight Loss</SelectItem>
                                        <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                                        <SelectItem value="strength">Build Strength</SelectItem>
                                        <SelectItem value="endurance">Improve Endurance</SelectItem>
                                        <SelectItem value="toning">Toning & Definition</SelectItem>
                                        <SelectItem value="general-fitness">General Fitness</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.primaryGoal && <p className="text-red-500 text-xs">{errors.primaryGoal}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="targetWeight" className="text-sm font-medium text-gray-700">
                                    Target Weight (lbs) - Optional
                                </Label>
                                <Input
                                    id="targetWeight"
                                    type="number"
                                    placeholder="Goal weight"
                                    value={goals.targetWeight || ''}
                                    onChange={(e) => setGoals({...goals, targetWeight: e.target.value})}
                                    className="h-12 border-2 border-gray-200 focus:border-purple-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                {/* WORKOUT FREQUENCY - OPTIONAL */}
                                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Workout Frequency (Optional)
                                </Label>
                                <Select onValueChange={(value) => {
                                    setGoals({...goals, workoutFrequency: value});
                                }} value={goals.workoutFrequency || ''}>
                                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500">
                                        <SelectValue placeholder="How often will you train?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2-3 times per week">2-3 times per week</SelectItem>
                                        <SelectItem value="3-4 times per week">3-4 times per week</SelectItem>
                                        <SelectItem value="4-5 times per week">4-5 times per week</SelectItem>
                                        <SelectItem value="6-7 times per week">6-7 times per week</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                {/* FITNESS LEVEL - MANDATORY */}
                                <Label className="text-sm font-medium text-gray-700">
                                    Your Current Fitness Level <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    onValueChange={(value) => {
                                        setGoals(prev => ({...prev, fitnessLevel: value}));
                                        setErrors(prev => ({...prev, fitnessLevel: undefined}));
                                    }}
                                    value={goals.fitnessLevel}
                                    onOpenChange={(open) => { if (!open) validateForm(); }}
                                >
                                    <SelectTrigger className={`h-12 border-2 ${errors.fitnessLevel ? 'border-red-500' : 'border-gray-200'} focus:border-purple-500`}>
                                        <SelectValue placeholder="Select your level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.fitnessLevel && <p className="text-red-500 text-xs">{errors.fitnessLevel}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Dumbbell className="w-4 h-4" />
                                Available Equipment (Optional)
                            </Label>
                            <Select onValueChange={(value) => setGoals({...goals, availableEquipment: value})} value={goals.availableEquipment || ''}>
                                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500">
                                    <SelectValue placeholder="What equipment do you have access to?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full gym">Full Gym</SelectItem>
                                    <SelectItem value="home gym (basic)">Home Gym (basic weights, bands)</SelectItem>
                                    <SelectItem value="bodyweight only">Bodyweight Only</SelectItem>
                                    <SelectItem value="specific equipment (e.g., dumbbells)">Specific Equipment (e.g., dumbbells, kettlebells)</SelectItem>
                                    <SelectItem value="outdoor (running/cycling)">Outdoor (running/cycling)</SelectItem>
                                    <SelectItem value="mixed (gym & home)">Mixed (Gym & Home)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            {/* TIMEFRAME - OPTIONAL */}
                            <Label className="text-sm font-medium text-gray-700">
                                Timeframe (Optional)
                            </Label>
                            <Select onValueChange={(value) => {
                                setGoals({...goals, timeframe: value});
                            }} value={goals.timeframe || ''}>
                                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500">
                                    <SelectValue placeholder="When do you want to achieve this?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1 month">1 Month</SelectItem>
                                    <SelectItem value="3 months">3 Months</SelectItem>
                                    <SelectItem value="6 months">6 Months</SelectItem>
                                    <SelectItem value="1 year">1 Year</SelectItem>
                                    <SelectItem value="long-term (1+ years)">Long-term (1+ years)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Dumbbell className="w-4 h-4" />
                                Focus Areas (Select all that apply) - Optional
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {muscleGroupOptions.map((muscleGroup) => (
                                    <div key={muscleGroup} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={muscleGroup}
                                            checked={goals.muscleGroups.includes(muscleGroup)}
                                            onCheckedChange={(checked) => handleMuscleGroupChange(muscleGroup, checked as boolean)}
                                            className="border-2 border-gray-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                        />
                                        <Label htmlFor={muscleGroup} className="text-sm text-gray-700 cursor-pointer">
                                            {muscleGroup}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                disabled={!canSubmit}
                                className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                            >
                                Generate My Workout Plan
                            </Button>

                            <Button
                                type="button"
                                onClick={handleSkip}
                                variant="outline"
                                className="h-12 px-6 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-all duration-300"
                            >
                                <SkipForward className="w-4 h-4 mr-2" />
                                Skip
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default GoalsForm;