import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import styled from "styled-components";


// Define simplified squat analysis type
type squatAnalysis = {
  leftKneeAngle: number;
  rightKneeAngle: number;
  leftHipAngle: number;
  rightHipAngle: number;
  backAngle: number;
  depthBelowParallel: boolean;
  symmetryIssue: boolean;
  // New fields for feedback and bar data
  kneeFeedback: string;
  hipFeedback: string;
  backFeedback: string;
  kneeBarData: { value: number; ideal: number; range: number } | null;
  hipBarData: { value: number; ideal: number; range: number } | null;
  backBarData: { value: number; ideal: number; range: number } | null;
};

type situpAnalysis = {
  torsoAngle: number;
  hipAngle: number;
  shoulderLifted: boolean;
  symmetryIssue: boolean;

  torsoFeedback: string;
  hipFeedback: string;

  torsoBarData: { value: number; ideal: number; range: number } | null;
  hipBarData: { value: number; ideal: number; range: number } | null;
};



// Layout containers
const PageLayout = styled.div`
  display: flex;
  align-items: flex-start;
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

// Dropdown controls and display for angles
const ControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 15px;
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

const AngleDisplayContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px; /* Increased gap for bars */
  margin-top: 20px;
  font-size: 1.2em;
`;

const AngleItem = styled.div`
  background-color: #f0f0f0;
  padding: 10px 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column; /* Stack label, value, bar, and feedback */
  gap: 8px;
  width: 300px; /* Give it a fixed width */
`;

const AngleLabelValue = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
`;

const FeedbackText = styled.div`
  font-size: 0.9em;
  color: #333;
  min-height: 1.2em; /* Ensure consistent height */
`;

// New Styled Component for the Feedback Bar
const FeedbackBarWrapper = styled.div`
  width: 100%;
  height: 20px;
  background: #ccc;
  border-radius: 10px;
  position: relative;
  overflow: hidden; /* Ensure bar fill stays within bounds */
`;

interface FeedbackBarFillProps {
  $position: number; // 0 (far left) to 1 (far right)
  $color: string;
}

const FeedbackBarFill = styled.div<FeedbackBarFillProps>`
  position: absolute;
  top: 0;
  left: ${({ $position }) => `${$position * 100}%`}; /* Center based on position */
  transform: translateX(-50%); /* Adjust to truly center */
  width: 10px; /* Thickness of the indicator line */
  height: 100%;
  background-color: ${({ $color }) => $color};
  border-radius: 10px;
  transition: left 0.2s ease-out; /* Smooth movement */
`;

const FeedbackBarIdealLine = styled.div`
  position: absolute;
  left: 50%; /* Middle of the bar */
  top: 0;
  width: 2px; /* Thickness of the ideal line */
  height: 100%;
  background-color: #4CAF50; /* Green for ideal */
  z-index: 1; /* Make sure it's on top */
