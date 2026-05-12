const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:      String,
  joinedAt:  { type: Date, default: Date.now },
  isAI:      { type: Boolean, default: false },
  socketId:  String,
  // evaluation scores
  speakingTime:    { type: Number, default: 0 },   // seconds
  wordCount:       { type: Number, default: 0 },
  interruptions:   { type: Number, default: 0 },
  fillerWords:     { type: Number, default: 0 },
  uniquePoints:    { type: Number, default: 0 },
  transcript:      [{ time: Number, text: String }],
  aiScore: {
    communication: { type: Number, default: 0 },
    confidence:    { type: Number, default: 0 },
    leadership:    { type: Number, default: 0 },
    participation: { type: Number, default: 0 },
    overall:       { type: Number, default: 0 },
    strengths:     [String],
    improvements:  [String],
    summary:       String,
  },
});

const gdRoomSchema = new mongoose.Schema({
  roomCode:      { type: String, unique: true, required: true },
  topic:         { type: String },           // revealed only after lock
  topicCategory: String,
  companyContext:String,                     // e.g. 'TCS', 'Infosys'
  difficulty:    { type: String, enum: ['Easy','Medium','Hard'], default: 'Medium' },
  language:      { type: String, default: 'English' },
  // room config
  minParticipants: { type: Number, default: 3 },
  maxParticipants: { type: Number, default: 5 },
  durationSeconds: { type: Number, default: 600 }, // 10 minutes
  prepSeconds:     { type: Number, default: 45 },
  isPrivate:       { type: Boolean, default: false },
  // state machine
  state: {
    type: String,
    enum: ['waiting','locked','prep','active','completed'],
    default: 'waiting'
  },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [participantSchema],
  lockedAt:     Date,
  startedAt:    Date,
  endedAt:      Date,
  aiTranscript: [{ speaker: String, text: String, time: Number }],
}, { timestamps: true });


gdRoomSchema.index({ state: 1, createdAt: -1 });

module.exports = mongoose.model('GDRoom', gdRoomSchema);
