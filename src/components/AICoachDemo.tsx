import { useEffect, useRef, useState, useCallback } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import styled from "styled-components";

// --- (All existing type definitions) ---
type squatAnalysis = {
  leftKneeAngle: number;
  rightKneeAngle: number;
  leftHipAngle: number;
  rightHipAngle: number;
  backAngle: number;
  depthBelowParallel: boolean;
  symmetryIssue: boolean;
  kneeFeedback: string;
  hipFeedback: string;
  backFeedback: string;
  kneeBarData: { value: number; ideal: number; range: number } | null;
  hipBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
};
type situpAnalysis = {
  torsoAngle: number;
  kneeAngle: number;
  torsoFeedback: string;
  kneeFeedback: string;
  torsoBarData: { value: number; ideal: number; range: number } | null;
  kneeBarData: { value: number; ideal: number; range: number } | null;
};
type bicepCurlAnalysis = {
  elbowAngle: number;
  backAngle: number;
  elbowFeedback: string;
  backFeedback: string;
  elbowBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
};
type rdlAnalysis = {
  kneeAngle: number;
  hipAngle: number;
  backAngle: number;
  kneeFeedback: string;
  hipFeedback: string;
  backFeedback: string;
  kneeBarData: { value: number; ideal: number; range: number } | null;
  hipBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
};
type deadliftAnalysis = {
  kneeAngle: number;
  hipAngle: number;
  backAngle: number;
  kneeFeedback: string;
  hipFeedback: string;
  backFeedback: string;
  kneeBarData: { value: number; ideal: number; range: number } | null;
  hipBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
};
type lungeAnalysis = {
  leftKneeAngle: number;
  rightKneeAngle: number;
  backAngle: number;
  leftKneeFeedback: string;
  rightKneeFeedback: string;
  backFeedback: string;
  leftKneeBarData: { value: number; ideal: number; range: number } | null;
  rightKneeBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
};
type pushupAnalysis = {
  elbowAngle: number;
  backAngle: number;
  elbowFeedback: string;
  backFeedback: string;
  elbowBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
};
type hipThrustAnalysis = {
  kneeAngle: number;
  hipAngle: number;
  kneeFeedback: string;
  hipFeedback: string;
  kneeBarData: { value: number; ideal: number; range: number } | null;
  hipBarData: { value: number; ideal: number; range: number } | null;
};
type barbellRowAnalysis = {
  kneeAngle: number;
  backAngle: number;
  elbowAngle: number;
  kneeFeedback: string;
  backFeedback: string;
  elbowFeedback: string;
  kneeBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
  elbowBarData: { value: number; ideal: number; range: number } | null;
};
type plankAnalysis = {
  elbowAngle: number;
  backAngle: number;
  elbowFeedback: string;
  backFeedback: string;
  elbowBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
};
type shoulderPressAnalysis = {
  elbowAngle: number;
  backAngle: number;
  elbowFeedback: string;
  backFeedback: string;
  elbowBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
};

// --- NEW: Define Good Morning analysis type ---
type goodMorningAnalysis = {
  kneeAngle: number;
  hipAngle: number;
  backAngle: number;
  elbowAngle: number;
  kneeFeedback: string;
  hipFeedback: string;
  backFeedback: string;
  elbowFeedback: string;
  kneeBarData: { value: number; ideal: number; range: number } | null;
  hipBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
  elbowBarData: { value: number; ideal: number; range: number } | null;
};


// --- (All styled-components remain the same) ---
const PageLayout = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 40px;
  gap: 40px;
  font-family: 'Poppins', sans-serif;
  background-color: #f9f9f9;
  min-height: 100vh;
`;
const CameraWrapper = styled.div`
  flex: 0 0 640px;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  background-color: #000;
`;
const WebcamVideo = styled.video`
  width: 100%;
  height: auto;
  object-fit: cover;
`;
const WebcamCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;
const ControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  background-color: #ffffff;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  max-width: 400px;
  min-width: 300px;
`;
const Label = styled.label`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
`;
const Select = styled.select`
  padding: 10px 14px;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  background-color: #fdfdfd;
  transition: border 0.2s;

  &:hover {
    border-color: #888;
  }

  &:focus {
    outline: none;
    border-color: #4caf50;
  }
`;
const AngleDisplayContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-top: 20px;
  font-size: 1.2em;
`;
const AngleItem = styled.div`
  background: linear-gradient(135deg, #ffffff, #f5f5f5);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 360px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-3px);
  }
`;
const AngleLabelValue = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 1rem;
`;
const FeedbackText = styled.div`
  font-size: 0.95rem;
  font-weight: 500;
  color: #444;
  min-height: 1.2em;
`;
const FeedbackBarWrapper = styled.div`
  width: 100%;
  height: 14px;
  background: #eee;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
`;
interface FeedbackBarFillProps {
  $position: number;
  $color: string;
}
const FeedbackBarFill = styled.div<FeedbackBarFillProps>`
  position: absolute;
  top: 0;
  left: ${({ $position }) => `${$position * 100}%`};
  transform: translateX(-50%);
  width: 12px;
  height: 100%;
  background-color: ${({ $color }) => $color};
  border-radius: 50%;
  box-shadow: 0 0 8px ${({ $color }) => $color};
  transition: left 0.2s ease-in-out;
`;
const FeedbackBarIdealLine = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  width: 2px;
  height: 100%;
  background-color: #4caf50;
  z-index: 1;
`;

const DemoVideoContainer = styled.div`
  margin-top: 20px;
  width: 100%;
`;

const DemoVideo = styled.video`
  width: 100%;
  max-height: 360px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const demoVideos: Record<string, string> = {
  "Squat": "/squat_animation.mp4",
  "Push-up": "/pushup_animation.mp4",
  "Plank": "/plank_animation.mp4",
  "Shoulder Press": "/shoulderpress_animation.mp4",
  "Lunge": "/lunge_animation.mp4",
  "Hip Thrust": "hipthrust_animation.mp4",
  "Barbell Row": "barbellrow_animation.mp4",
  "Good Morning": "goodmorning_animation.mp4",
  "Sit-up": "situp_animation.mp4",
  "Bicep Curl": "bicepcurl_animation.mp4",
  "RDL": "rdl_animation.mp4",
  "Deadlift": "deadlift_animation.mp4"
  // ...
};

const ViewToggleContainer = styled.div`
  display: flex;
  border: 2px solid #ccc;
  border-radius: 12px;
  overflow: hidden;
  width: fit-content;
  margin-bottom: 20px;
`;

const ViewOption = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  border: none;
  background: ${({ active }) => (active ? "#4caf50" : "#f0f0f0")};
  color: ${({ active }) => (active ? "white" : "#333")};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: ${({ active }) => (active ? "#43a047" : "#e0e0e0")};
  }
