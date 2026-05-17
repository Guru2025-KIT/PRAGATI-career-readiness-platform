const router = require('express').Router();
const axios  = require('axios');
const FormData = require('form-data');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { SkillpathResult } = require('../models/index');
const User = require('../models/User.model');
const { authenticate } = require('../middleware/auth.middleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── AI Provider: Groq (primary, free) → Gemini (fallback) ─────────────────────
// Groq models: llama-3.1-8b-instant (fast, free), mixtral-8x7b-32768 (better)
// Gemini: gemini-2.0-flash (free 15 req/min, 1M tokens/day)
async function callAI(prompt, maxTokens = 1500) {
  const GROQ_KEY   = process.env.GROQ_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  // 1. Try Groq first (faster, generous free tier: 14,400 req/day)
  if (GROQ_KEY) {
    try {
      const resp = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        { model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens, temperature: 0.7 },
        { headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }, timeout: 25000 }
      );
      return resp.data?.choices?.[0]?.message?.content?.trim() || null;
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error?.message || err.message;
      console.warn(`[AI] Groq failed (${status}): ${msg}`);
      if (status === 429) console.warn('[AI] Groq rate limit hit — falling back to Gemini');
    }
  }

  // 2. Fallback to Gemini
  if (GEMINI_KEY) {
    try {
      const resp = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens } },
        { headers: { 'Content-Type': 'application/json' }, timeout: 25000 }
      );
      return resp.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error?.message || err.message;
      console.warn(`[AI] Gemini failed (${status}): ${msg}`);
      if (status === 429 || msg?.toLowerCase().includes('quota')) {
        console.warn('[AI] Gemini quota exceeded — returning mock data');
      }
    }
  }

  if (!GROQ_KEY && !GEMINI_KEY) {
    console.info('[AI] No API keys configured — using mock data');
  }

  return null; // both failed or no keys
}

function parseJSON(text) {
  if (!text) return null;
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch { return null; }
}

// ── Groq-based fallback analysis (when ML service is unavailable) ─────────────
async function groqFallbackAnalysis(resumeUrl, jdText, jobTitle, userId) {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return null;

  // Fetch resume text via URL so Groq can analyze it
  let resumeText = `Resume URL: ${resumeUrl}`;
  try {
    // Try to get text representation (works if it's a text/plain resume)
    const r = await axios.get(resumeUrl, { timeout: 10000, responseType: 'text' });
    if (typeof r.data === 'string' && r.data.length > 100) resumeText = r.data.slice(0, 3000);
  } catch { /* PDF binary - use URL hint only */ }

  const prompt = `You are an expert ATS (Applicant Tracking System) and career coach for Indian engineering placements.

Analyze this candidate's resume against the job description and return ONLY valid JSON (no markdown, no backticks).

Resume Info: ${resumeText}
Job Description: ${jdText.slice(0, 2000)}
Target Role: ${jobTitle || 'Software Engineer'}

Return this exact JSON structure:
{
  "ats_score": <number 0-100>,
  "target_role": "<job title>",
  "proficiency_level": "Beginner|Intermediate|Expert",
  "eligibility_percent": <number 0-100>,
  "eligibility_reason": "<2 sentence explanation>",
  "parsed_skills": ["skill1","skill2","skill3"],
  "skill_gap": {
    "matched_skills": ["skill1","skill2"],
    "missing_skills": ["skill1","skill2"],
    "weak_areas": ["area1","area2"]
  },
  "strengths": ["strength1","strength2","strength3"],
  "recommendations": [
    {"skill":"skill name","resource":"specific free resource URL","priority":"high|medium|low"},
    {"skill":"skill name","resource":"specific free resource URL","priority":"high|medium|low"}
  ],
  "overall_readiness_score": <number 0-100>,
  "ats_breakdown": {
    "keyword_match": <0-100>,
    "skills_match": <0-100>,
    "experience_match": <0-100>,
    "education_match": <0-100>
  },
  "analysis_note": "AI-powered analysis (ML service unavailable)"
}`;

  try {
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 1500, temperature: 0.3 },
      { headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    const text = resp.data?.choices?.[0]?.message?.content?.trim() || '';
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
    if (s !== -1 && e !== -1) return JSON.parse(clean.slice(s, e + 1));
  } catch (err) {
    console.warn('[SkillPath] Groq fallback failed:', err.message);
  }
  return null;
}

