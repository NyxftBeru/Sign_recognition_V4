// video_detection.ts

import {
  HandLandmarker,
  FilesetResolver,
  FaceLandmarker,
  PoseLandmarker
} from "@mediapipe/tasks-vision";

// REMOVED these lines:
// import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
// import { HAND_CONNECTIONS } from '@mediapipe/hands';
// import { POSE_CONNECTIONS } from '@mediapipe/pose';

// ADDED these lines to declare global variables for MediaPipe Solutions
declare const drawConnectors: (canvasCtx: CanvasRenderingContext2D, landmarks: any[], connections: any, options?: any) => void;
declare const drawLandmarks: (canvasCtx: CanvasRenderingContext2D, landmarks: any[], options?: any) => void;
declare const HAND_CONNECTIONS: any;
declare const POSE_CONNECTIONS: any;


// UI elements from video_detection.html
const videoFileInput = document.getElementById("videoFileInput") as HTMLInputElement;
const uploadedVideoContainer = document.getElementById("uploadedVideoContainer") as HTMLDivElement;
const uploadedVideoElement = document.getElementById("uploadedVideo") as HTMLVideoElement;
const uploadedVideoCanvasElement = document.getElementById("uploadedVideoCanvas") as HTMLCanvasElement;
const uploadedVideoCanvasCtx = uploadedVideoCanvasElement?.getContext("2d");
const videoPredictionResultElement = document.getElementById("videoPredictionResult") as HTMLHeadingElement;
// Ensure predictionResult for webcam section is also defined if it exists
const predictionResult = document.getElementById("predictionResult");


let handLandmarker: HandLandmarker | undefined = undefined;
let faceLandmarker: FaceLandmarker | undefined = undefined;
let poseLandmarker: PoseLandmarker | undefined = undefined;

// --- Model Loading ---
// This function initializes all MediaPipe models (Hand, Face, Pose Landmarkers).
const createDetectors = async () => {
    try {
        // Resolve the Wasm files for MediaPipe Tasks Vision API.
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");

        // Initialize HandLandmarker with a single hand.
        const handOptions = {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU" as const
            },
            runningMode: "VIDEO" as const,
            numHands: 1
        };
        handLandmarker = await HandLandmarker.createFromOptions(vision, handOptions);
        console.log("HandLandmarker model loaded successfully!");

        // Initialize FaceLandmarker for single face detection.
        const faceOptions = {
            baseOptions: {
                // CORRECTED THE TYPO HERE: storage.com changed to storage.googleapis.com
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU" as const
            },
            runningMode: "VIDEO" as const,
            outputFaceBlendshapes: false,
            numFaces: 1
        };
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, faceOptions);
        console.log("FaceLandmarker model loaded successfully!");

        // Initialize PoseLandmarker for single pose detection.
        const poseOptions = {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU" as const
            },
            runningMode: "VIDEO" as const,
            numPoses: 1
        };
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, poseOptions);
        console.log("PoseLandmarker model loaded successfully!");

        // Update the prediction result display to indicate readiness.
        if (videoPredictionResultElement) {
            videoPredictionResultElement.innerText = "Prediction: Models loaded, waiting for video upload...";
        }
        // If there's a separate predictionResult for webcam, update it too
        if (predictionResult) {
            predictionResult.innerText = "Prediction: Models loaded, enable webcam for live predictions.";
        }

    } catch (error) {
        console.error("Failed to load MediaPipe models:", error);
        if (videoPredictionResultElement) {
            videoPredictionResultElement.innerText = "Prediction: Failed to load ML models. Check console for details.";
        }
        if (predictionResult) {
            predictionResult.innerText = "Prediction: Failed to load ML models. Check console for details.";
        }
    }
};
createDetectors(); // Call the function to create all detectors immediately on page load


// --- NEW: Handle Video File Upload ---
let lastUploadedVideoTime = -1;
let uploadedVideoRunning = false;

