import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera as CameraIcon, Pause, Play, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";

const AICoachDemo = ({ onBack }: { onBack: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentExercise, setCurrentExercise] = useState("Push-ups");
  const [formScore, setFormScore] = useState(85);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("Keep your core tight!");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const exercises = ["Push-ups", "Squats", "Planks", "Lunges"];

  // Initialize camera
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        console.log("Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("Camera stream connected");
          setCameraReady(true);
          setCameraError(null);
        }
      } catch (error) {
        console.error("Camera access error:", error);
        if (mounted) {
          setCameraError("Unable to access camera. Please check permissions.");
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Simulate form tracking (without MediaPipe for now)
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      // Simulate form analysis
      const scores = [75, 80, 85, 90, 95];
      const feedbacks = [
        "Keep your core tight!",
        "Great form!",
        "Lower your body more",
        "Perfect alignment!",
        "Maintain steady pace"
      ];
      
      const randomScore = scores[Math.floor(Math.random() * scores.length)];
      const randomFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
      
      setFormScore(randomScore);
      setFeedback(randomFeedback);
      
      // Simulate rep counting
      if (Math.random() > 0.7) {
        setReps(prev => prev + 1);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (!cameraReady) {
      setCameraError("Camera not ready. Please refresh and allow camera access.");
      return;
    }
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
          <Card className="bg-black/50 backdrop-blur-sm border-gray-700">
            <CardContent className="p-6">
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                {cameraError ? (
                  <div className="text-center z-10">
                    <CameraIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 text-lg mb-4">{cameraError}</p>
                    <Button 
                      onClick={() => window.location.reload()} 
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Refresh Page
                    </Button>
                  </div>
                ) : !cameraReady ? (
                  <div className="text-center z-10">
                    <CameraIcon className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-blue-400 text-lg">Starting camera...</p>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                    REC
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <Button
                  onClick={toggleRecording}
                  disabled={!cameraReady}
                  className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                    isRecording 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "bg-green-500 hover:bg-green-600 text-white"
                  } ${!cameraReady ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isRecording ? (
                    <>
                      <Pause className="mr-2 w-5 h-5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 w-5 h-5" /> Start
                    </>
                  )}
                </Button>

                <Button
                  onClick={resetSession}
                  variant="outline"
                  className="px-8 py-3 rounded-full font-semibold border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RotateCcw className="mr-2 w-5 h-5" /> Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
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

            <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Form Score</h3>
                  <Badge className={`${getScoreBadgeColor(formScore)} text-white px-3 py-1`}>
                    {formScore >= 90 ? "Excellent" : formScore >= 75 ? "Good" : "Needs Work"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-5xl font-bold ${getScoreColor(formScore)}`}>{formScore}%</span>
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

            <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Rep Counter</h3>
                <div className="text-center">
                  <span className="text-6xl font-bold text-purple-400">{reps}</span>
                  <p className="text-gray-300 mt-2">Completed Reps</p>
                </div>
              </CardContent>
            </Card>

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
