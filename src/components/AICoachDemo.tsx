
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Pause, Play, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";

const AICoachDemo = ({ onBack }: { onBack: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentExercise, setCurrentExercise] = useState("Push-ups");
  const [formScore, setFormScore] = useState(85);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("Keep your core tight!");

  const exercises = ["Push-ups", "Squats", "Planks", "Lunges"];
  const feedbackMessages = [
    "Perfect form! Keep it up!",
    "Lower your body a bit more",
    "Keep your core engaged",
    "Great rhythm, maintain it!",
    "Adjust your hand position",
    "Excellent technique!"
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        // Simulate changing form score and feedback
        setFormScore(Math.floor(Math.random() * 30) + 70);
        setFeedback(feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]);
        
        // Occasionally increment reps
        if (Math.random() > 0.7) {
          setReps(prev => prev + 1);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const resetSession = () => {
    setIsRecording(false);
    setReps(0);
    setFormScore(85);
    setFeedback("Ready to start!");
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">AI Coach Live Demo</h1>
          <p className="text-xl text-gray-300">
            Experience real-time form tracking and feedback
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Camera View */}
          <Card className="bg-black/50 backdrop-blur-sm border-gray-700">
            <CardContent className="p-6">
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
                
                {/* Simulated camera feed */}
                <div className="text-center z-10">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    {isRecording ? "AI is analyzing your form..." : "Camera ready"}
                  </p>
                </div>

                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-500 font-medium">LIVE</span>
                  </div>
                )}

                {/* Skeleton pose overlay */}
                {isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-48 border-2 border-cyan-400 rounded-lg opacity-50 animate-pulse"></div>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <Button
                  onClick={toggleRecording}
                  className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                    isRecording 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Pause className="mr-2 w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 w-5 h-5" />
                      Start
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={resetSession}
                  variant="outline"
                  className="px-8 py-3 rounded-full font-semibold border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RotateCcw className="mr-2 w-5 h-5" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats and Feedback */}
          <div className="space-y-6">
            {/* Current Exercise */}
            <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Current Exercise</h3>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-cyan-400">{currentExercise}</span>
                  <select 
                    value={currentExercise}
                    onChange={(e) => setCurrentExercise(e.target.value)}
                    className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
                  >
                    {exercises.map(exercise => (
                      <option key={exercise} value={exercise}>{exercise}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Form Score */}
            <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Form Score</h3>
                  <Badge className={`${getScoreBadgeColor(formScore)} text-white px-3 py-1`}>
                    {formScore >= 90 ? "Excellent" : formScore >= 75 ? "Good" : "Needs Work"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-5xl font-bold ${getScoreColor(formScore)}`}>
                    {formScore}%
                  </span>
                  {formScore >= 90 ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  )}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 mt-4">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      formScore >= 90 ? "bg-green-500" : formScore >= 75 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${formScore}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Rep Counter */}
            <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Rep Counter</h3>
                <div className="text-center">
                  <span className="text-6xl font-bold text-purple-400">{reps}</span>
                  <p className="text-gray-300 mt-2">Completed Reps</p>
                </div>
              </CardContent>
            </Card>

            {/* AI Feedback */}
            <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">AI Feedback</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-cyan-400 text-lg font-medium">{feedback}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button 
            onClick={onBack}
            variant="outline"
            className="px-8 py-3 rounded-full font-semibold border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Back to Workout Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AICoachDemo;
