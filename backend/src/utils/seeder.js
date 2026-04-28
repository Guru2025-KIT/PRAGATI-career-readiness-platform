require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://pragati:pragati_secret@mongo:27017/pragati?authSource=admin';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  // Dynamic model imports
  const User = require('../models/User.model');
  const { Company, Problem, AptitudeQuestion } = require('../models/index');

  // ── Demo accounts ─────────────────────────────────────────
  await User.deleteMany({ email: { $in: [
    'admin@pragati.edu','faculty@pragati.edu','student@pragati.edu',
    'dr.khot@pragati.edu','mrs.buwa@pragati.edu'
  ]}});
  await User.create([
    { name:'Admin',           email:'admin@pragati.edu',    password:'Admin@123',   role:'admin',   department:'CSAIML' },
    { name:'Demo Faculty',    email:'faculty@pragati.edu',  password:'Faculty@123', role:'faculty', department:'CSAIML' },
    { name:'Demo Student',    email:'student@pragati.edu',  password:'Student@123', role:'student', department:'CSAIML', year:2, rollNumber:'A37', skillLevel:'Intermediate' },
  ]);
  console.log('✅ Demo users created');

  // ── Companies visiting KITCOEK CSAIML ─────────────────────
  await Company.deleteMany({});
  const companies = [
    {
      name:'TCS', sector:'IT Services', status:'visited', campusVisitDate:new Date('2024-09-15'),
      website:'https://tcs.com', ctc:'3.36–7 LPA',
      roles:['System Engineer','Digital Specialist Engineer','Ninja (Smart Hiring)'],
      recruitmentRounds:['TCS National Qualifier Test (NQT) — online, 3 sections','Technical Interview (45–60 min)','Managerial Round (situational)','HR Interview'],
      aptitudePatterns:'NQT has: Verbal Ability (24Q/20min) — RC, fill blanks, sentence correction. Numerical Ability (26Q/40min) — time-work, profit-loss, percentages, series. Reasoning Ability (30Q/50min) — blood relations, coding-decoding, syllogisms. Advanced: Coding (2 problems, 30min) — for Digital/Ninja roles. Focus: speed + accuracy, no negative marking in NQT standard.',
      interviewPatterns:'Technical TR: C/Java/Python basics, OOP (4 pillars with examples), DBMS (normalization, joins, indexing), OS (deadlock, paging), CN basics. Managerial: "If your team misses a deadline, what do you do?" HR: salary expectations, bond acceptance (1 year), relocation. NOTE: For CSE/AIML — expect ML basics, Python libraries (NumPy, Pandas) for Digital roles.',
      difficulty:'Easy', jdText:'TCS hiring System Engineers for service-based roles. Strong fundamentals required. Bond: 1 year, 3.36 LPA base.',
      eligibilityCriteria:{ minCGPA:6.0, allowedBranches:['CSE','CSAIML','IT','ECE','Mechanical','Civil'], backlogs:false },
      prepTips:'Practice: RS Aggarwal (Quant), Logical Reasoning by M.K. Pandey. LeetCode Easy problems. Prepare "Tell me about yourself" (2 min), project explanation.',
    },
    {
      name:'Infosys', sector:'IT Services', status:'visited', campusVisitDate:new Date('2024-10-10'),
      website:'https://infosys.com', ctc:'3.6–9.5 LPA',
      roles:['Systems Engineer (SE)','Specialist Programmer (SP)','Power Programmer (PP)'],
      recruitmentRounds:['InfyTQ Certification OR HackWithInfy rank (SP/PP)','Online Assessment (Aptitude + Pseudocode + Puzzle)','HR Interview (SE) / Technical + HR (SP/PP)'],
      aptitudePatterns:'For SE: OA has Quantitative (10Q/15min), Pseudocode Tracing (5Q/15min — output of code), Puzzle (5Q/10min). For SP: HackerRank — 2 coding problems in 90 min (Medium–Hard). Pseudocode section tests code reading, not writing — very important to practice.',
      interviewPatterns:'SE HR: Resume walkthrough, "Why Infosys?", bond confirmation. SP Technical: 1–2 rounds — DSA (linked lists, trees, graphs), OOP, DBMS (complex joins, stored procedures), 1 coding problem on whiteboard. AIML-specific for SP: ML algorithms, scikit-learn, model evaluation metrics.',
      difficulty:'Medium', jdText:'Infosys hiring all three tracks. SP/PP require competitive programming strength. SE path is suitable for most students.',
      eligibilityCriteria:{ minCGPA:6.5, allowedBranches:['CSE','CSAIML','IT','ECE'], backlogs:false },
      prepTips:'InfyTQ prep at infytq.com. For SP: LeetCode Medium problems. Pseudocode tracing is unique — practice reading C/Java pseudo code carefully.',
    },
    {
      name:'Persistent Systems', sector:'Product Engineering', status:'upcoming', campusVisitDate:new Date('2025-01-22'),
      website:'https://persistent.com', ctc:'4–8 LPA',
      roles:['Software Engineer','Trainee Engineer'],
      recruitmentRounds:['AMCAT-based Aptitude (online, proctored)','Coding Round (2 problems, 60 min, HackerRank)','Technical Interview (1–2 rounds)','HR Interview'],
      aptitudePatterns:'AMCAT: Logical Ability (25Q/35min), Quantitative (25Q/35min), English Comprehension (25Q/25min), Coding Section (2 problems — Easy to Medium). Coding topics: Array manipulation, String problems, Number theory, Basic recursion, Pattern printing.',
      interviewPatterns:'TR: Deep project dive (be ready to explain every function you wrote), OOP with design examples, DBMS (ER diagram to schema, JOIN types), sorting algorithm complexities. They check GitHub activity. HR: Why Persistent, salary, team player situations. AIML students: expect CNN/RNN basics, Python ML stack questions.',
      difficulty:'Medium', jdText:'Persistent known for strong technical rounds. Good for students with solid DSA and real project work.',
      eligibilityCriteria:{ minCGPA:7.0, allowedBranches:['CSE','CSAIML','IT'], backlogs:false },
      prepTips:'Have at least 2 strong projects on GitHub. Solve 50+ LeetCode problems. Study Persistent previous interview questions on GeeksforGeeks/InterviewBit.',
    },
    {
      name:'Wipro', sector:'IT Services', status:'upcoming', campusVisitDate:new Date('2025-02-12'),
      website:'https://wipro.com', ctc:'3.5–6.5 LPA',
      roles:['Project Engineer','Network Engineer','Wipro Elite (NLTH)'],
      recruitmentRounds:['NLTH Online Test (Aptitude + Written Communication)','Technical Interview','HR Interview'],
      aptitudePatterns:'NLTH: Aptitude (50Q/50min) — Quant, Reasoning, Verbal. Written Communication (essay on given topic, 500 words, 20 min). No separate coding round for Project Engineer. Elite NLTH: higher aptitude cutoff, quicker hiring.',
      interviewPatterns:'Technical (30–45 min): Mainly C/Java/Python basics, OOP concepts (abstract class vs interface), DBMS (normalization — 1NF, 2NF, 3NF), basic networking. Very friendly interviewers. HR: Bond (18 months), night shifts, relocation agreement.',
      difficulty:'Easy', jdText:'Wipro NLTH is one of the most accessible placement drives. Suitable for all branches.',
      eligibilityCriteria:{ minCGPA:6.0, allowedBranches:['CSE','CSAIML','IT','ECE','Mechanical','Civil'], backlogs:false },
      prepTips:'Essay writing practice is crucial — many miss here. Practice Wipro NLTH previous papers. Focus on communication skills.',
    },
    {
      name:'Cognizant', sector:'IT Services', status:'expected',
      website:'https://cognizant.com', ctc:'4–7 LPA',
      roles:['Programmer Analyst Trainee (PAT)','Programmer Analyst (PA)','GenC Elevate'],
      recruitmentRounds:['Cognizant Aptitude Online Test (COCUBES-based)','Technical + HR Combined Interview'],
      aptitudePatterns:'COCUBES: Quant (20Q), Logical (20Q), English (20Q), Pseudo Code Tracing (20Q — very important!), Automation Concepts MCQs (10Q — basic software testing, SDLC). GenC Elevate: additional DSA coding round (2 problems, Medium difficulty).',
      interviewPatterns:'TR+HR combined (1 hour): OOP with real-life examples, SDLC models (Agile extensively asked), SQL (GROUP BY, HAVING, subqueries with examples), explain your project in detail, any live coding of simple logic. HR within same round: willingness to relocate, night shifts, service agreement.',
      difficulty:'Easy', jdText:'Cognizant GenC is for all students. GenC Elevate for strong coders with better package.',
      eligibilityCriteria:{ minCGPA:6.0, allowedBranches:['CSE','CSAIML','IT','ECE'], backlogs:false },
      prepTips:'Pseudo code tracing is the differentiator at Cognizant — practice heavily. Learn Agile/Scrum terminology. Focus on SDLC questions.',
    },
    {
      name:'L&T Technology Services (LTTS)', sector:'Engineering R&D', status:'expected',
      website:'https://ltts.com', ctc:'3.5–7 LPA',
      roles:['Graduate Engineer Trainee','Software Engineer'],
      recruitmentRounds:['Written Test (Technical MCQ + Aptitude)','Technical Interview (1–2 rounds)','HR Interview'],
      aptitudePatterns:'Technical MCQs (50Q): C programming, Data Structures, OOP concepts, Digital Electronics, Microcontrollers, Signal Processing basics. Aptitude (30Q): Quantitative + Logical. AIML students should know ML fundamentals for technical MCQs.',
      interviewPatterns:'Strong focus on engineering fundamentals. For CSE/AIML: DS algorithms, OS concepts (scheduling, deadlock), CN (OSI layers, TCP/IP), DBMS. For AIML: supervised vs unsupervised learning, model evaluation, Python for ML. Project-based questions are very common.',
      difficulty:'Medium', jdText:'LTTS values core engineering knowledge. Good option for students interested in product and R&D work.',
      eligibilityCriteria:{ minCGPA:6.5, allowedBranches:['CSE','CSAIML','IT','ECE'], backlogs:false },
      prepTips:'Prepare C programming deeply. OS, DBMS, CN are must. For AIML: prepare decision tree, SVM, neural network basics.',
    },
    {
      name:'Tech Mahindra', sector:'IT Services', status:'expected',
      website:'https://techmahindra.com', ctc:'3.25–6 LPA',
      roles:['Associate Software Engineer','ASSOCIATE in AI/ML track'],
      recruitmentRounds:['Aptitude Test (AMCAT/internal)','Technical Interview','HR Interview'],
      aptitudePatterns:'Aptitude: Logical (20Q), Quant (20Q), English (20Q), Technical MCQ (20Q — programming basics). AI/ML track has additional ML theory questions. Focus on percentages, averages, ratios, coding logic MCQs.',
      interviewPatterns:'Friendly interviews. Technical: basic OOP, DBMS queries, Python basics, project discussion. For AI track: ML algorithms (Random Forest, SVM, CNN), Python libraries, one dataset-based question. HR: quick — background, interests, tech skills.',
      difficulty:'Easy', jdText:'Tech Mahindra has a dedicated AI/ML track — excellent for CSAIML students.',
      eligibilityCriteria:{ minCGPA:6.0, allowedBranches:['CSE','CSAIML','IT','ECE','Mechanical'], backlogs:false },
      prepTips:'For AI track: prepare all ML algorithms, be ready to explain confusion matrix, ROC curve, bias-variance tradeoff.',
    },
    {
      name:'Mphasis', sector:'IT Services', status:'expected',
      website:'https://mphasis.com', ctc:'4–6 LPA',
      roles:['Engineer Trainee'],
      recruitmentRounds:['Online Assessment (Aptitude + Coding)','Technical Interview','HR'],
      aptitudePatterns:'Online: Logical (15Q), Quant (15Q), Verbal (15Q), Coding (2 problems — Easy). Coding usually: array/string basic manipulation, one slightly tricky logic problem.',
      interviewPatterns:'TR: OOP in Java/Python, DBMS (ER diagrams and queries), basic DS (arrays, linked list), project explanation. HR: quick and friendly. Very important to know about Mphasis and its banking/financial domain clients.',
      difficulty:'Easy', jdText:'Mphasis focuses on banking and financial technology. Good work environment.',
      eligibilityCriteria:{ minCGPA:6.0, allowedBranches:['CSE','CSAIML','IT'], backlogs:false },
    },
    {
      name:'Accenture', sector:'IT Consulting', status:'expected',
      website:'https://accenture.com', ctc:'4.5–8 LPA',
      roles:['ASE (Associate Software Engineer)','Packaged App Dev Associate','AIS Associate'],
      recruitmentRounds:['Cognitive and Technical Assessment (online, 90 min)','Communication Assessment (video AI tool)','Technical Interview','HR Interview'],
      aptitudePatterns:'Cognitive: Logical (20Q/20min), Verbal (20Q/20min), Mathematical (20Q/20min). Technical: OOP MCQ, DS MCQ, Algorithm MCQ (20Q). Communication Assessment: answer 2 questions via video recording — AI scores your communication.',
      interviewPatterns:'TR: OOP, DBMS, CN basics, code review questions (find errors in given code), project explanation. AIS (AI Solutions): ML concepts, Python, one ML scenario question. HR: situational leadership questions, strengths/weaknesses.',
      difficulty:'Medium', jdText:'Accenture AIS track is perfect for AIML students. Strong focus on communication and technical fundamentals.',
      eligibilityCriteria:{ minCGPA:6.5, allowedBranches:['CSE','CSAIML','IT','ECE'], backlogs:false },
      prepTips:'Communication Assessment is make-or-break — practice speaking clearly. For AIS: prepare data science lifecycle, model deployment concepts.',
    },
    {
      name:'Capgemini', sector:'IT Services', status:'expected',
      website:'https://capgemini.com', ctc:'4–7 LPA',
      roles:['Analyst','Senior Analyst (Capgemini InfraServices)'],
      recruitmentRounds:['Game-based Assessment (Pymetrics)','Pseudocode + Technical MCQ','Technical Interview','HR'],
      aptitudePatterns:'Pymetrics: 12 neuroscience-based games (memory, risk, reaction — 25 min). Technical MCQ: pseudocode tracing (very important), OOP, DBMS (20Q). No coding round for standard track.',
      interviewPatterns:'TR: Resume-based, project depth, basic OOP, SQL queries. Very process-oriented company — questions about agile, SDLC. HR: career goals, why Capgemini, leadership examples.',
      difficulty:'Easy', jdText:'Capgemini known for inclusive hiring. Pymetrics is unique — no "wrong" answers, measures your cognitive style.',
      eligibilityCriteria:{ minCGPA:6.0, allowedBranches:['CSE','CSAIML','IT','ECE','Mechanical'], backlogs:false },
    },
  ];
  await Company.create(companies);
  console.log(`✅ ${companies.length} companies seeded with detailed prep info`);

  // ── Problems ──────────────────────────────────────────────
  await Problem.deleteMany({});
  await Problem.create([
    // Easy
    { title:'Two Sum', source:'LeetCode', problemId:'1', url:'https://leetcode.com/problems/two-sum/', difficulty:'Easy', topic:'Arrays', tags:['TCS','Infosys'] },
    { title:'Valid Parentheses', source:'LeetCode', problemId:'20', url:'https://leetcode.com/problems/valid-parentheses/', difficulty:'Easy', topic:'Stack', tags:['TCS'] },
    { title:'Reverse String', source:'LeetCode', problemId:'344', url:'https://leetcode.com/problems/reverse-string/', difficulty:'Easy', topic:'Strings', tags:['TCS','Wipro'] },
    { title:'Palindrome Number', source:'LeetCode', problemId:'9', url:'https://leetcode.com/problems/palindrome-number/', difficulty:'Easy', topic:'Math', tags:['TCS','Cognizant'] },
    { title:'Maximum Subarray (Kadane\'s)', source:'LeetCode', problemId:'53', url:'https://leetcode.com/problems/maximum-subarray/', difficulty:'Easy', topic:'Dynamic Programming', tags:['Cognizant','Wipro'] },
    { title:'Single Number (XOR trick)', source:'LeetCode', problemId:'136', url:'https://leetcode.com/problems/single-number/', difficulty:'Easy', topic:'Bit Manipulation' },
    { title:'Binary Search', source:'LeetCode', problemId:'704', url:'https://leetcode.com/problems/binary-search/', difficulty:'Easy', topic:'Binary Search', tags:['Persistent','Mphasis'] },
    { title:'Fibonacci Number', source:'LeetCode', problemId:'509', url:'https://leetcode.com/problems/fibonacci-number/', difficulty:'Easy', topic:'Recursion', tags:['Wipro','Capgemini'] },
    { title:'Count Occurrences in Array', source:'LeetCode', problemId:'1207', url:'https://leetcode.com/problems/unique-number-of-occurrences/', difficulty:'Easy', topic:'HashMap', tags:['TCS','Tech Mahindra'] },
    { title:'Move Zeroes', source:'LeetCode', problemId:'283', url:'https://leetcode.com/problems/move-zeroes/', difficulty:'Easy', topic:'Arrays', tags:['Accenture','Capgemini'] },
    // Medium
    { title:'Longest Substring Without Repeating', source:'LeetCode', problemId:'3', url:'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty:'Medium', topic:'Sliding Window', tags:['Infosys','Persistent'] },
    { title:'Add Two Numbers (Linked List)', source:'LeetCode', problemId:'2', url:'https://leetcode.com/problems/add-two-numbers/', difficulty:'Medium', topic:'Linked List', tags:['Persistent'] },
    { title:'Merge Intervals', source:'LeetCode', problemId:'56', url:'https://leetcode.com/problems/merge-intervals/', difficulty:'Medium', topic:'Arrays', tags:['Persistent','TCS Digital'] },
    { title:'Number of Islands (BFS/DFS)', source:'LeetCode', problemId:'200', url:'https://leetcode.com/problems/number-of-islands/', difficulty:'Medium', topic:'Graph', tags:['Infosys SP','Persistent','LTTS'] },
    { title:'Coin Change', source:'LeetCode', problemId:'322', url:'https://leetcode.com/problems/coin-change/', difficulty:'Medium', topic:'Dynamic Programming', tags:['Infosys SP','Accenture'] },
    { title:'Binary Tree Level Order Traversal', source:'LeetCode', problemId:'102', url:'https://leetcode.com/problems/binary-tree-level-order-traversal/', difficulty:'Medium', topic:'Trees', tags:['Persistent','Cognizant'] },
    { title:'Sort Colors (Dutch National Flag)', source:'LeetCode', problemId:'75', url:'https://leetcode.com/problems/sort-colors/', difficulty:'Medium', topic:'Two Pointers', tags:['Mphasis','Accenture'] },
    { title:'Subarray Sum Equals K', source:'LeetCode', problemId:'560', url:'https://leetcode.com/problems/subarray-sum-equals-k/', difficulty:'Medium', topic:'HashMap', tags:['Capgemini','Tech Mahindra'] },
    // Hard
    { title:'Trapping Rain Water', source:'LeetCode', problemId:'42', url:'https://leetcode.com/problems/trapping-rain-water/', difficulty:'Hard', topic:'Two Pointers', tags:['TCS Digital','Infosys SP'] },
    { title:'Median of Two Sorted Arrays', source:'LeetCode', problemId:'4', url:'https://leetcode.com/problems/median-of-two-sorted-arrays/', difficulty:'Hard', topic:'Binary Search', tags:['Persistent'] },
    { title:'Longest Valid Parentheses', source:'LeetCode', problemId:'32', url:'https://leetcode.com/problems/longest-valid-parentheses/', difficulty:'Hard', topic:'Stack/DP', tags:['Infosys PP'] },
  ]);
  console.log('✅ 21 LeetCode problems seeded');

  // ── Aptitude Questions ─────────────────────────────────────
  await AptitudeQuestion.deleteMany({});
  const qs = [
    // ─── QUANTITATIVE — Easy ───────────────────────────────────────────────
    { topic:'Quantitative', difficulty:'Easy', question:'A train 150m long passes a pole in 15 seconds. Speed in km/h?', options:['36','40','45','54'], answer:'36', explanation:'Speed = 150/15 = 10 m/s = 36 km/h' },
    { topic:'Quantitative', difficulty:'Easy', question:'15% of 480 = ?', options:['62','68','72','80'], answer:'72', explanation:'480 × 0.15 = 72' },
    { topic:'Quantitative', difficulty:'Easy', question:'A shirt costs ₹800, sold at 20% profit. Selling price?', options:['₹900','₹960','₹1000','₹1040'], answer:'₹960', explanation:'SP = 800 × 1.2 = ₹960' },
    { topic:'Quantitative', difficulty:'Easy', question:'A:B = 3:5. If A = 12, B = ?', options:['15','18','20','25'], answer:'20', explanation:'3:5 = 12:x → x = 20' },
    { topic:'Quantitative', difficulty:'Easy', question:'Simple interest on ₹5000 at 8% per annum for 3 years?', options:['₹1000','₹1200','₹1400','₹1600'], answer:'₹1200', explanation:'SI = (5000 × 8 × 3) / 100 = ₹1200' },
    { topic:'Quantitative', difficulty:'Easy', question:'Average of 5 numbers: 12, 15, 18, 22, 23 = ?', options:['17','18','19','20'], answer:'18', explanation:'Sum = 90; Avg = 90/5 = 18' },
    { topic:'Quantitative', difficulty:'Easy', question:'Profit% if CP = ₹400, SP = ₹500?', options:['20%','22%','25%','28%'], answer:'25%', explanation:'Profit% = (100/400) × 100 = 25%' },
    // ─── QUANTITATIVE — Medium ──────────────────────────────────────────────
    { topic:'Quantitative', difficulty:'Medium', question:'Pipe fills tank in 4h, another empties in 6h. Both open — fill time?', options:['10h','12h','8h','15h'], answer:'12h', explanation:'Net rate = 1/4 - 1/6 = 1/12 per hour → 12 hours' },
    { topic:'Quantitative', difficulty:'Medium', question:'CI on ₹8000 at 10% p.a. for 2 years?', options:['₹1600','₹1680','₹1760','₹2000'], answer:'₹1680', explanation:'CI = 8000[(1.1)²-1] = 8000×0.21 = ₹1680' },
    { topic:'Quantitative', difficulty:'Medium', question:'A & B complete work in 12 & 18 days. Together they finish in?', options:['6','7.2','8','9'], answer:'7.2', explanation:'Combined = 1/12+1/18 = 5/36 → 36/5 = 7.2 days' },
    { topic:'Quantitative', difficulty:'Medium', question:'Upstream speed = 15 km/h. Distance 75 km. Time taken?', options:['3h','4h','5h','6h'], answer:'5h', explanation:'Time = 75/15 = 5 hours' },
    { topic:'Quantitative', difficulty:'Medium', question:'A man buys 10 articles for ₹100 and sells each for ₹12. Profit%?', options:['15%','18%','20%','22%'], answer:'20%', explanation:'CP each = ₹10, SP = ₹12, Profit% = (2/10)×100 = 20%' },
    { topic:'Quantitative', difficulty:'Medium', question:'Two numbers are in ratio 3:4. Their LCM is 48. Sum of numbers?', options:['24','28','32','36'], answer:'28', explanation:'Numbers: 3x and 4x. LCM = 12x = 48 → x=4. Numbers: 12,16. Sum=28.' },
    // ─── QUANTITATIVE — Hard ───────────────────────────────────────────────
    { topic:'Quantitative', difficulty:'Hard', question:'In 60L mixture, milk:water = 2:1. Water added to make 1:2?', options:['50L','60L','40L','30L'], answer:'60L', explanation:'Milk=40L, Water=20L. Add x: 40/(20+x)=1/2 → x=60' },
    { topic:'Quantitative', difficulty:'Hard', question:'A sum doubles in 5 years at SI. In how many years will it be 4× at same rate?', options:['10','15','20','25'], answer:'15', explanation:'SI rate=20%/yr. For 4×: 300% SI needed → 300/20=15 years' },
    // ─── LOGICAL REASONING — Easy ──────────────────────────────────────────
    { topic:'Logical Reasoning', difficulty:'Easy', question:"ROSE coded as 6821, CHAIR as 73456. SEARCH = ?", options:['216673','214673','214571','216574'], answer:'216673', explanation:'S=2,E=1,A=6,R=6,C=7,H=3 → 216673' },
    { topic:'Logical Reasoning', difficulty:'Easy', question:'Next: 2, 6, 12, 20, 30, ?', options:['40','42','44','46'], answer:'42', explanation:'Differences: 4,6,8,10,12. Next=30+12=42' },
    { topic:'Logical Reasoning', difficulty:'Easy', question:'Find odd one out: 121, 144, 169, 196, 225, 316', options:['169','196','225','316'], answer:'316', explanation:'All others are perfect squares. 316 is not (17²=289, 18²=324).' },
    { topic:'Logical Reasoning', difficulty:'Easy', question:'If A>B, B>C, C>D, then which is smallest?', options:['A','B','C','D'], answer:'D', explanation:'A>B>C>D, so D is smallest.' },
    { topic:'Logical Reasoning', difficulty:'Easy', question:'Mirror image: PRAGATI → reflection on vertical axis?', options:['ITAGARP','PRAGATI','ϽRAGATI','IATGARB'], answer:'ITAGARP', explanation:'Vertical mirror reverses the word → ITAGARP' },
    // ─── LOGICAL REASONING — Medium ────────────────────────────────────────
    { topic:'Logical Reasoning', difficulty:'Medium', question:'All cats are dogs. Some dogs are rats. Conclusion: (i) Some cats are rats (ii) Some rats are dogs', options:['Only (i)','Only (ii)','Both','Neither'], answer:'Only (ii)', explanation:'(ii) follows: some dogs=rats, all cats=dogs, but cats-rats link cannot be derived.' },
    { topic:'Logical Reasoning', difficulty:'Medium', question:'A is B\'s mother. B is C\'s sister. D is C\'s father. What is A to D?', options:['Sister','Wife','Mother','Daughter'], answer:'Wife', explanation:'D is father of C, B is sister of C, A is mother of B → A is wife of D.' },
    { topic:'Logical Reasoning', difficulty:'Medium', question:'Pointing to a man, Priya says "His mother is my father\'s only daughter." Who is the man to Priya?', options:['Brother','Son','Uncle','Nephew'], answer:'Son', explanation:"My father's only daughter = myself (Priya). Man's mother = Priya → Man is Priya's son." },
    { topic:'Logical Reasoning', difficulty:'Medium', question:'A+B means A is mother of B. A−B means A is father of B. A×B means A is brother of B. In P−Q+R, what is P to R?', options:['Grandfather','Grandmother','Father','Uncle'], answer:'Grandfather', explanation:'P-Q: P is father of Q. Q+R: Q is mother of R. So P is grandfather of R.' },
    // ─── VERBAL ABILITY — Easy ─────────────────────────────────────────────
    { topic:'Verbal Ability', difficulty:'Easy', question:'Synonym of BENEVOLENT:', options:['Cruel','Kind','Harsh','Greedy'], answer:'Kind', explanation:'Benevolent = kind, well-meaning' },
    { topic:'Verbal Ability', difficulty:'Easy', question:'Antonym of LOQUACIOUS:', options:['Talkative','Verbose','Reticent','Eloquent'], answer:'Reticent', explanation:'Loquacious = very talkative. Antonym = reticent (silent, reserved).' },
    { topic:'Verbal Ability', difficulty:'Easy', question:'Choose correct: "Neither Ram nor Shyam __ present."', options:['were','are','was','is'], answer:'was', explanation:'Neither...nor takes singular verb when both subjects are singular.' },
    { topic:'Verbal Ability', difficulty:'Easy', question:'Identify error: "He is one of those students who works very hard."', options:['He is','one of those','students who','works very hard'], answer:'works very hard', explanation:'"who" refers to "students" (plural), so should be "work".' },
    // ─── VERBAL ABILITY — Medium ───────────────────────────────────────────
    { topic:'Verbal Ability', difficulty:'Medium', question:'Choose the correctly spelt word:', options:['Accomodate','Accommodate','Acommodate','Acomodate'], answer:'Accommodate', explanation:'Accommodate has double c and double m.' },
    { topic:'Verbal Ability', difficulty:'Medium', question:'Idiom "Bite the bullet" means:', options:['Eat quickly','Face a painful situation bravely','Make a mistake','Be very angry'], answer:'Face a painful situation bravely', explanation:'To "bite the bullet" = to endure a painful or difficult situation.' },
    // ─── DATA INTERPRETATION — Easy ────────────────────────────────────────
    { topic:'Data Interpretation', difficulty:'Easy', question:'Company revenue: Q1=₹2.4L, Q2=₹2.8L, Q3=₹3.2L, Q4=₹3.6L. Average quarterly revenue?', options:['₹2.8L','₹3.0L','₹3.2L','₹2.9L'], answer:'₹3.0L', explanation:'Avg = (2.4+2.8+3.2+3.6)/4 = 12/4 = 3.0 Lakhs' },
    { topic:'Data Interpretation', difficulty:'Easy', question:'Bar chart: sales = 500,700,600,900,800 for 5 months. % increase from month 2 to 4?', options:['27.5%','28.6%','29.5%','30%'], answer:'28.6%', explanation:'(900-700)/700 × 100 ≈ 28.6%' },
    { topic:'Data Interpretation', difficulty:'Medium', question:'A pie chart shows: CSE=35%, IT=25%, ECE=20%, Mech=15%, Civil=5%. Total 400 students. How many in CSE?', options:['120','130','140','150'], answer:'140', explanation:'35% of 400 = 140' },
    // ─── TECHNICAL — Easy ──────────────────────────────────────────────────
    { topic:'Technical', difficulty:'Easy', question:'Time complexity of binary search?', options:['O(n)','O(log n)','O(n log n)','O(1)'], answer:'O(log n)', explanation:'Binary search halves search space each step → O(log n).' },
    { topic:'Technical', difficulty:'Easy', question:'Which data structure for function call stack?', options:['Queue','Stack','Heap','Array'], answer:'Stack', explanation:'Function calls use LIFO call stack.' },
    { topic:'Technical', difficulty:'Easy', question:'output: int x=5; printf("%d", x++);', options:['5','6','4','Error'], answer:'5', explanation:'Post-increment: uses current value (5) then increments.' },
    { topic:'Technical', difficulty:'Easy', question:'SQL clause to filter groups after GROUP BY?', options:['WHERE','HAVING','FILTER','GROUPBY'], answer:'HAVING', explanation:'HAVING filters after grouping. WHERE filters rows before grouping.' },
    { topic:'Technical', difficulty:'Easy', question:'TCP vs UDP — which provides reliable delivery?', options:['UDP','Both','TCP','Neither'], answer:'TCP', explanation:'TCP: connection-oriented, reliable, ordered. UDP: fast, connectionless, unreliable.' },
    { topic:'Technical', difficulty:'Easy', question:'OOP concept where class cannot be instantiated?', options:['Interface','Abstract class','Both A and B','Concrete class'], answer:'Both A and B', explanation:'Both interfaces and abstract classes cannot be directly instantiated.' },
    // ─── TECHNICAL — Medium ────────────────────────────────────────────────
    { topic:'Technical', difficulty:'Medium', question:'Deadlock requires which 4 conditions?', options:['Mutual exclusion, Hold and wait, No preemption, Circular wait','Mutual exclusion, Preemption, Circular wait, Starvation','Starvation, Hold, Release, Circular','Preemption, Sharing, Wait, Circular'], answer:'Mutual exclusion, Hold and wait, No preemption, Circular wait', explanation:'Coffman conditions for deadlock: mutual exclusion, hold-and-wait, no preemption, circular wait.' },
    { topic:'Technical', difficulty:'Medium', question:'What is the output?\nclass A { void show(){System.out.println("A");} }\nclass B extends A { void show(){System.out.println("B");} }\nA obj = new B(); obj.show();', options:['A','B','Error','A B'], answer:'B', explanation:'Runtime polymorphism — obj refers to B instance, so B\'s show() runs.' },
    { topic:'Technical', difficulty:'Medium', question:'What is a foreign key?', options:['Primary key of same table','References PK of another table','Unique key','Index on a column'], answer:'References PK of another table', explanation:'Foreign key creates referential integrity between tables.' },
    { topic:'Technical', difficulty:'Medium', question:'HTTP status code for "Not Found"?', options:['200','301','404','500'], answer:'404', explanation:'404 = Not Found. 200=OK, 301=Moved Permanently, 500=Internal Server Error.' },
    { topic:'Technical', difficulty:'Medium', question:'Which ML algorithm is best for classification with clear margin?', options:['Linear Regression','SVM','K-Means','PCA'], answer:'SVM', explanation:'SVM (Support Vector Machine) maximizes the margin between classes — ideal for classification.' },
    { topic:'Technical', difficulty:'Medium', question:'In DBMS, what is 3NF?', options:['No repeating groups','No partial dependencies','No transitive dependencies','No multi-valued attributes'], answer:'No transitive dependencies', explanation:'3NF: no non-key attribute transitively depends on the primary key.' },
    // ─── TECHNICAL — Hard ──────────────────────────────────────────────────
    { topic:'Technical', difficulty:'Hard', question:'What is the difference between L1 and L2 regularization?', options:['L1 adds |weights| penalty; L2 adds weights² penalty','L1=Ridge, L2=Lasso','L1 prevents overfitting, L2 causes it','No difference'], answer:'L1 adds |weights| penalty; L2 adds weights² penalty', explanation:'L1 (Lasso) adds sum of absolute weights — causes sparsity. L2 (Ridge) adds sum of squared weights — prevents large weights.' },
    { topic:'Technical', difficulty:'Hard', question:'Explain bias-variance tradeoff:', options:['High bias=underfitting, high variance=overfitting','High bias=overfitting, high variance=underfitting','Both mean underfitting','No such concept in ML'], answer:'High bias=underfitting, high variance=overfitting', explanation:'Bias: error from wrong assumptions (underfits). Variance: error from sensitivity to training data (overfits). Goal: find balance.' },
  ];
  await AptitudeQuestion.create(qs);
  console.log(`✅ ${qs.length} aptitude questions seeded (TCS/Infosys/Persistent patterns)`);

  console.log('\n🎉 SEEDING COMPLETE!\n');
  console.log('Demo accounts:');
  console.log('  admin@pragati.edu    / Admin@123');
  console.log('  faculty@pragati.edu  / Faculty@123');
  console.log('  student@pragati.edu  / Student@123\n');
  process.exit(0);
}
seed().catch(e => { console.error('Seed failed:', e); process.exit(1); });
