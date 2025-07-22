const express = require('express');
const mysql = require('mysql2'); // Keep for now, but read notes below
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- IMPORTANT: MySQL Connection for Render ---
// On Render, 'localhost' won't work for your MySQL database unless it's a separate Render service.
// You'll need to use environment variables for your database credentials.
// For now, I'm modifying it to use environment variables.
const connection = mysql.createConnection({
    host: process.env.DB_HOST, // e.g., 'your-mysql-service-url.render.com'
    user: process.env.DB_USER, // e.g., 'root' or 'your_db_user'
    password: process.env.DB_PASSWORD, // e.g., 'your_db_password'
    database: process.env.DB_NAME // e.g., 'sign_language'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        // In production, you might want to stop the server or have a more graceful error page.
        // For now, we'll log and continue, but database operations will fail.
        return;
    }
    console.log('Connected to MySQL database');
});

// Serve static files from the current directory
// Serve static files from the current directory, but exclude index.html
app.use(express.static(__dirname, {
    index: false
}));
app.set('view engine', 'ejs');
app.set('views', __dirname);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'aVerySecretKey', // Use environment variable for secret
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(flash());

// --- NEW: Configuration Endpoint for Client-Side JS ---
// This endpoint will provide environment variables to your client-side code
app.get('/config.js', (req, res) => {
    res.type('application/javascript');
    // PYTHON_API_URL should be set as an environment variable in Render for this frontend service
    res.send(`
        window.ENV_CONFIG = {
            PYTHON_API_URL: "${process.env.PYTHON_API_URL || 'http://localhost:5000'}"
        };
    `);
});

// Middleware to check if user is logged in
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'You are not log in. Please login');
        res.redirect('/login');
    }
};

// Redirect all unauthenticated requests to /login except for /login, /register, and /signup routes
app.use((req, res, next) => {
    // Allow static files (html, css, js, images) without authentication
    const staticFilePattern = /\.(html|css|js|png|jpg|jpeg|gif|ico)$/i;
    // Allow unauthenticated access to predict_live.html, config.js, and other public assets
    if (!req.session.user &&
        req.path !== '/login' &&
        req.path !== '/register' &&
        req.path !== '/signup' &&
        req.path !== '/predict_live.html' &&
        req.path !== '/video_detection.html' && // Added video_detection.html
        req.path !== '/config.js' && // Allow access to config.js
        !staticFilePattern.test(req.path) &&
        !req.path.startsWith('/public/') // Assuming your static assets are in a 'public' folder inside 'frontend'
    ) {
        // If not authenticated and not an allowed path, redirect to login
        return res.redirect('/login');
    }
    next();
});

// Password length check middleware
const checkPwd = (req, res, next) => {
    const { password } = req.body;
    if (password && password.length < 10) {
        req.flash('error', 'Password must be at least 10 characters long');
        return res.redirect('back');
    }
    next();
};

// Registration validation middleware
const validateRegistration = (req, res, next) => {
    const { username, email, password, contact } = req.body;
    if (!username || !email || !password || !contact ){
        return res.status(400).send('All fields are required.');
    }
    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next();
};

// Example route using authentication
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Login route
app.get('/login', (req, res) => {
    res.render('login', { error: req.flash('error'), success: req.flash('success') }); // Pass flash messages
});

// Update login POST to redirect to /index.html after successful login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    // Find user by email and password in MySQL
    const sql = 'SELECT * FROM user WHERE email = ? AND password = SHA1(?)';
    connection.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('Login SQL error:', err);
            return res.render('login', { error: 'Database error.' });
        }
        if (results.length > 0) {
            req.session.user = results[0];
            return res.redirect('/index.html');
        }
        req.flash('error', 'Invalid email or password.'); // Use flash for invalid credentials
        res.redirect('/login');
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Signup page route (adjusted to render register.ejs)
app.get('/signup', (req, res) => {
    res.render('register', { error: req.flash('error'), formData: req.flash('formData') }); // Pass flash messages
});

// Registration route
app.post('/register', validateRegistration, (req, res) => {
    const { username, email, password, contact } = req.body;
    // Check if email already exists
    connection.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Email check SQL error:', err);
            return res.render('register', { error: 'Database error.' });
        }
        if (results.length > 0) {
            req.flash('error', 'Email already registered.');
            req.flash('formData', req.body);
            return res.redirect('/register');
        }
        // Insert new user with SHA1 password hashing
        const sql = 'INSERT INTO user (username, email, password, contact) VALUES (?, ?, SHA1(?), ?)';
        connection.query(sql, [username, email, password, contact], (err, result) => {
            if (err) {
                console.error('Registration SQL error:', err);
                return res.render('register', { error: 'Registration failed.' });
            }
            req.flash('success', 'Registration successful! Please log in.');
            res.redirect('/login');
        });
    });
});

// Authenticated route to serve index.html
app.get('/index.html', checkAuthenticated, (req, res) => { // Use checkAuthenticated middleware
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Authenticated route to serve profile.html
app.get('/profile', checkAuthenticated, (req, res) => { // Use checkAuthenticated middleware
    res.render('profile', { user: req.session.user });
});

// Authenticated route to delete profile (GET)
app.get('/delete-profile', checkAuthenticated, (req, res) => { // Use checkAuthenticated middleware
    res.render('delete-profile');
});

// Authenticated route to handle profile deletion (POST)
app.post('/delete-profile', checkAuthenticated, (req, res) => { // Use checkAuthenticated middleware
    const username = req.session.user.username; // Use existing session user
    connection.query('DELETE FROM user WHERE username = ?', [username], (err, result) => {
        if (err) {
            console.error('Delete profile SQL error:', err);
            return res.send('Error deleting profile.');
        }
        req.session.destroy(() => {
            res.redirect('/login');
        });
    });
});

app.get('/edit-profile', checkAuthenticated, (req, res) => { // Use checkAuthenticated middleware
    res.render('edit-profile', { user: req.session.user, error: null, success: null });
});

// Authenticated route to handle profile update (POST)
app.post('/edit-profile', checkAuthenticated, (req, res) => { // Use checkAuthenticated middleware
    const { username, email, contact } = req.body;
    // Validate input
    if (!username || !email || !contact) {
        return res.render('edit-profile', { user: req.session.user, error: 'All fields are required.', success: null });
    }
    // Update user in database
    const sql = 'UPDATE user SET username = ?, email = ?, contact = ? WHERE id = ?'; // Added WHERE clause
    const userId = req.session.user.id; // Correctly get id from session
    connection.query(sql, [username, email, contact, userId], (err, result) => { // Pass userId to query
        if (err) {
            console.error('Edit profile SQL error:', err);
            return res.render('edit-profile', { user: req.session.user, error: 'Database error.', success: null });
        }
        // Update session user
        req.session.user.username = username;
        req.session.user.email = email;
        req.session.user.contact = contact;
        res.render('edit-profile', { user: req.session.user, error: null, success: 'Profile updated successfully!' });
    });
});

app.listen(PORT, () => {
    console.log(`SignEase server running on http://localhost:${PORT}`);
});