const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const multer  = require('multer');
const User    = require('../models/User.model');
const { generateTokens, authenticate } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary is OPTIONAL.
// If CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET are set → use Cloudinary.
// If not → fall back to memory storage so registration works without Cloudinary.
// ─────────────────────────────────────────────────────────────────────────────
const CLOUDINARY_OK = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let uploadResume;

if (CLOUDINARY_OK) {
  try {
    const cloudinary            = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const resumeStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder:          'pragati/resumes',
        resource_type:   'raw',
        allowed_formats: ['pdf', 'docx'],
      },
    });

    uploadResume = multer({
      storage: resumeStorage,
      limits:  { fileSize: 5 * 1024 * 1024 },
    });

    console.log('✅ Cloudinary storage enabled for resume uploads');
  } catch (e) {
    console.error('⚠️  Cloudinary init failed, falling back to memory:', e.message);
    uploadResume = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
  }
} else {
  console.log('⚠️  Cloudinary not configured — resume upload disabled, using memory fallback');
  uploadResume = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', uploadResume.single('resume'), async (req, res) => {
  try {
    console.log('REGISTER BODY:', req.body);
    console.log('REGISTER FILE:', req.file ? req.file.originalname : 'none');

    const {
      name, email, password, role,
      department, year, rollNumber, prn, division,
      linkedinUrl, githubUrl, portfolioUrl,
    } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Please sign in instead.' });
    }

    const userData = {
      name:       name.trim(),
      email:      email.toLowerCase().trim(),
      password,
      role:       role || 'student',
      department,
    };

    if (year)         userData.year         = Number(year);
    if (rollNumber)   userData.rollNumber   = rollNumber.trim();
    if (prn)          userData.prn          = prn.trim();
    if (division)     userData.division     = division;
    if (linkedinUrl)  userData.linkedinUrl  = linkedinUrl;
    if (githubUrl)    userData.githubUrl    = githubUrl;
    if (portfolioUrl) userData.portfolioUrl = portfolioUrl;

    if (CLOUDINARY_OK && req.file && req.file.path) {
      userData.resumeUrl = req.file.path;
    }

    const user   = await User.create(userData);
    const tokens = generateTokens(user._id, user.role);

    return res.status(201).json({ message: 'Registered successfully', user, ...tokens });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered. Please sign in instead.' });
    }
    return res.status(500).json({ error: 'Registration failed. Please try again.', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isActive) return res.status(403).json({ error: 'Account deactivated. Contact administrator.' });

    const tokens = generateTokens(user._id, user.role);
    return res.json({ message: 'Login successful', user, ...tokens });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });
    if (!process.env.JWT_REFRESH_SECRET) return res.status(500).json({ error: 'JWT_REFRESH_SECRET missing' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    return res.json(generateTokens(user._id, user.role));
  } catch (err) {
    console.error('REFRESH ERROR:', err.message);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

module.exports = router;