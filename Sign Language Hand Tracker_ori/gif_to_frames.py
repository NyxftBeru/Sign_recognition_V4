import cv2
import os
import re

def extract_frames(video_path, label):
    output_base = "frames"
    os.makedirs(output_base, exist_ok=True)

    # Create output folder for the label
    output_folder = os.path.join(output_base, label)
    os.makedirs(output_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ Error opening video file: {video_path}")
        return

    existing_frames = len(os.listdir(output_folder))
    frame_idx = existing_frames

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_path = os.path.join(output_folder, f"frame_{frame_idx:04d}.jpg")
        cv2.imwrite(frame_path, frame)
        frame_idx += 1

    cap.release()
    print(f"✅ Extracted {frame_idx - existing_frames} frames from '{os.path.basename(video_path)}' into '{output_folder}'.")

def extract_all_videos(input_folder="asl_vid"):
    supported_exts = (".mp4", ".mov", ".avi", ".gif")  # Add or remove extensions as needed
    for filename in os.listdir(input_folder):
        if filename.lower().endswith(supported_exts):
            label = filename.split("_")[0].lower()  # e.g., "all_1.mp4" → "all"
            video_path = os.path.join(input_folder, filename)
            extract_frames(video_path, label)

if __name__ == "__main__":
    extract_all_videos()
