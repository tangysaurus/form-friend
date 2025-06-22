
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera as CameraIcon, Pause, Play, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

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
        console.log("Camera stream obtained");
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("Video element src set");
          
          // Set a timeout to ensure camera is ready after a short delay
          setTimeout(() => {
            if (mounted && videoRef.current && videoRef.current.readyState >= 2) {
              console.log("Camera ready - video has enough data");
              setCameraReady(true);
              setCameraError(null);
            } else if (mounted) {
              console.log("Setting camera ready after timeout");
              setCameraReady(true);
              setCameraError(null);
            }
          }, 1000);

          // Also try the standard approach
          const handleCanPlay = () => {
            console.log("Video can play event fired");
            if (mounted) {
              setCameraReady(true);
              setCameraError(null);
            }
          };

          videoRef.current.addEventListener('canplay', handleCanPlay);
          videoRef.current.addEventListener('loadeddata', handleCanPlay);
          
          // Start playing the video
          videoRef.current.play().then(() => {
            console.log("Video started playing");
          }).catch(error => {
            console.error("Video play error:", error);
          });
        }
      } catch (error) {
        console.error("Camera access error:", error);
        if (mounted) {
          setCameraError("Unable to access camera. Please check permissions and refresh the page.");
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

  const getAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    return Math.abs((radians * 180.0) / Math.PI);
  };

  const analyzeSquatForm = (keypoints: poseDetection.Keypoint[]) => {
    const leftHip = keypoints.find(k => k.name === 'left_hip');
    const leftKnee = keypoints.find(k => k.name === 'left_knee');
    const leftAnkle = keypoints.find(k => k.name === 'left_ankle');

    if (!leftHip || !leftKnee || !leftAnkle || leftHip.score! < 0.5 || leftKnee.score! < 0.5 || leftAnkle.score! < 0.5)
      return { score: 0, feedback: "Pose not detected clearly" };

    const angle = getAngle(leftHip, leftKnee, leftAnkle);
    let score = 0;
    let feedback = "";

    if (angle < 80) {
      score = 60;
      feedback = "Too low, raise your body slightly";
    } else if (angle < 110) {
      score = 90;
      feedback = "Great depth!";
    } else {
      score = 70;
      feedback = "Squat deeper";
    }

    return { score, feedback };
  };


  // Simulate form tracking (without MediaPipe for now)
  useEffect(() => {
    if (!isRecording || !videoRef.current) return;

    let detector: poseDetection.PoseDetector;
    let animationId: number;

    const runDetection = async () => {
      const poses = await detector.estimatePoses(videoRef.current!, { flipHorizontal: true });

      if (poses.length > 0) {
        const keypoints = poses[0].keypoints;
        const { score, feedback } = analyzeSquatForm(keypoints);

        setFormScore(score);
        setFeedback(feedback);

        if (score >= 85) {
          setReps(prev => prev + 1);
        }
      }

      animationId = requestAnimationFrame(runDetection);
    };

    const loadModelAndStart = async () => {
      await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      }).then(d => {
        detector = d;
        runDetection();
      });
    };

    loadModelAndStart();

    return () => {
      cancelAnimationFrame(animationId);
      detector?.dispose();
    };
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
                {isRecording && cameraReady && (
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
