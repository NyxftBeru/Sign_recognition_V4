from flask import Flask, request, jsonify
import numpy as np
import joblib
import os
from flask_cors import CORS

# Removed cv2, mediapipe, scipy.spatial.distance imports
# As they are NOT needed if features are sent from frontend.

app = Flask(__name__)
CORS(app) # Enable CORS for all origins (for development)

# --- GLOBAL MODEL LOADING ---
model = None
feature_names = []
# Updated to 46 features as per current requirements
EXPECTED_FEATURE_COUNT = 46

try:
    model = joblib.load('model.pkl') # Load your model.pkl
    feature_names = joblib.load('feature_names.pkl')

    if len(feature_names) != EXPECTED_FEATURE_COUNT:
        raise ValueError(f"Expected {EXPECTED_FEATURE_COUNT} feature names, but got {len(feature_names)}. Please check feature_names.pkl.")
    print(f"✅ Model (model.pkl) and feature names loaded successfully. Expected {EXPECTED_FEATURE_COUNT} features.", flush=True)

except FileNotFoundError as e:
    print(f"❌ Error: Model files not found. Ensure 'model.pkl' and 'feature_names.pkl' are in the same directory as server.py. Error: {e}", flush=True)
    # In a production app, you might want to exit or return an error page.
except Exception as e:
    print(f"❌ An unexpected error occurred during model loading: {e}", flush=True)

# --- REMOVED /predict_video ENDPOINT ENTIRELY ---
# This part is removed because it's problematic for Render deployment.
# All video processing and feature extraction should happen on the client-side (frontend).

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({'error': 'Prediction model not loaded on server'}), 500

        data = request.get_json()
        if not data or 'features' not in data:
            return jsonify({'error': 'No features provided in request body'}), 400
        
        features = data['features']
        
        # Ensure the feature list matches the expected count (46)
        if len(features) != EXPECTED_FEATURE_COUNT:
            print(f"⚠️ Received {len(features)} features, expected {EXPECTED_FEATURE_COUNT}. Adjusting...", flush=True)
            if len(features) < EXPECTED_FEATURE_COUNT:
                features.extend([0.0] * (EXPECTED_FEATURE_COUNT - len(features)))
            else:
                features = features[:EXPECTED_FEATURE_COUNT]
        
        input_data = np.array([features])

        predicted_gloss = model.predict(input_data)[0]
        
        confidence = None
        if hasattr(model, 'predict_proba'):
            confidence_scores = model.predict_proba(input_data)[0]
            confidence = np.max(confidence_scores)

        print(f"Prediction received: '{predicted_gloss}', Confidence: {confidence:.2f if confidence is not None else 'N/A'}", flush=True)

        return jsonify({
            'predicted_gloss': str(predicted_gloss),
            'confidence': float(confidence) if confidence is not None else None
        })

    except Exception as e:
        print(f'❌ Error in /predict endpoint: {str(e)}', flush=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

# --- Production Deployment using Gunicorn ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Running Flask app locally on http://0.0.0.0:{port} (Development Server)", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)