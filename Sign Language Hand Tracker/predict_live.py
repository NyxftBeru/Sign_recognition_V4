import cv2
import mediapipe as mp
import joblib
import numpy as np
import pandas as pd
import math

# Load trained model and feature names
model = joblib.load("model.pkl")
feature_names = [f"{axis}{i}" for i in range(21) for axis in "xy"] + ["face_x", "face_y", "chest_x", "chest_y"]

# Initialize MediaPipe
mp_hands = mp.solutions.hands
mp_pose = mp.solutions.pose
mp_face = mp.solutions.face_detection

hands = mp_hands.Hands(max_num_hands=1)
pose = mp_pose.Pose()
face = mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5)

# Start webcam
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    hand_result = hands.process(rgb)
    face_result = face.process(rgb)
    pose_result = pose.process(rgb)

    features = []

    if hand_result.multi_hand_landmarks:
        hand = hand_result.multi_hand_landmarks[0]
        for lm in hand.landmark:
            features.extend([lm.x, lm.y])
        mp.solutions.drawing_utils.draw_landmarks(frame, hand, mp_hands.HAND_CONNECTIONS)
    else:
        features = None
        cv2.imshow("Prediction", frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break
        continue

    # Face center
    if face_result.detections:
        box = face_result.detections[0].location_data.relative_bounding_box
        face_x = box.xmin + box.width / 2
        face_y = box.ymin + box.height / 2
    else:
        face_x, face_y = 0, 0
    features.extend([face_x, face_y])

    # Chest position (avg. shoulders)
    if pose_result.pose_landmarks:
        lm = pose_result.pose_landmarks.landmark
        left_shoulder = lm[mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        chest_x = (left_shoulder.x + right_shoulder.x) / 2
        chest_y = (left_shoulder.y + right_shoulder.y) / 2
    else:
        chest_x, chest_y = 0, 0
    features.extend([chest_x, chest_y])

    # Predict and display
    if features and len(features) == 46:
        input_df = pd.DataFrame([features], columns=feature_names)
        prediction = model.predict(input_df)[0]
        cv2.putText(frame, f"Prediction: {prediction}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("Prediction", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
