from flask import Flask, request, jsonify
import numpy as np
import joblib # Correctly imports joblib
import os
from flask_cors import CORS

# IMPORTANT: Remove MediaPipe and OpenCV imports if you are sending FEATURES from frontend.
# The server should primarily receive extracted features.
# import cv2
# import mediapipe as mp
# from scipy.spatial import distance as dist

app = Flask(__name__)
CORS(app) # Enable CORS for all origins (for development)

# --- GLOBAL MODEL LOADING ---
model = None
feature_names = []
# Updated to 50 features as per latest requirements (hand, nose, shoulder midpoint, etc.)
EXPECTED_FEATURE_COUNT = 50

try:
    # --- IMPORTANT: Loading your model.pkl ---
    model = joblib.load('model.pkl') # Changed from 'knn_model.pkl' to 'model.pkl'
    feature_names = joblib.load('feature_names.pkl')

    if len(feature_names) != EXPECTED_FEATURE_COUNT:
        raise ValueError(f"Expected {EXPECTED_FEATURE_COUNT} feature names, but got {len(feature_names)}. Please check feature_names.pkl.")
    print(f"✅ Model (model.pkl) and feature names loaded successfully. Expected {EXPECTED_FEATURE_COUNT} features.", flush=True)

except FileNotFoundError as e:
    print(f"❌ Error: Model files not found. Ensure 'model.pkl' and 'feature_names.pkl' are in the same directory as server.py. Error: {e}", flush=True)
    # In a production app, you might want to exit or return an error page.
    # For now, we'll let the app run but predictions will fail.
except Exception as e:
    print(f"❌ An unexpected error occurred during model loading: {e}", flush=True)

# --- REMOVED /predict_video ENDPOINT ---
# This endpoint is highly problematic for a production Flask server due to:
# 1. High CPU/memory usage for video processing.
# 2. Blocking nature (cannot handle other requests while processing video).
# 3. Reliability issues with cv2.VideoCapture in server environments.
# 4. MediaPipe API differences between Python and browser.
# Recommendation: Perform video processing and feature extraction on the client (browser/Node.js)
# and send the extracted features to the /predict endpoint.
# If you absolutely need server-side video processing, it requires a dedicated background worker
# setup (e.g., Celery, RQ) and not direct Flask routes.

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({'error': 'Prediction model not loaded on server'}), 500

        data = request.get_json()
        if not data or 'features' not in data:
            return jsonify({'error': 'No features provided in request body'}), 400
        
        features = data['features']
        
        # Ensure the feature list matches the expected count (50)
        if len(features) != EXPECTED_FEATURE_COUNT:
            print(f"⚠️ Received {len(features)} features, expected {EXPECTED_FEATURE_COUNT}. Adjusting...", flush=True)
            if len(features) < EXPECTED_FEATURE_COUNT:
                features.extend([0.0] * (EXPECTED_FEATURE_COUNT - len(features)))
            else:
                features = features[:EXPECTED_FEATURE_COUNT]
        
        # Convert to numpy array for prediction
        input_data = np.array([features])

        # Perform prediction (assuming your model is compatible with scikit-learn's predict/predict_proba)
        predicted_gloss = model.predict(input_data)[0]
        
        # Get confidence scores if your model supports predict_proba (e.g., K-Neighbors, Logistic Regression)
        confidence = None
        if hasattr(model, 'predict_proba'):
            confidence_scores = model.predict_proba(input_data)[0]
            confidence = np.max(confidence_scores)

        print(f"Prediction received: '{predicted_gloss}', Confidence: {confidence:.2f if confidence is not None else 'N/A'}", flush=True)

        return jsonify({
            'predicted_gloss': str(predicted_gloss), # Ensure it's a string
            'confidence': float(confidence) if confidence is not None else None # Ensure it's a float
        })

    except Exception as e:
        print(f'❌ Error in /predict endpoint: {str(e)}', flush=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

# --- Production Deployment using Gunicorn ---
# This block is ONLY for local development.
# Render will use the 'Start Command' you configure in its dashboard (e.g., gunicorn).
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000)) # Get port from environment variable, default to 5000 for local dev
    print(f"Running Flask app locally on http://0.0.0.0:{port} (Development Server)", flush=True)
    # IMPORTANT: Do NOT use debug=True in production.
    app.run(host='0.0.0.0', port=port, debug=False) # Changed debug to False