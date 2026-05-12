/**
 * GD WebSocket Socket.IO Logic
 * Namespace: /gd
 */
const AI_NAMES   = ['Arjun AI','Priya AI','Rahul AI','Sneha AI','Vikram AI'];
const AI_OPENERS = [
  t=>`We should consider that ${t} has both immediate and long-term societal implications.`,
  t=>`The statement "${t}" is multifaceted — we must weigh economic, social, and ethical dimensions equally.`,
  t=>`Regarding "${t}", I believe the developing-world perspective is often underrepresented in mainstream discourse.`,
];
const AI_FILLERS = [
  'I agree with some points raised, but stakeholders most affected deserve equal consideration.',
  'Could we explore what this means for Tier-2 and Tier-3 cities specifically?',
  'The data clearly supports both sides — the key is sustainable implementation.',
  'Building on what was said, industry readiness is a critical factor we haven\'t fully explored.',
];
const AI_CLOSERS = [
  'To summarise, this topic has valid arguments on both sides. A balanced, context-aware approach is ideal.',
  'In conclusion, incremental policy changes with continuous monitoring would be the most pragmatic path forward.',
];

async function generateTopic(GDRoom, room) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const cats  = {
      TCS:['Digital India','Cloud Computing','Cybersecurity','IT Ethics','AI Automation'],
      Infosys:['AI in Finance','Blockchain','Sustainability in IT','Digital Transformation'],
      Wipro:['Climate Tech','EdTech','5G Impact','Healthcare AI'],
      Cognizant:['Remote Work','Diversity in Tech','Open Source','DevSecOps'],
      Capgemini:['Smart Cities','EV Revolution','Data Privacy','Metaverse'],
      Accenture:['ESG Business','Future of Work','Digital Health','Inclusive Growth'],
    };
    const list = cats[room.companyContext] || ['AI & Society','Startup Culture','India@2047','Education Reform','Mental Health'];
    const cat  = list[Math.floor(Math.random() * list.length)];
    const prompt = `Generate ONE concise Group Discussion topic for ${room.companyContext||'a top IT'} company placement. Category: ${cat}. Difficulty: ${room.difficulty}. Make it debatable, 8-12 words, no question marks. Return ONLY the topic text.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim().replace(/['"]/g,'');
  } catch {
    const fallback = ['AI will eliminate more jobs than it creates','India needs Universal Basic Income now','Social media regulation harms free speech','Remote work permanently changes urban economies'];
    return fallback[Math.floor(Math.random()*fallback.length)];
  }
}

async function evaluateAll(GDRoom, roomCode) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const room  = await GDRoom.findOne({ roomCode });
    if (!room) return;

    for (let i = 0; i < room.participants.length; i++) {
      const p = room.participants[i];
      if (p.isAI) continue;
      const speech = (p.transcript||[]).map(t=>t.text).join(' ').slice(0,600);
      const prompt = `You are a corporate HR evaluator for a GD round. Topic: "${room.topic}". Participant "${p.name}" spoke for ${p.speakingTime}s, used ${p.wordCount} words, ${p.fillerWords} filler words, ${p.interruptions} interruptions. Speech: "${speech}". Score 0-100 on communication, confidence, leadership, participation. JSON only: {"communication":N,"confidence":N,"leadership":N,"participation":N,"overall":N,"strengths":["s1","s2"],"improvements":["i1","i2"],"summary":"2 sentences"}`;
      try {
        const r = await model.generateContent(prompt);
        const t = r.response.text().trim().replace(/\`\`\`json|\`\`\`/g,'');
        const s = JSON.parse(t);
        s.overall = Math.round((s.communication+s.confidence+s.leadership+s.participation)/4);
        room.participants[i].aiScore = s;
      } catch {
        const b = 50+Math.floor(Math.random()*25);
        room.participants[i].aiScore = {
          communication:b, confidence:b-5, leadership:b-10, participation:b+5, overall:b,
          strengths:['Active participant','Clear examples'],
          improvements:['Reduce hesitation','More assertive tone'],
          summary:'Showed decent participation. With more practice, can become a strong GD performer.',
        };
      }
    }
    await room.save();
    return room;
  } catch(err){ console.error('[evaluateAll]',err.message); }
}

function registerGDSocket(io, GDRoom) {
  const gdIO = io.of('/gd');
  const timers = {};  // roomCode → timeoutId

  gdIO.on('connection', socket => {
    console.log('[GD] socket connected:', socket.id);

    // ── JOIN ROOM ─────────────────────────────────────────────────────────────
    socket.on('join-room', async ({ roomCode, userId, userName }) => {
      try {
        const room = await GDRoom.findOne({ roomCode });
        if (!room) { socket.emit('error','Room not found'); return; }

        if (['locked','prep','active','completed'].includes(room.state)) {
          socket.emit('room-locked', { message:'Group Discussion has already started. Please wait for the next session.' });
          return;
        }
        if (room.participants.length >= room.maxParticipants) {
          socket.emit('room-full', { message:'Room is full. Please join another session.' }); return;
        }

        const already = room.participants.find(p=>p.userId?.toString()===userId);
        if (!already) room.participants.push({ userId, name:userName, socketId:socket.id, isAI:false });
        else          already.socketId = socket.id;
        await room.save();

        socket.join(roomCode);
        socket.data = { roomCode, userId, userName };

        const parts = room.participants.map(p=>({ userId:p.userId, name:p.name, isAI:p.isAI }));
        gdIO.to(roomCode).emit('participant-update', {
          participants:parts, count:room.participants.length,
          required:room.minParticipants, max:room.maxParticipants, state:room.state,
        });
        socket.emit('joined', { roomCode, state:room.state, participants:parts });

        // Auto-lock when min reached
        if (room.participants.filter(p=>!p.isAI).length >= room.minParticipants && room.state==='waiting') {
          await doLock(room, roomCode, gdIO, GDRoom, timers);
        }
      } catch(err){ console.error('[join-room]',err.message); socket.emit('error',err.message); }
    });

    // ── SPEECH UPDATE (from client STT) ──────────────────────────────────────
    socket.on('speech-update', async ({ roomCode, userId, text, delta }) => {
      try {
        const room = await GDRoom.findOne({ roomCode });
        if (!room || room.state!=='active') return;
        const p = room.participants.find(p=>p.userId?.toString()===userId);
        if (p && text) {
          p.speakingTime += (delta?.speakingTime||0);
          p.wordCount    += (delta?.wordCount||0);
          p.fillerWords  += (delta?.fillerWords||0);
          p.transcript.push({ time:Date.now(), text });
          await room.save();
          gdIO.to(roomCode).emit('caption', { userId, userName:p.name, text });
        }
      } catch(err){ console.error('[speech-update]',err.message); }
    });

    // ── INTERRUPT ────────────────────────────────────────────────────────────
    socket.on('interrupt', async ({ roomCode, userId }) => {
      try {
        const room = await GDRoom.findOne({ roomCode });
        if (!room) return;
        const p = room.participants.find(p=>p.userId?.toString()===userId);
        if (p){ p.interruptions+=1; await room.save(); }
      } catch {}
    });

    // ── MANUAL END ───────────────────────────────────────────────────────────
    socket.on('end-session', async ({ roomCode }) => {
      await doEnd(roomCode, gdIO, GDRoom, timers);
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode) return;
      try {
        const room = await GDRoom.findOne({ roomCode });
        if (!room) return;
        const p = room.participants.find(p=>p.userId?.toString()===userId);
        if (p) p.socketId = null;
        await room.save();
        gdIO.to(roomCode).emit('participant-left', { userId, userName:p?.name });
      } catch {}
    });
  });

  return gdIO;
}

// ── LOCK & START ──────────────────────────────────────────────────────────────
async function doLock(room, roomCode, namespace, GDRoom, timers) {
  try {
    const topic = await generateTopic(GDRoom, room);
    room.topic    = topic;
    room.state    = 'locked';
    room.lockedAt = new Date();
    await room.save();

    namespace.to(roomCode).emit('room-locked-announce', {
      message:'The Group Discussion session is now locked. No further participants can join.',
      participants: room.participants.map(p=>({ name:p.name, isAI:p.isAI })),
    });

    // Fill remaining slots with AI if needed
    const humanCount = room.participants.filter(p=>!p.isAI).length;
    if (humanCount < room.minParticipants) {
      for (let i=0; i<(room.minParticipants-humanCount); i++) {
        room.participants.push({ name:AI_NAMES[i%AI_NAMES.length], isAI:true, speakingTime:45+Math.floor(Math.random()*60), wordCount:120+Math.floor(Math.random()*80), uniquePoints:3, fillerWords:Math.floor(Math.random()*5) });
      }
      await room.save();
    }

    // PREP phase
    room.state = 'prep';
    await room.save();
    namespace.to(roomCode).emit('prep-phase', {
      duration:room.prepSeconds,
      message:`Prepare your thoughts. Topic will be revealed in ${room.prepSeconds} seconds.`,
    });

    // After prep — reveal topic, start
    const prepTimer = setTimeout(async () => {
      const r = await GDRoom.findOne({ roomCode });
      if (!r || r.state==='completed') return;
      r.state    = 'active';
      r.startedAt = new Date();
      await r.save();

      namespace.to(roomCode).emit('discussion-start', {
        topic, duration:r.durationSeconds,
        message:`The topic is: "${topic}". You have ${Math.round(r.durationSeconds/60)} minutes. Begin now.`,
      });

      // AI opener at 8s
      setTimeout(()=>{
        namespace.to(roomCode).emit('caption',{
          userId:'ai-0', userName:AI_NAMES[0], text:AI_OPENERS[Math.floor(Math.random()*AI_OPENERS.length)](topic), isAI:true,
        });
      }, 8000);

      // AI filler at 2.5 min
      setTimeout(()=>{
        namespace.to(roomCode).emit('caption',{
          userId:'ai-1', userName:AI_NAMES[1], text:AI_FILLERS[Math.floor(Math.random()*AI_FILLERS.length)], isAI:true,
        });
      }, 150000);

      // AI closer at 1 min before end
      const closerDelay = Math.max((r.durationSeconds-60)*1000, 0);
      setTimeout(()=>{
        namespace.to(roomCode).emit('caption',{
          userId:'ai-0', userName:AI_NAMES[0], text:AI_CLOSERS[Math.floor(Math.random()*AI_CLOSERS.length)], isAI:true,
        });
        namespace.to(roomCode).emit('time-warning', { secondsLeft:60 });
      }, closerDelay);

      // Auto-end
      const endTimer = setTimeout(()=>doEnd(roomCode, namespace, GDRoom, timers), r.durationSeconds*1000);
      timers[roomCode] = endTimer;

    }, room.prepSeconds*1000);
    timers[`prep_${roomCode}`] = prepTimer;

  } catch(err){ console.error('[doLock]',err.message); }
}

async function doEnd(roomCode, namespace, GDRoom, timers) {
  try {
    if (timers[roomCode]) { clearTimeout(timers[roomCode]); delete timers[roomCode]; }
    const room = await GDRoom.findOne({ roomCode });
    if (!room || room.state==='completed') return;
    room.state   = 'completed';
    room.endedAt = new Date();
    await room.save();

    namespace.to(roomCode).emit('session-ended', {
      message:'Session ended. Generating AI evaluation reports…', roomCode,
    });

    // Evaluate all participants
    const evaluated = await evaluateAll(GDRoom, roomCode);
    if (evaluated) {
      namespace.to(roomCode).emit('evaluation-ready', {
        roomCode,
        participants: evaluated.participants.map(p=>({
          userId:p.userId, name:p.name, isAI:p.isAI, aiScore:p.aiScore,
          speakingTime:p.speakingTime, wordCount:p.wordCount,
        })),
      });
    }
  } catch(err){ console.error('[doEnd]',err.message); }
}

module.exports = { registerGDSocket };
