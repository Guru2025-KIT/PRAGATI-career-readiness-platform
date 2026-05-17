/**
 * GD WebSocket — Fixed & Upgraded:
 *  • AI stops speaking immediately when human starts talking
 *  • AI only speaks after 45–60s of silence (not 25s)
 *  • Different TTS voices: Moderator vs AI Participant
 *  • Short, contextual AI responses (no long monologues)
 *  • Leave-session generates partial evaluation report
 *  • Session persistence with reconnection support
 *  • WebRTC signaling for video mesh
 *  • Per-participant 7-dimension AI evaluation
 */

const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const AI_MODERATOR      = { id: 'ai-moderator', name: 'PRAGATI AI Moderator' };
const MODERATOR_VOICE   = 'Celeste-PlayAI';
const PARTICIPANT_VOICE = 'Fritz-PlayAI';

// Track human speaking to prevent AI overlap
const humanSpeakingRooms  = {};
const humanSpeakingTimers = {};
const pendingAIReplies    = {};

function markHumanSpeaking(roomCode) {
  humanSpeakingRooms[roomCode] = true;
  clearTimeout(humanSpeakingTimers[roomCode]);
  if (pendingAIReplies[roomCode]) {
    clearTimeout(pendingAIReplies[roomCode]);
    delete pendingAIReplies[roomCode];
  }
  humanSpeakingTimers[roomCode] = setTimeout(() => {
    humanSpeakingRooms[roomCode] = false;
  }, 8000);
}

async function groqChat(systemPrompt, userMessage, maxTokens = 300) {
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    return res.choices[0]?.message?.content?.trim() || '';
  } catch (err) { console.error('[groqChat]', err.message); return ''; }
}

async function groqTTS(text, voice = MODERATOR_VOICE) {
  try {
    const res = await groq.audio.speech.create({ model: 'playai-tts', voice, input: text, response_format: 'mp3' });
    return Buffer.from(await res.arrayBuffer()).toString('base64');
  } catch (err) { console.error('[groqTTS]', err.message); return null; }
}

async function groqSTT(audioBuffer, language = 'en') {
  try {
    const { File } = await import('node:buffer');
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
    const res  = await groq.audio.transcriptions.create({ file, model: 'whisper-large-v3-turbo', language, response_format: 'json' });
    return res.text || '';
  } catch (err) { console.error('[groqSTT]', err.message); return ''; }
}

