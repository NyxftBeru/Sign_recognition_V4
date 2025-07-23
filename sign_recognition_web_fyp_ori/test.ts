

import {
  HandLandmarker,
  FilesetResolver,
  HandLandmarkerOptions,
  HandLandmarkerResult,
  FaceLandmarker, // Import FaceLandmarker
  FaceLandmarkerOptions,
  PoseLandmarker, // Import PoseLandmarker
  PoseLandmarkerOptions,
  PoseLandmarkerResult
} from "@mediapipe/tasks-vision";
// @ts-ignore - Ignore if drawing_utils or hands typings are not found, common for direct npm imports
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
// @ts-ignore
import { HAND_CONNECTIONS } from '@mediapipe/hands';
// @ts-ignore
import { POSE_CONNECTIONS } from '@mediapipe/pose'; // Import POSE_CONNECTIONS for drawing

const demosSection = document.getElementById("demos");
const predictionResult = document.getElementById("predictionResult"); // Added for displaying prediction

let handLandmarker: HandLandmarker | undefined = undefined;
let faceLandmarker: FaceLandmarker | undefined = undefined; // New: FaceLandmarker instance
let poseLandmarker: PoseLandmarker | undefined = undefined; // New: PoseLandmarker instance
let enableWebcamButton: HTMLButtonElement | null = null; // Can be null if element not found
let webcamRunning: boolean = false;


// --- Model Loading ---
// Before we can use MediaPipe classes, we must wait for them to finish
// loading.
const createDetectors = async () => {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    // Initialize HandLandmarker
    const handOptions: HandLandmarkerOptions = {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO", // Always start in VIDEO mode for webcam
      numHands: 1 // We need max 1 hand for your current model features
    };
    handLandmarker = await HandLandmarker.createFromOptions(vision, handOptions);
    console.log("HandLandmarker model loaded successfully!");

    // Initialize FaceLandmarker
    const faceOptions: FaceLandmarkerOptions = {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        outputFaceBlendshapes: false,
        numFaces: 1
        // IMPORTANT: Ensure 'outputFaceRects' is true if using an older version or if it's explicitly needed.
        // Latest versions of FaceLandmarker should output faceRects by default when used in VIDEO mode.
    };
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, faceOptions);
    console.log("FaceLandmarker model loaded successfully!");

    // Initialize PoseLandmarker
    const poseOptions: PoseLandmarkerOptions = {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
    };
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, poseOptions);
    console.log("PoseLandmarker model loaded successfully!");


    // Ensure demosSection exists before trying to access its classList
    if (demosSection) {
      demosSection.classList.remove("invisible"); // Remove 'invisible' class when ready
    }
  } catch (error) {
    console.error("Failed to load MediaPipe models:", error);
    if (demosSection) {
      demosSection.innerHTML = "Failed to load ML models. Please check console for details.";
    }
  }
};
createDetectors(); // Call the function to create all detectors


// --- Webcam Continuous Detection ---

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById(
  "output_canvas"
) as HTMLCanvasElement;
const canvasCtx = canvasElement?.getContext("2d");

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
  if (enableWebcamButton) {
    enableWebcamButton.addEventListener("click", enableCam);
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
let handResults: HandLandmarkerResult | undefined = undefined;
let faceResults: any = undefined; // MediaPipe FaceLandmarker result type
let poseResults: PoseLandmarkerResult | undefined = undefined;

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

    // console.log("Webcam hand detection results:", handResults);
    // console.log("Webcam face detection results:", faceResults);
    // console.log("Webcam pose detection results:", poseResults);
  } else {
      console.log("Video frame not changed, skipping detection for this frame.");
  }


  canvasCtx.save(); // Save the current state of the canvas context
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Apply a horizontal flip transformation to the canvas context for non-mirrored webcam display
  canvasCtx.scale(-1, 1);
  canvasCtx.translate(-canvasElement.width, 0);

  canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

  const features: number[] = [];

  // 1. Extract Hand Landmarks (21 landmarks * 2 coordinates = 42 features)
  if (handResults && handResults.landmarks && handResults.landmarks.length > 0) {
    const landmarks = handResults.landmarks[0]; // Assuming only one hand is relevant
    for (const landmark of landmarks) {
      features.push(landmark.x, landmark.y);
    }
    // Draw hand landmarks
    const debugHandLandmarks = landmarks.map(lm => ({ ...lm, visibility: 1 }));
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

  // 2. Extract Face Center (Bounding Box Center) (2 features) - MODIFIED HERE!
  if (faceResults && faceResults.faceRects && faceResults.faceRects.length > 0) {
      const faceRect = faceResults.faceRects[0].boundingBox; // Get the bounding box of the first detected face
      
      const face_x = faceRect.x + faceRect.width / 2;
      const face_y = faceRect.y + faceRect.height / 2;
      features.push(face_x, face_y);

      // Optionally, draw the face bounding box for visualization
      canvasCtx.strokeStyle = '#00BFFF'; // Deep Sky Blue
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeRect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
  } else {
      features.push(0, 0); // No face detected
  }

  // 3. Extract Chest Position (average of shoulder landmarks) (2 features)
  if (poseResults && poseResults.landmarks && poseResults.landmarks.length > 0) {
      const poseLandmarks = poseResults.landmarks[0]; // Assuming only one person
      const LEFT_SHOULDER_IDX = 11;
      const RIGHT_SHOULDER_IDX = 12;

      const leftShoulder = poseLandmarks[LEFT_SHOULDER_IDX];
      const rightShoulder = poseLandmarks[RIGHT_SHOULDER_IDX];

      if (leftShoulder && rightShoulder && leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
          const chest_x = (leftShoulder.x + rightShoulder.x) / 2;
          const chest_y = (leftShoulder.y + rightShoulder.y) / 2;
          features.push(chest_x, chest_y);

          // Draw pose landmarks (optional, for debugging/visualization)
          const debugPoseLandmarks = poseLandmarks.map(lm => ({ ...lm, visibility: 1 }));
          drawConnectors(canvasCtx, debugPoseLandmarks, POSE_CONNECTIONS, { color: '#FFFF00', lineWidth: 2 }); // Yellow
          drawLandmarks(canvasCtx, [leftShoulder, rightShoulder], { color: '#00FFFF', lineWidth: 5 }); // Cyan for shoulders
      } else {
          features.push(0, 0); // Shoulders not detected or not visible enough
      }
  } else {
      features.push(0, 0); // No pose detected
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
      const response = await fetch('http://localhost:5000/predict', { // Ensure this URL matches your Flask server
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

  canvasCtx.restore(); // Restore the canvas context to its original (un-flipped) state

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}