// ── POST /api/skillpath/analyze ───────────────────────────────────────────────
router.post('/analyze', authenticate, upload.fields([{ name:'resume', maxCount:1 }, { name:'jdFile', maxCount:1 }]), async (req, res) => {
  try {
    const jdText    = req.body?.jdText || req.body?.jd_text || '';
    const jobTitle  = req.body?.jobTitle || '';
    const companyId = req.body?.companyId || null;
    const jdFileBuffer    = req.files?.jdFile?.[0]?.buffer;
    const resumeFileBuffer= req.files?.resume?.[0]?.buffer;

    const hasJD = (jdText && jdText.trim().length >= 10) || jdFileBuffer;
    if (!hasJD) return res.status(400).json({ error: 'Job description required — paste text or upload PDF' });

    // ── Upload resume to Cloudinary if provided ───────────────────────────────
    let resumeUrl = req.user.resumeUrl;
    if (resumeFileBuffer) {
      try {
        const up = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'pragati/resumes', resource_type: 'raw' },
            (err, result) => err ? reject(err) : resolve(result)
          );
          stream.end(resumeFileBuffer);
        });
        resumeUrl = up.secure_url;
        await User.findByIdAndUpdate(req.user._id, { resumeUrl });
      } catch (cloudErr) {
        console.error('[SkillPath] Cloudinary upload failed:', cloudErr.message);
        if (!resumeUrl) return res.status(400).json({ error: 'Resume upload failed. Check Cloudinary config.' });
      }
    }
    if (!resumeUrl) return res.status(400).json({ error: 'No resume found. Please upload your resume (PDF) first.' });

    // ── Try ML service with 30s timeout (was 90s — too long for Render free tier)
    let mlData = null;
    let mlError = null;

    try {
      const form = new FormData();
      if (jdFileBuffer && !jdText.trim()) {
        // PDF JD upload
        const resumeResp = await axios.get(resumeUrl, { responseType: 'arraybuffer', timeout: 15000 });
        form.append('resume', Buffer.from(resumeResp.data), { filename: 'resume.pdf', contentType: 'application/pdf' });
        form.append('job_description', jdFileBuffer, { filename: 'jd.pdf', contentType: 'application/pdf' });
        const mlResp = await axios.post(
  `${process.env.ML_SERVICE_URL}/analyze-file`,
  form,
  {
    headers: form.getHeaders(),
    timeout: 90000 // 90s - handles Render cold start
  }
);
        mlData = mlResp.data;
      } else {
        form.append('resume_url', resumeUrl);
        form.append('jd_text',    jdText);
        form.append('user_id',    req.user._id.toString());
        const mlResp = await axios.post(
  `${process.env.ML_SERVICE_URL}/analyze`,
  form,
  {
    headers: form.getHeaders(),
    timeout: 90000 // 90s - handles Render cold start
  }
);
        mlData = mlResp.data;
      }
    } catch (err) {
      mlError = err.message;
      console.warn('[SkillPath] ML service unavailable:', err.code || err.message, '— trying Groq fallback');
    }

    // ── Groq AI fallback if ML service failed ────────────────────────────────
    if (!mlData) {
      mlData = await groqFallbackAnalysis(resumeUrl, jdText, jobTitle, req.user._id);
    }

    // ── Static fallback if both ML and Groq failed ───────────────────────────
    if (!mlData) {
      mlData = {
        ats_score: 60, target_role: jobTitle || 'Software Engineer',
        proficiency_level: 'Intermediate', eligibility_percent: 60,
        eligibility_reason: 'Analysis completed with limited data. For full analysis, ensure the ML service is running.',
        parsed_skills: ['Python', 'Java', 'SQL', 'Data Structures'],
        skill_gap: { matched_skills: ['Core CS', 'Programming'], missing_skills: ['System Design'], weak_areas: [] },
        strengths: ['Engineering fundamentals', 'Problem solving'],
        recommendations: [
          { skill: 'System Design', resource: 'https://github.com/donnemartin/system-design-primer', priority: 'high' },
          { skill: 'LeetCode', resource: 'https://leetcode.com/studyplan/top-interview-150/', priority: 'high' },
        ],
        overall_readiness_score: 60,
        ats_breakdown: { keyword_match: 55, skills_match: 60, experience_match: 65, education_match: 70 },
        analysis_note: mlError ? `ML service offline. Groq fallback also failed. Static analysis shown. Error: ${mlError}` : 'Static analysis',
      };
    }

    // ── Save result to DB ────────────────────────────────────────────────────
    const skill_gap = mlData.skill_gap || {};
    const dbResult  = await SkillpathResult.create({
      userId: req.user._id, resumeUrl,
      jobTitle: mlData.target_role || jobTitle || 'Job Analysis',
      companyId: companyId || null,
      jdText: jdText || '[PDF job description]',
      atsScore: mlData.ats_score || 0,
      atsBreakdown: mlData.ats_breakdown || {},
      eligibilityPercent: mlData.eligibility_percent || mlData.overall_readiness_score || 0,
      eligibilityReason:  mlData.eligibility_reason  || '',
      skillGapAnalysis: {
        matchedSkills: skill_gap.matched_skills || skill_gap.matchedSkills || mlData.strengths || [],
        missingSkills: skill_gap.missing_skills || skill_gap.missingSkills || (mlData.skill_gaps||[]).map(g=>g.skill) || [],
        weakAreas:     skill_gap.weak_areas     || skill_gap.weakAreas     || [],
      },
      proficiencyLevel: mlData.proficiency_level || 'Beginner',
      recommendations:  mlData.recommendations   || [],
      parsedSkills:     mlData.parsed_skills      || [],
    });

    await User.findByIdAndUpdate(req.user._id, {
      atsScore:          mlData.ats_score          || 0,
      resumeParsedSkills:mlData.parsed_skills       || [],
      skillLevel:        mlData.proficiency_level   || 'Beginner',
    });

    res.json({
      message:      'Analysis complete',
      result:       dbResult,
      fullAnalysis: mlData,
      analysisMode: mlData.analysis_note ? 'ai-fallback' : 'ml-service',
    });

  } catch (err) {
    console.error('[SkillPath] analyze error:', err.message);
    res.status(500).json({ error: 'Analysis failed. ' + (err.response?.data?.detail || err.message) });
  }
});

