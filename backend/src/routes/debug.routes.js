const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGemini(prompt, retries = 2) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set in .env');
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.0, maxOutputTokens: 4096, topP: 1.0, topK: 1 },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0,300)}`);
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
}

function buildPrompt({ code, language, problemTitle, testCases }) {
  const lang = (language || 'javascript').toLowerCase();
  const tcSection = (testCases && testCases.length > 0)
    ? `\nTEST CASES (trace manually for each):\n${testCases.map((tc,i)=>`  Case ${i+1}: Input=${JSON.stringify(tc.input)} Expected=${JSON.stringify(tc.expected)}`).join('\n')}`
    : '\n(No test cases — analyze algorithm correctness from logic alone)';

  return `You are the world's most accurate code debugger. Analyze this code with 100% precision.

Language: ${lang}
${problemTitle ? `Problem: ${problemTitle}` : ''}${tcSection}

Code:
\`\`\`${lang}
${code}
\`\`\`

ANALYSIS STEPS:
1. Understand the algorithm — what does it compute?
2. Trace each test case line-by-line, track every variable
3. Check: off-by-one errors, wrong loop bounds, missing return, wrong comparisons, uninitialized vars, integer overflow, null access, wrong algorithm
4. Language bugs: ${lang==='java'?'String== vs .equals(), int overflow, ArrayIndexOutOfBounds':lang==='python'?'/ vs //, range() off-by-one, mutable defaults':lang==='javascript'?'=== vs ==, NaN, undefined, array mutation':'int overflow, bounds, pointers'}
5. Edge cases: empty input, single element, negatives, zero, max values

VERDICT RULES (STRICT):
- "likely_correct": ALL tests pass AND no bugs AND 100% certain
- "has_errors": ANY test fails OR any bug found OR runtime error possible
- "review": uncertain OR no tests given OR edge case risks
- DEFAULT to "review" when unsure. NEVER say "likely_correct" without proof.

Respond ONLY with raw JSON (no markdown, no text outside JSON):
{
  "verdict": "likely_correct" | "review" | "has_errors",
  "verdictMessage": "One precise sentence",
  "issues": [{"type":"error"|"warning","line":null,"msg":"exact issue"}],
  "hints": ["specific actionable hint"],
  "testResults": [{"input":"","expected":"","actualOutput":"","passed":true,"trace":"var=val steps"}],
  "suggestedFix": "corrected code snippet or empty string",
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)",
  "explanation": "4-5 sentences about algorithm, correctness, improvements"
}`;
}

function parseGemini(raw) {
  let text = raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s===-1||e===-1) throw new Error('No JSON in Gemini response');
  return JSON.parse(text.slice(s,e+1));
}

router.post('/', authenticate, async (req, res) => {
  const { code, language='javascript', problemTitle='', testCases=[] } = req.body;
  if (!code || code.trim().length < 5) return res.status(400).json({ error:'Provide code to debug (min 5 chars).' });

  // PRIMARY: Gemini AI
  if (GEMINI_API_KEY) {
    try {
      const raw    = await callGemini(buildPrompt({ code, language, problemTitle, testCases }));
      const parsed = parseGemini(raw);

      let verdict = parsed.verdict || 'review';
      if (parsed.issues?.some(i=>i.type==='error')) verdict = 'has_errors';
      if (parsed.testResults?.some(t=>t.passed===false)) verdict = 'has_errors';
      if (!testCases.length && verdict==='likely_correct') verdict = 'review';

      return res.json({
        verdict,
        verdictMessage:  parsed.verdictMessage  || (verdict==='likely_correct'?'✅ All tests passed!':verdict==='has_errors'?'❌ Errors found.':'⚠️ Review needed.'),
        issues:          Array.isArray(parsed.issues)      ? parsed.issues      : [],
        hints:           Array.isArray(parsed.hints)       ? parsed.hints       : [],
        testResults:     Array.isArray(parsed.testResults) ? parsed.testResults : [],
        suggestedFix:    parsed.suggestedFix    || '',
        timeComplexity:  parsed.timeComplexity  || 'N/A',
        spaceComplexity: parsed.spaceComplexity || 'N/A',
        explanation:     parsed.explanation     || '',
        source: 'gemini',
      });
    } catch(err) {
      console.error('Gemini debug failed:', err.message);
    }
  }

  // FALLBACK: rule-based
  const issues=[], hints=[];
  let verdict='review';
  const lang=(language||'').toLowerCase();
  if (/<=\s*(arr\.length|n|len|size)\b/.test(code)&&!/.length\s*-\s*1/.test(code)) { issues.push({line:null,type:'warning',msg:'Off-by-one: `<= arr.length` should be `< arr.length`'}); hints.push('Use `i < arr.length` not `i <= arr.length`.'); }
  if (/while\s*\(\s*true\s*\)/i.test(code)&&!/break\b/i.test(code)) { issues.push({line:null,type:'error',msg:'while(true) without break — infinite loop'}); verdict='has_errors'; }
  if (/function\s+\w+/.test(code)&&!/\breturn\b/.test(code)) { issues.push({line:null,type:'warning',msg:'Function with no return statement'}); hints.push('All code paths must return a value.'); }
  if (lang==='java'&&(/==\s*"/.test(code)||/"\s*==/.test(code))) { issues.push({line:null,type:'error',msg:'Java: use .equals() for String comparison, not =='}); verdict='has_errors'; }
  if (issues.some(i=>i.type==='error')) verdict='has_errors';
  return res.json({ verdict, verdictMessage:verdict==='has_errors'?'❌ Errors detected.':'⚠️ Add GEMINI_API_KEY for AI analysis.', issues, hints, testResults:[], suggestedFix:'', timeComplexity:'N/A', spaceComplexity:'N/A', explanation:'Rule-based only. Set GEMINI_API_KEY in .env for full Gemini AI debugging.', source:'rule-based' });
});

module.exports = router;
