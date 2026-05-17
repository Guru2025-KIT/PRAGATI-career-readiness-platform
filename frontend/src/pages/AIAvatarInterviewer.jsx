import { useState, useEffect, useRef, useCallback } from "react";
import RealisticAvatar from "../components/RealisticAvatar";

const API_BASE = process.env.REACT_APP_API_URL || "https://pragati-backend-ixn3.onrender.com/api";
const getToken = () => localStorage.getItem("pragati_token");


// ── Persona configs ──────────────────────────────────────────────────────────
const PERSONAS = [
  {
    id: "hr",
    label: "HR Recruiter",
    icon: "👩‍💼",
    color: "#7C3AED",
    accent: "#EDE9FE",
    skinTone: "#F4A261",
    hairColor: "#2D1B0E",
    shirtColor: "#7C3AED",
    systemPrompt:
      "You are Sarah Chen, a warm and professional HR recruiter at a top tech company. You're friendly but thorough. You care deeply about culture fit, communication skills, and growth mindset. You ask behavioral questions using STAR format. Speak naturally, warmly, and conversationally. Ask ONE question at a time. Keep responses under 80 words.",
  },
  {
    id: "tech",
    label: "Senior Engineer",
    icon: "👨‍💻",
    color: "#0F766E",
    accent: "#CCFBF1",
    skinTone: "#C68642",
    hairColor: "#1A1A2E",
    shirtColor: "#0F766E",
    systemPrompt:
      "You are Marcus Rivera, a senior software engineer with 10 years at top-tier companies. You're analytical and concise. You probe technical depth — ask about trade-offs, complexity, design patterns. You're not hostile but you don't accept vague answers. Ask ONE technical question at a time. Keep responses under 80 words.",
  },
  {
    id: "faang",
    label: "FAANG Interviewer",
    icon: "🧑‍🔬",
    color: "#DC2626",
    accent: "#FEE2E2",
    skinTone: "#FDBCB4",
    hairColor: "#3D2B1F",
    shirtColor: "#1E3A5F",
    systemPrompt:
      "You are Alex Kim, a principal engineer conducting a FAANG-style interview. You're sharp, precise, and demanding. You expect rigorous answers — system design, algorithmic complexity, edge cases. You follow up aggressively on weak answers. Keep pressure high but professional. Ask ONE question at a time. Responses under 80 words.",
  },
  {
    id: "startup",
    label: "Startup Founder",
    icon: "🚀",
    color: "#D97706",
    accent: "#FEF3C7",
    skinTone: "#8D5524",
    hairColor: "#4A3728",
    shirtColor: "#D97706",
    systemPrompt:
      "You are Jordan Lee, a Series B startup founder. You move fast and value scrappiness. You ask about passion, ownership, and problem-solving under uncertainty. You want to know if candidates can wear multiple hats. Be direct, energetic, and authentic. Ask ONE question at a time. Keep responses under 80 words.",
  },
];

// AvatarFace replaced by RealisticAvatar component