// ── GET /api/skillpath/ai-status ──────────────────────────────────────────────
router.get('/ai-status', authenticate, async (req, res) => {
  const groqKey   = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const result = { groq: { configured: !!groqKey, working: false }, gemini: { configured: !!geminiKey, working: false } };
  if (groqKey) {
    try {
      const r = await axios.post('https://api.groq.com/openai/v1/chat/completions',
        { model:'llama-3.1-8b-instant', messages:[{role:'user',content:'Say OK'}], max_tokens:5 },
        { headers:{ Authorization:`Bearer ${groqKey}`, 'Content-Type':'application/json' }, timeout:10000 });
      result.groq.working = !!r.data?.choices?.[0]?.message?.content;
    } catch(e) { result.groq.error = e.response?.data?.error?.message||e.message; }
  }
  if (geminiKey) {
    try {
      const r = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { contents:[{parts:[{text:'Say OK'}]}], generationConfig:{maxOutputTokens:5} },
        { headers:{'Content-Type':'application/json'}, timeout:10000 });
      result.gemini.working = !!r.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch(e) { result.gemini.error = e.response?.data?.error?.message||e.message; }
  }
  result.activeProvider = result.groq.working ? 'Groq (llama-3.1-8b-instant)' : result.gemini.working ? 'Gemini 2.0 Flash' : 'None (using mock data)';
  res.json(result);
});

