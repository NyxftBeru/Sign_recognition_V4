// predict_live_logic.js

import {
    HandLandmarker,
    PoseLandmarker,
    FaceDetector,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// Assuming config.js will be loaded before this script,
// providing window.ENV_CONFIG.PYTHON_API_URL
const PYTHON_API_URL = window.ENV_CONFIG.PYTHON_API_URL;
console.log("Backend API URL:", PYTHON_API_URL);

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const predictionResultDiv = document.getElementById("predictionResult");
const enablePredictionsButton = document.getElementById("webcamButton");

let handLandmarker;
let poseLandmarker;
let faceDetector;
let runningMode = "VIDEO";
let lastVideoTime = -1;
let isPredicting = false;

// Drawing utilities from MediaPipe
const drawingUtils = window; // MediaPipe drawing_utils are typically global after import

// Initialize MediaPipe models
const createLandmarkers = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU" // or "CPU"
        },
        runningMode: runningMode,
        numHands: 1
    });

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU" // or "CPU"
        },
        runningMode: runningMode,
    });

    faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/face_detector_lite/float16/1/face_detector_lite.task`,
            delegate: "GPU" // or "CPU"
        },
        runningMode: runningMode,
        minDetectionConfidence: 0.5
    });

    console.log("MediaPipe models loaded!");
    enablePredictionsButton.disabled = false;
    enablePredictionsButton.textContent = "ENABLE PREDICTIONS";
};

createLandmarkers();

// Enable webcam access
enablePredictionsButton.addEventListener("click", enableCam);

function enableCam() {
    if (!handLandmarker || !poseLandmarker || !faceDetector) {
        console.log("Wait! models not loaded yet.");
        return;
    }

    if (isPredicting) {
        video.pause();
        video.srcObject.getTracks().forEach(track => track.stop());
        isPredicting = false;
        enablePredictionsButton.textContent = "ENABLE PREDICTIONS";
        predictionResultDiv.textContent = "Prediction: Stopped";
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height); // Clear canvas
        return;
    }

    const constraints = {
        video: true
    };

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
        enablePredictionsButton.textContent = "STOP PREDICTIONS";
        isPredicting = true;
    }).catch(function(err) {
        console.error("Error accessing webcam:", err);
        predictionResultDiv.textContent = "Error: Could not access webcam. Please ensure it's not in use and permissions are granted.";
    });
}

async function predictWebcam() {
    canvasElement.style.width = video.videoWidth + "px";
    canvasElement.style.height = video.videoHeight + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;

        const handResults = handLandmarker.detectForVideo(video, startTimeMs);
        const poseResults = poseLandmarker.detectForVideo(video, startTimeMs);
        const faceResults = faceDetector.detectForVideo(video, startTimeMs);

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

        const features = [];

        // Hand Landmarks (21 points * 2 coords = 42 features)
        if (handResults.landmarks.length > 0) {
            const handLandmarks = handResults.landmarks[0];
            for (const landmark of handLandmarks) {
                features.push(landmark.x, landmark.y);
            }
            drawingUtils.drawConnectors(canvasCtx, handLandmarks, HandLandmarker.HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 5
            });
            drawingUtils.drawLandmarks(canvasCtx, handLandmarks, {
                color: "#FF0000",
                lineWidth: 2
            });
        } else {
            // If no hand detected, push zeros for hand features
            for (let i = 0; i < 42; i++) {
                features.push(0);
            }
        }

        // Face Detection (1 point * 2 coords = 2 features: center of bounding box)
        let face_x = 0;
        let face_y = 0;
        if (faceResults.detections.length > 0) {
            const boundingBox = faceResults.detections[0].boundingBox;
            face_x = boundingBox.originX + boundingBox.width / 2;
            face_y = boundingBox.originY + boundingBox.height / 2;

            // Optionally draw face bounding box (MediaPipe FaceDetector only provides bounding box)
            // drawingUtils.drawRectangle(canvasCtx, boundingBox, { color: "#0000FF", lineWidth: 2 });
        }
        features.push(face_x, face_y);


        // Pose Landmarks (specifically shoulders for chest midpoint) (2 points * 2 coords = 4 features initially, then averaged to 2)
        let chest_x = 0;
        let chest_y = 0;
        if (poseResults.landmarks.length > 0) {
            const poseLandmarks = poseResults.landmarks[0];
            const leftShoulder = poseLandmarks[drawingUtils.POSE_LANDMARKS.LEFT_SHOULDER];
            const rightShoulder = poseLandmarks[drawingUtils.POSE_LANDMARKS.RIGHT_SHOULDER];

            if (leftShoulder && rightShoulder) {
                chest_x = (leftShoulder.x + rightShoulder.x) / 2;
                chest_y = (leftShoulder.y + rightShoulder.y) / 2;
            }
            drawingUtils.drawConnectors(canvasCtx, poseLandmarks, drawingUtils.POSE_CONNECTIONS, {
                color: "#AAAAAA",
                lineWidth: 2
            }); // Draw full pose for visualization
        }
        features.push(chest_x, chest_y);

        canvasCtx.restore();

        // Sanity check: Ensure we have exactly 46 features
        if (features.length !== 46) {
            console.warn(`Expected 46 features, but got ${features.length}. Padding/Truncating...`);
            while(features.length < 46) features.push(0);
            if (features.length > 46) features.splice(46);
        }

        // Send features to your Python backend
        if (isPredicting) {
            try {
                const response = await fetch(`${PYTHON_API_URL}/predict`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        features: features
                    }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                predictionResultDiv.textContent = `Prediction: ${data.predicted_gloss} (Confidence: ${(data.confidence * 100).toFixed(2)}%)`;
            } catch (error) {
                console.error("Error sending features to backend:", error);
                predictionResultDiv.textContent = `Prediction Error: ${error.message}`;
            }
        }
    }

    // Call this function again to keep predicting when the browser is ready.
    if (isPredicting) {
        window.requestAnimationFrame(predictWebcam);
    }
}