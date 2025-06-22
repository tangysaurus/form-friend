import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, Calendar, Dumbbell, SkipForward } from "lucide-react";

interface Goals {
  primaryGoal: string;
  targetWeight: string;
  workoutFrequency: string;
  muscleGroups: string[];
  timeframe: string;
}

const GoalsForm = ({ onComplete }: { onComplete: (goals: Goals | null) => void }) => {
  const [goals, setGoals] = useState<Goals>({
    primaryGoal: "",
    targetWeight: "",
    workoutFrequency: "",
    muscleGroups: [],
    timeframe: ""
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(goals);
  };

  const handleSkip = () => {
    onComplete(null);
  };

  const isValid = goals.primaryGoal && goals.workoutFrequency && goals.muscleGroups.length > 0 && goals.timeframe;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">What are your goals?</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Let's create a workout plan that matches your aspirations (all fields optional)
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Primary Goal</Label>
                <Select onValueChange={(value) => setGoals({...goals, primaryGoal: value})}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500">
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetWeight" className="text-sm font-medium text-gray-700">
                  Target Weight (lbs) - Optional
                </Label>
                <Input
                  id="targetWeight"
                  type="number"
                  placeholder="Goal weight"
                  value={goals.targetWeight}
                  onChange={(e) => setGoals({...goals, targetWeight: e.target.value})}
                  className="h-12 border-2 border-gray-200 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Workout Frequency
                </Label>
                <Select onValueChange={(value) => setGoals({...goals, workoutFrequency: value})}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500">
                    <SelectValue placeholder="How often will you train?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2-3">2-3 times per week</SelectItem>
                    <SelectItem value="4-5">4-5 times per week</SelectItem>
                    <SelectItem value="6-7">6-7 times per week</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Timeframe</Label>
                <Select onValueChange={(value) => setGoals({...goals, timeframe: value})}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500">
                    <SelectValue placeholder="When do you want to achieve this?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-month">1 Month</SelectItem>
                    <SelectItem value="3-months">3 Months</SelectItem>
                    <SelectItem value="6-months">6 Months</SelectItem>
                    <SelectItem value="1-year">1 Year</SelectItem>
                    <SelectItem value="long-term">Long-term (1+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Focus Areas (Select all that apply)
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
