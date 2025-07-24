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

// CRITICAL: We declare these variables but do NOT initialize them with imports.
// We will access them from the global 'window' object dynamically.
let HAND_CONNECTIONS = [];
let POSE_CONNECTIONS = [];
let drawConnectors = undefined; // Will be window.drawConnectors
let drawLandmarks = undefined;   // Will be window.drawLandmarks

// Function to ensure global constants and drawing utilities are loaded.
// This handles the asynchronous nature of script loading.
const ensureGlobalsAreLoaded = () => {
    if (window.HAND_CONNECTIONS && window.POSE_CONNECTIONS && window.drawConnectors && window.drawLandmarks) {
        HAND_CONNECTIONS = window.HAND_CONNECTIONS;
        POSE_CONNECTIONS = window.POSE_CONNECTIONS;
        drawConnectors = window.drawConnectors;
        drawLandmarks = window.drawLandmarks;
        console.log("MediaPipe global constants and drawing utilities loaded.");
    } else {
        console.warn("MediaPipe global dependencies not yet available on window. Retrying...");
        // If not available, retry after a short delay. This handles module load order.
        setTimeout(ensureGlobalsAreLoaded, 100);
    }
};


// --- Model Loading ---
const createDetectors = async () => {
    if (!FilesetResolver) {
        console.error("FilesetResolver is still undefined even after direct module import. Check CDN path or bundle content.");
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
        ensureGlobalsAreLoaded();

    } catch (error) {
        console.error("Failed to load MediaPipe models:", error);
        if (demosSection) {
            demosSection.innerHTML = "Failed to load ML models. Please check console for details.";
        }
    }
};

createDetectors();


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
    if (!handLandmarker || !faceLandmarker || !poseLandmarker) {
        console.log("Wait! MediaPipe detectors not loaded yet. Retrying in 1 second...");
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
    if (!video || !canvasElement || !canvasCtx || !handLandmarker || !faceLandmarker || !poseLandmarker) {
        console.warn("Required elements or MediaPipe detectors not ready for webcam prediction. Halting loop.");
        return;
    }

    // Ensure global drawing functions and constants are available before attempting to draw
    if (!drawConnectors || !drawLandmarks || HAND_CONNECTIONS.length === 0 || POSE_CONNECTIONS.length === 0) {
        console.warn("MediaPipe global drawing functions or connection constants not yet loaded. Skipping drawing this frame.");
        if (webcamRunning === true) {
            window.requestAnimationFrame(predictWebcam); // Keep trying in next frame
        }
        return;
    }


    canvasElement.style.width = video.offsetWidth + "px";
    canvasElement.style.height = video.offsetHeight + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    let startTimeMs = performance.now();

    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        handResults = handLandmarker.detectForVideo(video, startTimeMs);
        faceResults = faceLandmarker.detectForVideo(video, startTimeMs);
        poseResults = poseLandmarker.detectForVideo(video, startTimeMs);
    } else {
        if (webcamRunning === true) {
            window.requestAnimationFrame(predictWebcam);
        }
        return;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);
    canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    const features = [];

    if (handResults && handResults.landmarks && handResults.landmarks.length > 0) {
        const landmarks = handResults.landmarks[0];
        for (const landmark of landmarks) {
            features.push(landmark.x, landmark.y);
        }
        const debugHandLandmarks = landmarks.map(lm => ({ ...lm, visibility: 1 }));
        drawConnectors( // Call the global function
            canvasCtx,
            debugHandLandmarks,
            HAND_CONNECTIONS, // This will be the global HAND_CONNECTIONS
            { color: "#00FF00", lineWidth: 5 }
        );
        drawLandmarks( // Call the global function
            canvasCtx,
            debugHandLandmarks,
            {
                color: "#FF0000",
                lineWidth: 3
            }
        );
    } else {
        for (let i = 0; i < 42; i++) {
            features.push(0);
        }
    }

    if (faceResults && faceResults.faceRects && faceResults.faceRects.length > 0) {
        const faceRect = faceResults.faceRects[0].boundingBox;
        const face_x = faceRect.x + faceRect.width / 2;
        const face_y = faceRect.y + faceRect.height / 2;
        features.push(face_x, face_y);

        canvasCtx.strokeStyle = '#00BFFF';
        canvasCtx.lineWidth = 2;
        // MediaPipe Tasks bounding boxes are normalized [0,1], so multiply by canvas dimensions
        canvasCtx.strokeRect(faceRect.x * canvasElement.width, faceRect.y * canvasElement.height,
                             faceRect.width * canvasElement.width, faceRect.height * canvasElement.height);
    } else {
        features.push(0, 0);
    }

    if (poseResults && poseResults.landmarks && poseResults.landmarks.length > 0) {
        const poseLandmarks = poseResults.landmarks[0];
        const LEFT_SHOULDER_IDX = 11;
        const RIGHT_SHOULDER_IDX = 12;

        const leftShoulder = poseLandmarks[LEFT_SHOULDER_IDX];
        const rightShoulder = poseLandmarks[RIGHT_SHOULDER_IDX];

        if (leftShoulder && rightShoulder && leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
            const chest_x = (leftShoulder.x + rightShoulder.x) / 2;
            const chest_y = (leftShoulder.y + rightShoulder.y) / 2;
            features.push(chest_x, chest_y);

            const debugPoseLandmarks = poseLandmarks.map(lm => ({ ...lm, visibility: 1 }));
            drawConnectors( // Call the global function
                canvasCtx,
                debugPoseLandmarks,
                POSE_CONNECTIONS, // This will be the global POSE_CONNECTIONS
                { color: '#FFFF00', lineWidth: 2 }
            );
            drawLandmarks( // Call the global function
                canvasCtx,
                [leftShoulder, rightShoulder],
                { color: '#00FFFF', lineWidth: 5 }
            );
        } else {
            features.push(0, 0);
        }
    } else {
        features.push(0, 0);
    }

    if (features.length !== 46) {
        console.warn(`Feature array length mismatch: Expected 46, got ${features.length}. Padding/truncating.`);
        while (features.length < 46) {
            features.push(0);
        }
        if (features.length > 46) {
            features.splice(46);
        }
    }

    try {
        const response = await fetch('predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ features: features })
        });

        if (response.ok) {
            const data = await response.json();
            const prediction = data.prediction;
            if (predictionResult) {
                predictionResult.innerText = `Prediction: ${prediction}`;
            }
        } else {
            console.error('Server error:', response.status, response.statusText);
            if (predictionResult) {
                predictionResult.innerText = `Prediction: Server Error (${response.status})`;
            }
        }
    } catch (error) {
        console.error('Network error during prediction:', error);
        if (predictionResult) {
            predictionResult.innerText = 'Prediction: Network Error (Is server running?)';
        }
    }

    canvasCtx.restore();

    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}