// ── Waveform visualizer ──────────────────────────────────────────────────────
function Waveform({ active, color }) {
  const bars = 20;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 28 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: color,
            height: active ? `${8 + Math.random() * 18}px` : "4px",
            transition: "height 0.1s ease",
            animation: active ? `wave ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate` : "none",
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { height: 4px; }
          to { height: ${active ? "22px" : "4px"}; }
        }
      `}</style>
    </div>
  );
}

// ── Live score display ───────────────────────────────────────────────────────
function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: "var(--color-background-secondary)", borderRadius: 3 }}>
        <div style={{
          height: "100%", width: `${value}%`, background: color,
          borderRadius: 3, transition: "width 0.8s ease"
        }} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIAvatarInterviewer() {
  const [phase, setPhase] = useState("select"); // select | briefing | interview | report
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [role, setRole] = useState("Software Engineer");
  const [domain, setDomain] = useState("Full Stack Development");
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [avatarState, setAvatarState] = useState("idle"); // idle | talking | thinking | listening
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [blinkState, setBlinkState] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [emotion, setEmotion] = useState("neutral");
  const [scores, setScores] = useState({ communication: 70, confidence: 65, accuracy: 72, depth: 68 });
  const [questionCount, setQuestionCount] = useState(0);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [sessionMemory, setSessionMemory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [ttsSupported] = useState(typeof window !== "undefined" && "speechSynthesis" in window);
  const [sttSupported] = useState(typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition));

  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const messagesEndRef = useRef(null);
  const eyeTimerRef = useRef(null);
  const blinkTimerRef = useRef(null);
  const talkAnimRef = useRef(null);

  // ── Blinking ────────────────────────────────────────────────────────────
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 5000;
      blinkTimerRef.current = setTimeout(() => {
        setBlinkState(true);
        setTimeout(() => setBlinkState(false), 120);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(blinkTimerRef.current);
  }, []);

  // ── Eye movement ─────────────────────────────────────────────────────────
  useEffect(() => {
    const moveEyes = () => {
      const x = (Math.random() - 0.5) * 4;
      const y = (Math.random() - 0.5) * 3;
      setEyeOffset({ x, y });
      eyeTimerRef.current = setTimeout(moveEyes, 1500 + Math.random() * 3000);
    };
    moveEyes();
    return () => clearTimeout(eyeTimerRef.current);
  }, []);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Browser TTS ───────────────────────────────────────────────────────────
  const speakText = useCallback((text) => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.pitch = persona.id === "faang" ? 0.9 : persona.id === "startup" ? 1.05 : 1.0;
    utter.volume = 1;

    // Pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("neural"))
      || voices.find(v => v.lang.startsWith("en-US"))
      || voices[0];
    if (preferred) utter.voice = preferred;

    utter.onstart = () => { setIsTTSPlaying(true); setAvatarState("talking"); };
    utter.onend = () => { setIsTTSPlaying(false); setAvatarState("idle"); setStatusText("Your turn to answer..."); };
    utter.onerror = () => { setIsTTSPlaying(false); setAvatarState("idle"); };

    utteranceRef.current = utter;
    // Small delay to ensure voices are loaded
    setTimeout(() => window.speechSynthesis.speak(utter), 100);
  }, [persona, ttsSupported]);

  // ── Call Claude AI ────────────────────────────────────────────────────────
  const callClaude = useCallback(async (userMessage) => {
    setLoading(true);
    setAvatarState("thinking");
    setStatusText("Thinking...");

    const systemPrompt = `${persona.systemPrompt}

INTERVIEW CONTEXT:
- Candidate is interviewing for: ${role}
- Domain: ${domain}
- Question number: ${questionCount + 1}
- Session memory: ${sessionMemory.slice(-6).map(m => `[${m.role}]: ${m.content}`).join(" | ")}

IMPORTANT RULES:
1. Ask EXACTLY ONE question per response.
2. If this is the first message (no prior context), greet professionally and ask your FIRST interview question.
3. Reference previous answers naturally when relevant (e.g., "You mentioned X earlier...").
4. Adapt difficulty based on answer quality.
5. After 8+ questions, you may give a closing statement instead of another question.
6. Keep response under 100 words.
7. Sound HUMAN — use natural pauses (commas), casual connectors ("so", "now", "alright").
8. Occasionally express reactions: "Interesting.", "Good point.", "I see.", "Hmm, let me follow up on that."

