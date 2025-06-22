import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import styled from "styled-components";


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

const ScoreBarFill = styled.div<{ score: number }>`
  height: 100%;
  background: ${({ score }) =>
    score > 80 ? "#4caf50" : score > 50 ? "#ffc107" : "#f44336"};
  width: ${({ score }) => `${score}%`};
  border-radius: 10px;
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

  // define squatAnalysis type
  type squatAnalysis = {
    leftKneeAngle: number;
    rightKneeAngle: number;
    leftHipAngle: number;
    rightHipAngle: number;
    backAngle: number;
    depthBelowParallel: boolean;
    symmetryIssue: boolean;
    feedback: string[];
    score: number;
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
    let score = 0;

    // ---- SCORING ----

    // 1. Knee angle (depth)
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    if (avgKneeAngle <= 110) {
      score += 30;
    } else if (avgKneeAngle <= 130) {
      score += 15;
      feedback.push("Try squatting a bit deeper.");
    } else {
      feedback.push("You're not squatting deep enough.");
    }

    // 2. Hip below knee
    if (depthBelowParallel) {
      score += 25;
    } else {
      feedback.push("Try to get your hips below your knees.");
    }

    // 3. Back angle (upright)
    if (backAngle >= 45) {
      score += 20;
    } else if (backAngle >= 30) {
      score += 10;
      feedback.push("Keep your chest up and back more upright.");
    } else {
      feedback.push("You're leaning too far forward.");
    }

    // 4. Symmetry
    if (symmetryDiff <= 15) {
      score += 15;
    } else {
      feedback.push("Your squat is uneven—distribute weight evenly.");
    }

    // 5. Hip bend
    if (avgHipAngle >= 40 && avgHipAngle <= 100) {
      score += 10;
    } else {
      feedback.push("Check hip mobility or posture—hip bend off.");
    }

    return {
      leftKneeAngle,
      rightKneeAngle,
      leftHipAngle,
      rightHipAngle,
      backAngle,
      depthBelowParallel,
      symmetryIssue,
      feedback,
      score,
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
          <ScoreBarContainer>
            <ScoreLabel>Squat Score: {squatMetrics.score}</ScoreLabel>
            <ScoreBarBackground>
              <ScoreBarFill score={squatMetrics.score} />
            </ScoreBarBackground>
          </ScoreBarContainer>
        )}
      </ControlPanel>
    </PageLayout>
  );

};

export default AICoachDemo;