// ── POST /api/skillpath/interview-prep ────────────────────────────────────────
router.post('/interview-prep', authenticate, async (req, res) => {
  try {
    const { targetRole, skillGaps, strengths, readinessScore, candidateName } = req.body;
    const criticalGaps  = (skillGaps||[]).filter(g=>g.importance==='critical').map(g=>g.skill).slice(0,5);
    const importantGaps = (skillGaps||[]).filter(g=>g.importance==='important').map(g=>g.skill).slice(0,4);
    const topStrengths  = (strengths||[]).slice(0,6);
    const gapList = [...criticalGaps, ...importantGaps].slice(0,6);

    const prompt = `You are an expert technical interview coach for campus placements at engineering colleges in India.

Candidate: ${candidateName||'Engineering Student'}
Target Role: ${targetRole||'Software Engineer'}
Readiness Score: ${readinessScore||50}/100
Critical Skill Gaps: ${criticalGaps.join(', ')||'None'}
Important Skill Gaps: ${importantGaps.join(', ')||'None'}
Key Strengths: ${topStrengths.join(', ')||'Core CS fundamentals'}

Generate a comprehensive interview preparation guide. Return ONLY valid JSON (no markdown, no backticks):
{
  "coaching_summary": "2-3 sentence personalised coaching for this candidate",
  "technical_questions": [{"question":"...","skill":"...","difficulty":"easy|medium|hard","tip":"one sentence answer tip"}],
  "behavioral_questions": [{"question":"...","framework":"STAR|CAR|PAR","angle":"what they test"}],
  "gap_questions": [{"question":"...","skill":"...","how_to_handle":"honest strategy"}],
  "quick_wins": ["actionable tip 1","actionable tip 2","actionable tip 3","actionable tip 4"]
}
Rules: 5 technical questions, 4 behavioral questions, 3 gap questions, 4 quick wins. Specific to Indian campus placements.`;

    const raw = await callAI(prompt, 1800);
    const parsed = parseJSON(raw);
    if (parsed) return res.json(parsed);

    // High-quality mock fallback
    const gap = gapList[0] || 'core technical skills';
    const strength = topStrengths[0] || 'your core CS skills';
    res.json({
      coaching_summary: `You are targeting ${targetRole||'Software Engineer'} with a readiness of ${readinessScore||50}/100. Your strongest asset is ${strength} — lead with this in interviews. For ${gap}, be honest about your learning journey and show a concrete plan. Note: This is mock data — add GROQ_API_KEY or GEMINI_API_KEY in .env for personalised AI responses.`,
      technical_questions: [
        { question:`Explain how you would use ${gap} in a real project.`, skill:gap, difficulty:'medium', tip:'Focus on a concrete project example, not theory.' },
        { question:'What is the time and space complexity of Merge Sort? When would you prefer it over Quick Sort?', skill:'algorithms', difficulty:'medium', tip:'O(n log n) both — prefer Merge Sort for linked lists and stable sort requirements.' },
        { question:'Explain the difference between a process and a thread with a real-world example.', skill:'operating systems', difficulty:'medium', tip:'Restaurant analogy: process = kitchen, thread = chef. Share memory, different stacks.' },
        { question:'Write a SQL query to find the third highest salary from an employee table.', skill:'sql', difficulty:'medium', tip:'Use DENSE_RANK() or LIMIT with OFFSET. Show both approaches.' },
        { question:'What is REST? How is it different from GraphQL?', skill:'system design', difficulty:'easy', tip:'REST: multiple endpoints, over-fetching. GraphQL: one endpoint, fetch exactly what you need.' },
      ],
      behavioral_questions: [
        { question:'Tell me about a project you are most proud of and what you learned from it.', framework:'STAR', angle:'Technical depth + ownership + impact' },
        { question:'Describe a time you had to learn something quickly under pressure.', framework:'STAR', angle:'Learning agility and adaptability' },
        { question:'Give an example of how you resolved a conflict in a team project.', framework:'CAR', angle:'Collaboration and communication skills' },
        { question:'Tell me about a time you failed and what you learned.', framework:'PAR', angle:'Self-awareness and growth mindset' },
      ],
      gap_questions: [
        { question:`We require strong ${gap} experience. How much have you worked with it?`, skill:gap, how_to_handle:'Be honest: "I have foundational knowledge and have been building [specific project]. I am actively improving through [resource]."' },
        { question:'What areas do you feel you need to grow in for this role?', skill:'self-awareness', how_to_handle:'Name the gap confidently, then pivot to your concrete plan to close it within 3 months.' },
        { question:'Why should we hire you over someone with more experience?', skill:'value proposition', how_to_handle:'Lead with learning velocity and fresh perspective — "I might have less experience but I adapt faster and bring energy to every problem."' },
      ],
      quick_wins: [
        `Build one project using ${gap} this week — even a simple demo shows initiative`,
        'Prepare a crisp 90-second "tell me about yourself" that connects your projects directly to this role',
        'Research the company tech stack and prepare 3 thoughtful questions about their engineering challenges',
        'Revise your resume to quantify every achievement with numbers (users, performance %, time saved)',
      ]
    });
  } catch (err) {
    console.error('Interview prep error:', err.message);
    res.json({ coaching_summary:'Interview prep is temporarily unavailable. Check your AI API keys in .env.', technical_questions:[], behavioral_questions:[], gap_questions:[], quick_wins:[] });
  }
});