if (videoFileInput) {
    videoFileInput.addEventListener('change', (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            const file = files[0];
            const videoURL = URL.createObjectURL(file);

            // Set video source and make container visible
            uploadedVideoElement.src = videoURL;
            uploadedVideoContainer.style.display = 'block';

            // Reset prediction display
            if (videoPredictionResultElement) {
                videoPredictionResultElement.innerText = "Prediction: Loading video...";
            }

            // Ensure canvas matches video size when video metadata is loaded
            uploadedVideoElement.onloadedmetadata = () => {
                if (uploadedVideoCanvasElement && uploadedVideoElement) {
                    uploadedVideoCanvasElement.width = uploadedVideoElement.videoWidth;
                    uploadedVideoCanvasElement.height = uploadedVideoElement.videoHeight;
                    // Adjust style for display aspect ratio if needed (optional)
                    uploadedVideoCanvasElement.style.width = uploadedVideoElement.offsetWidth + "px";
                    uploadedVideoCanvasElement.style.height = uploadedVideoElement.offsetHeight + "px";
                }
            };

            // Start prediction when video starts playing
            uploadedVideoElement.addEventListener('play', () => {
                uploadedVideoRunning = true;
                predictUploadedVideo();
            });
            uploadedVideoElement.addEventListener('pause', () => uploadedVideoRunning = false);
            uploadedVideoElement.addEventListener('ended', () => {
                uploadedVideoRunning = false;
                if (videoPredictionResultElement) {
                    videoPredictionResultElement.innerText = "Prediction: Video processing complete.";
                }
            });


            uploadedVideoElement.load(); // Ensure video loads metadata if not already
        }
    });
}

