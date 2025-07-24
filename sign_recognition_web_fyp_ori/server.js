const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL connection configuration
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sign_language'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
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
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(flash());

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
    // Allow unauthenticated access to predict_live.html
    if (!req.session.user &&
        req.path !== '/login' &&
        req.path !== '/register' &&
        req.path !== '/signup' &&
        req.path !== '/predict_live.html' &&
        !staticFilePattern.test(req.path)) {
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
    res.render('login', { error: null });
});

// Update login POST to redirect to /index.html after successful login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    // Find user by email and password in MySQL
    const sql = 'SELECT * FROM user WHERE email = ? AND password = SHA1(?)';
    connection.query(sql, [email, password], (err, results) => {
        if (err) {
            return res.render('login', { error: 'Database error.' });
        }
        if (results.length > 0) {
            req.session.user = results[0];
            return res.redirect('/index.html');
        }
        res.render('login', { error: 'Invalid email or password.' });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Signup page route (adjusted to render register.ejs)
app.get('/signup', (req, res) => {
    res.render('register', { error: null });
});

// Registration route
app.post('/register', validateRegistration, (req, res) => {
    const { username, email, password, contact } = req.body;
    // Check if email already exists
    connection.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Email check SQL error:', err); // Log error
            return res.render('register', { error: 'Database error.' });
        }
        if (results.length > 0) {
            return res.render('register', { error: 'Email already registered.' });
        }
        // Insert new user with SHA1 password hashing
        const sql = 'INSERT INTO user (username, email, password, contact) VALUES (?, ?, SHA1(?), ?)';
        connection.query(sql, [username, email, password, contact], (err, result) => {
            if (err) {
                console.error('Registration SQL error:', err); // Log error
                return res.render('register', { error: 'Registration failed.' });
            }
            req.flash('success', 'Registration successful! Please log in.');
            res.redirect('/login');
        });
    });
});

// Authenticated route to serve index.html
app.get('/index.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Authenticated route to serve profile.html
app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('profile', { user: req.session.user });
});

// Authenticated route to edit profile (GET)
// Authenticated route to delete profile (GET)
app.get('/delete-profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('delete-profile');
});

// Authenticated route to handle profile deletion (POST)
app.post('/delete-profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const username = req.session.user.username;
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
app.get('/edit-profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('edit-profile', { user: req.session.user, error: null, success: null });
});

// Authenticated route to handle profile update (POST)
app.post('/edit-profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const { username, email, contact } = req.body;
    // Validate input
    if (!username || !email || !contact) {
        return res.render('edit-profile', { user: req.session.user, error: 'All fields are required.', success: null });
    }
    // Update user in database
    const sql = 'UPDATE user SET username = ?, email = ?, contact = ?';
    // Use id from session user
    const userId = req.session.user.id;
    connection.query(sql, [username, email, contact], (err, result) => {
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
