const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Save with question ID if provided
        const questionId = req.body.questionId || 'unknown';
        cb(null, `response-q${questionId}-${Date.now()}.webm`);
    }
});

const upload = multer({ storage: storage });

// Serve static files from project root
app.use(express.static(__dirname));

// Serve uploaded files
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
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to list recordings' });
        }
        
        const recordings = files
            .filter(file => file.endsWith('.webm'))
            .map(file => ({
                filename: file,
                path: `/uploads/${file}`,
                url: `http://localhost:3000/uploads/${file}`,
                timestamp: fs.statSync(path.join(uploadsDir, file)).mtime
            }));

        res.json(recordings);
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Uploads directory: ${uploadsDir}`);
});