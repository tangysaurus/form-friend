import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import styled from "styled-components";

// Styled components
const WebcamContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
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

const AICoachDemo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Draw keypoints
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

  // Draw skeleton
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

  // Load MoveNet and start detection
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

  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Set canvas size to match video
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

  // Run real-time pose detection
  const runPoseDetection = () => {
    const detect = async () => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !detectorRef.current
      ) {
        return;
      }

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
      }

      animationFrameIdRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  return (
    <WebcamContainer>
      <WebcamVideo ref={videoRef} autoPlay muted playsInline />
      <WebcamCanvas ref={canvasRef} />
    </WebcamContainer>
  );
};

export default AICoachDemo;
