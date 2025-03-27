import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Configure CORS to allow requests from both development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'https://royacare-cv-builder.vercel.app',
  'https://cv-chronologizer.vercel.app',
  'https://naomicare-cv-builder.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  useTempFiles: false, // Don't use temp files to avoid potential issues
  debug: true, // Enable debug for troubleshooting
  preserveExtension: true // Keep file extensions
}));

// Endpoint to send CV via email
app.post('/api/send-cv', async (req, res) => {
  try {
    console.log('Received CV upload request');
    
    if (!req.files || !req.files.cv) {
      console.error('No CV file uploaded');
      return res.status(400).json({ error: 'No CV file uploaded' });
    }

    const cvFile = req.files.cv;
    const { firstName, lastName } = req.body;
    
    console.log(`Received CV for ${firstName} ${lastName} (${cvFile.size} bytes, type: ${cvFile.mimetype})`);

    if (!firstName || !lastName) {
      console.error('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (cvFile.size === 0) {
      console.error('CV file is empty');
      return res.status(400).json({ error: 'CV file is empty' });
    }

    // Create a temporary file to ensure proper handling
    const tempFilePath = path.join(__dirname, `${firstName}_${lastName}_CV.docx`);
    await cvFile.mv(tempFilePath);
    
    console.log(`Saved temporary file to ${tempFilePath}`);

    console.log('Sending email with attachment...');
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'CV Chronologizer <recruitment@royacare.co.uk>',
      to: process.env.EMAIL_TO || 'recruitment@royacare.co.uk',
      subject: `New CV Submission - ${firstName} ${lastName}`,
      html: `
        <p style="font-family: Arial, sans-serif; font-size: 14px;">Please find attached the CV for <strong>${firstName} ${lastName}</strong>.</p>
        <p style="font-family: Arial, sans-serif; font-size: 14px;">This CV was generated using the Royacare Agency CV Builder.</p>
      `,
      attachments: [
        {
          filename: `${firstName}_${lastName}_CV.docx`,
          path: tempFilePath,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    console.log(`Temporary file ${tempFilePath} removed`);
    
    if (!info || !info.messageId) {
      throw new Error('Failed to send email');
    }

    res.json({ success: true, data: info });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 