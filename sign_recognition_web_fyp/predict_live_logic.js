// dist/test.js

// 1. Core MediaPipe Tasks Vision imports
// This is the ONLY import needed from @mediapipe/tasks-vision.
// We are NOT importing DrawingUtils from here.
import {
    HandLandmarker,
    FilesetResolver,
    FaceLandmarker,
    PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/vision_bundle.js";


// 2. Declare all DOM elements and state variables at the top-level
const demosSection = document.getElementById("demos");
const predictionResult = document.getElementById("predictionResult");
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement?.getContext("2d");
let enableWebcamButton = null;

let handLandmarker = undefined;
let faceLandmarker = undefined;
let poseLandmarker = undefined;
let webcamRunning = false;
let PYTHON_API_URL = ''; // Declare variable to hold the backend URL

// CRITICAL: We declare these variables but do NOT initialize them with imports.
// We will access them from the global 'window' object dynamically after the CDN scripts load.
let HAND_CONNECTIONS = [];
let POSE_CONNECTIONS = [];
let drawConnectors = undefined; // Will be window.drawConnectors
let drawLandmarks = undefined;   // Will be window.drawLandmarks

// Function to ensure global constants and drawing utilities are loaded.
// This handles the asynchronous nature of script loading.
const ensureGlobalsAreLoaded = () => {
    // Check if the global MediaPipe drawing utilities and constants are available
    if (window.HAND_CONNECTIONS && window.POSE_CONNECTIONS && window.drawConnectors && window.drawLandmarks) {
        HAND_CONNECTIONS = window.HAND_CONNECTIONS;
        POSE_CONNECTIONS = window.POSE_CONNECTIONS;
        drawConnectors = window.drawConnectors;
        drawLandmarks = window.drawLandmarks;
        console.log("MediaPipe global constants and drawing utilities loaded.");
        return true; // Indicate success
    } else {
        console.warn("MediaPipe global dependencies not yet available on window. Retrying...");
        return false; // Indicate failure
    }
};


// --- Model Loading ---
const createDetectors = async () => {
    // Ensure FilesetResolver is available from the vision_bundle.js import
    if (!FilesetResolver) {
        console.error("FilesetResolver is still undefined. Check CDN path or bundle content.");
        if (demosSection) {
            demosSection.innerHTML = "Error: MediaPipe components not loaded. Check console.";
        }
        return;
    }

    try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
        
        // Initialize HandLandmarker
        const handOptions = {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        };
        handLandmarker = await HandLandmarker.createFromOptions(vision, handOptions);
        console.log("HandLandmarker model loaded successfully!");

        // Initialize FaceLandmarker
        const faceOptions = {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            outputFaceBlendshapes: false,
            numFaces: 1
        };
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, faceOptions);
        console.log("FaceLandmarker model loaded successfully!");

        // Initialize PoseLandmarker
        const poseOptions = {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1
        };
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, poseOptions);
        console.log("PoseLandmarker model loaded successfully!");

        if (demosSection) {
            demosSection.classList.remove("invisible");
        }

        // After all models are loaded, ensure global connections and drawing utils are available
        // This is a crucial step to make sure drawing functions are ready before predictWebcam runs.
        const webcamButton = document.getElementById("webcamButton");
        if (webcamButton) {
            webcamButton.disabled = false;
            webcamButton.innerText = "ENABLE PREDICTIONS";
        }
        
        // Start checking for global drawing libs after models are loaded
        const checkDrawingGlobals = () => {
            if (!ensureGlobalsAreLoaded()) {
                setTimeout(checkDrawingGlobals, 100); // Retry if not loaded
            }
        };
        checkDrawingGlobals();

    } catch (error) {
        console.error("Failed to load MediaPipe models:", error);
        if (demosSection) {
            demosSection.innerHTML = "Failed to load ML models. Please check console for details.";
        }
    }
};


// --- Get API URL from window.ENV_CONFIG ---
// This will be called once the DOM is ready and window.ENV_CONFIG is expected to be populated
document.addEventListener('DOMContentLoaded', () => {
    const checkEnvConfigAndInit = () => {
        if (window.ENV_CONFIG && window.ENV_CONFIG.PYTHON_API_URL) {
            PYTHON_API_URL = window.ENV_CONFIG.PYTHON_API_URL;
            console.log('PYTHON_API_URL from window.ENV_CONFIG:', PYTHON_API_URL);
            createDetectors(); // Start loading MediaPipe models
        } else {
            console.warn("window.ENV_CONFIG.PYTHON_API_URL not yet available. Retrying...");
            setTimeout(checkEnvConfigAndInit, 100); // Retry after a short delay
        }
    };
    checkEnvConfigAndInit();
});


