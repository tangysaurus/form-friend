
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Scale, Ruler, Activity } from "lucide-react";

interface HealthStats {
  age: string;
  weight: string;
  height: string;
  fitnessLevel: string;
  gender: string;
}

const HealthStatsForm = ({ onNext }: { onNext: (stats: HealthStats) => void }) => {
  const [stats, setStats] = useState<HealthStats>({
    age: "",
    weight: "",
    height: "",
    fitnessLevel: "",
    gender: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(stats);
  };

  const isValid = stats.age && stats.weight && stats.height && stats.fitnessLevel && stats.gender;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">Tell us about yourself</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            We'll use this information to create your personalized training plan
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={stats.age}
                  onChange={(e) => setStats({...stats, age: e.target.value})}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
                <Select onValueChange={(value) => setStats({...stats, gender: value})}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Weight (lbs)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="150"
                  value={stats.weight}
                  onChange={(e) => setStats({...stats, weight: e.target.value})}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Height (inches)
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="68"
                  value={stats.height}
                  onChange={(e) => setStats({...stats, height: e.target.value})}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Current Fitness Level
              </Label>
              <Select onValueChange={(value) => setStats({...stats, fitnessLevel: value})}>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Select your fitness level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner - Just starting out</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Regular exercise</SelectItem>
                  <SelectItem value="advanced">Advanced - Very active lifestyle</SelectItem>
                  <SelectItem value="expert">Expert - Professional athlete level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              disabled={!isValid}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              Continue to Goals
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthStatsForm;
