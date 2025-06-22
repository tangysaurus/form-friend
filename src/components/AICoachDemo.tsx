import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import styled from "styled-components";

// define squatAnalysis type
type SquatComponentScores = {
  kneeDepth: number;
  hipDepth: number;
  backPosture: number;
  symmetry: number;
  hipBend: number;
};

type squatAnalysis = {
  leftKneeAngle: number;
  rightKneeAngle: number;
  leftHipAngle: number;
  rightHipAngle: number;
  backAngle: number;
  depthBelowParallel: boolean;
  symmetryIssue: boolean;
  feedback: string[];
  componentScores: SquatComponentScores;
  totalScore: number;
};


// Layout containers
const PageLayout = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 24px;
`;

// Camera display
const CameraWrapper = styled.div`
  flex: 0 0 600px;
  position: relative;
`;

const WebcamVideo = styled.video`
  width: 100%;
  border-radius: 10px;
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

// Dropdown controls
const ControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Label = styled.label`
  font-weight: bold;
  margin-bottom: 8px;
`;

const Select = styled.select`
  padding: 8px 14px;
  font-size: 16px;
  border-radius: 6px;
`;

// Score bar styles
const ScoreBarContainer = styled.div`
  margin-top: 20px;
  width: 100%;
  max-width: 200px;
`;

const ScoreLabel = styled.div`
  font-weight: bold;
  margin-bottom: 6px;
`;

const ScoreBarBackground = styled.div`
  width: 100%;
  height: 20px;
  background: #ddd;
  border-radius: 10px;
`;

const MAX_SCORES: Record<keyof SquatComponentScores, number> = {
  kneeDepth: 30,
  hipDepth: 25,
  backPosture: 20,
  symmetry: 15,
  hipBend: 10,
};

const ScoreBarFill = styled.div<{ score: number; max: number }>`
  height: 100%;
  background: ${({ score, max }) =>
    score / max > 0.8 ? "#4caf50" :
    score / max > 0.5 ? "#ffc107" :
    "#f44336"};
  width: ${({ score, max }) => `${(score / max) * 100}%`};
  border-radius: 8px;
  transition: width 0.3s ease;
`;

