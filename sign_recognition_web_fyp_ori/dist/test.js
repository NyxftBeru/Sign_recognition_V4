"use strict";

var __assign = (this && this.__assign) || function (t) {
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops:[]};
    var f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op[1]); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : _.trys.pop().value, done: true };
    }
};
// dist/test.js
// 1. Core MediaPipe Tasks Vision imports
// This is the ONLY import needed from @mediapipe/tasks-vision.
// We are NOT importing DrawingUtils from here.
import { HandLandmarker, FilesetResolver, FaceLandmarker, PoseLandmarker, } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/vision_bundle.js";
// 2. Declare all DOM elements and state variables at the top-level
var demosSection = document.getElementById("demos");
var predictionResult = document.getElementById("predictionResult");
var video = document.getElementById("webcam");
var canvasElement = document.getElementById("output_canvas");
var canvasCtx = canvasElement === null || canvasElement === void 0 ? void 0 : canvasElement.getContext("2d");
var enableWebcamButton = null;
var handLandmarker = undefined;
var faceLandmarker = undefined;
var poseLandmarker = undefined;
var webcamRunning = false;
// CRITICAL: We declare these variables but do NOT initialize them with imports.
// We will access them from the global 'window' object dynamically.
var HAND_CONNECTIONS = [];
var POSE_CONNECTIONS = [];
var drawConnectors = undefined; // Will be window.drawConnectors
var drawLandmarks = undefined; // Will be window.drawLandmarks
// Function to ensure global constants and drawing utilities are loaded.
// This handles the asynchronous nature of script loading.
var ensureGlobalsAreLoaded = function () {
    if (window.HAND_CONNECTIONS && window.POSE_CONNECTIONS && window.drawConnectors && window.drawLandmarks) {
        HAND_CONNECTIONS = window.HAND_CONNECTIONS;
        POSE_CONNECTIONS = window.POSE_CONNECTIONS;
        drawConnectors = window.drawConnectors;
        drawLandmarks = window.drawLandmarks;
        return true;
    }
    return false;
};
// --- Model Loading ---
// This function initializes all MediaPipe models (Hand, Face, Pose Landmarkers).
var createDetectors = function () { return __awaiter(void 0, void 0, void 0, function () {
    var vision, handOptions, faceOptions, poseOptions;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, , 2, 3]);
                console.log("🚀 Creating detectors...");
                return [4 /*yield*/, FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm")];
            case 1:
                vision = _a.sent();
                handOptions = {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU"
                    },
                    numHands: 1,
                    runningMode: "VIDEO",
                };
                faceOptions = {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker_v2_with_blendshapes/float16/1/face_landmarker_v2_with_blendshapes.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    outputFaceBlendshapes: false,
                    outputFaceGeometries: false,
                };
                poseOptions = {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                };
                handLandmarker = new HandLandmarker(vision);
                faceLandmarker = new FaceLandmarker(vision);
                poseLandmarker = new PoseLandmarker(vision);
                Promise.all([
                    handLandmarker.load(),
                    faceLandmarker.load(),
                    poseLandmarker.load(),
                ]).then(function () {
                    console.log("✅ All detectors loaded.");
                    if (demosSection) {
                        demosSection.classList.remove("invisible");
                    }
                }).catch(function (error) {
                    console.error("❌ Error loading detectors:", error);
                    alert("Failed to load AI models. Please check console for details and ensure you have an active internet connection. If you are using a VPN, try disabling it. Some browsers/networks may block model downloads.");
                });
                return [3 /*break*/, 3];
            case 2:
                // Ensure the MediaPipe drawing utilities are available on the window object.
                // This is a common pattern when using script tags for MediaPipe's drawing_utils.
                if (!ensureGlobalsAreLoaded()) {
                    console.warn("MediaPipe drawing utilities not yet loaded. Retrying...");
                    // Potentially set a timeout to retry or inform the user.
                }
                return [7 /*endfinally*/];
            case 3: return [2 /*return*/];
        }
    });
}); };
createDetectors();
/********************************************************************
// Demo 1: Webcam Live Sign Language Detection
********************************************************************/
var hasGetUserMedia = function () {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};
// Enable the live webcam stream and start detection.
var enableCam = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var constraints;
    return __generator(this, function (_a) {
        if (!handLandmarker || !faceLandmarker || !poseLandmarker) {
            console.log("Wait! HandLandmarker not loaded yet.");
            return [2 /*return*/];
        }
        if (webcamRunning === true) {
            webcamRunning = false;
            if (enableWebcamButton) {
                enableWebcamButton.innerText = "ENABLE PREDICTIONS";
            }
        }
        else {
            webcamRunning = true;
            if (enableWebcamButton) {
                enableWebcamButton.innerText = "DISABLE PREDICTIONS";
            }
        }
        constraints = {
            video: true
        };
        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            if (video) {
                video.srcObject = stream;
                video.addEventListener("loadeddata", predictWebcam);
            }
        }).catch(function (error) {
            console.error("Error accessing webcam:", error);
            alert("Failed to access webcam. Please ensure you have a webcam connected and grant camera permissions.");
        });
        return [2 /*return*/];
    });
}); };
// Check if webcam access is supported.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    if (enableWebcamButton) {
        enableWebcamButton.addEventListener("click", enableCam);
    }
}
else {
    console.warn("getUserMedia() is not supported by your browser");
    if (enableWebcamButton) {
        enableWebcamButton.innerText = "getUserMedia() is not supported by your browser";
        enableWebcamButton.disabled = true;
    }
}
var lastVideoTime = -1;
var predictWebcam = function () { return __awaiter(void 0, void 0, void 0, function () {
    var handResult, faceResult, poseResult, features, hand, _i, _a, lm, box, face_x, face_y, lm, left_shoulder, right_shoulder, chest_x, chest_y, input_data, response, data, prediction, error_1, error_2;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!ensureGlobalsAreLoaded()) {
                    window.requestAnimationFrame(predictWebcam);
                    return [2 /*return*/];
                }
                if (!(video && canvasCtx && handLandmarker && faceLandmarker && poseLandmarker)) {
                    return [2 /*return*/];
                }
                // Now, ensure the drawing utilities are loaded BEFORE we proceed.
                if (lastVideoTime !== video.currentTime) {
                    lastVideoTime = video.currentTime;
                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, video.videoWidth, video.videoHeight);
                    canvasCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                    handResult = handLandmarker.detectForVideo(video, Date.now());
                    faceResult = faceLandmarker.detectForVideo(video, Date.now());
                    poseResult = poseLandmarker.detectForVideo(video, Date.now());
                }
                features = [];
                // Extract hand landmarks
                if (handResult.landmarks && handResult.landmarks.length > 0) {
                    hand = handResult.landmarks[0];
                    for (_i = 0, _a = hand; _i < _a.length; _i++) {
                        lm = _a[_i];
                        features.push(lm.x, lm.y);
                    }
                    if (canvasCtx && HAND_CONNECTIONS && drawConnectors && drawLandmarks) {
                        drawConnectors(canvasCtx, hand, HAND_CONNECTIONS, {
                            color: "#00FF00",
                            lineWidth: 2
                        });
                        drawLandmarks(canvasCtx, hand, {
                            color: "#FF0000",
                            lineWidth: 1
                        });
                    }
                }
                else {
                    features = []; // Clear features if no hand is detected
                    // Pad with zeros for hand landmarks (21 landmarks * 2 coords = 42 features)
                    for (var i = 0; i < 42; i++) {
                        features.push(0);
                    }
                }
                // Extract face center (e.g., nose)
                if ((_b = faceResult.detections) === null || _b === void 0 ? void 0 : _b.length) {
                    box = faceResult.detections[0].boundingBox;
                    face_x = box.originX + box.width / 2;
                    face_y = box.originY + box.height / 2;
                }
                else {
                    face_x = 0;
                    face_y = 0;
                }
                features.push(face_x, face_y);
                // Extract chest position (midpoint of left & right shoulders)
                if (poseResult.landmarks && poseResult.landmarks.length > 0) {
                    lm = poseResult.landmarks[0];
                    left_shoulder = lm[mp_pose.PoseLandmark.LEFT_SHOULDER];
                    right_shoulder = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER];
                    chest_x = (left_shoulder.x + right_shoulder.x) / 2;
                    chest_y = (left_shoulder.y + right_shoulder.y) / 2;
                }
                else {
                    chest_x = 0;
                    chest_y = 0;
                }
                features.push(chest_x, chest_y);
                if (features.length !== 46) {
                    console.warn("Feature array length mismatch: Expected 46, got ".concat(features.length, ". Padding/truncating."));
                    while (features.length < 46) {
                        features.push(0);
                    }
                    if (features.length > 46) {
                        features.splice(46);
                    }
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 10, 11, 12]);
                input_data = { features: features };
                return [4 /*yield*/, fetch('http://localhost:5000/predict', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(input_data)
                    })];
            case 2:
                response = _c.sent();
                if (!response.ok) return [3 /*break*/, 8];
                _c.label = 3;
            case 3:
                _c.trys.push([3, 6, , 7]);
                return [4 /*yield*/, response.json()];
            case 4:
                data = _c.sent();
                prediction = data.predicted_gloss;
                if (predictionResult) {
                    predictionResult.innerText = "Prediction: ".concat(prediction);
                }
                return [3 /*break*/, 7];
            case 5:
                error_1 = _c.sent();
                console.error('Error parsing JSON response:', error_1);
                if (predictionResult) {
                    predictionResult.innerText = 'Prediction: Error parsing server response.';
                }
                return [3 /*break*/, 7];
            case 6: return [7 /*endfinally*/];
            case 7: return [3 /*break*/, 9];
            case 8:
                console.error('Server error:', response.status, response.statusText);
                if (predictionResult) {
                    predictionResult.innerText = "Prediction: Server Error (".concat(response.status, ")");
                }
                _c.label = 9;
            case 9: return [3 /*break*/, 12];
            case 10:
                error_2 = _c.sent();
                console.error('Network error during prediction:', error_2);
                if (predictionResult) {
                    predictionResult.innerText = 'Prediction: Network Error (Is server running?)';
                }
                return [3 /*break*/, 12];
            case 11:
                canvasCtx.restore(); // Restore the canvas context to its original (un-flipped) state
                // Call this function again to keep predicting when the browser is ready.
                if (webcamRunning === true) {
                    window.requestAnimationFrame(predictWebcam);
                }
                return [7 /*endfinally*/];
            case 12: return [2 /*return*/];
        }
    });
}); };