`;


// --- MODIFIED: BufferedAngles type ---
type BufferedAngles = {
  knee: number[]; hip: number[]; back: number[];
  torso: number[]; situpKnee: number[];
  elbow: number[]; bicepBack: number[];
  rdlKnee: number[]; rdlHip: number[]; rdlBack: number[];
  deadliftKnee: number[]; deadliftHip: number[]; deadliftBack: number[];
  lungeLeftKnee: number[]; lungeRightKnee: number[]; lungeBack: number[];
  pushupElbow: number[]; pushupBack: number[];
  hipThrustKnee: number[]; hipThrustHip: number[];
  barbellRowKnee: number[]; barbellRowBack: number[]; barbellRowElbow: number[];
  plankElbow: number[]; plankBack: number[];
  shoulderPressElbow: number[]; shoulderPressBack: number[];
  goodMorningKnee: number[]; goodMorningHip: number[]; goodMorningBack: number[]; goodMorningElbow: number[];
};

const ANGLE_BUFFER_SIZE = 5;
const DETECTION_AND_UI_UPDATE_INTERVAL_MS = 500;

const IDEAL_SQUAT_ANGLES = { knee: 70, hip: 70, back: 15 };
const IDEAL_SITUP_ANGLES = { torsoUp: 50, knee: 60 };
const IDEAL_BICEP_CURL_ANGLES = { elbowUp: 30, back: 0 };
const IDEAL_RDL_ANGLES = { knee: 155, hip: 90, back: 60 };
const IDEAL_DEADLIFT_ANGLES = { knee: 80, hip: 50, back: 60 };
const IDEAL_LUNGE_ANGLES = { leftKnee: 90, rightKnee: 90, back: 0 };
const IDEAL_PUSHUP_ANGLES = { elbow: 90, back: 0 };
const IDEAL_HIP_THRUST_ANGLES = { knee: 90, hip: 180 };
const IDEAL_BARBELL_ROW_ANGLES = { knee: 140, back: 40, elbow: 160 };
const IDEAL_PLANK_ANGLES = { elbow: 90, back: 0 };
const IDEAL_SHOULDER_PRESS_ANGLES = { elbow: 180, back: 0 };
// --- NEW: Ideal angle definitions for Good Morning ---
const IDEAL_GOOD_MORNING_ANGLES = { knee: 150, hip: 85, back: 65, elbow: 65 };

const DISPLAY_RANGE_DEGREES = 200;
const EXCELLENT_RANGE_DEGREES = 25;

const AICoachDemo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const detectionIntervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [selectedExercise, setSelectedExercise] = useState("Push-up");
  const [squatMetrics, setSquatMetrics] = useState<squatAnalysis | null>(null);
  const [situpMetrics, setSitupMetrics] = useState<situpAnalysis | null>(null);
  const [bicepCurlMetrics, setBicepCurlMetrics] = useState<bicepCurlAnalysis | null>(null);
  const [rdlMetrics, setRdlMetrics] = useState<rdlAnalysis | null>(null);
  const [deadliftMetrics, setDeadliftMetrics] = useState<deadliftAnalysis | null>(null);
  const [lungeMetrics, setLungeMetrics] = useState<lungeAnalysis | null>(null);
  const [pushupMetrics, setPushupMetrics] = useState<pushupAnalysis | null>(null);
  const [hipThrustMetrics, setHipThrustMetrics] = useState<hipThrustAnalysis | null>(null);
  const [barbellRowMetrics, setBarbellRowMetrics] = useState<barbellRowAnalysis | null>(null);
  const [plankMetrics, setPlankMetrics] = useState<plankAnalysis | null>(null);
  const [shoulderPressMetrics, setShoulderPressMetrics] = useState<shoulderPressAnalysis | null>(null);
  // --- NEW: State for Good Morning metrics ---
  const [goodMorningMetrics, setGoodMorningMetrics] = useState<goodMorningAnalysis | null>(null);

  const [viewMode, setViewMode] = useState<"camera" | "demo">("camera");


  // --- MODIFIED: Update angle buffers ---
  const angleBuffers = useRef<BufferedAngles>({
    knee: [], hip: [], back: [], torso: [], situpKnee: [], elbow: [], bicepBack: [], rdlKnee: [], rdlHip: [], rdlBack: [], deadliftKnee: [], deadliftHip: [], deadliftBack: [], lungeLeftKnee: [], lungeRightKnee: [], lungeBack: [], pushupElbow: [], pushupBack: [], hipThrustKnee: [], hipThrustHip: [], barbellRowKnee: [], barbellRowBack: [], barbellRowElbow: [], plankElbow: [], plankBack: [], shoulderPressElbow: [], shoulderPressBack: [], goodMorningKnee: [], goodMorningHip: [], goodMorningBack: [], goodMorningElbow: [],
  });

  const updateAngleBuffer = (buffer: number[], newValue: number) => { if (isNaN(newValue)) return; buffer.push(newValue); if (buffer.length > ANGLE_BUFFER_SIZE) buffer.shift(); };
  const getAverage = (buffer: number[]) => { if (buffer.length === 0) return 0; const sum = buffer.reduce((acc, val) => acc + val, 0); return sum / buffer.length; };
  function getAngle(a: poseDetection.Keypoint, b: poseDetection.Keypoint, c: poseDetection.Keypoint) { if (!a || !b || !c) return NaN; const ab = { x: a.x - b.x, y: a.y - b.y }; const cb = { x: c.x - b.x, y: c.y - b.y }; const dot = ab.x * cb.x + ab.y * cb.y; const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2); const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2); if (magAB === 0 || magCB === 0) return NaN; let angleRad = Math.acos(Math.max(-1, Math.min(1, dot / (magAB * magCB)))); return (angleRad * 180) / Math.PI; }

  const analyzeSquatPose = (keypoints: poseDetection.Keypoint[]): squatAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), rightShoulder = get(6), leftHip = get(11), rightHip = get(12), leftKnee = get(13), rightKnee = get(14), leftAnkle = get(15), rightAnkle = get(16); const leftKneeAngle = getAngle(leftHip, leftKnee, leftAnkle); const rightKneeAngle = getAngle(rightHip, rightKnee, rightAnkle); const leftHipAngle = getAngle(leftShoulder, leftHip, leftKnee); const rightHipAngle = getAngle(rightShoulder, rightHip, leftKnee); const backVector = { x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2 }; const backAngle = getAngle({ x: 0, y: -1 }, { x: 0, y: 0 }, backVector); const depthBelowParallel = (leftHip.y + rightHip.y) / 2 > (leftKnee.y + rightKnee.y) / 2; const symmetryIssue = Math.abs(leftKneeAngle - rightKneeAngle) > 15; return { leftKneeAngle, rightKneeAngle, leftHipAngle, rightHipAngle, backAngle, depthBelowParallel, symmetryIssue, kneeFeedback: "", hipFeedback: "", backFeedback: "", kneeBarData: null, hipBarData: null, backBarData: null }; };
  const analyzeSitupPose = (keypoints: poseDetection.Keypoint[]): situpAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), leftHip = get(11), leftKnee = get(13), leftAnkle = get(15); const torsoAngle = getAngle(leftShoulder, leftHip, leftKnee); const kneeAngle = getAngle(leftHip, leftKnee, leftAnkle); return { torsoAngle, kneeAngle, torsoFeedback: "", kneeFeedback: "", torsoBarData: null, kneeBarData: null }; };
  const analyzeBicepCurlPose = (keypoints: poseDetection.Keypoint[]): bicepCurlAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), rightShoulder = get(6), leftElbow = get(7), leftWrist = get(9), leftHip = get(11), rightHip = get(12); const elbowAngle = getAngle(leftShoulder, leftElbow, leftWrist); const backVector = { x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2 }; const backAngle = getAngle({ x: 0, y: -1 }, { x: 0, y: 0 }, backVector); return { elbowAngle, backAngle, elbowFeedback: "", backFeedback: "", elbowBarData: null, backBarData: null, }; };
  const analyzeRdlPose = (keypoints: poseDetection.Keypoint[]): rdlAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), rightShoulder = get(6), leftHip = get(11), rightHip = get(12), leftKnee = get(13), leftAnkle = get(15); const kneeAngle = getAngle(leftHip, leftKnee, leftAnkle); const hipAngle = getAngle(leftShoulder, leftHip, leftKnee); const backVector = { x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2 }; const backAngle = getAngle({ x: 0, y: -1 }, { x: 0, y: 0 }, backVector); return { kneeAngle, hipAngle, backAngle, kneeFeedback: "", hipFeedback: "", backFeedback: "", kneeBarData: null, hipBarData: null, backBarData: null }; };
  const analyzeDeadliftPose = (keypoints: poseDetection.Keypoint[]): deadliftAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), rightShoulder = get(6), leftHip = get(11), rightHip = get(12), leftKnee = get(13), leftAnkle = get(15); const kneeAngle = getAngle(leftHip, leftKnee, leftAnkle); const hipAngle = getAngle(leftShoulder, leftHip, leftKnee); const backVector = { x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2 }; const backAngle = getAngle({ x: 0, y: -1 }, { x: 0, y: 0 }, backVector); return { kneeAngle, hipAngle, backAngle, kneeFeedback: "", hipFeedback: "", backFeedback: "", kneeBarData: null, hipBarData: null, backBarData: null }; };
  const analyzeLungePose = (keypoints: poseDetection.Keypoint[]): lungeAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), rightShoulder = get(6), leftHip = get(11), rightHip = get(12), leftKnee = get(13), rightKnee = get(14), leftAnkle = get(15), rightAnkle = get(16); const leftKneeAngle = getAngle(leftHip, leftKnee, leftAnkle); const rightKneeAngle = getAngle(rightHip, rightKnee, rightAnkle); const backVector = { x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2 }; const backAngle = getAngle({ x: 0, y: -1 }, { x: 0, y: 0 }, backVector); return { leftKneeAngle, rightKneeAngle, backAngle, leftKneeFeedback: "", rightKneeFeedback: "", backFeedback: "", leftKneeBarData: null, rightKneeBarData: null, backBarData: null }; };
  const analyzePushupPose = (keypoints: poseDetection.Keypoint[]): pushupAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), rightShoulder = get(6), leftElbow = get(7), rightElbow = get(8), leftWrist = get(9), rightWrist = get(10), leftHip = get(11), rightHip = get(12); const leftElbowAngle = getAngle(leftShoulder, leftElbow, leftWrist); const rightElbowAngle = getAngle(rightShoulder, rightElbow, rightWrist); const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2; const backVector = { x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2 }; const backAngle = getAngle({ x: 1, y: 0 }, { x: 0, y: 0 }, backVector); return { elbowAngle, backAngle, elbowFeedback: "", backFeedback: "", elbowBarData: null, backBarData: null }; };
  const analyzeHipThrustPose = (keypoints: poseDetection.Keypoint[]): hipThrustAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), leftHip = get(11), leftKnee = get(13), leftAnkle = get(15); const kneeAngle = getAngle(leftHip, leftKnee, leftAnkle); const hipAngle = getAngle(leftShoulder, leftHip, leftKnee); return { kneeAngle, hipAngle, kneeFeedback: "", hipFeedback: "", kneeBarData: null, hipBarData: null }; };
  const analyzeBarbellRowPose = (keypoints: poseDetection.Keypoint[]): barbellRowAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), rightShoulder = get(6), leftHip = get(11), rightHip = get(12), leftKnee = get(13), leftAnkle = get(15), leftElbow = get(7), leftWrist = get(9); const kneeAngle = getAngle(leftHip, leftKnee, leftAnkle); const backVector = { x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2 }; const backAngle = getAngle({ x: 0, y: -1 }, { x: 0, y: 0 }, backVector); const elbowAngle = getAngle(leftShoulder, leftElbow, leftWrist); return { kneeAngle, backAngle, elbowAngle, kneeFeedback: "", backFeedback: "", elbowFeedback: "", kneeBarData: null, backBarData: null, elbowBarData: null }; };
  const analyzePlankPose = (keypoints: poseDetection.Keypoint[]): plankAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), rightShoulder = get(6), leftElbow = get(7), rightElbow = get(8), leftWrist = get(9), rightWrist = get(10), leftHip = get(11), rightHip = get(12); const leftElbowAngle = getAngle(leftShoulder, leftElbow, leftWrist); const rightElbowAngle = getAngle(rightShoulder, rightElbow, rightWrist); const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2; const backVector = { x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2 }; const backAngle = getAngle({ x: 1, y: 0 }, { x: 0, y: 0 }, backVector); return { elbowAngle, backAngle, elbowFeedback: "", backFeedback: "", elbowBarData: null, backBarData: null }; };
  const analyzeShoulderPressPose = (keypoints: poseDetection.Keypoint[]): shoulderPressAnalysis => { const get = (i: number) => keypoints[i]; const leftShoulder = get(5), rightShoulder = get(6), leftElbow = get(7), leftWrist = get(9), leftHip = get(11), rightHip = get(12); const elbowAngle = getAngle(leftShoulder, leftElbow, leftWrist); const backVector = { x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2 }; const backAngle = getAngle({ x: 0, y: -1 }, { x: 0, y: 0 }, backVector); return { elbowAngle, backAngle, elbowFeedback: "", backFeedback: "", elbowBarData: null, backBarData: null }; };
  // --- NEW: Function to analyze Good Morning pose ---
  const analyzeGoodMorningPose = (keypoints: poseDetection.Keypoint[]): goodMorningAnalysis => {
    const get = (i: number) => keypoints[i];
    const leftShoulder = get(5), rightShoulder = get(6), leftHip = get(11), rightHip = get(12), leftKnee = get(13), leftAnkle = get(15), leftElbow = get(7), leftWrist = get(9);
    const kneeAngle = getAngle(leftHip, leftKnee, leftAnkle);
    const hipAngle = getAngle(leftShoulder, leftHip, leftKnee);
    const backVector = { x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2 };
    const backAngle = getAngle({ x: 0, y: -1 }, { x: 0, y: 0 }, backVector);
    const elbowAngle = getAngle(leftShoulder, leftElbow, leftWrist);
    return { kneeAngle, hipAngle, backAngle, elbowAngle, kneeFeedback: "", hipFeedback: "", backFeedback: "", elbowFeedback: "", kneeBarData: null, hipBarData: null, backBarData: null, elbowBarData: null };
  };

  // --- MODIFIED: Update feedback function for all new angle types ---
  const getAngleFeedbackAndBarData = (currentAngle: number, idealAngle: number, displayRange: number, excellentRange: number, angleType: 'knee' | 'hip' | 'back' | 'torso' | 'situpKnee' | 'elbow' | 'bicepBack' | 'rdlKnee' | 'rdlHip' | 'rdlBack' | 'deadliftKnee' | 'deadliftHip' | 'deadliftBack' | 'lungeLeftKnee' | 'lungeRightKnee' | 'lungeBack' | 'pushupElbow' | 'pushupBack' | 'hipThrustKnee' | 'hipThrustHip' | 'barbellRowKnee' | 'barbellRowBack' | 'barbellRowElbow' | 'plankElbow' | 'plankBack' | 'shoulderPressElbow' | 'shoulderPressBack' | 'goodMorningKnee' | 'goodMorningHip' | 'goodMorningBack' | 'goodMorningElbow') => {
    let feedback = ""; let barData: { value: number; ideal: number; range: number } | null = null; if (isNaN(currentAngle)) return { feedback: "Detecting...", barData: null }; const deviation = currentAngle - idealAngle;
    if (Math.abs(deviation) <= displayRange) {
      const minVal = idealAngle - displayRange; const maxVal = idealAngle + displayRange; const normalizedValue = (currentAngle - minVal) / (maxVal - minVal); barData = { value: normalizedValue, ideal: 0.5, range: 1 };
      if (Math.abs(deviation) <= excellentRange) { feedback = "Excellent!"; }
      else if (deviation > excellentRange) {
        if (angleType === 'goodMorningKnee') feedback = "Keep knees straighter.";
        else if (angleType === 'goodMorningHip') feedback = "Hinge less at the hips.";
        else if (angleType === 'goodMorningBack') feedback = "Keep your back flatter.";
        else if (angleType === 'goodMorningElbow') feedback = "Keep elbows in position.";
        else if (angleType === 'shoulderPressBack') feedback = "Don't lean back.";
        else if (angleType === 'shoulderPressElbow') feedback = "Press to full extension.";
        else if (angleType === 'plankBack') feedback = "Lower your hips.";
        else if (angleType === 'plankElbow') feedback = "Lower your shoulders.";
        else if (angleType === 'barbellRowKnee') feedback = "Keep knees straighter."; else if (angleType === 'barbellRowBack') feedback = "Lower your chest."; else if (angleType === 'barbellRowElbow') feedback = "Pull elbows back further.";
        else if (angleType === 'hipThrustHip') feedback = "Don't overextend your back."; else if (angleType === 'hipThrustKnee') feedback = "Move feet closer to you.";
        else if (angleType === 'deadliftKnee' || angleType === 'knee') feedback = "Bend knees more."; else if (angleType === 'deadliftHip' || angleType === 'hip') feedback = "Lower your hips."; else if (angleType === 'deadliftBack' || angleType === 'back') feedback = "Keep your back flatter.";
        else if (angleType === 'rdlKnee') feedback = "Keep knees straighter."; else if (angleType === 'rdlHip') feedback = "Hinge less at the hips."; else if (angleType === 'rdlBack') feedback = "Keep back flatter.";
        else if (angleType === 'torso') feedback = "Sit up higher."; else if (angleType === 'situpKnee') feedback = "Bend your knees less."; else if (angleType === 'elbow') feedback = "Lower the weight fully.";
        else if (angleType === 'bicepBack') feedback = "Don't lean back."; else if (angleType === 'lungeLeftKnee' || angleType === 'lungeRightKnee') feedback = "Go lower.";
        else if (angleType === 'lungeBack') feedback = "Don't lean forward."; else if (angleType === 'pushupElbow' || angleType === 'pushupBack') feedback = "Lower your hips.";
      } else { // deviation < -excellentRange
        if (angleType === 'goodMorningKnee') feedback = "Bend your knees more.";
        else if (angleType === 'goodMorningHip') feedback = "Hinge deeper at the hips.";
        else if (angleType === 'goodMorningBack') feedback = "Don't round your back.";
        else if (angleType === 'goodMorningElbow') feedback = "Keep elbows in position.";
        else if (angleType === 'shoulderPressBack') feedback = "Keep your torso upright.";
        else if (angleType === 'shoulderPressElbow') feedback = "Press higher.";
        else if (angleType === 'plankBack') feedback = "Raise your hips.";
        else if (angleType === 'plankElbow') feedback = "Align shoulders over elbows.";
        else if (angleType === 'barbellRowKnee') feedback = "Bend your knees more."; else if (angleType === 'barbellRowBack') feedback = "Keep your back flatter."; else if (angleType === 'barbellRowElbow') feedback = "Don't round your shoulders.";
        else if (angleType === 'hipThrustHip') feedback = "Push your hips higher."; else if (angleType === 'hipThrustKnee') feedback = "Move feet further away.";
        else if (angleType === 'deadliftKnee' || angleType === 'knee') feedback = "Don't squat too deep."; else if (angleType === 'deadliftHip' || angleType === 'hip') feedback = "Hinge deeper."; else if (angleType === 'deadliftBack' || angleType === 'back') feedback = "Don't round your back.";
        else if (angleType === 'rdlKnee') feedback = "Bend your knees slightly more."; else if (angleType === 'rdlHip') feedback = "Hinge deeper at the hips."; else if (angleType === 'rdlBack') feedback = "Don't round your back.";
        else if (angleType === 'torso') feedback = "Lower yourself with more control."; else if (angleType === 'situpKnee') feedback = "Bend your knees more."; else if (angleType === 'elbow') feedback = "Curl higher!";
        else if (angleType === 'bicepBack') feedback = "Keep your back straight."; else if (angleType === 'lungeLeftKnee' || angleType === 'lungeRightKnee') feedback = "Don't go too deep.";
        else if (angleType === 'lungeBack') feedback = "Keep torso upright."; else if (angleType === 'pushupElbow') feedback = "Don't flare elbows."; else if (angleType === 'pushupBack') feedback = "Don't let hips sag.";
      }
    } return { feedback, barData };
  };

  const performDetectionAndUpdateUI = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !detectorRef.current || !videoRef.current.srcObject) return;
    const poses = await detectorRef.current.estimatePoses(videoRef.current, { flipHorizontal: true }); const ctx = canvasRef.current.getContext("2d"); if (!ctx) return; ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (poses.length > 0) {
      const keypoints = poses[0].keypoints; const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet); ctx.strokeStyle = "rgb(255,0,0)"; ctx.lineWidth = 2; adjacentPairs.forEach(([i, j]) => { const kp1 = keypoints[i], kp2 = keypoints[j]; if (kp1.score! > 0.5 && kp2.score! > 0.5) { ctx.beginPath(); ctx.moveTo(kp1.x, kp1.y); ctx.lineTo(kp2.x, kp2.y); ctx.stroke(); } }); keypoints.forEach((keypoint) => { if (keypoint.score && keypoint.score > 0.5) { const { x, y } = keypoint; ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fillStyle = "rgb(0,255,0)"; ctx.fill(); } });
      setSquatMetrics(null); setSitupMetrics(null); setBicepCurlMetrics(null); setRdlMetrics(null); setDeadliftMetrics(null); setLungeMetrics(null); setPushupMetrics(null); setHipThrustMetrics(null); setBarbellRowMetrics(null); setPlankMetrics(null); setShoulderPressMetrics(null); setGoodMorningMetrics(null);
      if (selectedExercise === "Squat") {
        const rawMetrics = analyzeSquatPose(keypoints); updateAngleBuffer(angleBuffers.current.knee, rawMetrics.leftKneeAngle); updateAngleBuffer(angleBuffers.current.hip, rawMetrics.leftHipAngle); updateAngleBuffer(angleBuffers.current.back, rawMetrics.backAngle);
        const avgKnee = parseFloat(getAverage(angleBuffers.current.knee).toFixed(1)); const avgHip = parseFloat(getAverage(angleBuffers.current.hip).toFixed(1)); const avgBack = parseFloat(getAverage(angleBuffers.current.back).toFixed(1));
        const { feedback: kneeFeedback, barData: kneeBarData } = getAngleFeedbackAndBarData(avgKnee, IDEAL_SQUAT_ANGLES.knee, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'knee'); const { feedback: hipFeedback, barData: hipBarData } = getAngleFeedbackAndBarData(avgHip, IDEAL_SQUAT_ANGLES.hip, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'hip'); const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(avgBack, IDEAL_SQUAT_ANGLES.back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'back');
        setSquatMetrics({ ...rawMetrics, leftKneeAngle: avgKnee, leftHipAngle: avgHip, backAngle: avgBack, kneeFeedback, hipFeedback, backFeedback, kneeBarData, hipBarData, backBarData });
      } else if (selectedExercise === "Sit-up") {
        const rawMetrics = analyzeSitupPose(keypoints); updateAngleBuffer(angleBuffers.current.torso, rawMetrics.torsoAngle); updateAngleBuffer(angleBuffers.current.situpKnee, rawMetrics.kneeAngle);
        const avgTorso = parseFloat(getAverage(angleBuffers.current.torso).toFixed(1)); const avgKnee = parseFloat(getAverage(angleBuffers.current.situpKnee).toFixed(1));
        const { feedback: torsoFeedback, barData: torsoBarData } = getAngleFeedbackAndBarData(avgTorso, IDEAL_SITUP_ANGLES.torsoUp, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'torso'); const { feedback: kneeFeedback, barData: kneeBarData } = getAngleFeedbackAndBarData(avgKnee, IDEAL_SITUP_ANGLES.knee, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'situpKnee');
        setSitupMetrics({ ...rawMetrics, torsoAngle: avgTorso, kneeAngle: avgKnee, torsoFeedback, kneeFeedback, torsoBarData, kneeBarData });
      } else if (selectedExercise === "Bicep Curl") {
        const rawMetrics = analyzeBicepCurlPose(keypoints); updateAngleBuffer(angleBuffers.current.elbow, rawMetrics.elbowAngle); updateAngleBuffer(angleBuffers.current.bicepBack, rawMetrics.backAngle);
        const avgElbow = parseFloat(getAverage(angleBuffers.current.elbow).toFixed(1)); const avgBack = parseFloat(getAverage(angleBuffers.current.bicepBack).toFixed(1));
        const { feedback: elbowFeedback, barData: elbowBarData } = getAngleFeedbackAndBarData(avgElbow, IDEAL_BICEP_CURL_ANGLES.elbowUp, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'elbow'); const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(avgBack, IDEAL_BICEP_CURL_ANGLES.back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'bicepBack');
        setBicepCurlMetrics({ ...rawMetrics, elbowAngle: avgElbow, backAngle: avgBack, elbowFeedback, backFeedback, elbowBarData, backBarData });
      } else if (selectedExercise === "RDL") {
        const rawMetrics = analyzeRdlPose(keypoints); updateAngleBuffer(angleBuffers.current.rdlKnee, rawMetrics.kneeAngle); updateAngleBuffer(angleBuffers.current.rdlHip, rawMetrics.hipAngle); updateAngleBuffer(angleBuffers.current.rdlBack, rawMetrics.backAngle);
        const avgKnee = parseFloat(getAverage(angleBuffers.current.rdlKnee).toFixed(1)); const avgHip = parseFloat(getAverage(angleBuffers.current.rdlHip).toFixed(1)); const avgBack = parseFloat(getAverage(angleBuffers.current.rdlBack).toFixed(1));
        const { feedback: kneeFeedback, barData: kneeBarData } = getAngleFeedbackAndBarData(avgKnee, IDEAL_RDL_ANGLES.knee, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'rdlKnee'); const { feedback: hipFeedback, barData: hipBarData } = getAngleFeedbackAndBarData(avgHip, IDEAL_RDL_ANGLES.hip, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'rdlHip'); const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(avgBack, IDEAL_RDL_ANGLES.back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'rdlBack');
        setRdlMetrics({ ...rawMetrics, kneeAngle: avgKnee, hipAngle: avgHip, backAngle: avgBack, kneeFeedback, hipFeedback, backFeedback, kneeBarData, hipBarData, backBarData });
      } else if (selectedExercise === "Deadlift") {
        const rawMetrics = analyzeDeadliftPose(keypoints); updateAngleBuffer(angleBuffers.current.deadliftKnee, rawMetrics.kneeAngle); updateAngleBuffer(angleBuffers.current.deadliftHip, rawMetrics.hipAngle); updateAngleBuffer(angleBuffers.current.deadliftBack, rawMetrics.backAngle);
        const avgKnee = parseFloat(getAverage(angleBuffers.current.deadliftKnee).toFixed(1)); const avgHip = parseFloat(getAverage(angleBuffers.current.deadliftHip).toFixed(1)); const avgBack = parseFloat(getAverage(angleBuffers.current.deadliftBack).toFixed(1));
        const { feedback: kneeFeedback, barData: kneeBarData } = getAngleFeedbackAndBarData(avgKnee, IDEAL_DEADLIFT_ANGLES.knee, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'deadliftKnee'); const { feedback: hipFeedback, barData: hipBarData } = getAngleFeedbackAndBarData(avgHip, IDEAL_DEADLIFT_ANGLES.hip, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'deadliftHip'); const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(avgBack, IDEAL_DEADLIFT_ANGLES.back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'deadliftBack');
        setDeadliftMetrics({ ...rawMetrics, kneeAngle: avgKnee, hipAngle: avgHip, backAngle: avgBack, kneeFeedback, hipFeedback, backFeedback, kneeBarData, hipBarData, backBarData });
      } else if (selectedExercise === "Lunge") {
        const rawMetrics = analyzeLungePose(keypoints); updateAngleBuffer(angleBuffers.current.lungeLeftKnee, rawMetrics.leftKneeAngle); updateAngleBuffer(angleBuffers.current.lungeRightKnee, rawMetrics.rightKneeAngle); updateAngleBuffer(angleBuffers.current.lungeBack, rawMetrics.backAngle);
        const avgLeftKnee = parseFloat(getAverage(angleBuffers.current.lungeLeftKnee).toFixed(1)); const avgRightKnee = parseFloat(getAverage(angleBuffers.current.lungeRightKnee).toFixed(1)); const avgBack = parseFloat(getAverage(angleBuffers.current.lungeBack).toFixed(1));
        const { feedback: leftKneeFeedback, barData: leftKneeBarData } = getAngleFeedbackAndBarData(avgLeftKnee, IDEAL_LUNGE_ANGLES.leftKnee, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'lungeLeftKnee'); const { feedback: rightKneeFeedback, barData: rightKneeBarData } = getAngleFeedbackAndBarData(avgRightKnee, IDEAL_LUNGE_ANGLES.rightKnee, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'lungeRightKnee'); const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(avgBack, IDEAL_LUNGE_ANGLES.back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'lungeBack');
        setLungeMetrics({ ...rawMetrics, leftKneeAngle: avgLeftKnee, rightKneeAngle: avgRightKnee, backAngle: avgBack, leftKneeFeedback, rightKneeFeedback, backFeedback, leftKneeBarData, rightKneeBarData, backBarData });
      } else if (selectedExercise === "Push-up") {
        const rawMetrics = analyzePushupPose(keypoints); updateAngleBuffer(angleBuffers.current.pushupElbow, rawMetrics.elbowAngle); updateAngleBuffer(angleBuffers.current.pushupBack, rawMetrics.backAngle);
        const avgElbow = parseFloat(getAverage(angleBuffers.current.pushupElbow).toFixed(1)); const avgBack = parseFloat(getAverage(angleBuffers.current.pushupBack).toFixed(1));
        const { feedback: elbowFeedback, barData: elbowBarData } = getAngleFeedbackAndBarData(avgElbow, IDEAL_PUSHUP_ANGLES.elbow, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'pushupElbow'); const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(avgBack, IDEAL_PUSHUP_ANGLES.back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'pushupBack');
        setPushupMetrics({ ...rawMetrics, elbowAngle: avgElbow, backAngle: avgBack, elbowFeedback, backFeedback, elbowBarData, backBarData });
      } else if (selectedExercise === "Hip Thrust") {
        const rawMetrics = analyzeHipThrustPose(keypoints); updateAngleBuffer(angleBuffers.current.hipThrustKnee, rawMetrics.kneeAngle); updateAngleBuffer(angleBuffers.current.hipThrustHip, rawMetrics.hipAngle);
        const avgKnee = parseFloat(getAverage(angleBuffers.current.hipThrustKnee).toFixed(1)); const avgHip = parseFloat(getAverage(angleBuffers.current.hipThrustHip).toFixed(1));
        const { feedback: kneeFeedback, barData: kneeBarData } = getAngleFeedbackAndBarData(avgKnee, IDEAL_HIP_THRUST_ANGLES.knee, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'hipThrustKnee'); const { feedback: hipFeedback, barData: hipBarData } = getAngleFeedbackAndBarData(avgHip, IDEAL_HIP_THRUST_ANGLES.hip, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'hipThrustHip');
        setHipThrustMetrics({ ...rawMetrics, kneeAngle: avgKnee, hipAngle: avgHip, kneeFeedback, hipFeedback, kneeBarData, hipBarData });
      } else if (selectedExercise === "Barbell Row") {
        const rawMetrics = analyzeBarbellRowPose(keypoints); updateAngleBuffer(angleBuffers.current.barbellRowKnee, rawMetrics.kneeAngle); updateAngleBuffer(angleBuffers.current.barbellRowBack, rawMetrics.backAngle); updateAngleBuffer(angleBuffers.current.barbellRowElbow, rawMetrics.elbowAngle);
        const avgKnee = parseFloat(getAverage(angleBuffers.current.barbellRowKnee).toFixed(1)); const avgBack = parseFloat(getAverage(angleBuffers.current.barbellRowBack).toFixed(1)); const avgElbow = parseFloat(getAverage(angleBuffers.current.barbellRowElbow).toFixed(1));
        const { feedback: kneeFeedback, barData: kneeBarData } = getAngleFeedbackAndBarData(avgKnee, IDEAL_BARBELL_ROW_ANGLES.knee, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'barbellRowKnee'); const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(avgBack, IDEAL_BARBELL_ROW_ANGLES.back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'barbellRowBack'); const { feedback: elbowFeedback, barData: elbowBarData } = getAngleFeedbackAndBarData(avgElbow, IDEAL_BARBELL_ROW_ANGLES.elbow, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'barbellRowElbow');
        setBarbellRowMetrics({ ...rawMetrics, kneeAngle: avgKnee, backAngle: avgBack, elbowAngle: avgElbow, kneeFeedback, backFeedback, elbowFeedback, kneeBarData, backBarData, elbowBarData });
      } else if (selectedExercise === "Plank") {
        const rawMetrics = analyzePlankPose(keypoints); updateAngleBuffer(angleBuffers.current.plankElbow, rawMetrics.elbowAngle); updateAngleBuffer(angleBuffers.current.plankBack, rawMetrics.backAngle);
        const avgElbow = parseFloat(getAverage(angleBuffers.current.plankElbow).toFixed(1)); const avgBack = parseFloat(getAverage(angleBuffers.current.plankBack).toFixed(1));
        const { feedback: elbowFeedback, barData: elbowBarData } = getAngleFeedbackAndBarData(avgElbow, IDEAL_PLANK_ANGLES.elbow, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'plankElbow'); const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(avgBack, IDEAL_PLANK_ANGLES.back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'plankBack');
        setPlankMetrics({ ...rawMetrics, elbowAngle: avgElbow, backAngle: avgBack, elbowFeedback, backFeedback, elbowBarData, backBarData });
      } else if (selectedExercise === "Shoulder Press") {
        const rawMetrics = analyzeShoulderPressPose(keypoints); updateAngleBuffer(angleBuffers.current.shoulderPressElbow, rawMetrics.elbowAngle); updateAngleBuffer(angleBuffers.current.shoulderPressBack, rawMetrics.backAngle);
        const avgElbow = parseFloat(getAverage(angleBuffers.current.shoulderPressElbow).toFixed(1)); const avgBack = parseFloat(getAverage(angleBuffers.current.shoulderPressBack).toFixed(1));
        const { feedback: elbowFeedback, barData: elbowBarData } = getAngleFeedbackAndBarData(avgElbow, IDEAL_SHOULDER_PRESS_ANGLES.elbow, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'shoulderPressElbow'); const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(avgBack, IDEAL_SHOULDER_PRESS_ANGLES.back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'shoulderPressBack');
        setShoulderPressMetrics({ ...rawMetrics, elbowAngle: avgElbow, backAngle: avgBack, elbowFeedback, backFeedback, elbowBarData, backBarData });
      } else if (selectedExercise === "Good Morning") {
        const rawMetrics = analyzeGoodMorningPose(keypoints);
        updateAngleBuffer(angleBuffers.current.goodMorningKnee, rawMetrics.kneeAngle); updateAngleBuffer(angleBuffers.current.goodMorningHip, rawMetrics.hipAngle); updateAngleBuffer(angleBuffers.current.goodMorningBack, rawMetrics.backAngle); updateAngleBuffer(angleBuffers.current.goodMorningElbow, rawMetrics.elbowAngle);
        const avgKnee = parseFloat(getAverage(angleBuffers.current.goodMorningKnee).toFixed(1)); const avgHip = parseFloat(getAverage(angleBuffers.current.goodMorningHip).toFixed(1)); const avgBack = parseFloat(getAverage(angleBuffers.current.goodMorningBack).toFixed(1)); const avgElbow = parseFloat(getAverage(angleBuffers.current.goodMorningElbow).toFixed(1));
        const { feedback: kneeFeedback, barData: kneeBarData } = getAngleFeedbackAndBarData(avgKnee, IDEAL_GOOD_MORNING_ANGLES.knee, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'goodMorningKnee'); const { feedback: hipFeedback, barData: hipBarData } = getAngleFeedbackAndBarData(avgHip, IDEAL_GOOD_MORNING_ANGLES.hip, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'goodMorningHip'); const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(avgBack, IDEAL_GOOD_MORNING_ANGLES.back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'goodMorningBack'); const { feedback: elbowFeedback, barData: elbowBarData } = getAngleFeedbackAndBarData(avgElbow, IDEAL_GOOD_MORNING_ANGLES.elbow, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'goodMorningElbow');
        setGoodMorningMetrics({ ...rawMetrics, kneeAngle: avgKnee, hipAngle: avgHip, backAngle: avgBack, elbowAngle: avgElbow, kneeFeedback, hipFeedback, backFeedback, elbowFeedback, kneeBarData, hipBarData, backBarData, elbowBarData });
      }
    }
  }, [selectedExercise]);

  useEffect(() => { const loadModelAndStartWebcam = async () => { await tf.setBackend("webgl"); await tf.ready(); const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }); detectorRef.current = detector; console.log("MoveNet model loaded"); try { const stream = await navigator.mediaDevices.getUserMedia({ video: true }); if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); videoRef.current.onloadedmetadata = () => { if (videoRef.current && canvasRef.current) { canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight; } }; setMediaStream(stream); } } catch (error) { console.error("Error accessing webcam", error); } }; loadModelAndStartWebcam(); return () => { if (mediaStream) mediaStream.getTracks().forEach(track => track.stop()); if (detectorRef.current) detectorRef.current.dispose(); if (detectionIntervalIdRef.current) clearInterval(detectionIntervalIdRef.current); }; }, []);
  useEffect(() => { if (!mediaStream) return; if (detectionIntervalIdRef.current) clearInterval(detectionIntervalIdRef.current); detectionIntervalIdRef.current = setInterval(performDetectionAndUpdateUI, DETECTION_AND_UI_UPDATE_INTERVAL_MS); }, [mediaStream, performDetectionAndUpdateUI]);

  return (
    <PageLayout>
      <CameraWrapper>
        <WebcamVideo
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ display: viewMode === "camera" ? "block" : "none" }}
        />
        <WebcamCanvas
          ref={canvasRef}
          style={{ display: viewMode === "camera" ? "block" : "none" }}
        />

        <DemoVideo
          key={selectedExercise}
          autoPlay
          loop
          muted
          playsInline
          style={{ display: viewMode === "demo" ? "block" : "none" }}
        >
          <source src={demoVideos[selectedExercise]} type="video/mp4" />
          Your browser does not support the video tag.
        </DemoVideo>
      </CameraWrapper>
      <ControlPanel>
        <ViewToggleContainer>
          <ViewOption
            active={viewMode === "camera"}
            onClick={() => setViewMode("camera")}
          >
            Camera
          </ViewOption>
          <ViewOption
            active={viewMode === "demo"}
            onClick={() => setViewMode("demo")}
          >
            Demo
          </ViewOption>
        </ViewToggleContainer>
        <Label>
          Select Exercise:
          <Select
            value={selectedExercise}
            onChange={(e) => {
              setSelectedExercise(e.target.value);
              angleBuffers.current = { knee: [], hip: [], back: [], torso: [], situpKnee: [], elbow: [], bicepBack: [], rdlKnee: [], rdlHip: [], rdlBack: [], deadliftKnee: [], deadliftHip: [], deadliftBack: [], lungeLeftKnee: [], lungeRightKnee: [], lungeBack: [], pushupElbow: [], pushupBack: [], hipThrustKnee: [], hipThrustHip: [], barbellRowKnee: [], barbellRowBack: [], barbellRowElbow: [], plankElbow: [], plankBack: [], shoulderPressElbow: [], shoulderPressBack: [], goodMorningKnee: [], goodMorningHip: [], goodMorningBack: [], goodMorningElbow: [] };
            }}
          >
            <option value="Push-up">Push-up</option>
            <option value="Plank">Plank</option>
            <option value="Shoulder Press">Shoulder Press</option>
            <option value="Squat">Squat</option>
            <option value="Lunge">Lunge</option>
            <option value="Hip Thrust">Hip Thrust</option>
            <option value="Barbell Row">Barbell Row</option>
            <option value="Good Morning">Good Morning</option>
            <option value="Sit-up">Sit-up</option>
            <option value="Bicep Curl">Bicep Curl</option>
            <option value="RDL">RDL</option>
            <option value="Deadlift">Deadlift</option>
          </Select>
        </Label>
        {selectedExercise === "Push-up" && pushupMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Elbow Bend:</span><span>{pushupMetrics.elbowAngle.toFixed(0)}°</span></AngleLabelValue>{pushupMetrics.elbowBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={pushupMetrics.elbowBarData.value} $color={Math.abs(pushupMetrics.elbowAngle - IDEAL_PUSHUP_ANGLES.elbow) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{pushupMetrics.elbowFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Back Alignment:</span><span>{pushupMetrics.backAngle.toFixed(0)}°</span></AngleLabelValue>{pushupMetrics.backBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={pushupMetrics.backBarData.value} $color={Math.abs(pushupMetrics.backAngle - IDEAL_PUSHUP_ANGLES.back) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{pushupMetrics.backFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "Plank" && plankMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Elbow Angle:</span><span>{plankMetrics.elbowAngle.toFixed(0)}°</span></AngleLabelValue>{plankMetrics.elbowBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={plankMetrics.elbowBarData.value} $color={Math.abs(plankMetrics.elbowAngle - IDEAL_PLANK_ANGLES.elbow) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{plankMetrics.elbowFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Back Alignment:</span><span>{plankMetrics.backAngle.toFixed(0)}°</span></AngleLabelValue>{plankMetrics.backBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={plankMetrics.backBarData.value} $color={Math.abs(plankMetrics.backAngle - IDEAL_PLANK_ANGLES.back) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{plankMetrics.backFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "Shoulder Press" && shoulderPressMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Elbow Extension:</span><span>{shoulderPressMetrics.elbowAngle.toFixed(0)}°</span></AngleLabelValue>{shoulderPressMetrics.elbowBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={shoulderPressMetrics.elbowBarData.value} $color={Math.abs(shoulderPressMetrics.elbowAngle - IDEAL_SHOULDER_PRESS_ANGLES.elbow) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{shoulderPressMetrics.elbowFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Back Straightness:</span><span>{shoulderPressMetrics.backAngle.toFixed(0)}°</span></AngleLabelValue>{shoulderPressMetrics.backBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={shoulderPressMetrics.backBarData.value} $color={Math.abs(shoulderPressMetrics.backAngle - IDEAL_SHOULDER_PRESS_ANGLES.back) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{shoulderPressMetrics.backFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "Squat" && squatMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Knee Bend Angle:</span><span>{squatMetrics.leftKneeAngle}°</span></AngleLabelValue>{squatMetrics.kneeBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={squatMetrics.kneeBarData.value} $color={Math.abs(squatMetrics.leftKneeAngle - IDEAL_SQUAT_ANGLES.knee) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{squatMetrics.kneeFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Hip Bend Angle:</span><span>{squatMetrics.leftHipAngle}°</span></AngleLabelValue>{squatMetrics.hipBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={squatMetrics.hipBarData.value} $color={Math.abs(squatMetrics.leftHipAngle - IDEAL_SQUAT_ANGLES.hip) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{squatMetrics.hipFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Back Tilt Angle:</span><span>{squatMetrics.backAngle}°</span></AngleLabelValue>{squatMetrics.backBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={squatMetrics.backBarData.value} $color={Math.abs(squatMetrics.backAngle - IDEAL_SQUAT_ANGLES.back) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{squatMetrics.backFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "Lunge" && lungeMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Left Knee Angle:</span><span>{lungeMetrics.leftKneeAngle.toFixed(0)}°</span></AngleLabelValue>{lungeMetrics.leftKneeBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={lungeMetrics.leftKneeBarData.value} $color={Math.abs(lungeMetrics.leftKneeAngle - IDEAL_LUNGE_ANGLES.leftKnee) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{lungeMetrics.leftKneeFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Right Knee Angle:</span><span>{lungeMetrics.rightKneeAngle.toFixed(0)}°</span></AngleLabelValue>{lungeMetrics.rightKneeBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={lungeMetrics.rightKneeBarData.value} $color={Math.abs(lungeMetrics.rightKneeAngle - IDEAL_LUNGE_ANGLES.rightKnee) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{lungeMetrics.rightKneeFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Back Straightness:</span><span>{lungeMetrics.backAngle.toFixed(0)}°</span></AngleLabelValue>{lungeMetrics.backBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={lungeMetrics.backBarData.value} $color={Math.abs(lungeMetrics.backAngle - IDEAL_LUNGE_ANGLES.back) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{lungeMetrics.backFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "Hip Thrust" && hipThrustMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Knee Angle:</span><span>{hipThrustMetrics.kneeAngle.toFixed(0)}°</span></AngleLabelValue>{hipThrustMetrics.kneeBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={hipThrustMetrics.kneeBarData.value} $color={Math.abs(hipThrustMetrics.kneeAngle - IDEAL_HIP_THRUST_ANGLES.knee) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{hipThrustMetrics.kneeFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Hip Extension:</span><span>{hipThrustMetrics.hipAngle.toFixed(0)}°</span></AngleLabelValue>{hipThrustMetrics.hipBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={hipThrustMetrics.hipBarData.value} $color={Math.abs(hipThrustMetrics.hipAngle - IDEAL_HIP_THRUST_ANGLES.hip) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{hipThrustMetrics.hipFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "Barbell Row" && barbellRowMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Knee Bend:</span><span>{barbellRowMetrics.kneeAngle.toFixed(0)}°</span></AngleLabelValue>{barbellRowMetrics.kneeBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={barbellRowMetrics.kneeBarData.value} $color={Math.abs(barbellRowMetrics.kneeAngle - IDEAL_BARBELL_ROW_ANGLES.knee) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{barbellRowMetrics.kneeFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Back Angle:</span><span>{barbellRowMetrics.backAngle.toFixed(0)}°</span></AngleLabelValue>{barbellRowMetrics.backBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={barbellRowMetrics.backBarData.value} $color={Math.abs(barbellRowMetrics.backAngle - IDEAL_BARBELL_ROW_ANGLES.back) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{barbellRowMetrics.backFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Elbow Angle:</span><span>{barbellRowMetrics.elbowAngle.toFixed(0)}°</span></AngleLabelValue>{barbellRowMetrics.elbowBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={barbellRowMetrics.elbowBarData.value} $color={Math.abs(barbellRowMetrics.elbowAngle - IDEAL_BARBELL_ROW_ANGLES.elbow) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{barbellRowMetrics.elbowFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "Good Morning" && goodMorningMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Knee Bend:</span><span>{goodMorningMetrics.kneeAngle.toFixed(0)}°</span></AngleLabelValue>{goodMorningMetrics.kneeBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={goodMorningMetrics.kneeBarData.value} $color={Math.abs(goodMorningMetrics.kneeAngle - IDEAL_GOOD_MORNING_ANGLES.knee) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{goodMorningMetrics.kneeFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Hip Hinge:</span><span>{goodMorningMetrics.hipAngle.toFixed(0)}°</span></AngleLabelValue>{goodMorningMetrics.hipBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={goodMorningMetrics.hipBarData.value} $color={Math.abs(goodMorningMetrics.hipAngle - IDEAL_GOOD_MORNING_ANGLES.hip) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{goodMorningMetrics.hipFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Back Angle:</span><span>{goodMorningMetrics.backAngle.toFixed(0)}°</span></AngleLabelValue>{goodMorningMetrics.backBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={goodMorningMetrics.backBarData.value} $color={Math.abs(goodMorningMetrics.backAngle - IDEAL_GOOD_MORNING_ANGLES.back) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{goodMorningMetrics.backFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Elbow Bend:</span><span>{goodMorningMetrics.elbowAngle.toFixed(0)}°</span></AngleLabelValue>{goodMorningMetrics.elbowBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={goodMorningMetrics.elbowBarData.value} $color={Math.abs(goodMorningMetrics.elbowAngle - IDEAL_GOOD_MORNING_ANGLES.elbow) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{goodMorningMetrics.elbowFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "Sit-up" && situpMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Torso Angle:</span><span>{situpMetrics.torsoAngle}°</span></AngleLabelValue>{situpMetrics.torsoBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={situpMetrics.torsoBarData.value} $color={Math.abs(situpMetrics.torsoAngle - IDEAL_SITUP_ANGLES.torsoUp) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{situpMetrics.torsoFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Knee Bend Angle:</span><span>{situpMetrics.kneeAngle}°</span></AngleLabelValue>{situpMetrics.kneeBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={situpMetrics.kneeBarData.value} $color={Math.abs(situpMetrics.kneeAngle - IDEAL_SITUP_ANGLES.knee) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{situpMetrics.kneeFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "Bicep Curl" && bicepCurlMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Elbow Angle:</span><span>{bicepCurlMetrics.elbowAngle}°</span></AngleLabelValue>{bicepCurlMetrics.elbowBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={bicepCurlMetrics.elbowBarData.value} $color={Math.abs(bicepCurlMetrics.elbowAngle - IDEAL_BICEP_CURL_ANGLES.elbowUp) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{bicepCurlMetrics.elbowFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Back Straightness:</span><span>{bicepCurlMetrics.backAngle}°</span></AngleLabelValue>{bicepCurlMetrics.backBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={bicepCurlMetrics.backBarData.value} $color={Math.abs(bicepCurlMetrics.backAngle - IDEAL_BICEP_CURL_ANGLES.back) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{bicepCurlMetrics.backFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "RDL" && rdlMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Knee Bend:</span><span>{rdlMetrics.kneeAngle}°</span></AngleLabelValue>{rdlMetrics.kneeBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={rdlMetrics.kneeBarData.value} $color={Math.abs(rdlMetrics.kneeAngle - IDEAL_RDL_ANGLES.knee) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{rdlMetrics.kneeFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Hip Hinge:</span><span>{rdlMetrics.hipAngle}°</span></AngleLabelValue>{rdlMetrics.hipBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={rdlMetrics.hipBarData.value} $color={Math.abs(rdlMetrics.hipAngle - IDEAL_RDL_ANGLES.hip) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{rdlMetrics.hipFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Back Angle:</span><span>{rdlMetrics.backAngle}°</span></AngleLabelValue>{rdlMetrics.backBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={rdlMetrics.backBarData.value} $color={Math.abs(rdlMetrics.backAngle - IDEAL_RDL_ANGLES.back) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{rdlMetrics.backFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
        {selectedExercise === "Deadlift" && deadliftMetrics && (<AngleDisplayContainer> <AngleItem><AngleLabelValue><span>Knee Bend:</span><span>{deadliftMetrics.kneeAngle}°</span></AngleLabelValue>{deadliftMetrics.kneeBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={deadliftMetrics.kneeBarData.value} $color={Math.abs(deadliftMetrics.kneeAngle - IDEAL_DEADLIFT_ANGLES.knee) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{deadliftMetrics.kneeFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Hip Bend:</span><span>{deadliftMetrics.hipAngle}°</span></AngleLabelValue>{deadliftMetrics.hipBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={deadliftMetrics.hipBarData.value} $color={Math.abs(deadliftMetrics.hipAngle - IDEAL_DEADLIFT_ANGLES.hip) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{deadliftMetrics.hipFeedback}</FeedbackText></AngleItem> <AngleItem><AngleLabelValue><span>Back Angle:</span><span>{deadliftMetrics.backAngle}°</span></AngleLabelValue>{deadliftMetrics.backBarData && (<FeedbackBarWrapper><FeedbackBarIdealLine /><FeedbackBarFill $position={deadliftMetrics.backBarData.value} $color={Math.abs(deadliftMetrics.backAngle - IDEAL_DEADLIFT_ANGLES.back) <= EXCELLENT_RANGE_DEGREES ? '#4CAF50' : '#ffc107'} /></FeedbackBarWrapper>)}<FeedbackText>{deadliftMetrics.backFeedback}</FeedbackText></AngleItem> </AngleDisplayContainer>)}
      </ControlPanel>
    </PageLayout>
  );
};

export default AICoachDemo;