const AICoachDemo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [selectedExercise, setSelectedExercise] = useState("Push-up");
  const [squatMetrics, setSquatMetrics] = useState<squatAnalysis | null>(null);


  const drawKeypoints = (
    keypoints: poseDetection.Keypoint[],
    ctx: CanvasRenderingContext2D
  ) => {
    keypoints.forEach((keypoint) => {
      if (keypoint.score && keypoint.score > 0.5) {
        const { x, y } = keypoint;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgb(0,255,0)";
        ctx.fill();
      }
    });
  };

  const drawSkeleton = (
    keypoints: poseDetection.Keypoint[],
    ctx: CanvasRenderingContext2D
  ) => {
    const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
    ctx.strokeStyle = "rgb(255,0,0)";
    ctx.lineWidth = 2;

    adjacentPairs.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      if (kp1.score! > 0.5 && kp2.score! > 0.5) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    const loadModelAndStart = async () => {
      await tf.setBackend("webgl");
      await tf.ready();

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
      detectorRef.current = detector;
      console.log("MoveNet model loaded");

      startWebcam();
    };

    loadModelAndStart();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      detectorRef.current?.dispose();
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }

        setMediaStream(stream);
        runPoseDetection();
      }
    } catch (error) {
      console.error("Error accessing webcam", error);
    }
  };

  const runPoseDetection = () => {
    const detect = async () => {
      if (!videoRef.current || !canvasRef.current || !detectorRef.current) return;

      const poses = await detectorRef.current.estimatePoses(videoRef.current, {
        flipHorizontal: true,
      });

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (poses.length > 0) {
        const keypoints = poses[0].keypoints;
        drawKeypoints(keypoints, ctx);
        drawSkeleton(keypoints, ctx);
        setSquatMetrics(analyzeSquatPose(keypoints));
      }

      animationFrameIdRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  // landmark indices for each body part
  const landmarkMap = {
    nose: 0,
    leftEye: 1,
    rightEye: 2,
    leftShoulder: 5,
    rightShoulder: 6,
    leftHip: 11,
    rightHip: 12,
    leftKnee: 13,
    rightKnee: 14,
    leftAnkle: 15,
    rightAnkle: 16,
  };

  // calculate angle between 3 joints
  function getAngle(a: poseDetection.Keypoint, b: poseDetection.Keypoint, c: poseDetection.Keypoint) {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };

    const dot = ab.x * cb.x + ab.y * cb.y;
    const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
    const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);

    const angleRad = Math.acos(dot / (magAB * magCB));
    const angleDeg = (angleRad * 180) / Math.PI;

    return angleDeg;
  }

  const scoreFromRange = (
    value: number,
    idealMin: number,
    idealMax: number,
    maxScore: number,
    reverse = false
  ): number => {
      const clamped = Math.max(Math.min(value, idealMax), idealMin);
      const ratio = (clamped - idealMin) / (idealMax - idealMin);
      const score = reverse ? (1 - ratio) * maxScore : ratio * maxScore;
      return Math.round(score);
    };

  const analyzeSquatPose = (keypoints: poseDetection.Keypoint[]): squatAnalysis => {
    const get = (i: number) => keypoints[i];

    const leftShoulder = get(5);
    const rightShoulder = get(6);
    const leftHip = get(11);
    const rightHip = get(12);
    const leftKnee = get(13);
    const rightKnee = get(14);
    const leftAnkle = get(15);
    const rightAnkle = get(16);

    const leftKneeAngle = getAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = getAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    const leftHipAngle = getAngle(leftShoulder, leftHip, leftKnee);
    const rightHipAngle = getAngle(rightShoulder, rightHip, rightKnee);
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

    const backVector = {
      x: (leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2,
    };
    const vertical = { x: 0, y: 1 };
    const backAngle = getAngle({ x: 0, y: 0 }, vertical, backVector);

    const avgHipY = (leftHip.y + rightHip.y) / 2;
    const avgKneeY = (leftKnee.y + rightKnee.y) / 2;
    const depthBelowParallel = avgHipY > avgKneeY;

    const symmetryDiff = Math.abs(leftKneeAngle - rightKneeAngle);
    const symmetryIssue = symmetryDiff > 15;

    const feedback: string[] = [];

    // --- Continuous Scoring ---
    const kneeDepth = scoreFromRange(avgKneeAngle, 60, 100, 30, true); // lower = better
    if (kneeDepth < 20) feedback.push("Squat deeper to improve knee angle.");

    const hipToKneeGap = avgHipY - avgKneeY; // positive = deeper
    const hipDepth = scoreFromRange(hipToKneeGap, -200, 40, 25); // deeper = better
    if (hipDepth < 15) feedback.push("Lower your hips below knee level.");

    const backPosture = scoreFromRange(backAngle, -20, 50, 20); // higher = better
    if (backPosture < 10) feedback.push("Straighten your back to be more upright.");

    const symmetry = scoreFromRange(symmetryDiff, 0, 30, 15, true); // smaller = better
    if (symmetry < 10) feedback.push("Balance left and right knee angles.");

    const hipBend = scoreFromRange(avgHipAngle, 40, 100, 10); // ideal mid-range
    if (hipBend < 5) feedback.push("Adjust hip fold for better squat posture.");

    const componentScores: SquatComponentScores = {
      kneeDepth,
      hipDepth,
      backPosture,
      symmetry,
      hipBend,
    };

    const totalScore = Object.values(componentScores).reduce((sum, s) => sum + s, 0);

    return {
      leftKneeAngle,
      rightKneeAngle,
      leftHipAngle,
      rightHipAngle,
      backAngle,
      depthBelowParallel,
      symmetryIssue,
      feedback,
      componentScores,
      totalScore,
    };
  };


  return (
    <PageLayout>
      <CameraWrapper>
        <WebcamVideo ref={videoRef} autoPlay muted playsInline />
        <WebcamCanvas ref={canvasRef} />
      </CameraWrapper>

      <ControlPanel>
        <Label>
          Select Exercise:
          <Select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
          >
            <option value="Push-up">Push-up</option>
            <option value="Squat">Squat</option>
            <option value="Sit-up">Sit-up</option>
          </Select>
        </Label>

        {selectedExercise === "Squat" && squatMetrics && (
        <>
          <ScoreBarContainer>
            <ScoreLabel>Total Squat Score: {squatMetrics.totalScore}</ScoreLabel>
            <ScoreBarBackground>
              <ScoreBarFill score={squatMetrics.totalScore} max={100}/>
            </ScoreBarBackground>
          </ScoreBarContainer>

          {Object.entries(squatMetrics.componentScores).map(([label, score]) => {
            const key = label as keyof SquatComponentScores;
            const max = MAX_SCORES[key];

            return (
              <ScoreBarContainer key={label}>
                <ScoreLabel>
                  {label
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}: {score} / {max}
                </ScoreLabel>
                <ScoreBarBackground>
                  <ScoreBarFill score={score} max={max} />
                </ScoreBarBackground>
              </ScoreBarContainer>
            );
          })}

        </>
      )}
      </ControlPanel>
    </PageLayout>
  );

};

export default AICoachDemo;
