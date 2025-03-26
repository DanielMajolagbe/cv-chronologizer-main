import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';

dotenv.config();

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
  'http://localhost:3002',
  'https://royacare-cv-builder.vercel.app',
  'https://cv-chronologizer.vercel.app'
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
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  useTempFiles: true,
  tempFileDir: '/tmp/'
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
    
    console.log(`Received CV for ${firstName} ${lastName}`);

    if (!firstName || !lastName) {
      console.error('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Sending email...');
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'CV Chronologizer <recruitment@royacare.co.uk>',
      to: 'recruitment@royacare.co.uk',
      subject: `New CV Submission - ${firstName} ${lastName}`,
      html: `
        <p>Please find attached the CV for ${firstName} ${lastName}.</p>
        <p>This CV was generated using the Royacare Agency CV Builder.</p>
      `,
      attachments: [
        {
          filename: `${firstName}_${lastName}_CV.docx`,
          content: cvFile.data,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
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