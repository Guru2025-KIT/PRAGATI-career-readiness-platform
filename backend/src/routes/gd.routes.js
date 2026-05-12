/**
 * GD Routes — REST API for Group Discussion rooms
 * WebSocket logic is in server.js (io namespace /gd)
 */
const router  = require('express').Router();
const GDRoom  = require('../models/GDRoom.model');
const User    = require('../models/User.model');
const { authenticate } = require('../middleware/auth.middleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── Topic categories per company ──────────────────────────────────────────────
const COMPANY_TOPICS = {
  TCS:        ['Technology & Automation','Digital India','Cloud Computing','Cybersecurity','IT Ethics'],
  Infosys:    ['AI in Finance','Digital Transformation','Blockchain','Sustainability in IT'],
  Wipro:      ['Climate Tech','EdTech Revolution','5G Impact','Healthcare AI'],
  Cognizant:  ['Remote Work Culture','Diversity in Tech','Open Source','DevSecOps'],
  Capgemini:  ['Smart Cities','EV Revolution','Data Privacy','Metaverse'],
  Accenture:  ['ESG & Business','Future of Work','Digital Health','Inclusive Growth'],
  default:    ['AI & Society','Startup Culture','India@2047','Mental Health Awareness','Education Reform'],
};

// ── Generate AI topic ─────────────────────────────────────────────────────────
async function generateTopic(company, difficulty, category) {
  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const cats   = COMPANY_TOPICS[company] || COMPANY_TOPICS.default;
    const cat    = category || cats[Math.floor(Math.random() * cats.length)];
    const prompt = `Generate ONE thought-provoking Group Discussion topic for a ${company || 'top IT'} company placement round.
Category: ${cat}
Difficulty: ${difficulty}
Requirements:
- Must be debatable with multiple valid perspectives
- Relevant to ${difficulty === 'Hard' ? 'global policy and economics' : 'technology and society'}
- 10-15 words maximum
- No question marks (state as a proposition)
Return ONLY the topic text, nothing else.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim().replace(/['"]/g, '');
  } catch {
    const fallback = ['AI will eliminate more jobs than it creates','India needs Universal Basic Income now','Social media regulation harms free speech','Work from home reduces overall productivity'];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
}

// ── Generate AI evaluation ────────────────────────────────────────────────────
async function evaluateParticipant(participant, topic, allTranscripts) {
  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const speech = participant.transcript?.map(t => t.text).join(' ') || '';
    const prompt = `You are an expert corporate HR evaluator assessing a Group Discussion participant.

GD Topic: "${topic}"
Participant Name: ${participant.name}
Total Speaking Time: ${participant.speakingTime} seconds
Word Count: ${participant.wordCount}
Interruptions Made: ${participant.interruptions}
Filler Words Used: ${participant.fillerWords}
Speech Transcript: "${speech.slice(0, 800)}"

Evaluate on a scale of 0-100 for:
1. communication (clarity, vocabulary, fluency)
2. confidence (assertiveness, hesitation, pace)
3. leadership (initiative, guiding discussion, summarizing)
4. participation (relevance, unique points, engagement)

Also provide:
- 2-3 key strengths (short phrases)
- 2-3 areas to improve (short phrases)
- 2-sentence AI behavioral summary

Respond ONLY in this JSON format:
{
  "communication": 75,
  "confidence": 68,
  "leadership": 55,
  "participation": 72,
  "strengths": ["Clear articulation", "Good examples"],
  "improvements": ["Avoid filler words", "Speak more assertively"],
  "summary": "Demonstrated good communication skills with clear examples. Should focus on taking more initiative in guiding the discussion."
}`;
    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim().replace(/```json|```/g, '');
    const scores = JSON.parse(text);
    scores.overall = Math.round((scores.communication + scores.confidence + scores.leadership + scores.participation) / 4);
    return scores;
  } catch {
    const base = 50 + Math.floor(Math.random() * 30);
    return {
      communication: base, confidence: base - 5, leadership: base - 10, participation: base + 5,
      overall: base, strengths: ['Active participant', 'Relevant points'],
      improvements: ['Reduce hesitation', 'Speak with more confidence'],
      summary: 'Showed decent participation. With more practice, can become a strong GD performer.',
    };
  }
}

// ── POST /api/gd/rooms — create room ─────────────────────────────────────────
router.post('/rooms', authenticate, async (req, res) => {
  try {
    const { company, difficulty, minParticipants, maxParticipants, durationSeconds, language, isPrivate } = req.body;
    const roomCode = uuidv4().slice(0, 8).toUpperCase();
    const room = await GDRoom.create({
      roomCode,
      companyContext:  company || '',
      difficulty:      difficulty || 'Medium',
      language:        language || 'English',
      minParticipants: Math.max(2, Math.min(8, minParticipants || 3)),
      maxParticipants: Math.max(2, Math.min(8, maxParticipants || 5)),
      durationSeconds: durationSeconds || 600,
      isPrivate:       isPrivate || false,
      createdBy:       req.user._id,
    });
    res.status(201).json({ room });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── GET /api/gd/rooms — list open rooms ──────────────────────────────────────
router.get('/rooms', authenticate, async (req, res) => {
  try {
    const rooms = await GDRoom.find({
      state:     { $in: ['waiting'] },
      isPrivate: false,
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // last 2h
    })
      .select('roomCode companyContext difficulty language minParticipants maxParticipants participants state createdAt')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ rooms });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/gd/rooms/:code — get room details ───────────────────────────────
router.get('/rooms/:code', authenticate, async (req, res) => {
  try {
    const room = await GDRoom.findOne({ roomCode: req.params.code });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    // Only reveal topic if room is locked or completed
    const safeRoom = room.toObject();
    if (!['locked','prep','active','completed'].includes(safeRoom.state)) {
      delete safeRoom.topic;
    }
    res.json({ room: safeRoom });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/gd/rooms/:code/evaluate — AI evaluate after session ─────────────
router.post('/rooms/:code/evaluate', authenticate, async (req, res) => {
  try {
    const room = await GDRoom.findOne({ roomCode: req.params.code });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.state !== 'completed') return res.status(400).json({ error: 'Room not yet completed' });

    // Evaluate each human participant
    const allTranscripts = room.participants.map(p => ({
      name: p.name, transcript: p.transcript
    }));

    for (let i = 0; i < room.participants.length; i++) {
      if (!room.participants[i].isAI) {
        const scores = await evaluateParticipant(room.participants[i], room.topic, allTranscripts);
        room.participants[i].aiScore = scores;
      }
    }
    await room.save();
    res.json({ room });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/gd/rooms/:code/report/:userId — get individual report ─────────────
router.get('/rooms/:code/report/:userId', authenticate, async (req, res) => {
  try {
    const room = await GDRoom.findOne({ roomCode: req.params.code });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const participant = room.participants.find(p => p.userId?.toString() === req.params.userId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    res.json({ participant, topic: room.topic, roomCode: room.roomCode, duration: room.durationSeconds });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
module.exports.generateTopic  = generateTopic;
module.exports.evaluateParticipant = evaluateParticipant;
