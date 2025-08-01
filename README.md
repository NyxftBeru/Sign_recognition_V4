SignEase: Interactive Sign Language Learning Platform

🌟 Introduction

SignEase is a web application designed to help beginners learn and practice sign language in a fun and interactive way. Our platform leverages real-time machine learning to recognize hand gestures via a webcam, providing instant feedback and creating an engaging learning experience. The project is a final year project developed to make sign language accessible to a wider audience.

✨ Features

Real-time Sign Recognition: Use your webcam to practice sign language gestures. Our application processes video frames in the browser and sends landmark data to a backend model for a real-time prediction.

Interactive Quiz: Test your knowledge with a multi-choice quiz featuring various signs.

Conversational Chatbot: Get quick answers to your questions about sign language or the application from our integrated chatbot.

User Authentication: A secure login and registration system allows users to track their progress and access personalized features.

Video Uploads: Upload a video to have the application analyze the signs within it.


🚀 Technical Stack

Our project is built with a decoupled, two-service architecture for improved scalability and maintainability.

Frontend
HTML5, CSS3, JavaScript: The core building blocks of the user interface.

MediaPipe: A powerful machine learning framework for landmark and gesture recognition, running directly in the browser to ensure low-latency performance.

Node.js / Express: Serves all the static frontend files and manages user sessions and authentication.

EJS: Used for server-side rendering of HTML templates.

Backend (ML API)
Python / Flask: A lightweight web server that acts as a dedicated API for machine learning inference.

Scikit-learn: Used to run predictions on our pre-trained sign language classification model.

joblib: A library for efficiently loading our pre-trained machine learning model (model.pkl).

Database
MySQL: A relational database for storing and managing user data, including login credentials and profile information.


📁 Project Architecture

The application is structured into two main services:

Frontend Service (Node.js/Express): This service is responsible for serving all the HTML, CSS, and client-side JavaScript files to the user's browser. It also handles all user-related functionality like login, registration, and profile management.

ML API Service (Python/Flask): This is a separate, dedicated service that only handles machine learning predictions. The frontend sends extracted landmark data to this service via fetch API calls, and the Flask app returns a prediction result.

This separation allows for independent scaling and development of the web interface and the machine learning model.

🛠️ Getting Started
Prerequisites
Git

Node.js & npm

Python 3.8+ & pip

XAMPP

Local Setup
Clone the repository:

Bash

git clone https://github.com/NyxftBeru/Sign_recognition_V4.git
cd Sign_recognition_V4
Set up the Frontend Service:

Navigate to the frontend directory: cd frontend

Install Node.js dependencies: npm install

Start the frontend server: node server.js

This service will typically run on http://localhost:3000.

Set up the Backend Service:

Navigate to the backend directory: cd ../backend

Install Python dependencies: pip install -r requirements.txt

Ensure your model.pkl and feature_names.pkl files are in this directory.

Start the Flask backend server: python server.py

This service will run on http://localhost:5000.

Database Setup:

Set up your MySQL database and configure the connection details in your frontend server.js file.

Access the Application:

Open your web browser and navigate to http://localhost:3000 to start using SignEase.

👥 Team Members

Peggy Woo

Kerene Er

Khoo Jun Xuan

Sancho Miguel

🙏 Acknowledgements

We extend our sincere gratitude to all who supported and guided us throughout the development of the SignEase project.

Our deepest appreciation goes to our dedicated supervisor, Mr. Peter Kenny, for his invaluable guidance, constructive feedback, and unwavering support. His expertise was instrumental in navigating the complexities of this project.

We are also profoundly grateful to our evaluators, Mr. Frankie Cha and Mr. Florian Muljono, for their insightful critiques and helpful suggestions, which significantly contributed to the refinement and improvement of our application.

Finally, we wish to express our heartfelt thanks to our friends and family for their continuous encouragement, understanding, and patience.

📝 License

This project is licensed under the MIT License.
