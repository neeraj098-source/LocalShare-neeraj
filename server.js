const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const ip = require('ip');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

app.use(express.static('public'));

// 1. Uploads folder ensure karo (agar nahi hai to banao)
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Multer Storage Config (File kahan save hogi)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // Is folder me jayegi
    },
    filename: (req, file, cb) => {
        // File ka naam unique rakho taaki overwrite na ho
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 3. File Upload Route
app.post('/upload', upload.single('myFile'), (req, res) => {
    if (req.file) {
        // Sabko batao ki file aa gayi
        io.emit('file-shared', {
            filename: req.file.filename,
            originalname: req.file.originalname,
            fileType: req.file.mimetype
        });
        res.json({ success: true });
    } else {
        res.status(400).send('No file uploaded');
    }
});

// 4. Socket Connection (Chat wahi purana logic)
io.on('connection', (socket) => {
    socket.on('share-text', (data) => {
        socket.broadcast.emit('receive-text', data);
    });
});

// 5. Server Start & QR Code
const PORT = 3000;
const myIp = ip.address();
const url = `http://${myIp}:${PORT}`;

http.listen(PORT, () => {
    console.log(`Server running at: ${url}`);
    QRCode.toString(url, { type: 'terminal' }, (err, qr) => {
        if (!err) console.log(qr);
    });
});