// ── POST /api/skillpath/interview-feedback ────────────────────────────────────
router.post('/interview-feedback', authenticate, async (req, res) => {
  try {
    const { question, answer, nextQuestion, candidateName, targetRole } = req.body;
    if (!answer?.trim()) return res.json({ feedback: 'Please type or speak your answer first.' });

    const prompt = `You are a campus placement interview coach for Indian engineering students.
Candidate: ${candidateName||'Student'} | Role: ${targetRole||'Software Engineer'}
Interview Question: ${question}
Candidate's Answer: ${answer}

Give 2-3 sentence constructive feedback: what was good, what to improve, encourage using STAR format if weak.
${nextQuestion ? `End with "Next Question: ${nextQuestion}"` : 'Congratulate them for completing all questions.'}
Keep under 100 words. No markdown formatting.`;

    const text = await callAI(prompt, 200);
    if (text) return res.json({ feedback: text });

    // Mock fallback
    const words = (answer||'').split(/\s+/).filter(Boolean).length;
    const quality = words>=50?'Good depth and detail!':words>=20?'Decent — try adding a specific example using STAR format.':'Too brief — aim for 3-4 sentences with a concrete example.';
    const nxt = nextQuestion ? `\n\n➡️ Next Question: ${nextQuestion}` : '\n\n✅ Great work completing the mock interview!';
    res.json({ feedback: `📝 ${quality}${nxt}` });
  } catch (err) {
    console.error('Feedback error:', err.message);
    res.json({ feedback: 'Good attempt! Be more specific next time.' + (req.body.nextQuestion ? `\n\nNext: ${req.body.nextQuestion}` : '') });
  }
});

// ── POST /api/skillpath/ai-chat ───────────────────────────────────────────────
router.post('/ai-chat', authenticate, async (req, res) => {
  try {
    const { message, userName, targetRole } = req.body;
    if (!message?.trim()) return res.status(400).json({ error:'Message required' });

    const prompt = `You are PRAGATI AI, an expert placement assistant for Indian engineering students at KIT's College of Engineering.

Student: ${userName||'Engineering Student'} | Target: ${targetRole||'Software Engineer'}
Question: ${message}

Reply in 3-5 sentences. Be specific, practical, and encouraging. Use 1-2 relevant emojis. Focus on actionable advice for Indian campus placements. If about a technical topic, include the most important concept to remember.`;

    const reply = await callAI(prompt, 250);
    if (reply) return res.json({ reply });

    // Smart mock fallback
    const q = message.toLowerCase();
    let fallback = '';
    if (q.includes('array')||q.includes('dsa')||q.includes('algorithm'))
      fallback = '📚 For DSA problems: master Two Pointers, Sliding Window, and Binary Search first. These patterns solve ~60% of interview questions. Practice on LeetCode Easy → Medium in order. Time your solutions from day 1.';
    else if (q.includes('resume')||q.includes('ats'))
      fallback = '📄 ATS Resume Tips: Match keywords from the JD exactly. Structure: Contact → Skills → Projects → Education → Experience. Quantify every achievement: "Built REST API handling 500 requests/day." Run SkillPath AI for your personalised ATS score!';
    else if (q.includes('interview')||q.includes('prepare'))
      fallback = '🎤 Interview Prep: 1) Revise OOP (4 pillars with examples) 2) DBMS (normalization, JOINs) 3) OS (process vs thread, deadlock) 4) 2 strong projects you can explain deeply 5) 50+ LeetCode problems. Use PRAGATI Interview Prep for AI-powered mock interviews!';
    else if (q.includes('tcs')||q.includes('infosys')||q.includes('wipro'))
      fallback = '🏢 For service companies: Focus on quant aptitude, pseudocode tracing, basic DSA, OOP, and SQL. Communication is key for HR rounds. Practice TCS NQT mock tests — timing is everything. Good luck! 💪';
    else
      fallback = `🤖 Great question! For placement success, I recommend: 1) Upload your resume to SkillPath AI for a personalised gap analysis 2) Solve today's daily coding problem 3) Practice topic-wise aptitude 4) Check company prep guides. What specific topic can I help with? Note: Add GROQ_API_KEY to .env for full AI responses.`;

    res.json({ reply: fallback });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.json({ reply: 'I had a brief hiccup. Please try asking again!' });
  }
});

