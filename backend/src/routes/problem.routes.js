const router = require('express').Router();
const { Problem, UserProblem } = require('../models/index');
const User = require('../models/User.model');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const DIFFICULTY_MAP = { Beginner:'Easy', Intermediate:'Medium', Expert:'Hard' };
const LOWER_DIFF = { Hard:'Medium', Medium:'Easy', Easy:'Easy' };

// GET /api/problems/daily
router.get('/daily', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const difficulty = DIFFICULTY_MAP[user.skillLevel] || 'Easy';
    const today = new Date(); today.setHours(0,0,0,0);

    // Already assigned today?
    const existing = await UserProblem.findOne({ userId:user._id, createdAt:{ $gte:today } }).populate('problemId');
    if (existing?.problemId) return res.json({ userProblem:existing, problem:existing.problemId });

    // Exclude last 14 days
    const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(twoWeeksAgo.getDate()-14);
    const recentIds = (await UserProblem.find({ userId:user._id, createdAt:{ $gte:twoWeeksAgo } }).select('problemId')).map(u=>u.problemId);

    let problems = await Problem.aggregate([{ $match:{ difficulty, _id:{ $nin:recentIds } } },{ $sample:{ size:1 } }]);
    if (!problems.length) problems = await Problem.aggregate([{ $match:{ difficulty } },{ $sample:{ size:1 } }]);
    if (!problems.length) return res.json({ message:'No problems available. Ask admin to add more.' });

    const up = await UserProblem.create({ userId:user._id, problemId:problems[0]._id, status:'assigned' });
    res.json({ userProblem:up, problem:problems[0] });
  } catch(err){ res.status(500).json({ error:err.message }); }
});

// POST /api/problems/shuffle — request a lower difficulty replacement
router.post('/shuffle', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const today = new Date(); today.setHours(0,0,0,0);

    // Get today's problem
    const existing = await UserProblem.findOne({ userId:user._id, createdAt:{ $gte:today } });
    if (!existing) return res.status(404).json({ error:'No problem assigned today' });
    if (existing.status === 'solved') return res.status(400).json({ error:'Problem already solved' });
    if (existing.shuffled) return res.status(400).json({ error:'Already shuffled today — one shuffle per day allowed' });

    const currentDiff = DIFFICULTY_MAP[user.skillLevel] || 'Easy';
    const lowerDiff   = LOWER_DIFF[currentDiff];

    // Find a different problem of lower difficulty not done recently
    const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(twoWeeksAgo.getDate()-14);
    const recentIds = (await UserProblem.find({ userId:user._id, createdAt:{ $gte:twoWeeksAgo } }).select('problemId')).map(u=>u.problemId);
    recentIds.push(existing.problemId); // exclude current

    let problems = await Problem.aggregate([{ $match:{ difficulty:lowerDiff, _id:{ $nin:recentIds } } },{ $sample:{ size:1 } }]);
    if (!problems.length) problems = await Problem.aggregate([{ $match:{ difficulty:lowerDiff } },{ $sample:{ size:1 } }]);
    if (!problems.length) return res.status(404).json({ error:'No replacement problem available' });

    // Replace today's assignment
    await UserProblem.findByIdAndDelete(existing._id);
    const newUP = await UserProblem.create({ userId:user._id, problemId:problems[0]._id, status:'assigned', shuffled:true });
    res.json({ userProblem:newUP, problem:problems[0], message:`Shuffled to ${lowerDiff} problem!` });
  } catch(err){ res.status(500).json({ error:err.message }); }
});

// POST /api/problems/:id/solve — mandatory solution code
router.post('/:id/solve', authenticate, async (req, res) => {
  try {
    const { approachNotes, solutionCode, selfRating } = req.body;
    if (!solutionCode || solutionCode.trim().length < 10) {
      return res.status(400).json({ error:'Please paste your solution code (min 10 chars) before submitting.' });
    }
    const up = await UserProblem.findOneAndUpdate(
      { userId:req.user._id, problemId:req.params.id },
      { status:'solved', solvedAt:new Date(), approachNotes, solutionCode, selfRating },
      { new:true }
    );
    if (!up) return res.status(404).json({ error:'Problem assignment not found' });

    // Update streak
    const user = await User.findById(req.user._id);
    const today = new Date(); today.setHours(0,0,0,0);
    const lastSolved = user.lastSolvedDate ? new Date(user.lastSolvedDate) : null;
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
    let newStreak = 1;
    if (lastSolved) {
      lastSolved.setHours(0,0,0,0);
      if (lastSolved.getTime() === yesterday.getTime()) newStreak = user.streak+1;
      else if (lastSolved.getTime() === today.getTime()) newStreak = user.streak;
    }
    await User.findByIdAndUpdate(req.user._id, { streak:newStreak, lastSolvedDate:new Date(), $inc:{ totalProblemsSolved:1 } });
    res.json({ message:'🎉 Solved! Great work!', streak:newStreak, userProblem:up });
  } catch(err){ res.status(400).json({ error:err.message }); }
});

// POST /api/problems/:id/attempt
router.post('/:id/attempt', authenticate, async (req, res) => {
  try {
    await UserProblem.findOneAndUpdate({ userId:req.user._id, problemId:req.params.id, status:'assigned' },{ status:'attempted' });
    res.json({ message:'Marked as attempted' });
  } catch(err){ res.status(400).json({ error:err.message }); }
});

// GET /api/problems/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const history = await UserProblem.find({ userId:req.user._id }).populate('problemId').sort({ createdAt:-1 }).limit(60);
    res.json({ history });
  } catch(err){ res.status(500).json({ error:err.message }); }
});

// GET /api/problems
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.topic) filter.topic = req.query.topic;
    const problems = await Problem.find(filter).sort({ difficulty:1, createdAt:-1 });
    res.json({ problems });
  } catch(err){ res.status(500).json({ error:err.message }); }
});

// POST /api/problems — admin/faculty adds problem
router.post('/', authenticate, authorize('admin','faculty'), async (req, res) => {
  try {
    const p = await Problem.create(req.body);
    res.status(201).json({ message:'Problem added', problem:p });
  } catch(err){ res.status(400).json({ error:err.message }); }
});

module.exports = router;