// NEW FUNCTION: Predict for Uploaded Video
async function predictUploadedVideo() {
    if (!uploadedVideoElement || !uploadedVideoCanvasElement || !uploadedVideoCanvasCtx || !handLandmarker || !faceLandmarker || !poseLandmarker) {
        console.warn("Required elements or MediaPipe detectors not ready for uploaded video prediction.");
        if (uploadedVideoRunning) {
             window.requestAnimationFrame(predictUploadedVideo); // Continue trying if still supposed to be running
        }
        return;
    }

    if (uploadedVideoElement.paused || uploadedVideoElement.ended) {
        uploadedVideoRunning = false;
        if (videoPredictionResultElement) {
            videoPredictionResultElement.innerText = "Prediction: Video ended or paused.";
        }
        return;
    }

    let startTimeMs = performance.now();

    // Only detect if the video frame has changed
    if (lastUploadedVideoTime !== uploadedVideoElement.currentTime) {
        lastUploadedVideoTime = uploadedVideoElement.currentTime;

        handResults = handLandmarker.detectForVideo(uploadedVideoElement, startTimeMs);
        faceResults = faceLandmarker.detectForVideo(uploadedVideoElement, startTimeMs);
        poseResults = poseLandmarker.detectForVideo(uploadedVideoElement, startTimeMs);
    }

    uploadedVideoCanvasCtx.save();
    uploadedVideoCanvasCtx.clearRect(0, 0, uploadedVideoCanvasElement.width, uploadedVideoCanvasElement.height);

    // Draw the video frame onto the canvas
    uploadedVideoCanvasCtx.drawImage(uploadedVideoElement, 0, 0, uploadedVideoCanvasElement.width, uploadedVideoCanvasElement.height);

    const features: number[] = [];

    // 1. Extract Hand Landmarks (21 landmarks * 2 coordinates = 42 features)
    if (handResults && handResults.landmarks && handResults.landmarks.length > 0) {
        const landmarks = handResults.landmarks[0];
        for (const landmark of landmarks) {
            features.push(landmark.x, landmark.y);
        }
        const debugHandLandmarks = landmarks.map((lm: any) => ({ ...lm, visibility: 1 }));
        drawConnectors(uploadedVideoCanvasCtx, debugHandLandmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 5 });
        drawLandmarks(uploadedVideoCanvasCtx, debugHandLandmarks, { color: "#FF0000", lineWidth: 2 });
    } else {
        for (let i = 0; i < 42; i++) features.push(0);
    }

    // 2. Extract Face Center (Bounding Box Center) (2 features)
    if (faceResults && faceResults.faceRects && faceResults.faceRects.length > 0) {
        const faceRect = faceResults.faceRects[0].boundingBox;
        const face_x = faceRect.x + faceRect.width / 2;
        const face_y = faceRect.y + faceRect.height / 2;
        features.push(face_x, face_y);
        uploadedVideoCanvasCtx.strokeStyle = '#00BFFF';
        uploadedVideoCanvasCtx.lineWidth = 2;
        uploadedVideoCanvasCtx.strokeRect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
    } else {
        features.push(0, 0);
    }

    // 3. Extract Chest Position (average of shoulder landmarks) (2 features)
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
            const debugPoseLandmarks = poseLandmarks.map((lm: any) => ({ ...lm, visibility: 1 }));
            drawConnectors(uploadedVideoCanvasCtx, debugPoseLandmarks, POSE_CONNECTIONS, { color: '#FFFF00', lineWidth: 2 });
            drawLandmarks(uploadedVideoCanvasCtx, [leftShoulder, rightShoulder], { color: '#00FFFF', lineWidth: 5 });
        } else {
            features.push(0, 0);
        }
    } else {
        features.push(0, 0);
    }

    // Ensure features array has exactly 46 elements
    if (features.length !== 46) {
        console.warn(`Feature array length mismatch: Expected 46, got ${features.length}. Padding/truncating.`);
        while (features.length < 46) features.push(0);
        if (features.length > 46) features.splice(46);
    }

    // Send features to Flask server for prediction
    try {
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ features: features })
        });

        if (response.ok) {
            const data = await response.json();
            const prediction = data.prediction;
            if (videoPredictionResultElement) {
                videoPredictionResultElement.innerText = `Prediction: ${prediction}`;
            }
        } else {
            console.error('Server error:', response.status, response.statusText);
            if (videoPredictionResultElement) {
                videoPredictionResultElement.innerText = `Prediction: Server Error (${response.status})`;
            }
        }
    } catch (error) {
        console.error('Network error during prediction:', error);
        if (videoPredictionResultElement) {
            videoPredictionResultElement.innerText = 'Prediction: Network Error (Is server running?)';
        }
    }

    uploadedVideoCanvasCtx.restore();

    // Call this function again to keep predicting when the browser is ready.
    if (uploadedVideoRunning) {
        window.requestAnimationFrame(predictUploadedVideo);
    }
}


// --- Existing Webcam Continuous Detection ---

const demosSection = document.getElementById("demos");
const video = document.getElementById("webcam") as HTMLVideoElement; // Assuming this is for webcam
const canvasElement = document.getElementById(
  "output_canvas"
) as HTMLCanvasElement;
const canvasCtx = canvasElement?.getContext("2d");

let enableWebcamButton: HTMLButtonElement | null = null;
let webcamRunning: boolean = false;


// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
  if (enableWebcamButton) {
    enableWebcamButton.addEventListener("click", enableCam);
    // Remove "invisible" class for demosSection if it's supposed to be initially hidden
    if (demosSection) {
        demosSection.classList.remove("invisible");
    }
  } else {
    console.warn("Webcam enable button not found.");
  }
} else {
  console.warn("getUserMedia() is not supported by your browser");
}


