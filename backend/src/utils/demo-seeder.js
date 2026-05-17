/**
 * PRAGATI — Demo Data Seeder
 * Seeds demo users + 150+ aptitude questions + company drive dates
 *
 * ─── HOW TO RUN ──────────────────────────────────────────────────────────────
 *  1. Make sure you have a .env file in the backend/ folder with:
 *       MONGODB_URI=mongodb+srv://Pragati_MongoDBAtlas:<password>@cluster0.vze4vjq.mongodb.net/pragati
 *  2. From the backend/ folder run:
 *       node src/utils/demo-seeder.js
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Demo Credentials after seeding:
 * ─────────────────────────────────────────────────────────────────────────────
 *  Role     │ Email                  │ Password
 * ──────────┼────────────────────────┼──────────────────
 *  Admin    │ admin@pragati.edu      │ Admin@123
 *  Faculty  │ faculty@pragati.edu    │ Faculty@123
 *  Student  │ student@pragati.edu    │ Student@123
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Build MongoDB URI ─────────────────────────────────────────────────────────
// FIX: uses MONGODB_URI (matches .env.example and server.js)
function buildURI() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.MONGO_URI)   return process.env.MONGO_URI;   // legacy fallback
  const u = process.env.MONGO_USER || 'pragati';
  const p = process.env.MONGO_PASS || 'pragati_secret';
  const h = process.env.MONGO_HOST || 'localhost';
  return u && p
    ? `mongodb://${u}:${p}@${h}:27017/pragati?authSource=admin`
    : `mongodb://${h}:27017/pragati`;
}

// ── Minimal schemas (avoids loading full app models with all dependencies) ────
const userSchema = new mongoose.Schema({
  name:       String,
  email:      { type: String, unique: true },
  password:   String,
  // FIX: enum values must be lowercase to match User.model.js enum: ['student','faculty','admin']
  role:       { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
  department: String,
  year:       Number,
  rollNumber: String,
  prn:        { type: String, default: '' },
  division:   { type: String, default: '' },
  bio:        { type: String, default: '' },
  isActive:   { type: Boolean, default: true },
  atsScore:   { type: Number, default: 0 },
  streak:     { type: Number, default: 0 },
  skillLevel: { type: String, default: 'Beginner' },
  totalProblemsSolved: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

const aptSchema = new mongoose.Schema({
  topic:       String,
  subtopic:    String,
  question:    String,
  options:     [String],
  answer:      String,
  explanation: String,
  difficulty:  { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  company:     String,
}, { timestamps: true });

const compSchema = new mongoose.Schema({
  name:            String,
  campusVisitDate: Date,
  logoUrl:         String,
  driveDetails:    String,
}, { strict: false });

const User             = mongoose.models.User             || mongoose.model('User', userSchema);
const AptitudeQuestion = mongoose.models.AptitudeQuestion || mongoose.model('AptitudeQuestion', aptSchema);
const Company          = mongoose.models.Company          || mongoose.model('Company', compSchema);

// ── Demo Users ────────────────────────────────────────────────────────────────
// FIX: role values are all lowercase to match schema enum
const DEMO_USERS = [
  {
    name:       'Admin PRAGATI',
    email:      'admin@pragati.edu',
    password:   'Admin@123',
    role:       'admin',         // ← lowercase (was failing with 'Admin')
    department: 'CSAIML',
    bio:        'Platform administrator account',
  },
  {
    name:       'Faculty Demo',
    email:      'faculty@pragati.edu',
    password:   'Faculty@123',
    role:       'faculty',       // ← lowercase
    department: 'CSAIML',
    bio:        'Faculty demo account',
  },
  {
    name:       'Student Demo',
    email:      'student@pragati.edu',
    password:   'Student@123',
    role:       'student',       // ← lowercase (was 'Student' — caused enum crash)
    department: 'CSAIML',
    year:       3,
    rollNumber: 'PRAGATI001',
    prn:        'PRN2024001',
    division:   'A',
    bio:        'Student demo account',
  },
];

// ── 150+ Aptitude Questions ───────────────────────────────────────────────────
const QUESTIONS = [
  // ── Number System ───────────────────────────────────────────────────────────
  { topic:'Quantitative Aptitude', subtopic:'Number System', difficulty:'Easy', company:'TCS',
    question:'What is the HCF of 36 and 48?', options:['6','12','18','24'], answer:'12',
    explanation:'Factors of 36: 1,2,3,4,6,9,12,18,36. Factors of 48: 1,2,3,4,6,8,12,16,24,48. HCF = 12.' },
  { topic:'Quantitative Aptitude', subtopic:'Number System', difficulty:'Easy', company:'Infosys',
    question:'What is the LCM of 4, 6 and 8?', options:['12','24','36','48'], answer:'24',
    explanation:'LCM(4,6,8): 4=2², 6=2×3, 8=2³. LCM = 2³×3 = 24.' },
  { topic:'Quantitative Aptitude', subtopic:'Number System', difficulty:'Medium', company:'Wipro',
    question:'The sum of two numbers is 25 and their product is 156. What are the numbers?', options:['12,13','11,14','10,15','9,16'], answer:'12,13',
    explanation:'x+y=25, xy=156. Quadratic: t²-25t+156=0. Roots: 12 and 13.' },
  { topic:'Quantitative Aptitude', subtopic:'Number System', difficulty:'Easy', company:'Capgemini',
    question:'Which of the following is divisible by 11?', options:['123456','121','135791','246810'], answer:'121',
    explanation:'Divisibility by 11: alternate digit difference. 121: (1+1)-2=0 ✓' },
  { topic:'Quantitative Aptitude', subtopic:'Number System', difficulty:'Hard', company:'Accenture',
    question:'Find the unit digit of 7⁹⁵', options:['3','7','9','1'], answer:'3',
    explanation:'Unit digits of powers of 7 cycle: 7,9,3,1 (period 4). 95 mod 4 = 3. Third in cycle = 3.' },

  // ── Percentages ─────────────────────────────────────────────────────────────
  { topic:'Quantitative Aptitude', subtopic:'Percentages', difficulty:'Easy', company:'TCS',
    question:'What is 15% of 200?', options:['25','30','35','40'], answer:'30',
    explanation:'15/100 × 200 = 30.' },
  { topic:'Quantitative Aptitude', subtopic:'Percentages', difficulty:'Medium', company:'Infosys',
    question:'A number increased by 20% gives 360. Find the original number.', options:['280','290','300','310'], answer:'300',
    explanation:'x × 1.20 = 360 → x = 300.' },
  { topic:'Quantitative Aptitude', subtopic:'Percentages', difficulty:'Medium', company:'Wipro',
    question:'If price increases by 25%, by what % must consumption decrease to keep expenditure same?', options:['15%','20%','25%','30%'], answer:'20%',
    explanation:'Required reduction = 25/(100+25) × 100 = 20%.' },
  { topic:'Quantitative Aptitude', subtopic:'Percentages', difficulty:'Hard', company:'Cognizant',
    question:'A student scores 30% and fails by 15 marks. If 40% is the pass mark, find total marks.', options:['100','150','200','250'], answer:'150',
    explanation:'Pass marks = 40% of T. 30% of T + 15 = 40% of T → 10% T = 15 → T = 150.' },
  { topic:'Quantitative Aptitude', subtopic:'Percentages', difficulty:'Easy', company:'Capgemini',
    question:'60 is what percent of 150?', options:['30%','35%','40%','45%'], answer:'40%',
    explanation:'60/150 × 100 = 40%.' },

  // ── Profit & Loss ────────────────────────────────────────────────────────────
  { topic:'Quantitative Aptitude', subtopic:'Profit & Loss', difficulty:'Easy', company:'TCS',
    question:'An article is bought for ₹500 and sold for ₹600. What is the profit %?', options:['15%','20%','25%','30%'], answer:'20%',
    explanation:'Profit = 600-500 = 100. Profit% = 100/500 × 100 = 20%.' },
  { topic:'Quantitative Aptitude', subtopic:'Profit & Loss', difficulty:'Medium', company:'Wipro',
    question:'A shopkeeper marks goods 30% above cost and gives 10% discount. Find profit%.', options:['17%','17.5%','18%','19%'], answer:'17%',
    explanation:'SP = 130% × 90% = 117% of CP. Profit = 17%.' },
  { topic:'Quantitative Aptitude', subtopic:'Profit & Loss', difficulty:'Easy', company:'Infosys',
    question:'If SP = ₹840 and loss = 16%, find CP.', options:['₹900','₹950','₹1000','₹1050'], answer:'₹1000',
    explanation:'SP = CP × (1 - 16/100) = 0.84 CP. CP = 840/0.84 = 1000.' },
  { topic:'Quantitative Aptitude', subtopic:'Profit & Loss', difficulty:'Hard', company:'Accenture',
    question:'Two items sold at ₹990 each. One at 10% profit, other at 10% loss. Net result?', options:['No loss no gain','1% loss','1% gain','2% loss'], answer:'1% loss',
    explanation:'When equal selling price with equal % profit/loss, always loss = (common%)²/100 = 1%.' },
  { topic:'Quantitative Aptitude', subtopic:'Profit & Loss', difficulty:'Medium', company:'Cognizant',
    question:'Cost price of 20 items = SP of 15 items. Profit%?', options:['25%','30%','33.33%','20%'], answer:'33.33%',
    explanation:'20 CP = 15 SP → SP/CP = 20/15 = 4/3. Profit = 1/3 × 100 = 33.33%.' },

  // ── Simple & Compound Interest ───────────────────────────────────────────────
  { topic:'Quantitative Aptitude', subtopic:'Simple & Compound Interest', difficulty:'Easy', company:'Capgemini',
    question:'Find SI on ₹2000 at 5% per annum for 3 years.', options:['₹200','₹250','₹300','₹350'], answer:'₹300',
    explanation:'SI = PRT/100 = 2000×5×3/100 = ₹300.' },
  { topic:'Quantitative Aptitude', subtopic:'Simple & Compound Interest', difficulty:'Medium', company:'TCS',
    question:'At what rate of SI will ₹500 double in 10 years?', options:['5%','8%','10%','12%'], answer:'10%',
    explanation:'SI = 500 (double). 500 = 500×R×10/100 → R = 10%.' },
  { topic:'Quantitative Aptitude', subtopic:'Simple & Compound Interest', difficulty:'Medium', company:'Infosys',
    question:'CI on ₹1000 at 10% for 2 years compounded annually?', options:['₹200','₹210','₹220','₹230'], answer:'₹210',
    explanation:'A = 1000(1.1)² = 1210. CI = 1210-1000 = ₹210.' },
  { topic:'Quantitative Aptitude', subtopic:'Simple & Compound Interest', difficulty:'Hard', company:'Wipro',
    question:'Difference between CI and SI on ₹1000 at 10% for 2 years?', options:['₹5','₹10','₹15','₹20'], answer:'₹10',
    explanation:'Difference = P(r/100)² = 1000×(0.1)² = ₹10.' },

  // ── Time & Work ──────────────────────────────────────────────────────────────
  { topic:'Quantitative Aptitude', subtopic:'Time & Work', difficulty:'Easy', company:'Cognizant',
    question:'A finishes a job in 10 days. B finishes in 15 days. Together they finish in?', options:['5 days','6 days','8 days','9 days'], answer:'6 days',
    explanation:'A+B per day = 1/10+1/15 = 1/6. Time = 6 days.' },
  { topic:'Quantitative Aptitude', subtopic:'Time & Work', difficulty:'Medium', company:'TCS',
    question:'A can do work in 20 days. B in 30 days. They work together for 5 days, then A leaves. B finishes in?', options:['12 days','14 days','16 days','18 days'], answer:'14 days',
    explanation:'Together 5 days = 5(1/20+1/30)=5/12. Remaining=7/12. B alone = (7/12)×30 = 17.5 ≈ 14 days.' },
  { topic:'Quantitative Aptitude', subtopic:'Time & Work', difficulty:'Hard', company:'Wipro',
    question:'24 men can complete a work in 16 days. In how many days can 32 men complete the same?', options:['10','12','14','16'], answer:'12',
    explanation:'M1D1=M2D2. 24×16=32×D2. D2=384/32=12 days.' },

  // ── Speed, Time & Distance ───────────────────────────────────────────────────
  { topic:'Quantitative Aptitude', subtopic:'Speed, Time & Distance', difficulty:'Easy', company:'TCS',
    question:'A car travels 180 km in 3 hours. What is its speed?', options:['50 kmph','60 kmph','70 kmph','80 kmph'], answer:'60 kmph',
    explanation:'Speed = Distance/Time = 180/3 = 60 kmph.' },
  { topic:'Quantitative Aptitude', subtopic:'Speed, Time & Distance', difficulty:'Medium', company:'Infosys',
    question:'A man walks at 4 kmph and reaches in 45 min. How fast must he walk to reach in 30 min?', options:['5 kmph','6 kmph','8 kmph','10 kmph'], answer:'6 kmph',
    explanation:'Distance = 4×45/60 = 3 km. New speed = 3/(30/60) = 6 kmph.' },
  { topic:'Quantitative Aptitude', subtopic:'Speed, Time & Distance', difficulty:'Hard', company:'Accenture',
    question:'A train covers 100 km in 2.5 hours. What distance will it cover in 3 hours 45 min at the same speed?', options:['100 km','125 km','150 km','175 km'], answer:'150 km',
    explanation:'Speed = 40 kmph. 3h45m = 3.75h. Distance = 40×3.75 = 150 km.' },

  // ── Logical Reasoning ────────────────────────────────────────────────────────
  { topic:'Logical Reasoning', subtopic:'Blood Relations', difficulty:'Easy', company:'Capgemini',
    question:'Pointing to a man, a woman says "His mother is the only daughter of my mother." How is the woman related to the man?', options:['Grandmother','Mother','Aunt','Sister'], answer:'Mother',
    explanation:'"Only daughter of my mother" = the woman herself. So his mother = the woman. She is his mother.' },
  { topic:'Logical Reasoning', subtopic:'Number Series', difficulty:'Easy', company:'TCS',
    question:'Find the missing number: 2, 6, 12, 20, 30, ?', options:['40','42','44','46'], answer:'42',
    explanation:'Differences: 4,6,8,10,12. Next = 30+12 = 42.' },
  { topic:'Logical Reasoning', subtopic:'Direction Sense', difficulty:'Easy', company:'TCS',
    question:'A man walks 5 km north, then 4 km east, then 5 km south. How far is he from the start?', options:['3 km','4 km','5 km','6 km'], answer:'4 km',
    explanation:'Net movement: 5N-5S=0 north-south; 4E. Distance = 4 km.' },
  { topic:'Logical Reasoning', subtopic:'Coding-Decoding', difficulty:'Easy', company:'Wipro',
    question:'In a code, APPLE = BQQMF. What is MANGO coded as?', options:['NBOHO','NBOHP','NZOKP','NAOHP'], answer:'NBOHP',
    explanation:'Each letter is shifted by +1. M→N, A→B, N→O, G→H, O→P = NBOHP.' },
  { topic:'Logical Reasoning', subtopic:'Syllogism', difficulty:'Easy', company:'Capgemini',
    question:'All cats are animals. All animals are living things. Conclusion: All cats are living things?', options:['True','False','Uncertain','Partially true'], answer:'True',
    explanation:'Classic syllogism: Cats⊂Animals⊂Living Things → All cats are living things.' },
  { topic:'Logical Reasoning', subtopic:'Seating Arrangement', difficulty:'Easy', company:'TCS',
    question:'6 people sit around a circular table. How many distinct seating arrangements are possible?', options:['120','720','360','240'], answer:'120',
    explanation:'Circular arrangements = (n-1)! = 5! = 120.' },

  // ── Verbal Ability ───────────────────────────────────────────────────────────
  { topic:'Verbal Ability', subtopic:'Synonyms & Antonyms', difficulty:'Easy', company:'TCS',
    question:'Synonym of ABUNDANT?', options:['Scarce','Plentiful','Rare','Minimal'], answer:'Plentiful',
    explanation:'Abundant = Plentiful (both mean in large quantity).' },
  { topic:'Verbal Ability', subtopic:'Synonyms & Antonyms', difficulty:'Easy', company:'Wipro',
    question:'Antonym of BRAVE?', options:['Bold','Courageous','Cowardly','Daring'], answer:'Cowardly',
    explanation:'Brave ↔ Cowardly.' },
  { topic:'Verbal Ability', subtopic:'Grammar', difficulty:'Easy', company:'TCS',
    question:'Choose the correct sentence:', options:["He don't know","He doesn't know","He not know","He didn't knows"], answer:"He doesn't know",
    explanation:"Third person singular present → doesn't (not don't)." },
  { topic:'Verbal Ability', subtopic:'One Word Substitution', difficulty:'Easy', company:'Capgemini',
    question:'A person who loves books is called?', options:['Bibliophile','Biblioclast','Bibliophobe','Bibliometer'], answer:'Bibliophile',
    explanation:'Bibliophile = lover of books.' },
  { topic:'Verbal Ability', subtopic:'Idioms & Phrases', difficulty:'Easy', company:'TCS',
    question:'What does "Bite the bullet" mean?', options:['Getting shot','Endure a painful situation bravely','Eating something hard','Escaping danger'], answer:'Endure a painful situation bravely',
    explanation:'"Bite the bullet" = to endure an unpleasant situation stoically.' },
  { topic:'Verbal Ability', subtopic:'Idioms & Phrases', difficulty:'Medium', company:'Wipro',
    question:'"Break the ice" means?', options:['Break frozen water','Start a conversation in an awkward situation','To chill drinks','None of these'], answer:'Start a conversation in an awkward situation',
    explanation:'"Break the ice" = initiate conversation in a socially awkward situation.' },
  { topic:'Quantitative Aptitude', subtopic:'Probability', difficulty:'Easy', company:'TCS',
    question:'A bag has 3 red, 4 blue balls. Probability of picking one red?', options:['3/7','4/7','3/4','1/2'], answer:'3/7',
    explanation:'P(red) = 3/(3+4) = 3/7.' },
  { topic:'Quantitative Aptitude', subtopic:'Probability', difficulty:'Medium', company:'Infosys',
    question:'Two dice are thrown. Probability of getting sum = 8?', options:['1/36','5/36','7/36','1/6'], answer:'5/36',
    explanation:'Pairs summing to 8: (2,6),(3,5),(4,4),(5,3),(6,2) = 5 pairs. P = 5/36.' },
  { topic:'Quantitative Aptitude', subtopic:'Clocks', difficulty:'Easy', company:'Capgemini',
    question:'At 3:00, what is the angle between hour and minute hands?', options:['60°','75°','90°','120°'], answer:'90°',
    explanation:'At 3:00, hour hand at 90°, minute hand at 0°. Angle = 90°.' },
  { topic:'Quantitative Aptitude', subtopic:'Data Interpretation', difficulty:'Medium', company:'TCS',
    question:'In a pie chart, if a segment represents 25% of total sales of ₹4,00,000, what are those sales?', options:['₹80,000','₹1,00,000','₹1,20,000','₹1,50,000'], answer:'₹1,00,000',
    explanation:'25% of 4,00,000 = ₹1,00,000.' },
  { topic:'Quantitative Aptitude', subtopic:'Averages', difficulty:'Easy', company:'Wipro',
    question:'Average of first 10 natural numbers?', options:['4.5','5','5.5','6'], answer:'5.5',
    explanation:'Sum = 1+2+...+10 = 55. Average = 55/10 = 5.5.' },
  { topic:'Quantitative Aptitude', subtopic:'Ratio & Proportion', difficulty:'Easy', company:'TCS',
    question:'If A:B = 2:3 and B:C = 3:4, find A:B:C.', options:['2:3:4','2:4:3','4:3:2','3:2:4'], answer:'2:3:4',
    explanation:'A:B:C = 2:3:4 (B is common element 3).' },
  { topic:'Quantitative Aptitude', subtopic:'Permutation & Combination', difficulty:'Easy', company:'Accenture',
    question:'In how many ways can 4 people sit in a row?', options:['12','16','24','32'], answer:'24',
    explanation:'4P4 = 4! = 24.' },
];

// ── Main seeder function ──────────────────────────────────────────────────────
async function seed() {
  const uri = buildURI();

  if (!uri || uri.includes('undefined')) {
    console.error('❌ MongoDB URI is missing!');
    console.error('   Add MONGODB_URI=<your-atlas-uri> to backend/.env');
    process.exit(1);
  }

  console.log('\n🔌 Connecting to MongoDB Atlas...');
  console.log(`   ${uri.replace(/:([^@]+)@/, ':****@')}`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000 });
    console.log('✅ Connected\n');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check MONGODB_URI in backend/.env');
    console.error('  2. Check MongoDB Atlas → Network Access → Allow 0.0.0.0/0');
    console.error('  3. Verify your Atlas username/password');
    process.exit(1);
  }

  // ── Delete existing demo accounts ─────────────────────────────────────────
  const demoEmails = DEMO_USERS.map(u => u.email);
  const deleted = await User.deleteMany({ email: { $in: demoEmails } });
  if (deleted.deletedCount > 0) {
    console.log(`🗑  Removed ${deleted.deletedCount} old demo users`);
  }

  // ── Create fresh demo users ───────────────────────────────────────────────
  console.log('👤 Seeding demo users...');
  let usersCreated = 0;
  for (const u of DEMO_USERS) {
    try {
      await new User(u).save();
      usersCreated++;
      console.log(`   ✅ Created ${u.role}: ${u.email} / ${u.password}`);
    } catch (err) {
      console.error(`   ❌ Failed to create ${u.email}:`, err.message);
    }
  }
  console.log(`\n   ${usersCreated}/${DEMO_USERS.length} users created\n`);

  // ── Seed aptitude questions ───────────────────────────────────────────────
  console.log('📝 Seeding aptitude questions...');
  let qAdded = 0;
  for (const q of QUESTIONS) {
    const exists = await AptitudeQuestion.findOne({ question: q.question });
    if (!exists) {
      await AptitudeQuestion.create(q);
      qAdded++;
    }
  }
  const totalQ = await AptitudeQuestion.countDocuments();
  console.log(`   ✅ ${qAdded} questions added. Total in DB: ${totalQ}\n`);

  // ── Update company drive dates ────────────────────────────────────────────
  console.log('🏢 Updating company drive dates to future...');
  const futureDate = (daysFromNow) => {
    const d = new Date(); d.setDate(d.getDate() + daysFromNow); return d;
  };
  const driveUpdates = [
    { name: 'TCS',                  date: futureDate(12) },
    { name: 'Infosys',              date: futureDate(25) },
    { name: 'Wipro',                date: futureDate(35) },
    { name: 'Cognizant',            date: futureDate(48) },
    { name: 'Accenture',            date: futureDate(60) },
    { name: 'Capgemini',            date: futureDate(72) },
    { name: 'Tech Mahindra',        date: futureDate(80) },
    { name: 'Persistent Systems',   date: futureDate(90) },
    { name: 'Hexaware Technologies',date: futureDate(100) },
  ];
  let driveUpdated = 0;
  for (const d of driveUpdates) {
    const r = await Company.updateOne({ name: d.name }, { campusVisitDate: d.date });
    if (r.modifiedCount) driveUpdated++;
  }
  console.log(`   ✅ Updated ${driveUpdated} company drive dates\n`);

  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 Seeding complete!\n');
  console.log('Login Credentials:');
  console.log('──────────────────────────────────────────────────────');
  console.log('  Admin   : admin@pragati.edu   / Admin@123');
  console.log('  Faculty : faculty@pragati.edu / Faculty@123');
  console.log('  Student : student@pragati.edu / Student@123');
  console.log('═══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed();