// frontend/server.js

const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- IMPORTANT: MySQL Connection for Render ---
// These credentials MUST be set as environment variables on your Render frontend service.
// e.g., DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        // In a production environment, you might want to gracefully handle this,
        // e.g., by preventing the server from starting if the DB connection fails.
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
    secret: process.env.SESSION_SECRET || 'aVeryLongAndRandomSecretKeyForSessions', // Use environment variable for secret
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
}));
app.use(flash());

// --- NEW: Configuration Endpoint for Client-Side JS ---
// This endpoint provides environment variables to your client-side code.
app.get('/config.js', (req, res) => {
    res.type('application/javascript');
    // PYTHON_API_URL and CHATBOT_API_URL should be set as environment variables in Render
    res.send(`
        window.ENV_CONFIG = {
            PYTHON_API_URL: "${process.env.PYTHON_API_URL || 'http://localhost:5000'}",
            CHATBOT_API_URL: "${process.env.CHATBOT_API_URL || 'http://localhost:8080'}" // Example for a separate chatbot API
        };
    `);
});

// Middleware to check if user is logged in
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'You are not logged in. Please login.');
        res.redirect('/login');
    }
};

// Redirect all unauthenticated requests to /login except for /login, /register, and /signup routes
app.use((req, res, next) => {
    // Allow static files (html, css, js, images) without authentication
    const staticFilePattern = /\.(html|css|js|png|jpg|jpeg|gif|ico)$/i;

    // Allow unauthenticated access to specific public routes and assets
    if (!req.session.user &&
        req.path !== '/login' &&
        req.path !== '/register' &&
        req.path !== '/signup' &&
        req.path !== '/predict_live.html' &&
        req.path !== '/video_detection.html' &&
        req.path !== '/chatbot.html' &&
        req.path !== '/config.js' && // Allow access to config.js
        !staticFilePattern.test(req.path) && // Allow general static files
        !req.path.startsWith('/public/') // If you have a 'public' sub-folder
    ) {
        return res.redirect('/login');
    }
    next();
});

// Password length check middleware (used in registration)
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
        req.flash('error', 'All fields are required.');
        req.flash('formData', req.body); // Keep form data in flash for repopulation
        return res.redirect('/register');
    }
    if (password.length < 6) { // This check should ideally be done client-side first
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next();
};

// Default route - redirects to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Login page route
app.get('/login', (req, res) => {
    res.render('login', { error: req.flash('error'), success: req.flash('success') });
});

// Handle login form submission
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM user WHERE email = ? AND password = SHA1(?)'; // Using SHA1 as per your existing code
    connection.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('Login SQL error:', err);
            req.flash('error', 'Database error.');
            return res.redirect('/login');
        }
        if (results.length > 0) {
            req.session.user = results[0]; // Store user data in session
            return res.redirect('/index.html');
        }
        req.flash('error', 'Invalid email or password.');
        res.redirect('/login');
    });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Signup page route
app.get('/signup', (req, res) => {
    res.render('register', { error: req.flash('error'), formData: req.flash('formData')[0] || {} }); // Pass flash messages and old form data
});

// Handle registration form submission
app.post('/register', validateRegistration, (req, res) => {
    const { username, email, password, contact } = req.body;
    connection.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Email check SQL error:', err);
            req.flash('error', 'Database error.');
            req.flash('formData', req.body);
            return res.redirect('/register');
        }
        if (results.length > 0) {
            req.flash('error', 'Email already registered.');
            req.flash('formData', req.body);
            return res.redirect('/register');
        }
        const sql = 'INSERT INTO user (username, email, password, contact) VALUES (?, ?, SHA1(?), ?)';
        connection.query(sql, [username, email, password, contact], (err, result) => {
            if (err) {
                console.error('Registration SQL error:', err);
                req.flash('error', 'Registration failed.');
                req.flash('formData', req.body);
                return res.redirect('/register');
            }
            req.flash('success', 'Registration successful! Please log in.');
            res.redirect('/login');
        });
    });
});

// Authenticated route to serve index.html
app.get('/index.html', checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Authenticated route to serve profile.html
app.get('/profile', checkAuthenticated, (req, res) => {
    res.render('profile', { user: req.session.user });
});

// Authenticated route to delete profile (GET)
app.get('/delete-profile', checkAuthenticated, (req, res) => {
    res.render('delete-profile');
});

// Authenticated route to handle profile deletion (POST)
app.post('/delete-profile', checkAuthenticated, (req, res) => {
    const userId = req.session.user.id; // Use the user's ID for deletion
    connection.query('DELETE FROM user WHERE id = ?', [userId], (err, result) => {
        if (err) {
            console.error('Delete profile SQL error:', err);
            return res.send('Error deleting profile.'); // Or render an error page
        }
        req.session.destroy(() => {
            res.redirect('/login');
        });
    });
});

// Authenticated route to edit profile (GET)
app.get('/edit-profile', checkAuthenticated, (req, res) => {
    res.render('edit-profile', { user: req.session.user, error: req.flash('error'), success: req.flash('success') });
});

// Authenticated route to handle profile update (POST)
app.post('/edit-profile', checkAuthenticated, (req, res) => {
    const { username, email, contact } = req.body;
    if (!username || !email || !contact) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/edit-profile');
    }
    const userId = req.session.user.id;
    const sql = 'UPDATE user SET username = ?, email = ?, contact = ? WHERE id = ?';
    connection.query(sql, [username, email, contact, userId], (err, result) => {
        if (err) {
            console.error('Edit profile SQL error:', err);
            req.flash('error', 'Database error.');
            return res.redirect('/edit-profile');
        }
        // Update session user data after successful update
        req.session.user.username = username;
        req.session.user.email = email;
        req.session.user.contact = contact;
        req.flash('success', 'Profile updated successfully!');
        res.redirect('/edit-profile');
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`SignEase server running on http://localhost:${PORT}`);
});