// Enable the live webcam view and start detection.
function enableCam(event: Event) {
  if (!handLandmarker || !faceLandmarker || !poseLandmarker) { // Ensure all are loaded
    console.log("Wait! MediaPipe detectors not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    if (enableWebcamButton) enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    // Stop the video stream when disabling webcam
    if (video.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    // Clear canvas and prediction result
    if (canvasCtx && canvasElement) {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
    if (predictionResult) {
        predictionResult.innerText = "Prediction: Disabled";
    }
  } else {
    webcamRunning = true;
    if (enableWebcamButton) enableWebcamButton.innerText = "DISABLE PREDICTIONS";

    // getUsermedia parameters.
    const constraints = {
      video: true
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    }).catch(err => {
        console.error("Error accessing webcam:", err);
        webcamRunning = false;
        if (enableWebcamButton) enableWebcamButton.innerText = "ENABLE PREDICTIONS";
        if (predictionResult) {
            predictionResult.innerText = "Prediction: Webcam access denied or error";
        }
    });
  }
}

let lastVideoTime = -1;
let handResults: any = undefined; // Using these for both webcam and uploaded video now
let faceResults: any = undefined;
let poseResults: any = undefined;


async function predictWebcam() {
    if (!video || !canvasElement || !canvasCtx || !handLandmarker || !faceLandmarker || !poseLandmarker) {
        console.warn("Required elements or MediaPipe detectors not ready for webcam prediction.");
        if (webcamRunning) {
            window.requestAnimationFrame(predictWebcam);
        }
        return;
    }

    // Adjust canvas dimensions to match video feed
    canvasElement.style.width = video.offsetWidth + "px";
    canvasElement.style.height = video.offsetHeight + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    let startTimeMs = performance.now();
    // Only detect for video if the video frame has changed
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        // Perform detections
        handResults = handLandmarker.detectForVideo(video, startTimeMs);
        faceResults = faceLandmarker.detectForVideo(video, startTimeMs);
        poseResults = poseLandmarker.detectForVideo(video, startTimeMs);
    } else {
        // console.log("Video frame not changed, skipping detection for this frame."); // Too noisy for webcam
    }


    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Apply a horizontal flip transformation to the canvas context for non-mirrored webcam display
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);

    canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    const features: number[] = [];

    // 1. Extract Hand Landmarks (21 landmarks * 2 coordinates = 42 features)
    if (handResults && handResults.landmarks && handResults.landmarks.length > 0) {
        const landmarks = handResults.landmarks[0];
        for (const landmark of landmarks) {
            features.push(landmark.x, landmark.y);
        }
        const debugHandLandmarks = landmarks.map((lm: any) => ({ ...lm, visibility: 1 }));
        drawConnectors(canvasCtx, debugHandLandmarks, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
        });
        drawLandmarks(canvasCtx, debugHandLandmarks, {
            color: "#FF0000",
            lineWidth: 2
        });
    } else {
        // If no hand detected, pad with zeros for hand features (21 * 2 = 42 zeros)
        for (let i = 0; i < 42; i++) {
            features.push(0);
        }
    }

    // 2. Extract Face Center (Bounding Box Center) (2 features)
    if (faceResults && faceResults.faceRects && faceResults.faceRects.length > 0) {
        const faceRect = faceResults.faceRects[0].boundingBox;

        const face_x = faceRect.x + faceRect.width / 2;
        const face_y = faceRect.y + faceRect.height / 2;
        features.push(face_x, face_y);

        // Optionally, draw the face bounding box for visualization
        canvasCtx.strokeStyle = '#00BFFF';
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeRect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
    } else {
        features.push(0, 0);
    }

    // 3. Extract Chest Position (average of shoulder landmarks) (2 features)
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

            const debugPoseLandmarks = poseLandmarks.map((lm: any) => ({ ...lm, visibility: 1 }));

            // Draw pose landmarks (optional, for debugging/visualization)
            drawConnectors(canvasCtx, debugPoseLandmarks, POSE_CONNECTIONS, { color: '#FFFF00', lineWidth: 2 });
            drawLandmarks(canvasCtx, [leftShoulder, rightShoulder], { color: '#00FFFF', lineWidth: 5 });
        } else {
            features.push(0, 0);
        }
    } else {
        features.push(0, 0);
    }

    // Ensure features array has exactly 46 elements
    if (features.length !== 46) {
        console.warn(`Feature array length mismatch: Expected 46, got ${features.length}. Padding/truncating.`);
        while (features.length < 46) {
            features.push(0);
        }
        if (features.length > 46) {
            features.splice(46);
        }
    }

    // Send features to Flask server for prediction
    try {
        const response = await fetch('http://localhost:5000/predict', {
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

    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}