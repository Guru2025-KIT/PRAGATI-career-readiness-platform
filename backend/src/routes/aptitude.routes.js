const router = require('express').Router();
const { AptitudeQuestion, AptitudeAttempt, AptitudeBookmark } = require('../models/index');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const LEVEL_MAP = { Beginner:'Easy', Intermediate:'Medium', Expert:'Hard' };

// GET /api/aptitude/topics — with subtopic map
router.get('/topics', authenticate, async (req, res) => {
  try {
    const topics = await AptitudeQuestion.distinct('topic');
    const diff = LEVEL_MAP[req.user?.skillLevel] || 'Easy';
    const counts = {};
    const subtopicMap = {};
    for (const t of topics) {
      counts[t] = await AptitudeQuestion.countDocuments({ topic: t });
      subtopicMap[t] = (await AptitudeQuestion.distinct('subtopic', { topic: t })).filter(Boolean);
    }
    res.json({ topics, questionCounts: counts, subtopicMap, userLevel: diff });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aptitude/companies — all distinct company tags
router.get('/companies', authenticate, async (req, res) => {
  try {
    const companies = await AptitudeQuestion.distinct('companies');
    res.json({ companies: companies.filter(Boolean).sort() });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aptitude?topic=&subtopic=&company=&difficulty=&search=&page=&limit=
router.get('/', authenticate, async (req, res) => {
  try {
    const { topic, subtopic, company, difficulty, search, page = 1, limit = 15 } = req.query;
    const filter = {};
    if (topic && topic !== 'All')      filter.topic = topic;
    if (subtopic && subtopic !== 'All') filter.subtopic = subtopic;
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
    if (company && company !== 'All')  filter.companies = { $in: [company] };
    if (search) filter.question = { $regex: search, $options: 'i' };
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await AptitudeQuestion.countDocuments(filter);
    const questions = await AptitudeQuestion.find(filter)
      .sort({ topic: 1, difficulty: 1 }).skip(skip).limit(Number(limit));
    res.json({ questions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aptitude/set — random quiz set
router.get('/set', authenticate, async (req, res) => {
  try {
    const { topic, subtopic, difficulty } = req.query;
    const diff = difficulty || LEVEL_MAP[req.user?.skillLevel] || 'Easy';
    const filter = { difficulty: diff };
    if (topic)    filter.topic = topic;
    if (subtopic) filter.subtopic = subtopic;
    const questions = await AptitudeQuestion.aggregate([{ $match: filter }, { $sample: { size: 10 } }]);
    res.json({ questions, difficulty: diff, topic: topic || 'All' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aptitude/submit
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers) || !answers.length) return res.status(400).json({ error: 'answers required' });
    await AptitudeAttempt.insertMany(
      answers.map(a => ({
        userId: req.user._id, questionId: a.questionId, topic: a.topic,
        subtopic: a.subtopic, selectedAnswer: a.selectedAnswer,
        correct: a.correct, timeSpent: a.timeSpent || 0
      }))
    );
    const correct = answers.filter(a => a.correct).length;
    res.json({ score: Math.round((correct / answers.length) * 100), correct, total: answers.length });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aptitude/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { topic } = req.query;
    const filter = { userId: req.user._id };
    if (topic) filter.topic = topic;
    const history = await AptitudeAttempt.find(filter)
      .populate('questionId', 'question options answer explanation topic subtopic difficulty companies')
      .sort({ attemptedAt: -1 }).limit(100);
    res.json({ history });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aptitude/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await AptitudeAttempt.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$topic', total: { $sum: 1 }, correct: { $sum: { $cond: ['$correct', 1, 0] } } } },
      { $project: { topic: '$_id', total: 1, correct: 1,
          accuracy: { $divide: ['$correct', { $cond: [{ $eq: ['$total', 0] }, 1, '$total'] }] } } },
      { $sort: { accuracy: 1 } }
    ]);
    const totalAttempted = await AptitudeAttempt.countDocuments({ userId: req.user._id });
    const totalCorrect   = await AptitudeAttempt.countDocuments({ userId: req.user._id, correct: true });
    res.json({ stats, totalAttempted, totalCorrect,
      accuracy: totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : 0 });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aptitude/bookmark/:id — toggle bookmark
router.post('/bookmark/:id', authenticate, async (req, res) => {
  try {
    const existing = await AptitudeBookmark.findOne({ userId: req.user._id, questionId: req.params.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ bookmarked: false });
    }
    await AptitudeBookmark.create({ userId: req.user._id, questionId: req.params.id });
    res.json({ bookmarked: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aptitude/bookmarks
router.get('/bookmarks', authenticate, async (req, res) => {
  try {
    const bookmarks = await AptitudeBookmark.find({ userId: req.user._id })
      .populate('questionId').sort({ createdAt: -1 });
    const ids = bookmarks.map(b => b.questionId?._id?.toString()).filter(Boolean);
    res.json({ bookmarks, ids });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aptitude — admin adds question
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const q = await AptitudeQuestion.create(req.body);
    res.status(201).json({ question: q });
  } catch(err) { res.status(400).json({ error: err.message }); }
});

// POST /api/aptitude/bulk — admin bulk upload
router.post('/bulk', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || !questions.length) return res.status(400).json({ error: 'questions array required' });
    const result = await AptitudeQuestion.insertMany(questions, { ordered: false });
    res.status(201).json({ message: `${result.length} questions added`, inserted: result.length });
  } catch(err) { res.status(400).json({ error: err.message }); }
});

// POST /api/aptitude/seed — admin: seed all curated questions (idempotent)
router.post('/seed', authenticate, authorize('admin'), async (req, res) => {
  try {
    const QUESTIONS = require('../utils/aptitude-seed-full');
    await AptitudeQuestion.deleteMany({});
    const result = await AptitudeQuestion.insertMany(QUESTIONS, { ordered: false });
    const byTopic = {};
    result.forEach(q => { byTopic[q.topic] = (byTopic[q.topic]||0)+1; });
    res.json({
      message: `✅ Seeded ${result.length} questions successfully`,
      total: result.length,
      byTopic
    });
  } catch(err) {
    const inserted = err.insertedDocs?.length || 0;
    if (inserted > 0) return res.json({ message: `Seeded ${inserted} questions (some duplicates skipped)`, total: inserted });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
