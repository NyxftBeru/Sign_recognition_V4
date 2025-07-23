import cv2
import mediapipe as mp
import os
import csv
import math

mp_hands = mp.solutions.hands
mp_pose = mp.solutions.pose
mp_face = mp.solutions.face_detection

hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1)
pose = mp_pose.Pose(static_image_mode=True)
face = mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5)

def extract_features(image_path):
    image = cv2.imread(image_path)
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    h, w, _ = image.shape

    # Process all detectors
    hand_result = hands.process(rgb)
    pose_result = pose.process(rgb)
    face_result = face.process(rgb)

    features = []

    # Extract hand landmarks
    if hand_result.multi_hand_landmarks:
        hand = hand_result.multi_hand_landmarks[0]
        for lm in hand.landmark:
            features.extend([lm.x, lm.y])
    else:
        return None  # skip if no hand

    # Extract face center (e.g., nose)
    if face_result.detections:
        box = face_result.detections[0].location_data.relative_bounding_box
        face_x = box.xmin + box.width / 2
        face_y = box.ymin + box.height / 2
    else:
        face_x, face_y = 0, 0
    features.extend([face_x, face_y])

    # Extract chest position (midpoint of left & right shoulders)
    if pose_result.pose_landmarks:
        lm = pose_result.pose_landmarks.landmark
        left_shoulder = lm[mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        chest_x = (left_shoulder.x + right_shoulder.x) / 2
        chest_y = (left_shoulder.y + right_shoulder.y) / 2
    else:
        chest_x, chest_y = 0, 0
    features.extend([chest_x, chest_y])

    return features

# Process all frames and write to CSV
with open("hand_data.csv", "w", newline="") as f:
    writer = csv.writer(f)
    for label in os.listdir("frames"):
        folder = os.path.join("frames", label)
        for img in os.listdir(folder):
            img_path = os.path.join(folder, img)
            features = extract_features(img_path)
            if features:
                writer.writerow([label] + features)
