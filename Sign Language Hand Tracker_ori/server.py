from flask import Flask, request, jsonify
import cv2
import numpy as np
import joblib # <--- Change import from 'pickle' to 'joblib'
import mediapipe as mp
import os
from scipy.spatial import distance as dist
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load model and feature names using joblib
# Change these lines to use joblib.load()
model = joblib.load('model.pkl')
feature_names = joblib.load('feature_names.pkl')

if len(feature_names) != 46:
    raise ValueError(f"Expected 46 feature names, got {len(feature_names)}. Check feature_names.pkl.")

# MediaPipe setup (rest of your MediaPipe setup is fine)
mp_hands = mp.solutions.hands.Hands(max_num_hands=1)
mp_pose = mp.solutions.pose.Pose()
mp_face_detection = mp.solutions.face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)

@app.route('/predict_video', methods=['POST'])
def predict_video():
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        video_file = request.files['video']
        temp_path = os.path.join(os.environ.get('TEMP', '/tmp'), f'tmp{os.urandom(8).hex()}.webm')
        video_file.save(temp_path)
        print(f'Received video: {video_file.filename}, saved to: {temp_path}')

        cap = cv2.VideoCapture(temp_path)
        prev_positions = []
        min_movement_frame = None
        min_movement = float('inf')

        # The MediaPipe initializations here are redundant as they are already global,
        # but the logic for processing frames within the loop is correct.
        # Consider removing the 'with mp_hands.Hands ... as face_detection' context managers here
        # and just using the globally defined mp_hands, mp_pose, mp_face_detection objects.
        # This part of the code is also using outdated MediaPipe API. It is recommended to use
        # MediaPipe Tasks API for consistency with the frontend.
        with mp.solutions.hands.Hands(max_num_hands=1) as hands, \
             mp.solutions.pose.Pose() as pose, \
             mp.solutions.face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_detection:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                hands_results = hands.process(frame_rgb)
                hand_landmarks = hands_results.multi_hand_landmarks[0].landmark if hands_results.multi_hand_landmarks else None
                
                pose_results = pose.process(frame_rgb)
                pose_landmarks = pose_results.pose_landmarks.landmark if pose_results.pose_landmarks else None
                
                face_results = face_detection.process(frame_rgb)
                face_landmarks = face_results.detections[0].location_data.relative_keypoints if face_results.detections else None
                
                if hand_landmarks:
                    current_positions = [lm.x for lm in hand_landmarks] + [lm.y for lm in hand_landmarks]
                    if prev_positions:
                        movement = sum(dist.euclidean(prev_positions[i:i+2], current_positions[i:i+2]) for i in range(0, len(current_positions), 2)) / (len(current_positions) // 2)
                        if movement < min_movement:
                            min_movement = movement
                            min_movement_frame = frame.copy()
                    prev_positions = current_positions
                
            cap.release()
            print(f'Frame with minimum movement: {len(prev_positions)//2} landmarks (Movement: {min_movement})')

            if min_movement_frame is not None:
                features = []
                frame_rgb = cv2.cvtColor(min_movement_frame, cv2.COLOR_BGR2RGB)
                hands_results = hands.process(frame_rgb) # Re-process with stable frame
                if hands_results.multi_hand_landmarks:
                    landmarks = hands_results.multi_hand_landmarks[0].landmark
                    features.extend([lm.x for lm in landmarks] + [lm.y for lm in landmarks])
                else:
                    features.extend([0.0] * 42)

                face_results = face_detection.process(frame_rgb) # Re-process with stable frame
                if face_results.detections:
                    face = face_results.detections[0].location_data.relative_keypoints
                    avg_x = sum(lm.x for lm in face) / len(face)
                    avg_y = sum(lm.y for lm in face) / len(face)
                    features.extend([avg_x, avg_y])
                else:
                    features.extend([0.0, 0.0])

                pose_results = pose.process(frame_rgb) # Re-process with stable frame
                if pose_results.pose_landmarks:
                    left_shoulder = pose_results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
                    right_shoulder = pose_results.pose_landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
                    chest_x = (left_shoulder.x + right_shoulder.x) / 2
                    chest_y = (left_shoulder.y + right_shoulder.y) / 2
                    features.extend([chest_x, chest_y])
                else:
                    features.extend([0.0, 0.0])

                if len(features) != 46:
                    features = features[:46] + [0.0] * (46 - len(features))
                print(f"Extracted features: {len(features)} - {features}")

                input_df = np.array([features])
                prediction = model.predict(input_df)[0]
                return jsonify({'prediction': str(prediction)})
            else:
                return jsonify({'error': 'No stable frame detected'}), 400

    except Exception as e:
        print(f'Error processing video: {str(e)}', flush=True)
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'features' not in data:
            return jsonify({'error': 'No features provided'}), 400
        
        features = data['features']
        if len(features) != 46:
            features = features[:46] + [0.0] * (46 - len(features))
        print(f"Received features: {len(features)} - {features}")

        input_df = np.array([features])
        prediction = model.predict(input_df)[0]
        return jsonify({'prediction': str(prediction)})
    except Exception as e:
        print(f'Error processing prediction: {str(e)}', flush=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)