SCORING HINT (respond with JSON on a separate final line, hidden from display):
{"comm":NUMBER,"conf":NUMBER,"acc":NUMBER,"depth":NUMBER}
where each is 0-100 based on the candidate's last answer.`;

    const newMemory = [...sessionMemory, { role: "user", content: userMessage }];

    try {
      // ✅ Route through backend proxy (/api/interview/ai-chat) to avoid CORS
      //    and keep the Anthropic API key server-side
      const response = await fetch(`${API_BASE}/interview/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          system:   systemPrompt,
          messages: newMemory.slice(-12).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const rawText = data.content?.[0]?.text || "Thank you for that response. Could you elaborate a bit more?";

      // Extract hidden score JSON
      const scoreMatch = rawText.match(/\{"comm":\s*(\d+).*?"conf":\s*(\d+).*?"acc":\s*(\d+).*?"depth":\s*(\d+)\}/);
      let cleanText = rawText.replace(/\{.*"comm".*\}/, "").trim();

      if (scoreMatch) {
        const [, comm, conf, acc, depth] = scoreMatch;
        setScores(prev => ({
          communication: Math.round((prev.communication * 0.7 + parseInt(comm) * 0.3)),
          confidence: Math.round((prev.confidence * 0.7 + parseInt(conf) * 0.3)),
          accuracy: Math.round((prev.accuracy * 0.7 + parseInt(acc) * 0.3)),
          depth: Math.round((prev.depth * 0.7 + parseInt(depth) * 0.3)),
        }));
      }

      // Detect emotion from text
      if (/interesting|great|excellent|impressive/i.test(cleanText)) setEmotion("smile");
      else if (/\?|elaborate|explain|why|how/i.test(cleanText)) setEmotion("curious");
      else setEmotion("neutral");
      setTimeout(() => setEmotion("neutral"), 3000);

      const updatedMemory = [...newMemory, { role: "assistant", content: cleanText }];
      setSessionMemory(updatedMemory);
      setQuestionCount(q => q + 1);
      setLoading(false);

      // Add to visible messages
      setMessages(prev => [...prev, { role: "assistant", content: cleanText }]);

      // Speak it
      setAvatarState("talking");
      speakText(cleanText);

    } catch (err) {
      // ✅ Varied fallbacks so the same question never repeats on API errors
      const fallbackPool = [
        "That's a solid point. Tell me — how do you prioritize tasks when everything feels urgent?",
        "Interesting. Walk me through a time you had to learn something new very quickly.",
        "Good. How do you handle disagreements with teammates or your manager?",
        "Let's dig into system design — how would you design a URL shortener from scratch?",
        "Tell me about a project you're most proud of and why.",
        "What's your process when you encounter a bug you've never seen before?",
        "How do you stay current with new technologies in your field?",
      ];
      const fallback = fallbackPool[questionCount % fallbackPool.length];
      setMessages(prev => [...prev, { role: "assistant", content: fallback }]);
      setSessionMemory(m => [...m, { role: "assistant", content: fallback }]);
      setQuestionCount(q => q + 1);
      setLoading(false);
      setAvatarState("talking");
      speakText(fallback);
    }
  }, [persona, role, domain, questionCount, sessionMemory, speakText]);

  // ── Start interview ───────────────────────────────────────────────────────
  const startInterview = useCallback(async () => {
    setPhase("interview");
    setMessages([]);
    setSessionMemory([]);
    setQuestionCount(0);
    setInterviewStarted(false);
    setStatusText("Joining session...");
    setTimeout(async () => {
      setInterviewStarted(true);
      await callClaude(`[START INTERVIEW] The candidate is applying for ${role} in ${domain}. Begin the interview with a warm greeting and your first question.`);
    }, 1500);
  }, [role, domain, callClaude]);

  // ── STT ───────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    window.speechSynthesis.cancel();
    setIsTTSPlaying(false);
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    let finalText = "";
    let interimText = "";

    recognition.onstart = () => {
      setIsListening(true);
      setAvatarState("listening");
      setStatusText("Listening… speak now");
      setTranscript("");
    };
    recognition.onresult = (e) => {
      interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript + " ";
          interimText = "";
        } else {
          interimText = e.results[i][0].transcript;
        }
      }
      setTranscript(finalText + interimText);
      setUserInput(finalText + interimText);
    };
    recognition.onend = () => {
      setIsListening(false);
      setAvatarState("idle");
      // ✅ Flush interim text captured before recognition stopped
      const captured = (finalText + interimText).trim();
      if (captured) {
        setUserInput(captured);
        setTranscript("");
      }
    };
    recognition.onerror = (e) => {
      setIsListening(false);
      setAvatarState("idle");
      if (e.error !== "no-speech" && e.error !== "aborted") {
        console.warn("[STT] error:", e.error);
      }
    };
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // ── Send answer ────────────────────────────────────────────────────────────
  const sendAnswer = useCallback(() => {
    const text = userInput.trim();
    if (!text || loading || isTTSPlaying) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setUserInput("");
    setTranscript("");
    callClaude(text);
  }, [userInput, loading, isTTSPlaying, callClaude]);

  // ── Avg score ─────────────────────────────────────────────────────────────
  const avgScore = Math.round((scores.communication + scores.confidence + scores.accuracy + scores.depth) / 4);

  // ── Phase: Select ─────────────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--color-background-tertiary)", padding: "2rem 1rem" }}>
        <h2 className="sr-only">AI Avatar Interview Setup</h2>

        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 999, padding: "6px 16px", marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>AI Avatar Interview System</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
              Choose Your Interviewer
            </h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>
              A real-time AI avatar will conduct your interview with voice, memory, and adaptive questioning
            </p>
          </div>

          {/* Persona cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
            {PERSONAS.map((p) => (
              <div
                key={p.id}
                onClick={() => setPersona(p)}
                style={{
                  background: "var(--color-background-primary)",
                  border: persona.id === p.id ? `2px solid ${p.color}` : "0.5px solid var(--color-border-tertiary)",
                  borderRadius: 12,
                  padding: "16px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "center",
                  position: "relative",
                  transform: persona.id === p.id ? "translateY(-2px)" : "none",
                  boxShadow: persona.id === p.id ? `0 4px 20px ${p.color}22` : "none",
                }}
              >
                {persona.id === p.id && (
                  <div style={{ position: "absolute", top: -1, right: 10, background: p.color, color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: "0 0 6px 6px" }}>
                    SELECTED
                  </div>
                )}
                <div style={{ width: 56, height: 56, margin: "0 auto 10px", borderRadius: "50%", overflow: "hidden", background: p.accent, border: `2px solid ${p.color}33` }}>
                  <RealisticAvatar size={56} isTalking={false} isThinking={false} emotion="neutral" skinTone="indian" shirtColor={p.color} avatarName="" showNameBadge={false} glowColor={p.color} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                  {p.id === "hr" ? "Culture & behavior focus" : p.id === "tech" ? "Technical depth probing" : p.id === "faang" ? "High-pressure rigor" : "Startup velocity"}
                </div>
              </div>
            ))}
          </div>

          {/* Role & Domain */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>Target Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: 13 }}
                >
                  {["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Scientist", "ML Engineer", "DevOps Engineer", "Product Manager", "System Design Engineer"].map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>Focus Domain</label>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: 13 }}
                >
                  {["Full Stack Development", "Data Structures & Algorithms", "System Design", "Machine Learning", "Cloud & DevOps", "Behavioral & HR", "Database Design", "Networking"].map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Features list */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: "1.5rem" }}>
            {[
              ["🎭", "Live avatar", "Real expressions & lip-sync"],
              ["🧠", "AI memory", "Remembers all your answers"],
              ["🎯", "Adaptive questions", "Adjusts to your level"],
              ["🎙️", "Voice input", "Speak your answers"],
              ["📊", "Live scoring", "Real-time evaluation"],
              ["⚡", "Instant feedback", "AI-powered analysis"],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{desc}</div>
              </div>
            ))}
          </div>

          <button
            onClick={startInterview}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              background: persona.color, color: "white",
              border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            Begin Interview with {persona.label} →
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: Interview ───────────────────────────────────────────────────────
  if (phase === "interview") {
    return (
      <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--color-background-tertiary)", display: "flex", gap: 0 }}>
        <h2 className="sr-only">AI Avatar Interview in Progress</h2>

        {/* Left: Avatar Panel */}
        <div style={{
          width: 280, flexShrink: 0, background: "var(--color-background-primary)",
          borderRight: "0.5px solid var(--color-border-tertiary)",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "1.5rem 1rem", gap: "1rem"
        }}>
          {/* Status pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: avatarState === "talking" ? `${persona.color}15` : avatarState === "thinking" ? "#F5F3FF" : avatarState === "listening" ? "#F0FDF4" : "var(--color-background-secondary)",
            border: `0.5px solid ${avatarState === "talking" ? persona.color : avatarState === "listening" ? "#22C55E" : "var(--color-border-tertiary)"}`,
            borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 600,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: avatarState === "talking" ? persona.color : avatarState === "thinking" ? "#8B5CF6" : avatarState === "listening" ? "#22C55E" : "#9CA3AF",
              animation: (avatarState === "talking" || avatarState === "thinking" || avatarState === "listening") ? "pulse 1s ease-in-out infinite" : "none",
            }} />
            <span style={{ color: "var(--color-text-secondary)" }}>
              {avatarState === "talking" ? "Speaking" : avatarState === "thinking" ? "Thinking..." : avatarState === "listening" ? "Listening" : "Idle"}
            </span>
          </div>

          {/* Avatar face */}
          <div style={{
            width: 160, height: 180,
            background: `linear-gradient(160deg, ${persona.accent}, ${persona.accent}88)`,
            borderRadius: 20,
            overflow: "visible",
            border: "none",
            boxShadow: avatarState === "talking" ? `0 0 0 6px ${persona.color}22, 0 0 0 12px ${persona.color}11` : "none",
            transition: "box-shadow 0.3s ease",
            position: "relative",
          }}>
            <RealisticAvatar
              size={160}
              isTalking={avatarState === "talking"}
              isThinking={avatarState === "thinking"}
              isListening={avatarState === "listening"}
              emotion={emotion}
              skinTone="indian"
              shirtColor={persona.color}
              avatarName=""
              showNameBadge={false}
              glowColor={persona.color}
            />
          </div>

          {/* Name + role */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-primary)" }}>
              {persona.id === "hr" ? "Sarah Chen" : persona.id === "tech" ? "Marcus Rivera" : persona.id === "faang" ? "Alex Kim" : "Jordan Lee"}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{persona.label}</div>
          </div>

          {/* Audio waveform */}
          <Waveform active={avatarState === "talking"} color={persona.color} />

          {/* Divider */}
          <div style={{ width: "100%", height: 0.5, background: "var(--color-border-tertiary)" }} />

          {/* Live scores */}
          <div style={{ width: "100%" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Live Score
            </div>
            <ScoreBar label="Communication" value={scores.communication} color={persona.color} />
            <ScoreBar label="Confidence" value={scores.confidence} color="#F59E0B" />
            <ScoreBar label="Accuracy" value={scores.accuracy} color="#10B981" />
            <ScoreBar label="Depth" value={scores.depth} color="#8B5CF6" />

            <div style={{ marginTop: 12, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: persona.color }}>{avgScore}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Overall Score</div>
            </div>
          </div>

          {/* Q count */}
          <div style={{ width: "100%", background: "var(--color-background-secondary)", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>{questionCount}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Questions Asked</div>
          </div>

          {/* End session */}
          <button
            onClick={() => { window.speechSynthesis?.cancel(); setPhase("report"); }}
            style={{ width: "100%", padding: "8px", borderRadius: 8, background: "transparent", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", fontSize: 12, cursor: "pointer", marginTop: "auto" }}
          >
            End & View Report
          </button>
        </div>

        {/* Right: Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          {/* Top bar */}
          <div style={{ padding: "12px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>{role} Interview</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{domain} · {persona.label}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
              Live
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
            {!interviewStarted && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, opacity: 0.6 }}>
                <div style={{ fontSize: 32 }}>🎤</div>
                <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Connecting to interviewer...</div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 10 }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: persona.accent, border: `1.5px solid ${persona.color}44`, overflow: "hidden", flexShrink: 0 }}>
                    <RealisticAvatar size={32} isTalking={false} isThinking={false} emotion="neutral" skinTone="indian" shirtColor={persona.color} avatarName="" showNameBadge={false} />
                  </div>
                )}
                <div style={{
                  maxWidth: "70%",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user" ? persona.color : "var(--color-background-primary)",
                  color: msg.role === "user" ? "white" : "var(--color-text-primary)",
                  fontSize: 14, lineHeight: 1.65,
                  border: msg.role === "assistant" ? "0.5px solid var(--color-border-tertiary)" : "none",
                }}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    👤
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: persona.accent, overflow: "hidden", flexShrink: 0 }}>
                  <RealisticAvatar size={32} isTalking={false} isThinking={true} emotion="neutral" skinTone="indian" shirtColor={persona.color} avatarName="" showNameBadge={false} />
                </div>
                <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "18px 18px 18px 4px", padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: persona.color, opacity: 0.7, animation: `dot-bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice transcript preview */}
          {(isListening || transcript) && (
            <div style={{ margin: "0 1.5rem 8px", padding: "10px 14px", background: "#F0FDF4", border: "0.5px solid #86EFAC", borderRadius: 10, fontSize: 13, color: "#166534" }}>
              <span style={{ fontWeight: 600 }}>🎙️ </span>{transcript || "Listening..."}
            </div>
          )}

          {/* Status text */}
          {statusText && !isListening && (
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{statusText}</div>
          )}

          {/* Input area */}
          <div style={{ padding: "12px 1.5rem 1.5rem", background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
              placeholder="Type your answer, or use the mic..."
              rows={2}
              style={{
                flex: 1, resize: "none", padding: "10px 14px", borderRadius: 12,
                border: "0.5px solid var(--color-border-secondary)",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)", fontSize: 14, lineHeight: 1.5,
                fontFamily: "inherit",
              }}
            />
            {sttSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={loading || isTTSPlaying}
                style={{
                  width: 44, height: 44, borderRadius: "50%", border: "none",
                  background: isListening ? "#22C55E" : "var(--color-background-secondary)",
                  border: `0.5px solid ${isListening ? "#22C55E" : "var(--color-border-secondary)"}`,
                  cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  animation: isListening ? "pulse 1s ease-in-out infinite" : "none",
                }}
              >
                {isListening ? "⏹" : "🎙️"}
              </button>
            )}
            <button
              onClick={sendAnswer}
              disabled={!userInput.trim() || loading || isTTSPlaying}
              style={{
                height: 44, padding: "0 20px", borderRadius: 12, border: "none",
                background: !userInput.trim() || loading ? "var(--color-background-secondary)" : persona.color,
                color: !userInput.trim() || loading ? "var(--color-text-secondary)" : "white",
                fontSize: 14, fontWeight: 600, cursor: !userInput.trim() || loading ? "not-allowed" : "pointer",
              }}
            >
              Send ↵
            </button>
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          @keyframes dot-bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
          .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
        `}</style>
      </div>
    );
  }

  // ── Phase: Report ─────────────────────────────────────────────────────────
  if (phase === "report") {
    const grade = avgScore >= 85 ? "A" : avgScore >= 70 ? "B" : avgScore >= 55 ? "C" : "D";
    const verdict = avgScore >= 85 ? "Excellent — Strong Hire" : avgScore >= 70 ? "Good — Likely Hire" : avgScore >= 55 ? "Average — Borderline" : "Needs Improvement";
    const verdictColor = avgScore >= 85 ? "#10B981" : avgScore >= 70 ? "#3B82F6" : avgScore >= 55 ? "#F59E0B" : "#EF4444";

    return (
      <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--color-background-tertiary)", padding: "2rem 1rem" }}>
        <h2 className="sr-only">Interview Performance Report</h2>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 6px" }}>Interview Complete</h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>
              Interviewed by {persona.id === "hr" ? "Sarah Chen" : persona.id === "tech" ? "Marcus Rivera" : persona.id === "faang" ? "Alex Kim" : "Jordan Lee"} · {questionCount} questions
            </p>
          </div>

          {/* Score card */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, padding: "2rem", marginBottom: 16, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: "1.5rem" }}>
              <div>
                <div style={{ fontSize: 64, fontWeight: 800, color: persona.color, lineHeight: 1 }}>{avgScore}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Overall Score</div>
              </div>
              <div style={{ width: 0.5, height: 60, background: "var(--color-border-tertiary)" }} />
              <div>
                <div style={{ fontSize: 48, fontWeight: 800, color: verdictColor, lineHeight: 1 }}>{grade}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Grade</div>
              </div>
            </div>
            <div style={{ display: "inline-block", padding: "6px 20px", borderRadius: 999, background: `${verdictColor}15`, border: `1px solid ${verdictColor}44`, color: verdictColor, fontWeight: 700, fontSize: 13 }}>
              {verdict}
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, padding: "1.5rem", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: "var(--color-text-primary)" }}>Score Breakdown</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["Communication", scores.communication, persona.color],
                ["Confidence", scores.confidence, "#F59E0B"],
                ["Accuracy", scores.accuracy, "#10B981"],
                ["Technical Depth", scores.depth, "#8B5CF6"],
              ].map(([label, val, color]) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{val}%</span>
                  </div>
                  <div style={{ height: 8, background: "var(--color-background-secondary)", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${val}%`, background: color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation summary */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, padding: "1.5rem", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "var(--color-text-primary)" }}>Interview Transcript</div>
            <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: msg.role === "user" ? `${persona.color}10` : "var(--color-background-secondary)", borderLeft: `3px solid ${msg.role === "user" ? persona.color : "var(--color-border-tertiary)"}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: msg.role === "user" ? persona.color : "var(--color-text-secondary)", marginBottom: 3 }}>
                    {msg.role === "user" ? "You" : persona.id === "hr" ? "Sarah" : persona.id === "tech" ? "Marcus" : persona.id === "faang" ? "Alex" : "Jordan"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{msg.content}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              onClick={() => { setPhase("select"); setMessages([]); setSessionMemory([]); setQuestionCount(0); setScores({ communication: 70, confidence: 65, accuracy: 72, depth: 68 }); }}
              style={{ padding: "12px", borderRadius: 12, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-primary)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              New Interview
            </button>
            <button
              onClick={() => startInterview()}
              style={{ padding: "12px", borderRadius: 12, background: persona.color, border: "none", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Retry Same Setup
            </button>
          </div>
        </div>
        <style>{`.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }`}</style>
      </div>
    );
  }

  return null;
}