// --- Webcam Continuous Detection ---
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    if (enableWebcamButton) {
        enableWebcamButton.addEventListener("click", enableCam);
    } else {
        console.warn("Webcam enable button not found.");
    }
} else {
    console.warn("getUserMedia() is not supported by your browser");
}

function enableCam(event) {
    if (!handLandmarker || !faceLandmarker || !poseLandmarker || !PYTHON_API_URL) {
        console.log("Wait! MediaPipe detectors or API URL not loaded yet. Retrying in 1 second...");
        // Re-check and re-call enableCam after a delay
        setTimeout(() => enableCam(event), 1000);
        return;
    }

    if (webcamRunning === true) {
        webcamRunning = false;
        if (enableWebcamButton)
            enableWebcamButton.innerText = "ENABLE PREDICTIONS";
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        if (canvasCtx && canvasElement) {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
        if (predictionResult) {
            predictionResult.innerText = "Prediction: Disabled";
        }
    } else {
        webcamRunning = true;
        if (enableWebcamButton)
            enableWebcamButton.innerText = "DISABLE PREDICTIONS";
        const constraints = {
            video: true
        };
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            video.srcObject = stream;
            // Add a loadeddata event listener to ensure the video is ready
            video.addEventListener("loadeddata", predictWebcam);
        }).catch(err => {
            console.error("Error accessing webcam:", err);
            webcamRunning = false;
            if (enableWebcamButton)
                enableWebcamButton.innerText = "ENABLE PREDICTIONS";
            if (predictionResult) {
                predictionResult.innerText = "Prediction: Webcam access denied or error";
            }
        });
    }
}

let lastVideoTime = -1;
let handResults = undefined;
let faceResults = undefined;
let poseResults = undefined;

