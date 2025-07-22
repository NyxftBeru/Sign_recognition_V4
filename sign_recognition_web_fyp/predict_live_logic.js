// frontend/predict_live_logic.js

// Import MediaPipe Task Vision API components
import {
    HandLandmarker,
    PoseLandmarker,
    FaceDetector,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// Access the Python API URL from the global config object loaded by /config.js
const PYTHON_API_URL = window.ENV_CONFIG.PYTHON_API_URL;
console.log("Backend API URL:", PYTHON_API_URL);

// Get DOM elements
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const predictionResultDiv = document.getElementById("predictionResult");
const enablePredictionsButton = document.getElementById("webcamButton");

// MediaPipe Landmarker and Detector instances
let handLandmarker;
let poseLandmarker;
let faceDetector;
let runningMode = "VIDEO"; // Set running mode for continuous video processing
let lastVideoTime = -1; // To track video frames and avoid redundant processing
let isPredicting = false; // Control prediction loop

// Drawing utilities from MediaPipe (becomes global after import)
const drawingUtils = window;

// Asynchronously initialize MediaPipe models
const createLandmarkers = async () => {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        // Hand Landmarker
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU" // Use GPU if available for better performance, fallback to CPU
            },
            runningMode: runningMode,
            numHands: 1 // Assuming only one hand is relevant for your signs
        });

        // Pose Landmarker (for shoulders)
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU"
            },
            runningMode: runningMode,
        });

        // Face Detector (for face bounding box center)
        faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/face_detector_lite/float16/1/face_detector_lite.task`,
                delegate: "GPU"
            },
            runningMode: runningMode,
            minDetectionConfidence: 0.5
        });

        console.log("MediaPipe models loaded!");
        enablePredictionsButton.disabled = false;
        enablePredictionsButton.textContent = "ENABLE PREDICTIONS";
    } catch (error) {
        console.error("Failed to load MediaPipe models:", error);
        predictionResultDiv.textContent = "Error: Failed to load AI models. Check console for details.";
        enablePredictionsButton.disabled = true;
    }
};

createLandmarkers(); // Call to load models when script starts

// Event listener for the webcam button
enablePredictionsButton.addEventListener("click", enableCam);

function enableCam() {
    if (!handLandmarker || !poseLandmarker || !faceDetector) {
        console.log("Wait! MediaPipe models not loaded yet.");
        predictionResultDiv.textContent = "Prediction: Waiting for AI models to load...";
        return;
    }

    if (isPredicting) {
        // Stop current prediction
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        video.pause();
        isPredicting = false;
        enablePredictionsButton.textContent = "ENABLE PREDICTIONS";
        predictionResultDiv.textContent = "Prediction: Stopped";
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height); // Clear canvas
        return;
    }

    // Start webcam
    const constraints = { video: true };
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

// Prediction loop for webcam feed
async function predictWebcam() {
    // Set canvas dimensions to match video
    canvasElement.style.width = video.videoWidth + "px";
    canvasElement.style.height = video.videoHeight + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    let startTimeMs = performance.now(); // Current time for MediaPipe's detectForVideo

    // Only process if the video time has changed (new frame)
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;

        // Perform detections
        const handResults = handLandmarker.detectForVideo(video, startTimeMs);
        const poseResults = poseLandmarker.detectForVideo(video, startTimeMs);
        const faceResults = faceDetector.detectForVideo(video, startTimeMs);

        // Clear canvas and draw video frame
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

        const features = []; // Array to store 46 features

        // --- Extract Hand Landmarks (42 features: 21 x, 21 y) ---
        if (handResults.landmarks.length > 0) {
            const handLandmarks = handResults.landmarks[0]; // Assuming only one hand
            for (const landmark of handLandmarks) {
                features.push(landmark.x, landmark.y);
            }
            // Draw hand landmarks and connections
            drawingUtils.drawConnectors(canvasCtx, handLandmarks, HandLandmarker.HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 5
            });
            drawingUtils.drawLandmarks(canvasCtx, handLandmarks, {
                color: "#FF0000",
                lineWidth: 2
            });
        } else {
            // If no hand detected, push 0s for all 42 hand features
            for (let i = 0; i < 42; i++) {
                features.push(0);
            }
        }

        // --- Extract Face Center (2 features: x, y of bounding box center) ---
        let face_x = 0;
        let face_y = 0;
        if (faceResults.detections.length > 0) {
            const boundingBox = faceResults.detections[0].boundingBox;
            face_x = boundingBox.originX + boundingBox.width / 2;
            face_y = boundingBox.originY + boundingBox.height / 2;
            // Optionally draw face bounding box (MediaPipe FaceDetector only provides bounding box)
            // canvasCtx.beginPath();
            // canvasCtx.rect(boundingBox.originX, boundingBox.originY, boundingBox.width, boundingBox.height);
            // canvasCtx.strokeStyle = "#0000FF";
            // canvasCtx.lineWidth = 2;
            // canvasCtx.stroke();
        }
        features.push(face_x, face_y);

        // --- Extract Chest Midpoint (2 features: x, y of midpoint between shoulders) ---
        let chest_x = 0;
        let chest_y = 0;
        if (poseResults.landmarks.length > 0) {
            const poseLandmarks = poseResults.landmarks[0];
            const leftShoulder = poseLandmarks[drawingUtils.POSE_LANDMARKS.LEFT_SHOULDER];
            const rightShoulder = poseLandmarks[drawingUtils.POSE_LANDMARKS.RIGHT_SHOULDER];

            if (leftShoulder && rightShoulder) {
                chest_x = (leftShoulder.x + rightShoulder.x) / 2;
                chest_y = (leftShoulder.y + rightShoulder.y) / 2;
                // Draw a small circle for the chest midpoint for visualization
                // canvasCtx.beginPath();
                // canvasCtx.arc(chest_x * canvasElement.width, chest_y * canvasElement.height, 5, 0, 2 * Math.PI);
                // canvasCtx.fillStyle = "#FFFF00";
                // canvasCtx.fill();
            }
            // Draw full pose for visualization (optional)
            drawingUtils.drawConnectors(canvasCtx, poseLandmarks, drawingUtils.POSE_CONNECTIONS, {
                color: "#AAAAAA",
                lineWidth: 2
            });
            drawingUtils.drawLandmarks(canvasCtx, poseLandmarks, {
                color: "#CCCCCC",
                lineWidth: 1
            });
        }
        features.push(chest_x, chest_y);

        canvasCtx.restore(); // Restore canvas state

        // --- Sanity check: Ensure we have exactly 46 features ---
        if (features.length !== 46) {
            console.warn(`Expected 46 features, but got ${features.length}. Padding/Truncating...`);
            while(features.length < 46) features.push(0); // Pad with zeros if less
            if (features.length > 46) features.splice(46); // Truncate if more
        }

        // --- Send features to your Python backend ---
        if (isPredicting) { // Only send if actively predicting
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
                    const errorText = await response.text();
                    throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorText}`);
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