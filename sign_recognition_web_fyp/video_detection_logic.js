// frontend/video_detection_logic.js

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
const videoFileInput = document.getElementById("videoFileInput");
const uploadedVideo = document.getElementById("uploadedVideo");
const uploadedVideoCanvas = document.getElementById("uploadedVideoCanvas");
const canvasCtx = uploadedVideoCanvas.getContext("2d");
const videoPredictionResult = document.getElementById("videoPredictionResult");

// MediaPipe Landmarker and Detector instances
let handLandmarker;
let poseLandmarker;
let faceDetector;
let runningMode = "VIDEO"; // Still video mode as we process frames of a video
let animationFrameId = null; // To control the video frame processing loop

// Drawing utilities from MediaPipe
const drawingUtils = window;

// Asynchronously initialize MediaPipe models
const createLandmarkers = async () => {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: runningMode,
            numHands: 1
        });

        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU"
            },
            runningMode: runningMode,
        });

        faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/face_detector_lite/float16/1/face_detector_lite.task`,
                delegate: "GPU"
            },
            runningMode: runningMode,
            minDetectionConfidence: 0.5
        });

        console.log("MediaPipe models loaded for video detection!");
    } catch (error) {
        console.error("Failed to load MediaPipe models for video detection:", error);
        videoPredictionResult.textContent = "Error: Failed to load AI models. Check console for details.";
    }
};

createLandmarkers(); // Call to load models when script starts

// Handle video file input change event
videoFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        // Create a URL for the selected file and set it as the video source
        uploadedVideo.src = URL.createObjectURL(file);
        uploadedVideo.load(); // Load the video element
        videoPredictionResult.textContent = "Prediction: Loading video...";
        // Reset prediction display
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
});

// Event listener for when video metadata is loaded (e.g., dimensions)
uploadedVideo.addEventListener("loadeddata", () => {
    uploadedVideoCanvas.width = uploadedVideo.videoWidth;
    uploadedVideoCanvas.height = uploadedVideo.videoHeight;
    videoPredictionResult.textContent = "Prediction: Ready to play...";
});

// Event listener for when video starts playing
uploadedVideo.addEventListener("play", () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); // Stop any previous animation loop
    }
    predictVideo(); // Start the prediction loop
});

// Event listener for when video is paused
uploadedVideo.addEventListener("pause", () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
});

// Event listener for when video ends
uploadedVideo.addEventListener("ended", () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    videoPredictionResult.textContent = "Prediction: Video ended.";
});

// Prediction loop for video frames
async function predictVideo() {
    // Stop if video is paused or ended
    if (uploadedVideo.paused || uploadedVideo.ended) {
        return;
    }

    // Clear canvas and draw current video frame
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, uploadedVideoCanvas.width, uploadedVideoCanvas.height);
    canvasCtx.drawImage(uploadedVideo, 0, 0, uploadedVideoCanvas.width, uploadedVideoCanvas.height);

    // Perform detections for the current video frame
    // Pass current time in milliseconds to detectForVideo
    const handResults = handLandmarker.detectForVideo(uploadedVideo, uploadedVideo.currentTime * 1000);
    const poseResults = poseLandmarker.detectForVideo(uploadedVideo, uploadedVideo.currentTime * 1000);
    const faceResults = faceDetector.detectForVideo(uploadedVideo, uploadedVideo.currentTime * 1000);

    const features = []; // Array to store 46 features

    // --- Extract Hand Landmarks (42 features) ---
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
        // If no hand detected, push 0s
        for (let i = 0; i < 42; i++) {
            features.push(0);
        }
    }

    // --- Extract Face Center (2 features) ---
    let face_x = 0;
    let face_y = 0;
    if (faceResults.detections.length > 0) {
        const boundingBox = faceResults.detections[0].boundingBox;
        face_x = boundingBox.originX + boundingBox.width / 2;
        face_y = boundingBox.originY + boundingBox.height / 2;
    }
    features.push(face_x, face_y);

    // --- Extract Chest Midpoint (2 features) ---
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
        console.warn(`Video detection: Expected 46 features, but got ${features.length}. Padding/Truncating...`);
        while(features.length < 46) features.push(0);
        if (features.length > 46) features.splice(46);
    }

    // --- Send features to your Python backend ---
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
        videoPredictionResult.textContent = `Prediction: ${data.predicted_gloss} (Confidence: ${(data.confidence * 100).toFixed(2)}%)`;
    } catch (error) {
        console.error("Error sending video features to backend:", error);
        videoPredictionResult.textContent = `Prediction Error: ${error.message}`;
    }

    // Request next animation frame to continue processing video
    animationFrameId = window.requestAnimationFrame(predictVideo);
}