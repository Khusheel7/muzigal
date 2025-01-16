const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// SQLite connection
const db = new sqlite3.Database('attendancePortal.db', (err) => {
    if (err) {
        console.error('Error connecting to SQLite:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

// Create tables if they don't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS persons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            type TEXT NOT NULL,
            enrollmentDate TEXT,
            expiryDate TEXT,
            course TEXT,
            department TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT NOT NULL
        )
    `);
});
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Set up multer storage configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Create multer instance for handling file uploads
const upload = multer({ storage });

// Route for handling file upload
app.post('/upload', upload.single('file'), (req, res) => {
    console.log('File uploaded:', req.file);  // File info
    console.log('Form data:', req.body);  // Other form fields
    res.send('File uploaded successfully!');
});

// Route to handle registration form submission
app.post('/register', (req, res) => {
    const { name, phone, email, type, enrollmentDate, expiryDate, course, department } = req.body;

    const sql = `
        INSERT INTO persons (name, phone, email, type, enrollmentDate, expiryDate, course, department)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name, phone, email, type, enrollmentDate, expiryDate, course, department],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'Person added successfully!', id: this.lastID });
        }
    );
});

// Route to get all persons
app.get('/persons', (req, res) => {
    db.all('SELECT * FROM persons', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

// Route to delete a person by ID
app.delete('/persons/:id', (req, res) => {
    console.log('Received delete request for person with ID:', req.params.id);
    const { id } = req.params;
    const sql = `DELETE FROM persons WHERE id = ?`;

    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Error deleting person: ' + err.message });
        }

        // Check if a row was affected
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Person not found' });
        }

        // Send a success message on successful deletion
        res.status(200).json({ message: 'Person deleted successfully!' });
    });
});

// Route to handle attendance form submission
app.post('/attendance', (req, res) => {
    const { date, type, name, status } = req.body;

    // Validate the fields
    if (!date || !type || !name || !status) {
        return res.status(400).json({ error: 'All fields (date, type, name, status) are required!' });
    }

    const sql = `
        INSERT INTO attendance (date, type, name, status)
        VALUES (?, ?, ?, ?)
    `;
    db.run(sql, [date, type, name, status], function (err) {
        if (err) {
            console.error('Error saving attendance:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Attendance recorded successfully!', id: this.lastID });
    });
});

// Route to get all attendance records
app.get('/attendance', (req, res) => {
    db.all('SELECT * FROM attendance', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});
app.get('/attendance/persons/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Fetching person with ID: ${id}`);
  // You can fetch data from your SQLite database here or just send a mock response:
  res.json({ id, name: 'John Doe', status: 'present' }); 
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
