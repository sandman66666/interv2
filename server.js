const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Custom middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Questions endpoints
app.post('/save-questions', (req, res) => {
    try {
        const { questions } = req.body;
        if (!questions) {
            return res.status(400).json({ error: 'No questions data provided' });
        }

        const filePath = path.join(__dirname, 'src', 'questions.json');
        const jsonContent = JSON.stringify({ questions }, null, 2);
        
        fs.writeFileSync(filePath, jsonContent);
        console.log('Questions saved successfully to:', filePath);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving questions:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/load-questions', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'src', 'questions.json');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Questions file not found' });
        }

        const jsonContent = fs.readFileSync(filePath, 'utf8');
        res.json(JSON.parse(jsonContent));
    } catch (error) {
        console.error('Error loading questions:', error);
        res.status(500).json({ error: error.message });
    }
});

// File write handler
app.post('/fs/write', (req, res) => {
    try {
        const { path: filePath, content } = req.body;
        if (!filePath || !content) {
            return res.status(400).json({ error: 'Missing path or content' });
        }

        // Ensure the path is within the project directory
        const fullPath = path.join(__dirname, filePath);
        
        // Log the write operation
        console.log('Writing to file:', fullPath);
        console.log('Content length:', content.length);

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('File written successfully');
        
        // Verify the file was written
        const exists = fs.existsSync(fullPath);
        console.log('File exists after write:', exists);

        res.json({ success: true });
    } catch (error) {
        console.error('Error writing file:', error);
        res.status(500).json({ error: error.message });
    }
});

// File read handler
app.get('/fs/read', (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ error: 'Missing path' });
        }

        // Ensure the path is within the project directory
        const fullPath = path.join(__dirname, filePath);
        console.log('Reading file:', fullPath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        res.json({ content });
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const questionId = req.body.questionId || 'unknown';
        cb(null, `response-q${questionId}-${Date.now()}.webm`);
    }
});

const upload = multer({ storage: storage });

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// Handle video upload
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
        success: true,
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        questionId: req.body.questionId
    });
});

// List all recordings
app.get('/recordings', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir);
        const recordings = files
            .filter(file => file.endsWith('.webm'))
            .map(file => ({
                filename: file,
                path: `/uploads/${file}`,
                url: `http://localhost:3000/uploads/${file}`,
                timestamp: fs.statSync(path.join(uploadsDir, file)).mtime
            }));

        res.json(recordings);
    } catch (error) {
        console.error('Error listing recordings:', error);
        res.status(500).json({ error: 'Failed to list recordings' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message || 'An unexpected error occurred' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Uploads directory: ${uploadsDir}`);
});