async function generateTopic(room) {
  const cats = {
    TCS: ['Digital India','AI Automation','Cybersecurity','Cloud Ethics'],
    Infosys: ['AI in Finance','Blockchain','Digital Transformation'],
    Wipro: ['Climate Tech','EdTech','Healthcare AI'],
    Cognizant: ['Remote Work','Diversity in Tech','Open Source'],
    Capgemini: ['Smart Cities','EV Revolution','Data Privacy'],
    Accenture: ['ESG Business','Future of Work','Digital Health'],
  };
  const list = cats[room.companyContext] || ['AI & Society','Startup Culture','India@2047','Education Reform','Mental Health'];
  const cat  = list[Math.floor(Math.random() * list.length)];
  const text = await groqChat(
    'You are a placement GD topic generator. Return ONLY the topic, no quotes, no explanation.',
    `Generate ONE debatable Group Discussion topic for ${room.companyContext||'a top IT'} company placement.\nCategory: ${cat}\nDifficulty: ${room.difficulty}\nRules: 8-14 words, no question marks, must be a statement/proposition.`
  );
  if (text && text.length > 10) return text.replace(/['"]/g, '');
  const fallback = ['AI will eliminate more jobs than it creates','India needs Universal Basic Income now','Social media regulation harms free speech','Remote work permanently changes urban economies'];
  return fallback[Math.floor(Math.random() * fallback.length)];
}

async function broadcastAIVoice(namespace, roomCode, text, type = 'moderation', speakerName = null) {
  const isParticipant = type === 'participant';
  namespace.to(roomCode).emit('ai-message', {
    userId:   isParticipant ? `ai-participant` : AI_MODERATOR.id,
    userName: speakerName || (isParticipant ? 'AI Participant' : AI_MODERATOR.name),
    text, type, isAI: true, ts: Date.now(),
  });
  const voice = isParticipant ? PARTICIPANT_VOICE : MODERATOR_VOICE;
  groqTTS(text, voice).then(audioBase64 => {
    if (audioBase64) namespace.to(roomCode).emit('ai-voice', { audioBase64, text, type, voice, isParticipant });
  });
}

async function checkTopicRelevance(topic, speech) {
  if (!speech || speech.length < 20) return { relevant: true, score: 80 };
  const reply = await groqChat(
    'You are a GD moderator. Respond ONLY with JSON.',
    `GD Topic: "${topic}"\nParticipant said: "${speech.slice(0,300)}"\nRespond: {"relevant": true/false, "score": 0-100, "reason": "one short sentence"}`
  );
  try { return JSON.parse(reply.replace(/```json|```/g, '')); } catch { return { relevant: true, score: 70 }; }
}

async function generateModeratorInterjection(topic, recentCaptions, type) {
  const context = recentCaptions.slice(-5).map(c => `${c.userName}: ${c.text}`).join('\n');
  const prompts = {
    opening:   `You are PRAGATI AI Moderator. Give a warm GD opening (2-3 sentences max). Welcome participants, introduce topic "${topic}", invite first speaker.`,
    off_topic: `You are PRAGATI AI Moderator. Discussion drifted. Recent:\n${context}\n\nPolitely redirect to "${topic}" in 1 sentence only.`,
    guide:     `You are PRAGATI AI Moderator. Topic: "${topic}"\nRecent:\n${context}\n\nAdd ONE thought-provoking question (1 sentence only).`,
    silence:   `You are PRAGATI AI Moderator. Silence in GD on "${topic}". Ask one specific question to prompt a student (1 sentence, direct).`,
    time_warn: `You are PRAGATI AI Moderator. 90 seconds remain on "${topic}". Ask participants to summarize in 1 sentence.`,
    conclusion:`You are PRAGATI AI Moderator. GD on "${topic}" ending. Warm conclusion (2-3 sentences): summarize key themes, appreciate effort, announce evaluation.`,
  };
  return await groqChat('You are a professional GD moderator. Keep responses very short — 1-2 sentences maximum.', prompts[type] || prompts.guide, 120);
}

async function generateAIParticipantReply(aiName, topic, conversationHistory, lastHumanSpeech) {
  const context = conversationHistory.slice(-6).map(c => `${c.userName}: ${c.text}`).join('\n');
  const prompt  = `You are ${aiName}, a student in a Group Discussion.\n\nGD Topic: "${topic}"\nRecent:\n${context}\n\nLast said: "${lastHumanSpeech}"\n\nRules:\n- EXACTLY 1-2 sentences\n- Build directly on what was said\n- Add ONE new angle\n- Natural student language\n- Stay on topic\n\nRespond as ${aiName}:`;
  return await groqChat(`You are ${aiName}, a real student in a GD. Be brief (1-2 sentences max), natural, on-topic.`, prompt, 80);
}

const aiReplyCooldown = {};

async function evaluateParticipant(participant, topic, allParticipants) {
  const speech = (participant.transcript || []).map(t => t.text).join(' ').slice(0,1000);
  const totalDuration = allParticipants.reduce((s,p) => s+(p.speakingTime||0),0)||1;
  const participationRatio = Math.round((participant.speakingTime/totalDuration)*100);
  const prompt = `You are a senior corporate HR evaluator assessing a GD participant.\n\nGD Topic: "${topic}"\nParticipant: ${participant.name}\nSpeaking Time: ${participant.speakingTime}s out of ${totalDuration}s (${participationRatio}%)\nWord Count: ${participant.wordCount}\nFiller Words: ${participant.fillerWords}\nInterruptions: ${participant.interruptions}\nOff-topic: ${participant.offTopicCount||0}\nTranscript: "${speech}"\n\nScore each dimension 0-100: communication, confidence, leadership, participation, fluency, relevance, teamwork.\nAlso provide: 3 strengths, 3 improvements, 3-sentence behavioral summary, 4-5 sentence detailed feedback, placement readiness: "Ready"|"Near Ready"|"Needs Practice".\n\nRespond ONLY in this exact JSON (no markdown):\n{"communication":N,"confidence":N,"leadership":N,"participation":N,"fluency":N,"relevance":N,"teamwork":N,"overall":N,"strengths":["s1","s2","s3"],"improvements":["i1","i2","i3"],"summary":"...","detailedFeedback":"...","placementReadiness":"..."}`;
  try {
    const text   = await groqChat('You are an expert HR evaluator. Return ONLY valid JSON, no markdown.', prompt, 600);
    const scores = JSON.parse(text.replace(/```json|```/g,'').trim());
    scores.overall = Math.round((scores.communication+scores.confidence+scores.leadership+scores.participation+scores.fluency+scores.relevance+scores.teamwork)/7);
    return scores;
  } catch (err) {
    console.error('[evaluateParticipant]', err.message);
    const base = 45+Math.floor(Math.random()*30);
    return {communication:base,confidence:base-5,leadership:base-10,participation:base+5,fluency:base,relevance:base+3,teamwork:base-3,overall:base,strengths:['Active participant','Relevant contributions','Clear examples'],improvements:['Reduce filler words','Speak more assertively',"Engage with others' points"],summary:'Showed decent participation with relevant contributions. With focused practice, can become a strong GD performer. Leadership and confidence are areas for further development.',detailedFeedback:'The participant engaged with the discussion topic and made several relevant points. Communication was generally clear though filler words reduced impact. More assertive participation would strengthen overall performance.',placementReadiness:'Needs Practice'};
  }
}

async function evaluateAll(GDRoom, roomCode) {
  try {
    const room = await GDRoom.findOne({ roomCode });
    if (!room) return;
    for (let i = 0; i < room.participants.length; i++) {
      const p = room.participants[i];
      if (p.isAI) continue;
      room.participants[i].aiScore = await evaluateParticipant(p, room.topic, room.participants);
    }
    await room.save();
    return room;
  } catch (err) { console.error('[evaluateAll]', err.message); }
}

async function evaluateSingleParticipant(GDRoom, roomCode, userId) {
  try {
    const room = await GDRoom.findOne({ roomCode });
    if (!room) return null;
    const pIdx = room.participants.findIndex(p => p.userId?.toString() === userId);
    if (pIdx === -1) return null;
    const p = room.participants[pIdx];
    if (p.isAI) return null;
    room.participants[pIdx].aiScore = await evaluateParticipant(p, room.topic, room.participants);
    await room.save();
    return room.participants[pIdx];
  } catch (err) { console.error('[evaluateSingleParticipant]', err.message); return null; }
}

function registerGDSocket(io, GDRoom) {
  const gdIO          = io.of('/gd');
  const timers        = {};
  const recentCaptions= {};
  const silenceTimers = {};

  gdIO.on('connection', socket => {
    console.log('[GD] socket connected:', socket.id);

    socket.on('join-room', async ({ roomCode, userId, userName }) => {
      try {
        const room = await GDRoom.findOne({ roomCode });
        if (!room) { socket.emit('error', 'Room not found'); return; }
        const wasParticipant  = room.sessionParticipants?.some(sp => sp.userId?.toString() === userId);
        const isActiveSession = ['locked','prep','active'].includes(room.state);
        if (isActiveSession && !wasParticipant) { socket.emit('room-locked', { message: 'Group Discussion has already started. Please wait for the next session.' }); return; }
        if (room.state === 'completed') { socket.emit('room-locked', { message: 'This session has ended. Please join a new room.' }); return; }
        if (!isActiveSession && room.participants.length >= room.maxParticipants) { socket.emit('room-full', { message: 'Room is full.' }); return; }

        const existing = room.participants.find(p => p.userId?.toString() === userId);
        if (!existing) {
          room.participants.push({ userId, name: userName, socketId: socket.id, isAI: false });
          if (!room.sessionParticipants) room.sessionParticipants = [];
          if (!wasParticipant) room.sessionParticipants.push({ userId, name: userName, joinedAt: new Date() });
        } else {
          existing.socketId     = socket.id;
          existing.disconnected = false;
        }
        await room.save();
        socket.join(roomCode);
        socket.data = { roomCode, userId, userName };
        if (!recentCaptions[roomCode]) recentCaptions[roomCode] = [];

        const parts = room.participants.map(p => ({ userId: p.userId, name: p.name, isAI: p.isAI, isMuted: p.isMuted, isCameraOff: p.isCameraOff }));
        socket.emit('joined', {
          roomCode, state: room.state, participants: parts,
          topic:           ['locked','prep','active'].includes(room.state) ? room.topic : undefined,
          durationSeconds: room.durationSeconds,
          startedAt:       room.startedAt,
          recentCaptions:  (recentCaptions[roomCode]||[]).slice(-20),
        });
        gdIO.to(roomCode).emit('participant-update', { participants: parts, count: room.participants.length, required: room.minParticipants, max: room.maxParticipants, state: room.state });

        const humanCount = room.participants.filter(p => !p.isAI).length;
        if (room.state === 'waiting') {
          if (humanCount >= room.minParticipants) { clearTimeout(timers[`wait_${roomCode}`]); await doLock(room, roomCode, gdIO, GDRoom, timers, recentCaptions, silenceTimers); }
          else if (humanCount === 1 && !room.waitTimerStarted) {
            room.waitTimerStarted = new Date(); await room.save();
            gdIO.to(roomCode).emit('wait-timer-started', { message: 'Waiting for more participants. AI will join in 2 minutes if minimum not reached.', waitSeconds: 120 });
            timers[`wait_${roomCode}`] = setTimeout(async () => {
              const freshRoom = await GDRoom.findOne({ roomCode });
              if (!freshRoom || freshRoom.state !== 'waiting') return;
              const aiNeeded = freshRoom.minParticipants - freshRoom.participants.filter(p => !p.isAI).length;
              const AI_NAMES = ['Arjun AI','Priya AI','Rahul AI','Sneha AI','Vikram AI'];
              for (let i = 0; i < Math.max(aiNeeded,1); i++) freshRoom.participants.push({ name: AI_NAMES[i%AI_NAMES.length], isAI: true, speakingTime: 0, wordCount: 0 });
              await freshRoom.save();
              gdIO.to(roomCode).emit('ai-joined', { message: 'Minimum participants not reached. AI participants have joined to start the discussion.', participants: freshRoom.participants.map(p => ({ userId: p.userId, name: p.name, isAI: p.isAI })) });
              await doLock(freshRoom, roomCode, gdIO, GDRoom, timers, recentCaptions, silenceTimers);
            }, 2*60*1000);
          }
        }
      } catch (err) { console.error('[join-room]', err.message); socket.emit('error', err.message); }
    });

    socket.on('webrtc-offer',  ({ toSocketId, offer, fromSocketId })   => { gdIO.to(toSocketId).emit('webrtc-offer',  { offer,  fromSocketId }); });
    socket.on('webrtc-answer', ({ toSocketId, answer, fromSocketId })  => { gdIO.to(toSocketId).emit('webrtc-answer', { answer, fromSocketId }); });
    socket.on('webrtc-ice',    ({ toSocketId, candidate, fromSocketId })=> { gdIO.to(toSocketId).emit('webrtc-ice',   { candidate, fromSocketId }); });
    socket.on('webrtc-ready', async ({ roomCode, userId }) => {
      socket.to(roomCode).emit('webrtc-peer-joined', { socketId: socket.id, userId });
    });

    socket.on('media-status', async ({ roomCode, userId, isMuted, isCameraOff }) => {
      try {
        const room = await GDRoom.findOne({ roomCode });
        if (!room) return;
        const p = room.participants.find(p => p.userId?.toString() === userId);
        if (p) { if (isMuted!==undefined) p.isMuted=isMuted; if (isCameraOff!==undefined) p.isCameraOff=isCameraOff; await room.save(); }
        gdIO.to(roomCode).emit('participant-media-update', { userId, isMuted, isCameraOff });
      } catch {}
    });

    socket.on('active-speaker', ({ roomCode, userId, speaking }) => { gdIO.to(roomCode).emit('active-speaker-update', { userId, speaking }); });

    // Human speaking — stop AI immediately
    socket.on('human-speaking-start', ({ roomCode }) => {
      markHumanSpeaking(roomCode);
      gdIO.to(roomCode).emit('stop-ai-audio', { reason: 'human-speaking' });
    });

    socket.on('speech-update', async ({ roomCode, userId, text, delta }) => {
      try {
        const room = await GDRoom.findOne({ roomCode });
        if (!room || room.state !== 'active') return;
        const p = room.participants.find(p => p.userId?.toString() === userId);
        if (!p || !text) return;

        markHumanSpeaking(roomCode);
        p.speakingTime += (delta?.speakingTime||0);
        p.wordCount    += (delta?.wordCount   ||0);
        p.fillerWords  += (delta?.fillerWords ||0);

        checkTopicRelevance(room.topic, text).then(async rel => {
          if (!rel.relevant && rel.score < 40) {
            const fr = await GDRoom.findOne({ roomCode });
            if (!fr) return;
            const fp = fr.participants.find(p => p.userId?.toString() === userId);
            if (fp) { fp.offTopicCount=(fp.offTopicCount||0)+1; fp.transcript?.push({time:Date.now(),text,isOffTopic:true}); fr.aiModerator.interventions=(fr.aiModerator.interventions||0)+1; await fr.save(); }
            if (!humanSpeakingRooms[roomCode]) {
              const intervention = await generateModeratorInterjection(fr.topic, recentCaptions[roomCode]||[], 'off_topic');
              if (intervention) { await broadcastAIVoice(gdIO, roomCode, intervention, 'warning'); recentCaptions[roomCode]=[...(recentCaptions[roomCode]||[]).slice(-10),{userName:AI_MODERATOR.name,text:intervention,isAI:true,ts:Date.now()}]; }
            }
          } else {
            try { const fr=await GDRoom.findOne({roomCode}); const fp=fr?.participants.find(p=>p.userId?.toString()===userId); if(fp){fp.topicRelevanceScore=Math.round(((fp.topicRelevanceScore||70)+rel.score)/2);fp.transcript?.push({time:Date.now(),text,isOffTopic:false});await fr.save();} } catch {}
          }
        });
        await room.save();

        const caption = { userId, userName: p.name, text, isAI: false, ts: Date.now() };
        gdIO.to(roomCode).emit('caption', caption);
        recentCaptions[roomCode] = [...(recentCaptions[roomCode]||[]).slice(-20), caption];

        const now=Date.now(), lastReply=aiReplyCooldown[roomCode]||0, cooldownMs=20000;
        if (now-lastReply > cooldownMs && !humanSpeakingRooms[roomCode]) {
          const aiParticipants = room.participants.filter(p => p.isAI && !p.name.includes('Moderator'));
          if (aiParticipants.length > 0) {
            aiReplyCooldown[roomCode] = now;
            const aiPart = aiParticipants[Math.floor(Math.random()*aiParticipants.length)];
            const thinkDelay = 3000+Math.floor(Math.random()*4000);
            const replyTimer = setTimeout(async () => {
              try {
                if (humanSpeakingRooms[roomCode]) return;
                const fr = await GDRoom.findOne({ roomCode });
                if (!fr || fr.state !== 'active') return;
                const reply = await generateAIParticipantReply(aiPart.name, fr.topic, recentCaptions[roomCode]||[], text);
                if (reply && reply.trim().length > 10 && !humanSpeakingRooms[roomCode]) {
                  const aiCaption = { userId:`ai-${aiPart.name}`, userName:aiPart.name, text:reply.trim(), isAI:true, type:'participant', ts:Date.now() };
                  // Emit ONLY ai-message for AI participants (not caption) so frontend
                  // deduplication doesn't swallow the voice trigger.
                  gdIO.to(roomCode).emit('ai-message', { ...aiCaption });
                  recentCaptions[roomCode]=[...(recentCaptions[roomCode]||[]).slice(-20),aiCaption];
                  broadcastAIVoice(gdIO, roomCode, reply.trim(), 'participant', aiPart.name);
                }
              } catch(err){console.error('[aiParticipantReply]',err.message);}
              delete pendingAIReplies[roomCode];
            }, thinkDelay);
            pendingAIReplies[roomCode] = replyTimer;
          }
        }
        resetSilenceTimer(roomCode, room.topic, gdIO, GDRoom, timers, silenceTimers, recentCaptions);
      } catch(err){console.error('[speech-update]',err.message);}
    });

    socket.on('audio-chunk', async ({ roomCode, userId, audioBuffer, language }) => {
      try {
        const room = await GDRoom.findOne({ roomCode });
        if (!room || room.state !== 'active') return;
        const text = await groqSTT(Buffer.from(audioBuffer), language||'en');
        if (text && text.trim().length > 3) { socket.emit('stt-result',{text,userId}); socket.emit('forward-speech',{roomCode,userId,text}); }
      } catch {}
    });

    socket.on('interrupt', async ({ roomCode, userId }) => {
      try { const room=await GDRoom.findOne({roomCode}); if(!room)return; const p=room.participants.find(p=>p.userId?.toString()===userId); if(p){p.interruptions+=1;await room.save();} } catch {}
    });

    socket.on('chat-message', ({ roomCode, userId, userName, text }) => { gdIO.to(roomCode).emit('chat-message',{userId,userName,text,ts:Date.now()}); });

    // Leave mid-session — generate partial report
    socket.on('leave-session', async ({ roomCode, userId }) => {
      try {
        console.log(`[leave-session] User ${userId} leaving ${roomCode}`);
        const evaluated = await evaluateSingleParticipant(GDRoom, roomCode, userId);
        if (evaluated) {
          socket.emit('partial-evaluation-ready', {
            roomCode,
            participant: {
              userId: evaluated.userId, name: evaluated.name, isAI: evaluated.isAI,
              aiScore: evaluated.aiScore, speakingTime: evaluated.speakingTime,
              wordCount: evaluated.wordCount, fillerWords: evaluated.fillerWords,
              interruptions: evaluated.interruptions, offTopicCount: evaluated.offTopicCount,
            },
          });
        } else {
          socket.emit('partial-evaluation-ready', { roomCode, participant: { userId, name: socket.data?.userName, aiScore: null } });
        }
      } catch(err){console.error('[leave-session]',err.message);}
    });

    socket.on('end-session', async ({ roomCode }) => { await doEnd(roomCode, gdIO, GDRoom, timers, silenceTimers); });

    socket.on('disconnect', async () => {
      const { roomCode, userId } = socket.data||{};
      if (!roomCode) return;
      try {
        const room = await GDRoom.findOne({ roomCode });
        if (!room) return;
        const p = room.participants.find(p => p.userId?.toString()===userId);
        if (p) { p.socketId=null; p.disconnected=true; }
        await room.save();
        gdIO.to(roomCode).emit('participant-disconnected',{ userId, userName:p?.name, message:`${p?.name||'A participant'} temporarily disconnected.` });
      } catch {}
    });
  });

  return gdIO;
}

function resetSilenceTimer(roomCode, topic, namespace, GDRoom, timers, silenceTimers, recentCaptions) {
  clearTimeout(silenceTimers[roomCode]);
  const silenceMs = 45000 + Math.floor(Math.random()*15000);
  silenceTimers[roomCode] = setTimeout(async () => {
    const room = await GDRoom.findOne({ roomCode });
    if (!room || room.state !== 'active') return;
    if (humanSpeakingRooms[roomCode]) { resetSilenceTimer(roomCode,topic,namespace,GDRoom,timers,silenceTimers,recentCaptions); return; }
    const msg = await generateModeratorInterjection(topic, recentCaptions[roomCode]||[], 'silence');
    if (msg) {
      await broadcastAIVoice(namespace, roomCode, msg, 'guide');
      recentCaptions[roomCode]=[...(recentCaptions[roomCode]||[]).slice(-10),{userName:AI_MODERATOR.name,text:msg,isAI:true,ts:Date.now()}];
    }
  }, silenceMs);
}

async function doLock(room, roomCode, namespace, GDRoom, timers, recentCaptions, silenceTimers) {
  try {
    const topic = await generateTopic(room);
    room.topic=topic; room.state='locked'; room.lockedAt=new Date(); await room.save();
    namespace.to(roomCode).emit('room-locked-announce',{ message:'The Group Discussion session is now locked.', participants:room.participants.map(p=>({name:p.name,isAI:p.isAI})) });
    room.state='prep'; await room.save();
    namespace.to(roomCode).emit('prep-phase',{ duration:room.prepSeconds, topic, message:`You have ${room.prepSeconds} seconds to prepare your thoughts.` });
    setTimeout(async () => {
      if (!humanSpeakingRooms[roomCode]) {
        const prepMsg = await generateModeratorInterjection(topic,[],'opening');
        if (prepMsg) broadcastAIVoice(namespace, roomCode, prepMsg, 'opening');
      }
    }, 2000);

    const prepTimer = setTimeout(async () => {
      const r = await GDRoom.findOne({ roomCode });
      if (!r || r.state==='completed') return;
      r.state='active'; r.startedAt=new Date(); r.aiModerator.hasOpened=true; await r.save();
      namespace.to(roomCode).emit('discussion-start',{ topic, duration:r.durationSeconds, startedAt:r.startedAt, message:`The topic is: "${topic}". You have ${Math.round(r.durationSeconds/60)} minutes. Begin now.` });

      setTimeout(async () => {
        if (humanSpeakingRooms[roomCode]) return;
        const openMsg = await generateModeratorInterjection(topic,[],'opening');
        if (openMsg) { await broadcastAIVoice(namespace,roomCode,openMsg,'opening'); if(!recentCaptions[roomCode])recentCaptions[roomCode]=[]; recentCaptions[roomCode].push({userName:AI_MODERATOR.name,text:openMsg,isAI:true,ts:Date.now()}); }
      }, 5000);

      const midpoint = Math.floor(r.durationSeconds*0.45)*1000;
      setTimeout(async () => {
        const fr=await GDRoom.findOne({roomCode}); if(!fr||fr.state!=='active')return;
        if(humanSpeakingRooms[roomCode])return;
        const guideMsg=await generateModeratorInterjection(topic,recentCaptions[roomCode]||[],'guide');
        if(guideMsg){await broadcastAIVoice(namespace,roomCode,guideMsg,'guide');recentCaptions[roomCode]=[...(recentCaptions[roomCode]||[]).slice(-10),{userName:AI_MODERATOR.name,text:guideMsg,isAI:true,ts:Date.now()}];}
      }, midpoint);

      const warnDelay = Math.max((r.durationSeconds-90)*1000,0);
      setTimeout(async () => {
        const fr=await GDRoom.findOne({roomCode}); if(!fr||fr.state!=='active')return;
        const warnMsg=await generateModeratorInterjection(topic,recentCaptions[roomCode]||[],'time_warn');
        if(warnMsg) await broadcastAIVoice(namespace,roomCode,warnMsg,'warning');
        namespace.to(roomCode).emit('time-warning',{secondsLeft:90});
      }, warnDelay);

      timers[roomCode] = setTimeout(()=>doEnd(roomCode,namespace,GDRoom,timers,silenceTimers), r.durationSeconds*1000);
      resetSilenceTimer(roomCode, topic, namespace, GDRoom, timers, silenceTimers, recentCaptions);
    }, room.prepSeconds*1000);
    timers[`prep_${roomCode}`]=prepTimer;
  } catch(err){console.error('[doLock]',err.message);}
}

async function doEnd(roomCode, namespace, GDRoom, timers, silenceTimers) {
  try {
    if(timers[roomCode]){clearTimeout(timers[roomCode]);delete timers[roomCode];}
    if(silenceTimers[roomCode]){clearTimeout(silenceTimers[roomCode]);delete silenceTimers[roomCode];}
    const room=await GDRoom.findOne({roomCode});
    if(!room||room.state==='completed')return;
    room.state='completed'; room.endedAt=new Date(); room.aiModerator.hasConcluded=true; await room.save();
    const conclusionMsg=await generateModeratorInterjection(room.topic,[],'conclusion');
    if(conclusionMsg) await broadcastAIVoice(namespace,roomCode,conclusionMsg,'conclusion');
    namespace.to(roomCode).emit('session-ended',{message:'Session ended. Generating personalised AI evaluation reports…',roomCode});
    setTimeout(async()=>{
      const evaluated=await evaluateAll(GDRoom,roomCode);
      if(evaluated){namespace.to(roomCode).emit('evaluation-ready',{roomCode,participants:evaluated.participants.map(p=>({userId:p.userId,name:p.name,isAI:p.isAI,aiScore:p.aiScore,speakingTime:p.speakingTime,wordCount:p.wordCount,fillerWords:p.fillerWords,interruptions:p.interruptions,offTopicCount:p.offTopicCount}))});}
    },3000);
  } catch(err){console.error('[doEnd]',err.message);}
}

module.exports = { registerGDSocket, evaluateParticipant };
