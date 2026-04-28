/**
 * PRAGATI — Aptitude Seed Script
 * Run: node backend/src/utils/seed-aptitude.js
 * Seeds all aptitude questions into MongoDB
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pragati';

const aptitudeQuestionSchema = new mongoose.Schema({
  topic:      { type: String, required: true },
  subtopic:   { type: String },
  question:   { type: String, required: true },
  options:    [String],
  answer:     { type: String, required: true },
  explanation:{ type: String },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  companies:  [String],
  source:     { type: String },
}, { timestamps: true });

const AptitudeQuestion = mongoose.model('AptitudeQuestion', aptitudeQuestionSchema);

const QUESTIONS = require('./aptitude-seed-full');

async function seed() {
  try {
    console.log('🔗 Connecting to MongoDB:', MONGO_URI.replace(/\/\/.*@/, '//***@'));
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Show existing count
    const existing = await AptitudeQuestion.countDocuments();
    console.log(`📊 Existing questions in DB: ${existing}`);

    if (existing > 0) {
      console.log('⚠️  Questions already exist. Dropping and re-seeding...');
      await AptitudeQuestion.deleteMany({});
      console.log('🗑️  Cleared existing questions\n');
    }

    // Group by subtopic for reporting
    const bySubtopic = {};
    QUESTIONS.forEach(q => {
      bySubtopic[q.subtopic] = (bySubtopic[q.subtopic] || 0) + 1;
    });

    console.log('📋 Questions to be seeded by subtopic:');
    Object.entries(bySubtopic).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([sub, count]) => {
      console.log(`   ${sub.padEnd(35)} ${count} questions`);
    });
    console.log(`\n📝 Total: ${QUESTIONS.length} questions\n`);

    // Insert all
    const result = await AptitudeQuestion.insertMany(QUESTIONS, { ordered: false });
    console.log(`✅ Successfully seeded ${result.length} questions!\n`);

    // Verify by topic
    const topics = await AptitudeQuestion.distinct('topic');
    for (const topic of topics) {
      const count = await AptitudeQuestion.countDocuments({ topic });
      console.log(`📚 ${topic}: ${count} questions`);
    }

    console.log('\n🎉 Aptitude seed complete!');
    process.exit(0);
  } catch (err) {
    if (err.writeErrors) {
      console.log(`⚠️  ${err.insertedDocs?.length || 0} inserted, ${err.writeErrors.length} duplicates skipped`);
    } else {
      console.error('❌ Seed failed:', err.message);
    }
    process.exit(1);
  }
}

seed();