// ── POST /api/skillpath/deep-dive ─────────────────────────────────────────────
router.post('/deep-dive', authenticate, async (req, res) => {
  try {
    const { topic, targetRole, candidateName } = req.body;
    const prompt = `You are a placement coach for Indian engineering students preparing for ${targetRole||'software engineering'} interviews.
Topic: ${topic} | Candidate: ${candidateName||'Student'}
Return ONLY valid JSON (no markdown):
{"explanation":"2-3 sentence clear explanation for a campus interview context","practice_questions":["3 interview questions about ${topic}"],"resources":["2 specific free resource URLs or names"],"quick_prep":"One sentence on how to answer ${topic} questions in an interview"}`;

    const raw = await callAI(prompt, 600);
    const parsed = parseJSON(raw);
    if (parsed) return res.json(parsed);

    res.json({
      explanation: `${topic} is a core technical skill frequently tested in campus placements. Understanding the fundamentals, use cases, and trade-offs is essential for both interviews and practical development.`,
      practice_questions: [`Explain ${topic} with a real-world example.`, `What are the common pitfalls when using ${topic}?`, `Compare ${topic} with similar alternatives.`],
      resources: [`freeCodeCamp.org — search "${topic} tutorial"`, `GeeksforGeeks.org — search "${topic}"`],
      quick_prep: `In interviews: explain the concept clearly in one sentence, give a concrete example, mention one trade-off or limitation.`,
    });
  } catch (err) {
    console.error('Deep dive error:', err.message);
    res.json({ explanation:`${req.body.topic} is an important topic. Study fundamentals and build a project using it.`, practice_questions:[], resources:['freeCodeCamp.org','GeeksforGeeks.org'], quick_prep:'Explain concept, give example, mention trade-offs.' });
  }
});

// ── GET /api/skillpath/history ────────────────────────────────────────────────
router.get('/history', authenticate, async (req, res) => {
  try {
    const results = await SkillpathResult.find({ userId:req.user._id }).sort({ analyzedAt:-1 }).limit(20);
    res.json({ results });
  } catch (err) { res.status(500).json({ error:err.message }); }
});


// ── GET /api/skillpath/health — proxies to ML service health check ────────────
// Used by frontend keepMLWarm to prevent Render cold starts
router.get('/health', async (req, res) => {
  const ML_URL = process.env.ML_SERVICE_URL;
  if (!ML_URL) return res.json({ status: 'no-ml-service', groq: !!process.env.GROQ_API_KEY });
  try {
    const r = await axios.get(`${ML_URL}/health`, { timeout: 8000 });
    res.json({ status: 'ok', ml: r.data });
  } catch {
    res.json({ status: 'ml-sleeping', groq: !!process.env.GROQ_API_KEY });
  }
});

// ── GET /api/skillpath/latest ─────────────────────────────────────────────────
router.get('/latest', authenticate, async (req, res) => {
  try {
    const result = await SkillpathResult.findOne({ userId:req.user._id }).populate('companyId','name sector').sort({ analyzedAt:-1 });
    res.json({ result });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

module.exports = router;