async function predictWebcam() {
    // Crucial check: ensure all necessary components are ready
    if (!video || !canvasElement || !canvasCtx || !handLandmarker || !faceLandmarker || !poseLandmarker || !PYTHON_API_URL) {
        console.warn("Required elements, MediaPipe detectors, or API URL not ready for webcam prediction. Halting loop.");
        return; // Stop the prediction loop if essentials are missing
    }

    // Ensure global drawing functions and constants are available before attempting to draw
    if (!drawConnectors || !drawLandmarks || HAND_CONNECTIONS.length === 0 || POSE_CONNECTIONS.length === 0) {
        console.warn("MediaPipe global drawing functions or connection constants not yet loaded. Skipping drawing this frame.");
        if (webcamRunning === true) {
            window.requestAnimationFrame(predictWebcam); // Keep trying in next frame
        }
        return;
    }

    // Set canvas dimensions to match video
    canvasElement.style.width = video.offsetWidth + "px";
    canvasElement.style.height = video.offsetHeight + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    let startTimeMs = performance.now();

    // Only run detection if the video frame has changed
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        handResults = handLandmarker.detectForVideo(video, startTimeMs);
        faceResults = faceLandmarker.detectForVideo(video, startTimeMs);
        poseResults = poseLandmarker.detectForVideo(video, startTimeMs);
    } else {
        // If the video hasn't changed, just request the next frame without re-processing
        if (webcamRunning === true) {
            window.requestAnimationFrame(predictWebcam);
        }
        return;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    // Flip the canvas horizontally for a mirror effect matching webcam
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);
    canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    const features = [];

    // Process Hand Landmarks
    if (handResults && handResults.landmarks && handResults.landmarks.length > 0) {
        const landmarks = handResults.landmarks[0]; // Assuming single hand detection
        for (const landmark of landmarks) {
            features.push(landmark.x, landmark.y);
        }
        // Draw hand landmarks and connections
        const debugHandLandmarks = landmarks.map(lm => ({ ...lm, visibility: 1 })); // Ensure visibility for drawing
        drawConnectors(
            canvasCtx,
            debugHandLandmarks,
            HAND_CONNECTIONS,
            { color: "#00FF00", lineWidth: 5 }
        );
        drawLandmarks(
            canvasCtx,
            debugHandLandmarks,
            {
                color: "#FF0000",
                lineWidth: 3
            }
        );
    } else {
        // Push 42 zeros if no hand detected (21 landmarks * 2 coords)
        for (let i = 0; i < 42; i++) {
            features.push(0);
        }
    }

    // Process Face Center (from FaceLandmarker's bounding box)
    if (faceResults && faceResults.faceRects && faceResults.faceRects.length > 0) {
        const faceRect = faceResults.faceRects[0].boundingBox;
        // Face Landmarker results also provide `faceRects` as bounding boxes
        const face_x = faceRect.x + faceRect.width / 2;
        const face_y = faceRect.y + faceRect.height / 2;
        features.push(face_x, face_y);

        // Draw bounding box for the face
        canvasCtx.strokeStyle = '#00BFFF';
        canvasCtx.lineWidth = 2;
        // MediaPipe Tasks bounding boxes are normalized [0,1], so multiply by canvas dimensions
        canvasCtx.strokeRect(faceRect.x * canvasElement.width, faceRect.y * canvasElement.height,
                             faceRect.width * canvasElement.width, faceRect.height * canvasElement.height);
    } else {
        features.push(0, 0); // Push 2 zeros if no face detected
    }

    // Process Chest Position (midpoint of shoulders from PoseLandmarker)
    if (poseResults && poseResults.landmarks && poseResults.landmarks.length > 0) {
        const poseLandmarks = poseResults.landmarks[0];
        const LEFT_SHOULDER_IDX = 11; // Standard MediaPipe Pose landmark index
        const RIGHT_SHOULDER_IDX = 12; // Standard MediaPipe Pose landmark index

        const leftShoulder = poseLandmarks[LEFT_SHOULDER_IDX];
        const rightShoulder = poseLandmarks[RIGHT_SHOULDER_IDX];

        // Check if shoulders are detected with sufficient visibility
        // Visibility is often used to determine reliability of a landmark
        if (leftShoulder && rightShoulder && leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
            const chest_x = (leftShoulder.x + rightShoulder.x) / 2;
            const chest_y = (leftShoulder.y + rightShoulder.y) / 2;
            features.push(chest_x, chest_y);

            // Draw pose landmarks and connections (e.g., shoulders, and potentially other relevant pose points)
            const debugPoseLandmarks = poseLandmarks.map(lm => ({ ...lm, visibility: 1 }));
            drawConnectors(
                canvasCtx,
                debugPoseLandmarks,
                POSE_CONNECTIONS,
                { color: '#FFFF00', lineWidth: 2 }
            );
            // Optionally draw just the shoulders or chest point
            drawLandmarks(
                canvasCtx,
                [leftShoulder, rightShoulder], // Just highlight shoulders
                { color: '#00FFFF', lineWidth: 5 }
            );
            // Also draw the calculated chest midpoint
            canvasCtx.beginPath();
            canvasCtx.arc(chest_x * canvasElement.width, chest_y * canvasElement.height, 5, 0, 2 * Math.PI);
            canvasCtx.fillStyle = '#FF00FF'; // Magenta for chest point
            canvasCtx.fill();

        } else {
            features.push(0, 0); // Push 2 zeros if shoulders not detected or not visible
        }
    } else {
        features.push(0, 0); // Push 2 zeros if no pose detected
    }

    // Final check for feature length
    // The current logic produces 46 features: (21 hand x,y) + (1 face_center x,y) + (1 chest_center x,y) = 42 + 2 + 2 = 46
    // Ensure your Python backend (server.py and train_model.py)
    // is configured to expect 46 features (EXPECTED_FEATURE_COUNT = 46).
    if (features.length !== 46) {
        console.warn(`Feature array length mismatch: Expected 46, got ${features.length}. This might cause backend errors.`);
        // You might want to handle this more robustly, e.g., by resetting or padding.
        // For now, we'll let it pass but log a warning.
    }

    try {
        // Use the dynamically loaded PYTHON_API_URL
        const response = await fetch(`${PYTHON_API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ features: features })
        });

        if (response.ok) {
            const data = await response.json();
            const predicted_gloss = data.predicted_gloss; // Use predicted_gloss as per server.py
            const confidence = data.confidence;
            if (predictionResult) {
                if (predicted_gloss && confidence !== undefined) {
                    predictionResult.innerText = `Prediction: ${predicted_gloss} (Confidence: ${confidence.toFixed(2)})`;
                } else {
                    predictionResult.innerText = `Prediction: ${predicted_gloss || 'N/A'}`;
                }
            }
        } else {
            console.error('Server error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Server error details:', errorText);
            if (predictionResult) {
                predictionResult.innerText = `Prediction: Server Error (${response.status})`;
            }
        }
    } catch (error) {
        console.error('Network error during prediction:', error);
        if (predictionResult) {
            predictionResult.innerText = 'Prediction: Network Error (Is backend server running?)';
        }
    }

    canvasCtx.restore(); // Restore the canvas state (undo the flip)

    // Continue the prediction loop only if webcam is still running
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}