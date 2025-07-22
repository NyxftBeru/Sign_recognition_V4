"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });

var tasks_vision_1 = require("@mediapipe/tasks-vision");
// @ts-ignore - Ignore if drawing_utils or hands typings are not found, common for direct npm imports
var drawing_utils_1 = require("@mediapipe/drawing_utils");
// @ts-ignore
var hands_1 = require("@mediapipe/hands");
// @ts-ignore
var pose_1 = require("@mediapipe/pose"); // Import POSE_CONNECTIONS for drawing
// IMPORTANT: Removed 'import './test.scss';' as we are now using plain CSS linked directly in HTML.
var demosSection = document.getElementById("demos");
var predictionResult = document.getElementById("predictionResult"); // Added for displaying prediction
var handLandmarker = undefined;
var faceLandmarker = undefined; // New: FaceLandmarker instance
var poseLandmarker = undefined; // New: PoseLandmarker instance
var runningMode = "IMAGE"; // Initial mode for image detection
var enableWebcamButton = null; // Can be null if element not found
var webcamRunning = false;
// --- Model Loading ---
// Before we can use MediaPipe classes, we must wait for them to finish
// loading.
var createDetectors = function () { return __awaiter(void 0, void 0, void 0, function () {
    var vision, handOptions, faceOptions, poseOptions, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, tasks_vision_1.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm")];
            case 1:
                vision = _a.sent();
                handOptions = {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO", // Always start in VIDEO mode for webcam to avoid mode switching issues
                    numHands: 1 // We need max 1 hand for your current model features
                };
                return [4 /*yield*/, tasks_vision_1.HandLandmarker.createFromOptions(vision, handOptions)];
            case 2:
                handLandmarker = _a.sent();
                console.log("HandLandmarker model loaded successfully!");
                faceOptions = {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", // Or `face_detector.task` if you only need detection
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    outputFaceBlendshapes: false, // Not needed for just position
                    numFaces: 1
                };
                return [4 /*yield*/, tasks_vision_1.FaceLandmarker.createFromOptions(vision, faceOptions)];
            case 3:
                faceLandmarker = _a.sent();
                console.log("FaceLandmarker model loaded successfully!");
                poseOptions = {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task", // Use lite version for speed
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numPoses: 1 // Assuming only one person in frame
                };
                return [4 /*yield*/, tasks_vision_1.PoseLandmarker.createFromOptions(vision, poseOptions)];
            case 4:
                poseLandmarker = _a.sent();
                console.log("PoseLandmarker model loaded successfully!");
                // Ensure demosSection exists before trying to access its classList
                if (demosSection) {
                    demosSection.classList.remove("invisible"); // Remove 'invisible' class when ready
                }
                return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                console.error("Failed to load MediaPipe models:", error_1);
                if (demosSection) {
                    demosSection.innerHTML = "Failed to load ML models. Please check console for details.";
                }
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
createDetectors(); // Call the function to create all detectors
// --- Demo 1: Image Detection ---
// (No changes to this section as it's separate from live prediction)
var imageContainers = document.getElementsByClassName("detectOnClick");
for (var i = 0; i < imageContainers.length; i++) {
    var container = imageContainers[i];
    var imgElement = container.querySelector('img');
    if (imgElement) {
        if (window.getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        imgElement.addEventListener("click", handleClick);
    }
    else {
        console.warn("Container ".concat(i, " with class 'detectOnClick' does not contain an <img> element."));
    }
}
function handleClick(event) {
    return __awaiter(this, void 0, void 0, function () {
        var target, parentContainer, existingCanvases, i, canvasToRemove, handLandmarkerResult, canvas, cxt, _i, _a, landmarks, debugLandmarks;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!handLandmarker) {
                        console.log("Wait for handLandmarker to load before clicking!");
                        return [2 /*return*/];
                    }
                    target = event.target;
                    if (!target || !(target instanceof HTMLImageElement)) {
                        console.error("Event target is not an image element.");
                        return [2 /*return*/];
                    }
                    if (!(runningMode === "VIDEO")) return [3 /*break*/, 6];
                    runningMode = "IMAGE";
                    return [4 /*yield*/, handLandmarker.setOptions({ runningMode: "IMAGE" })];
                case 1:
                    _c.sent();
                    if (!faceLandmarker) return [3 /*break*/, 3];
                    return [4 /*yield*/, faceLandmarker.setOptions({ runningMode: "IMAGE" })];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    if (!poseLandmarker) return [3 /*break*/, 5];
                    return [4 /*yield*/, poseLandmarker.setOptions({ runningMode: "IMAGE" })];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    console.log("Switched running mode to IMAGE.");
                    _c.label = 6;
                case 6:
                    parentContainer = target.parentNode;
                    existingCanvases = parentContainer === null || parentContainer === void 0 ? void 0 : parentContainer.getElementsByClassName("canvas");
                    if (existingCanvases) {
                        for (i = existingCanvases.length - 1; i >= 0; i--) {
                            canvasToRemove = existingCanvases[i];
                            (_b = canvasToRemove.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(canvasToRemove);
                        }
                    }
                    handLandmarkerResult = handLandmarker.detect(target);
                    // NOTE: For image prediction, you might also want to call faceLandmarker.detect(target) and poseLandmarker.detect(target)
                    // if your image analysis needs to show all landmarks. However, for live prediction we primarily focus on video.
                    console.log("Image detection results:", handLandmarkerResult);
                    canvas = document.createElement("canvas");
                    canvas.setAttribute("class", "canvas");
                    canvas.setAttribute("width", target.naturalWidth.toString());
                    canvas.setAttribute("height", target.naturalHeight.toString());
                    canvas.style.position = "absolute";
                    canvas.style.left = "0px";
                    canvas.style.top = "0px";
                    canvas.style.width = target.offsetWidth + "px";
                    canvas.style.height = target.offsetHeight + "px";
                    parentContainer === null || parentContainer === void 0 ? void 0 : parentContainer.appendChild(canvas);
                    cxt = canvas.getContext("2d");
                    if (!cxt) {
                        console.error("Could not get 2D context for canvas.");
                        return [2 /*return*/];
                    }
                    if (handLandmarkerResult && handLandmarkerResult.landmarks && handLandmarkerResult.landmarks.length > 0) {
                        console.log("Image: Drawing landmarks.");
                        for (_i = 0, _a = handLandmarkerResult.landmarks; _i < _a.length; _i++) {
                            landmarks = _a[_i];
                            console.log("First image landmark coordinates (normalized):", landmarks[0]);
                            console.log("Image Canvas width (drawing surface):", cxt.canvas.width);
                            console.log("Image Canvas height (drawing surface):", cxt.canvas.height);
                            debugLandmarks = landmarks.map(function (lm) { return (__assign(__assign({}, lm), { visibility: 1 })); });
                            (0, drawing_utils_1.drawConnectors)(cxt, debugLandmarks, hands_1.HAND_CONNECTIONS, {
                                color: "#00FF00",
                                lineWidth: 60
                            });
                            (0, drawing_utils_1.drawLandmarks)(cxt, debugLandmarks, {
                                color: "#FF0000",
                                lineWidth: 20
                            });
                        }
                    }
                    else {
                        console.log("Image: No landmarks detected for this image.");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// --- Demo 2: Webcam Continuous Detection ---
var video = document.getElementById("webcam");
var canvasElement = document.getElementById("output_canvas");
var canvasCtx = canvasElement === null || canvasElement === void 0 ? void 0 : canvasElement.getContext("2d");
// Check if webcam access is supported.
var hasGetUserMedia = function () { var _a; return !!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia); };
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    if (enableWebcamButton) {
        enableWebcamButton.addEventListener("click", enableCam);
    }
    else {
        console.warn("Webcam enable button not found.");
    }
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
function enableCam(event) {
    if (!handLandmarker || !faceLandmarker || !poseLandmarker) { // Ensure all are loaded
        console.log("Wait! MediaPipe detectors not loaded yet.");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        if (enableWebcamButton)
            enableWebcamButton.innerText = "ENABLE PREDICTIONS";
        // Stop the video stream when disabling webcam
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(function (track) { return track.stop(); });
            video.srcObject = null;
        }
        // Clear canvas and prediction result
        if (canvasCtx && canvasElement) {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
        if (predictionResult) {
            predictionResult.innerText = "Prediction: Disabled";
        }
    }
    else {
        webcamRunning = true;
        if (enableWebcamButton)
            enableWebcamButton.innerText = "DISABLE PREDICTIONS";
        // getUsermedia parameters.
        var constraints = {
            video: true
        };
        // Activate the webcam stream.
        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
        }).catch(function (err) {
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
var lastVideoTime = -1;
var handResults = undefined;
var faceResults = undefined; // MediaPipe FaceLandmarker result type
var poseResults = undefined;
function predictWebcam() {
    return __awaiter(this, void 0, void 0, function () {
        var startTimeMs, features, landmarks, _i, landmarks_1, landmark, debugHandLandmarks, i, faceLandmarks, sumX, sumY, _a, faceLandmarks_1, landmark, face_x, face_y, poseLandmarks, LEFT_SHOULDER_IDX, RIGHT_SHOULDER_IDX, leftShoulder, rightShoulder, chest_x, chest_y, debugPoseLandmarks, response, data, prediction, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!video || !canvasElement || !canvasCtx || !handLandmarker || !faceLandmarker || !poseLandmarker) {
                        console.warn("Required elements or MediaPipe detectors not ready for webcam prediction.");
                        if (webcamRunning) {
                            window.requestAnimationFrame(predictWebcam);
                        }
                        return [2 /*return*/];
                    }
                    // Adjust canvas dimensions to match video feed
                    canvasElement.style.width = video.offsetWidth + "px";
                    canvasElement.style.height = video.offsetHeight + "px";
                    canvasElement.width = video.videoWidth;
                    canvasElement.height = video.videoHeight;
                    if (!(runningMode === "IMAGE")) return [3 /*break*/, 4];
                    runningMode = "VIDEO";
                    return [4 /*yield*/, handLandmarker.setOptions({ runningMode: "VIDEO" })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, faceLandmarker.setOptions({ runningMode: "VIDEO" })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, poseLandmarker.setOptions({ runningMode: "VIDEO" })];
                case 3:
                    _b.sent();
                    console.log("Switched running mode to VIDEO.");
                    _b.label = 4;
                case 4:
                    startTimeMs = performance.now();
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
                    }
                    else {
                        console.log("Video frame not changed, skipping detection for this frame.");
                    }
                    canvasCtx.save(); // Save the current state of the canvas context
                    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    // Apply a horizontal flip transformation to the canvas context for non-mirrored webcam display
                    canvasCtx.scale(-1, 1);
                    canvasCtx.translate(-canvasElement.width, 0);
                    canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                    features = [];
                    // 1. Extract Hand Landmarks (21 landmarks * 2 coordinates = 42 features)
                    if (handResults && handResults.landmarks && handResults.landmarks.length > 0) {
                        landmarks = handResults.landmarks[0];
                        for (_i = 0, landmarks_1 = landmarks; _i < landmarks_1.length; _i++) {
                            landmark = landmarks_1[_i];
                            features.push(landmark.x, landmark.y);
                        }
                        debugHandLandmarks = landmarks.map(function (lm) { return (__assign(__assign({}, lm), { visibility: 1 })); });
                        (0, drawing_utils_1.drawConnectors)(canvasCtx, debugHandLandmarks, hands_1.HAND_CONNECTIONS, {
                            color: "#00FF00",
                            lineWidth: 5
                        });
                        (0, drawing_utils_1.drawLandmarks)(canvasCtx, debugHandLandmarks, {
                            color: "#FF0000",
                            lineWidth: 2
                        });
                    }
                    else {
                        // If no hand detected, pad with zeros for hand features (21 * 2 = 42 zeros)
                        for (i = 0; i < 42; i++) {
                            features.push(0);
                        }
                    }
                    // 2. Extract Face Center (avg of relative keypoints from first detection) (2 features)
                    if (faceResults && faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
                        faceLandmarks = faceResults.faceLandmarks[0];
                        sumX = 0;
                        sumY = 0;
                        for (_a = 0, faceLandmarks_1 = faceLandmarks; _a < faceLandmarks_1.length; _a++) {
                            landmark = faceLandmarks_1[_a];
                            sumX += landmark.x;
                            sumY += landmark.y;
                        }
                        face_x = sumX / faceLandmarks.length;
                        face_y = sumY / faceLandmarks.length;
                        features.push(face_x, face_y);
                        // Optionally, draw face landmarks (too many might be slow)
                        // const debugFaceLandmarks = faceLandmarks.map(lm => ({ ...lm, visibility: 1 }));
                        // drawConnectors(canvasCtx, debugFaceLandmarks, FACE_MESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
                        // drawLandmarks(canvasCtx, debugFaceLandmarks, { color: '#FF00FF', lineWidth: 1 });
                    }
                    else {
                        features.push(0, 0); // No face detected
                    }
                    // 3. Extract Chest Position (average of shoulder landmarks) (2 features)
                    if (poseResults && poseResults.landmarks && poseResults.landmarks.length > 0) {
                        poseLandmarks = poseResults.landmarks[0];
                        LEFT_SHOULDER_IDX = 11;
                        RIGHT_SHOULDER_IDX = 12;
                        leftShoulder = poseLandmarks[LEFT_SHOULDER_IDX];
                        rightShoulder = poseLandmarks[RIGHT_SHOULDER_IDX];
                        if (leftShoulder && rightShoulder && leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
                            chest_x = (leftShoulder.x + rightShoulder.x) / 2;
                            chest_y = (leftShoulder.y + rightShoulder.y) / 2;
                            features.push(chest_x, chest_y);
                            debugPoseLandmarks = poseLandmarks.map(function (lm) { return (__assign(__assign({}, lm), { visibility: 1 })); });
                            (0, drawing_utils_1.drawConnectors)(canvasCtx, debugPoseLandmarks, pose_1.POSE_CONNECTIONS, { color: '#FFFF00', lineWidth: 2 }); // Yellow
                            (0, drawing_utils_1.drawLandmarks)(canvasCtx, [leftShoulder, rightShoulder], { color: '#00FFFF', lineWidth: 5 }); // Cyan for shoulders
                        }
                        else {
                            features.push(0, 0); // Shoulders not detected or not visible enough
                        }
                    }
                    else {
                        features.push(0, 0); // No pose detected
                    }
                    // Ensure features array has exactly 46 elements
                    if (features.length !== 46) {
                        console.warn("Feature array length mismatch: Expected 46, got ".concat(features.length, ". Padding/truncating."));
                        while (features.length < 46) {
                            features.push(0);
                        }
                        if (features.length > 46) {
                            features.splice(46);
                        }
                    }
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 10, , 11]);
                    return [4 /*yield*/, fetch('http://localhost:5000/predict', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ features: features })
                        })];
                case 6:
                    response = _b.sent();
                    if (!response.ok) return [3 /*break*/, 8];
                    return [4 /*yield*/, response.json()];
                case 7:
                    data = _b.sent();
                    prediction = data.prediction;
                    if (predictionResult) {
                        predictionResult.innerText = "Prediction: ".concat(prediction);
                    }
                    return [3 /*break*/, 9];
                case 8:
                    console.error('Server error:', response.status, response.statusText);
                    if (predictionResult) {
                        predictionResult.innerText = "Prediction: Server Error (".concat(response.status, ")");
                    }
                    _b.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    error_2 = _b.sent();
                    console.error('Network error during prediction:', error_2);
                    if (predictionResult) {
                        predictionResult.innerText = 'Prediction: Network Error (Is server running?)';
                    }
                    return [3 /*break*/, 11];
                case 11:
                    canvasCtx.restore(); // Restore the canvas context to its original (un-flipped) state
                    // Call this function again to keep predicting when the browser is ready.
                    if (webcamRunning === true) {
                        window.requestAnimationFrame(predictWebcam);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