`;


// Define a type for the buffered angles
type BufferedAngles = {
  knee: number[];
  hip: number[];
  back: number[];
};

// Define the buffer size (how many past frames to average)
const ANGLE_BUFFER_SIZE = 5;

// Define the UI update interval in milliseconds
const DETECTION_AND_UI_UPDATE_INTERVAL_MS = 500; // Update every 0.5 seconds

// Ideal angle definitions
const IDEAL_ANGLES = {
  "Squat": {
    knee: 70,
    hip: 70,
    back: 15,
  },
  "Sit-up": {
    torso: 45,
    hip: 90,
  },
};

// Range within which the bar appears (15 degrees either side of ideal)
const DISPLAY_RANGE_DEGREES = 100;
const EXCELLENT_RANGE_DEGREES = 15; // Within 5 degrees for "Excellent" feedback

const AICoachDemo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const detectionIntervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [selectedExercise, setSelectedExercise] = useState("Squat");
  const [squatMetrics, setSquatMetrics] = useState<squatAnalysis | null>(null);
  const [situpMetrics, setSitupMetrics] = useState<situpAnalysis | null>(null);

  const angleBuffers = useRef<BufferedAngles>({
    knee: [],
    hip: [],
    back: [],
  });


  const updateAngleBuffer = (buffer: number[], newValue: number) => {
    buffer.push(newValue);
    if (buffer.length > ANGLE_BUFFER_SIZE) {
      buffer.shift();
    }
  };

  const getAverage = (buffer: number[]) => {
    if (buffer.length === 0) return 0;
    const sum = buffer.reduce((acc, val) => acc + val, 0);
    return sum / buffer.length;
  };


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

  const performDetectionAndUpdateUI = async () => {
    if (!videoRef.current || !canvasRef.current || !detectorRef.current) {
      console.warn("Video, canvas, or detector not ready for detection.");
      return;
    }

    const poses = await detectorRef.current.estimatePoses(videoRef.current, {
      flipHorizontal: true,
    });

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      console.warn("Canvas context not available.");
      return;
    }

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (poses.length > 0) {
      const keypoints = poses[0].keypoints;
      drawKeypoints(keypoints, ctx);
      drawSkeleton(keypoints, ctx);

      if (selectedExercise === "Squat") {
        const rawSquatMetrics = analyzeSquatPose(keypoints);

        updateAngleBuffer(angleBuffers.current.knee, rawSquatMetrics.leftKneeAngle);
        updateAngleBuffer(angleBuffers.current.hip, rawSquatMetrics.leftHipAngle);
        updateAngleBuffer(angleBuffers.current.back, rawSquatMetrics.backAngle);

        const averagedKnee = parseFloat(getAverage(angleBuffers.current.knee).toFixed(1));
        const averagedHip = parseFloat(getAverage(angleBuffers.current.hip).toFixed(1));
        const averagedBack = parseFloat(getAverage(angleBuffers.current.back).toFixed(1));

        // Generate feedback and bar data for each angle
        const { feedback: kneeFeedback, barData: kneeBarData } = getAngleFeedbackAndBarData(
          averagedKnee, IDEAL_ANGLES["Squat"].knee, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'knee'
        );
        const { feedback: hipFeedback, barData: hipBarData } = getAngleFeedbackAndBarData(
          averagedHip, IDEAL_ANGLES["Squat"].hip, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'hip'
        );
        const { feedback: backFeedback, barData: backBarData } = getAngleFeedbackAndBarData(
          averagedBack, IDEAL_ANGLES["Squat"].back, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'back'
        );

        setSquatMetrics({
          ...rawSquatMetrics,
          leftKneeAngle: averagedKnee,
          rightKneeAngle: averagedKnee, // Display average for simplicity
          leftHipAngle: averagedHip,
          rightHipAngle: averagedHip, // Display average for simplicity
          backAngle: averagedBack,
          kneeFeedback,
          hipFeedback,
          backFeedback,
          kneeBarData,
          hipBarData,
          backBarData,
        });
      } else if (selectedExercise === "Sit-up") {
          const rawSitupMetrics = analyzeSitupPose(keypoints);

          // Buffer torso and hip angles
          updateAngleBuffer(angleBuffers.current.back, rawSitupMetrics.torsoAngle); // reuse 'back' buffer for torso
          updateAngleBuffer(angleBuffers.current.hip, rawSitupMetrics.hipAngle);

          const averagedTorso = parseFloat(getAverage(angleBuffers.current.back).toFixed(1));
          const averagedHip = parseFloat(getAverage(angleBuffers.current.hip).toFixed(1));

          const { feedback: torsoFeedback, barData: torsoBarData } = getAngleFeedbackAndBarData(
            averagedTorso, IDEAL_ANGLES["Sit-up"].torso, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'back'
          );
          const { feedback: hipFeedback, barData: hipBarData } = getAngleFeedbackAndBarData(
            averagedHip, IDEAL_ANGLES["Sit-up"].hip, DISPLAY_RANGE_DEGREES, EXCELLENT_RANGE_DEGREES, 'hip'
          );

          setSitupMetrics({
            ...rawSitupMetrics,
            torsoAngle: averagedTorso,
            hipAngle: averagedHip,
            torsoFeedback,
            hipFeedback,
            torsoBarData,
            hipBarData,
          });
      } else {
        setSitupMetrics(null);
        setSquatMetrics(null);
        angleBuffers.current = { knee: [], hip: [], back: [] };
      }
    }
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
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
      if (detectionIntervalIdRef.current) {
        clearInterval(detectionIntervalIdRef.current);
      }
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

        if (detectionIntervalIdRef.current) {
          clearInterval(detectionIntervalIdRef.current);
        }
        detectionIntervalIdRef.current = setInterval(
          performDetectionAndUpdateUI,
          DETECTION_AND_UI_UPDATE_INTERVAL_MS
        );

      }
    } catch (error) {
      console.error("Error accessing webcam", error);
    }
  };


  // calculate angle between 3 joints
  function getAngle(a: poseDetection.Keypoint, b: poseDetection.Keypoint, c: poseDetection.Keypoint) {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };

    const dot = ab.x * cb.x + ab.y * cb.y;
    const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
    const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);

    let angleRad = Math.acos(dot / (magAB * magCB));
    if (isNaN(angleRad)) {
        const clampedDotProductDivisor = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
        angleRad = Math.acos(clampedDotProductDivisor);
    }

    const angleDeg = (angleRad * 180) / Math.PI;

    return angleDeg;
  }

  // New helper function to get feedback and bar data
  const getAngleFeedbackAndBarData = (
    currentAngle: number,
    idealAngle: number,
    displayRange: number,
    excellentRange: number,
    angleType: 'knee' | 'hip' | 'back'
  ) => {
    let feedback = "";
    let barData: { value: number; ideal: number; range: number } | null = null;
    const deviation = currentAngle - idealAngle;

    if (Math.abs(deviation) <= displayRange) {
      // Calculate position for the bar
      const minVal = idealAngle - displayRange;
      const maxVal = idealAngle + displayRange;
      const normalizedValue = (currentAngle - minVal) / (maxVal - minVal); // 0 to 1 scale
      barData = { value: normalizedValue, ideal: 0.5, range: 1 }; // value is normalized position, ideal is center (0.5)

      if (Math.abs(deviation) <= excellentRange) {
        feedback = "Excellent!";
      } else if (deviation > excellentRange) {
        if (angleType === 'knee') {
          feedback = "Squat deeper.";
        } else if (angleType === 'hip') {
          feedback = "Lean less forward with hips."; // "hips: if higher than ideal, it'll say something about leaning less forward"
        } else if (angleType === 'back') {
          feedback = "Keep your back more upright."; // "back tilt: if higher than ideal, it'll say something about looking up straight."
        }
      } else { // deviation < -excellentRange
        if (angleType === 'knee') {
          feedback = "Don't squat too deep."; // Example: If too low, could be too deep
        } else if (angleType === 'hip') {
          feedback = "Bend hips more."; // Example: If too low, not bending enough
        } else if (angleType === 'back') {
          feedback = "Don't overextend your back."; // Example: If too low, overextending
        }
      }
    }

    return { feedback, barData };
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
    const rightHipAngle = getAngle(rightShoulder, rightHip, leftKnee); // Fixed: should be leftKnee for hip angle calculation

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


    return {
      leftKneeAngle: leftKneeAngle,
      rightKneeAngle: rightKneeAngle,
      leftHipAngle: leftHipAngle,
      rightHipAngle: rightHipAngle,
      backAngle: backAngle,
      depthBelowParallel,
      symmetryIssue,
      kneeFeedback: "", // These will be populated in performDetectionAndUpdateUI
      hipFeedback: "",
      backFeedback: "",
      kneeBarData: null,
      hipBarData: null,
      backBarData: null,
    };
  };

  const analyzeSitupPose = (keypoints: poseDetection.Keypoint[]): situpAnalysis => {
    const get = (i: number) => keypoints[i];

    const leftShoulder = get(5);
    const rightShoulder = get(6);
    const leftHip = get(11);
    const rightHip = get(12);
    const leftKnee = get(13);
    const rightKnee = get(14);

    // Torso vector: hip to shoulder (avg)
    const midShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    const midHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };
    const vertical = { x: 0, y: 1 };

    const torsoAngle = getAngle({ x: 0, y: 0 }, vertical, {
      x: midShoulder.x - midHip.x,
      y: midShoulder.y - midHip.y,
    });

    // Hip angle: torso to knee
    const leftHipAngle = getAngle(leftShoulder, leftHip, leftKnee);
    const rightHipAngle = getAngle(rightShoulder, rightHip, rightKnee);
    const hipAngle = (leftHipAngle + rightHipAngle) / 2;

    // Detect shoulder lift (for sit-up phase detection)
    const shouldersRaised = midShoulder.y < midHip.y - 50; // tweak threshold as needed

    // Symmetry
    const symmetryDiff = Math.abs(leftHipAngle - rightHipAngle);
    const symmetryIssue = symmetryDiff > 15;

    return {
      torsoAngle,
      hipAngle,
      shoulderLifted: shouldersRaised,
      symmetryIssue,

      torsoFeedback: "",
      hipFeedback: "",

      torsoBarData: null,
      hipBarData: null,
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
          <AngleDisplayContainer>
            <AngleItem>
              <AngleLabelValue>
                <span>Knee Bend Angle:</span>
                <span>{squatMetrics.leftKneeAngle}°</span>
              </AngleLabelValue>
              {squatMetrics.kneeBarData && (
                <FeedbackBarWrapper>
                  <FeedbackBarIdealLine />
                  <FeedbackBarFill
                    $position={squatMetrics.kneeBarData.value}
                    $color={
                      Math.abs(squatMetrics.leftKneeAngle - IDEAL_ANGLES["Squat"].knee) <= EXCELLENT_RANGE_DEGREES
                        ? '#4CAF50' // Green for excellent
                        : Math.abs(squatMetrics.leftKneeAngle - IDEAL_ANGLES["Squat"].knee) <= DISPLAY_RANGE_DEGREES
                        ? '#ffc107' // Orange for good range
                        : '#f44336' // Red for outside range (though bar only shows within range)
                    }
                  />
                </FeedbackBarWrapper>
              )}
              <FeedbackText>{squatMetrics.kneeFeedback}</FeedbackText>
            </AngleItem>

            <AngleItem>
              <AngleLabelValue>
                <span>Hip Bend Angle:</span>
                <span>{squatMetrics.leftHipAngle}°</span>
              </AngleLabelValue>
              {squatMetrics.hipBarData && (
                <FeedbackBarWrapper>
                  <FeedbackBarIdealLine />
                  <FeedbackBarFill
                    $position={squatMetrics.hipBarData.value}
                    $color={
                      Math.abs(squatMetrics.leftHipAngle - IDEAL_ANGLES["Squat"].hip) <= EXCELLENT_RANGE_DEGREES
                        ? '#4CAF50'
                        : Math.abs(squatMetrics.leftHipAngle - IDEAL_ANGLES["Squat"].hip) <= DISPLAY_RANGE_DEGREES
                        ? '#ffc107'
                        : '#f44336'
                    }
                  />
                </FeedbackBarWrapper>
              )}
              <FeedbackText>{squatMetrics.hipFeedback}</FeedbackText>
            </AngleItem>

            <AngleItem>
              <AngleLabelValue>
                <span>Back Tilt Angle:</span>
                <span>{squatMetrics.backAngle}°</span>
              </AngleLabelValue>
              {squatMetrics.backBarData && (
                <FeedbackBarWrapper>
                  <FeedbackBarIdealLine />
                  <FeedbackBarFill
                    $position={squatMetrics.backBarData.value}
                    $color={
                      Math.abs(squatMetrics.backAngle - IDEAL_ANGLES["Squat"].back) <= EXCELLENT_RANGE_DEGREES
                        ? '#4CAF50'
                        : Math.abs(squatMetrics.backAngle - IDEAL_ANGLES["Squat"].back) <= DISPLAY_RANGE_DEGREES
                        ? '#ffc107'
                        : '#f44336'
                    }
                  />
                </FeedbackBarWrapper>
              )}
              <FeedbackText>{squatMetrics.backFeedback}</FeedbackText>
            </AngleItem>
          </AngleDisplayContainer>
        )}
        {/* selected exercise is sit-up */}
        {selectedExercise === "Sit-up" && situpMetrics && (
        <AngleDisplayContainer>
          <AngleItem>
            <AngleLabelValue>
              <span>Torso Angle:</span>
              <span>{situpMetrics.torsoAngle}°</span>
            </AngleLabelValue>
            {situpMetrics.torsoBarData && (
              <FeedbackBarWrapper>
                <FeedbackBarIdealLine />
                <FeedbackBarFill
                  $position={situpMetrics.torsoBarData.value}
                  $color={
                    Math.abs(situpMetrics.torsoAngle - IDEAL_ANGLES["Sit-up"].torso) <= EXCELLENT_RANGE_DEGREES
                      ? '#4CAF50'
                      : Math.abs(situpMetrics.torsoAngle - IDEAL_ANGLES["Sit-up"].torso) <= DISPLAY_RANGE_DEGREES
                      ? '#ffc107'
                      : '#f44336'
                  }
                />
              </FeedbackBarWrapper>
            )}
            <FeedbackText>{situpMetrics.torsoFeedback}</FeedbackText>
          </AngleItem>

          <AngleItem>
            <AngleLabelValue>
              <span>Hip Angle:</span>
              <span>{situpMetrics.hipAngle}°</span>
            </AngleLabelValue>
            {situpMetrics.hipBarData && (
              <FeedbackBarWrapper>
                <FeedbackBarIdealLine />
                <FeedbackBarFill
                  $position={situpMetrics.hipBarData.value}
                  $color={
                    Math.abs(situpMetrics.hipAngle - IDEAL_ANGLES["Sit-up"].hip) <= EXCELLENT_RANGE_DEGREES
                      ? '#4CAF50'
                      : Math.abs(situpMetrics.hipAngle - IDEAL_ANGLES["Sit-up"].hip) <= DISPLAY_RANGE_DEGREES
                      ? '#ffc107'
                      : '#f44336'
                  }
                />
              </FeedbackBarWrapper>
            )}
            <FeedbackText>{situpMetrics.hipFeedback}</FeedbackText>
          </AngleItem>
        </AngleDisplayContainer>
      )}
      </ControlPanel>
    </PageLayout>
  );

};

export default AICoachDemo;