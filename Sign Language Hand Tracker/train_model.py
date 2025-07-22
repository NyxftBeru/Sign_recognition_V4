import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import classification_report
import joblib

# Create column names (same as predict_live.py)
feature_names = [f"{axis}{i}" for i in range(21) for axis in "xy"] + ["face_x", "face_y", "chest_x", "chest_y"]

# Load data with no header and assign column names
df = pd.read_csv("hand_data.csv", header=None)
df.columns = ["label"] + feature_names  # first column is label

X = df[feature_names]
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = KNeighborsClassifier(n_neighbors=3)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# Save the model and feature names
joblib.dump(model, "model.pkl")
joblib.dump(feature_names, "feature_names.pkl")
