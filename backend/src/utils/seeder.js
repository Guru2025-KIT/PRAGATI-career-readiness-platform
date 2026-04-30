require('dotenv').config();
const mongoose = require('mongoose');

async function seed() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  const { Company, Problem, AptitudeQuestion } = require('../models/index');

  // ❌ DO NOT TOUCH USERS

  // ─────────────────────────────────────────────────────────
  // ❌ RESET ONLY COMPANY + APTITUDE
  // ─────────────────────────────────────────────────────────
  await Company.deleteMany({});
  await AptitudeQuestion.deleteMany({});

  console.log('🧹 Old Companies & Aptitude removed');

const companies = [

  // ════════════════════════════════════════════════
  // ✅ VISITED
  // ════════════════════════════════════════════════

  {
    name: "TCS",
    logoUrl: "https://mepiks.com/svg-1/tcs-tata-consultancy-services-vector-logo",
    sector: "IT Services",
    website: "https://tcs.com",
    status: "visited",
    campusVisitDate: new Date("2024-09-15"),
    ctc: "3.36–7 LPA",

    roles: [
      "System Engineer",
      "Digital Specialist Engineer",
      "Ninja (Smart Hiring)"
    ],

    techStack: [
      "Java", "Spring Boot", "Python",
      "SQL", "REST APIs", "Cloud (AWS basics)"
    ],

    companyOverview: `
TCS is India's largest IT services company and a part of the Tata Group.
It recruits in bulk across campuses through NQT and Smart Hiring.
The company works in banking, healthcare, retail, and enterprise solutions.
Strong focus on training freshers before project allocation.
    `,

    recruitmentRounds: [
      {
        title: "NQT Aptitude Test",
        description: "3 sections — Verbal, Quantitative, Logical. Focus is on speed and accuracy. No negative marking."
      },
      {
        title: "Advanced Coding Round",
        description: "2 coding questions for Digital roles. Topics include arrays, strings, basic DSA."
      },
      {
        title: "Technical Interview",
        description: "Questions on OOP, DBMS, OS basics, CN, and project explanation."
      },
      {
        title: "Managerial + HR",
        description: "Situational questions, teamwork, relocation, bond agreement."
      }
    ],

    aptitudePatterns: `
Quant: Percentages, Time & Work, Profit & Loss
Logical: Coding-Decoding, Blood Relations, Syllogism
Verbal: Reading Comprehension, Sentence Correction
    `,

    interviewPatterns: `
Explain your project in depth.
Difference between abstract class and interface.
SQL joins with examples.
Deadlock in OS.
    `,

    jdText: `
TCS hires freshers for large-scale IT projects.
Candidates are trained internally and assigned to enterprise solutions.
Work involves development, testing, and maintenance.
    `,

    prepTips: `
Practice RS Aggarwal for aptitude.
Solve 50+ LeetCode Easy problems.
Prepare a 2-minute intro and project explanation.
    `
  },

  {
    name: "Infosys",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg",
    sector: "IT Services",
    website: "https://infosys.com",
    status: "visited",
    campusVisitDate: new Date("2024-10-05"),
    ctc: "3.6–9.5 LPA",

    roles: [
      "Systems Engineer",
      "Specialist Programmer",
      "Power Programmer"
    ],

    techStack: [
      "Java", "Python", "SQL",
      "Cloud", "Microservices"
    ],

    companyOverview: `
Infosys is a global IT services leader headquartered in Bengaluru, India.
Offers multiple hiring tracks with different salary levels.
Strong focus on training and certifications via Infosys Springboard.
Known for InfyTQ platform used for campus hiring assessments.
    `,

    recruitmentRounds: [
      {
        title: "Online Test (InfyTQ / HackWithInfy)",
        description: "Quant, pseudocode tracing, and puzzle solving sections."
      },
      {
        title: "Coding Round",
        description: "For Specialist/Power Programmer roles — 2–3 coding questions of medium difficulty."
      },
      {
        title: "Technical Interview",
        description: "DSA, OOP, DBMS, CN basics, and project walkthrough."
      },
      {
        title: "HR Round",
        description: "Basic HR questions, relocation readiness, bond agreement."
      }
    ],

    aptitudePatterns: `
Pseudocode tracing is most important — 15+ questions.
Quant: Time & Work, Percentages, Ratios.
Logical puzzles and verbal reasoning.
    `,

    interviewPatterns: `
Linked list questions (reversal, detection of cycle).
Tree traversal algorithms.
DBMS joins, normalization.
Explain any one project with tech stack.
    `,

    jdText: `
Infosys hires for multiple tech roles.
Higher tracks (SP, PP) require strong coding skills.
Project-based work in banking, insurance, retail domains.
    `,

    prepTips: `
Practice pseudocode tracing on InfyTQ platform.
Solve LeetCode medium problems (arrays, strings, trees).
Revise OOP and DBMS thoroughly.
    `
  },

  {
    name: "Wipro",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg",
    sector: "IT Services",
    website: "https://wipro.com",
    status: "visited",
    campusVisitDate: new Date("2024-10-20"),
    ctc: "3.5–6.5 LPA",

    roles: [
      "Project Engineer",
      "Elite National Talent Hunt Engineer",
      "Turbo Graduate Engineer"
    ],

    techStack: [
      "Java", "Python", "SQL",
      "HTML/CSS", "JavaScript", "REST APIs"
    ],

    companyOverview: `
Wipro is a leading global IT, consulting, and BPS company.
Offers multiple campus hiring tracks — Elite, Turbo, and WILP.
Works in cloud, cybersecurity, data analytics, and enterprise IT.
Strong presence in manufacturing, BFSI, and telecom sectors.
    `,

    recruitmentRounds: [
      {
        title: "NLTH Online Test",
        description: "Aptitude, communication, coding, and essay writing sections."
      },
      {
        title: "Coding Test (Turbo/Elite)",
        description: "2 coding problems in Python or Java. Medium difficulty DSA."
      },
      {
        title: "Technical Interview",
        description: "OOP, DBMS, OS, CN, project explanation."
      },
      {
        title: "HR Interview",
        description: "Background check, relocation preferences, bond details."
      }
    ],

    aptitudePatterns: `
Quant: Percentages, Averages, Speed-Distance.
Verbal: Fill in the blanks, comprehension.
Essay writing: Current affairs topics.
    `,

    interviewPatterns: `
Explain your final year project.
String/Array coding problems.
Difference between TCP and UDP.
ACID properties in DBMS.
    `,

    jdText: `
Wipro hires freshers for development, testing, and support roles.
Internal training provided before project allocation.
    `,

    prepTips: `
Prepare essay writing topics from current affairs.
Solve 60+ LeetCode Easy-Medium problems.
Focus on communication skills.
    `
  },

  {
    name: "Cognizant",
    logoUrl: "https://commons.wikimedia.org/wiki/File:Cognizant_logo_2022.svg",
    sector: "IT Services",
    website: "https://cognizant.com",
    status: "visited",
    campusVisitDate: new Date("2024-11-02"),
    ctc: "4–7 LPA",

    roles: [
      "Programmer Analyst Trainee",
      "GenC",
      "GenC Next",
      "GenC Elevate"
    ],

    techStack: [
      "Java", "Python", "SQL",
      "React", "Cloud Fundamentals"
    ],

    companyOverview: `
Cognizant is a multinational IT services and consulting company.
Offers tiered campus hiring — GenC, GenC Next, GenC Elevate.
Focuses on digital transformation, AI, and cloud-based solutions.
Works extensively with BFSI, healthcare, and retail clients.
    `,

    recruitmentRounds: [
      {
        title: "GenC Online Test",
        description: "Aptitude, logical reasoning, verbal, and coding MCQs."
      },
      {
        title: "Coding Round (GenC Next/Elevate)",
        description: "2 coding problems — arrays, strings, recursion."
      },
      {
        title: "Technical Interview",
        description: "OOP, DBMS, CN, DSA problem-solving, project discussion."
      },
      {
        title: "HR Round",
        description: "Communication check, career goals, relocation."
      }
    ],

    aptitudePatterns: `
Quant: Profit & Loss, Permutations, Time & Work.
Logical: Seating arrangements, direction sense.
Verbal: Reading comprehension, grammar.
    `,

    interviewPatterns: `
Write a program for string reversal.
Explain normalization (1NF–3NF).
Describe a challenging project scenario.
    `,

    jdText: `
Cognizant recruits freshers for software development, QA, and consulting.
Strong training programs before client project allocation.
    `,

    prepTips: `
Revise all OOP concepts with examples.
Practice aptitude on IndiaBIX and PrepInsta.
Keep a strong 2-minute project pitch ready.
    `
  },

  {
    name: "Capgemini",
    logoUrl: "https://commons.wikimedia.org/wiki/File:Capgemini_201x_logo.svg",
    sector: "IT Consulting",
    website: "https://capgemini.com",
    status: "visited",
    campusVisitDate: new Date("2024-11-15"),
    ctc: "3.8–7 LPA",

    roles: [
      "Analyst",
      "Senior Analyst",
      "Associate Consultant"
    ],

    techStack: [
      "Java", "Python", "SQL",
      "Selenium", "Cloud (Azure/AWS)", "Agile"
    ],

    companyOverview: `
Capgemini is a French multinational IT and consulting company.
One of the world's largest IT companies by revenue.
Focuses on cloud services, digital engineering, and enterprise IT.
Strong recruiter at Indian engineering campuses.
    `,

    recruitmentRounds: [
      {
        title: "Aptitude Test",
        description: "Quant, logical, verbal, and pseudocode sections on AMCAT/Cocubes platform."
      },
      {
        title: "Essay Writing",
        description: "Short essay on a given tech or social topic — tests written communication."
      },
      {
        title: "Technical Interview",
        description: "OOP, DBMS, project walkthrough, basic coding."
      },
      {
        title: "HR Interview",
        description: "Background, soft skills, relocation, and culture fit."
      }
    ],

    aptitudePatterns: `
Pseudocode tracing questions are common.
Quant: Percentages, Ratios, Mensuration.
Verbal: Sentence ordering, vocabulary.
    `,

    interviewPatterns: `
Write a Java program for Fibonacci series.
Explain polymorphism with real-world example.
DBMS: Difference between DELETE and TRUNCATE.
    `,

    jdText: `
Capgemini hires for application development, cloud migration, and testing.
Work involves client-facing roles in banking and manufacturing sectors.
    `,

    prepTips: `
Practice essay writing on GD topics.
Revise pseudocode tracing from previous year papers.
Brush up on Agile methodology basics.
    `
  },

  // ════════════════════════════════════════════════
  // 🔜 UPCOMING
  // ════════════════════════════════════════════════

  {
    name: "Accenture",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg",
    sector: "IT Consulting",
    website: "https://accenture.com",
    status: "upcoming",
    ctc: "4.5–8 LPA",

    roles: [
      "Associate Software Engineer",
      "AI Solutions Associate",
      "Packaged App Developer"
    ],

    techStack: [
      "Java", "Python", "React",
      "SQL", "Azure", "Machine Learning Basics"
    ],

    companyOverview: `
Accenture is a global consulting and technology company.
It focuses on digital transformation, AI solutions, and cloud services.
Highly structured hiring with a dedicated communication assessment round.
One of the top recruiters for fresh engineering graduates in India.
    `,

    recruitmentRounds: [
      {
        title: "Cognitive & Technical Assessment",
        description: "Logical, verbal, mathematical aptitude, and MCQs on OOP, DBMS, DS."
      },
      {
        title: "Communication Test",
        description: "AI-based video response evaluation to assess spoken and written English fluency."
      },
      {
        title: "Technical Interview",
        description: "Code debugging exercises, DBMS queries, OOP design questions."
      },
      {
        title: "HR Interview",
        description: "Soft skill assessment, relocation, career goals."
      }
    ],

    aptitudePatterns: `
Logical puzzles, verbal reasoning, quantitative aptitude.
Technical MCQs on C, Java, DBMS, DS.
    `,

    interviewPatterns: `
Find bugs in given code snippets.
Explain DBMS normalization (1NF–BCNF).
Explain ML model lifecycle (for AI role applicants).
    `,

    jdText: `
Accenture provides roles in development, AI, and consulting.
Strong emphasis on communication and teamwork.
Internal training on cloud and AI tools post-joining.
    `,

    prepTips: `
Practice speaking clearly — record yourself.
Revise OOP and DBMS thoroughly.
Prepare ML basics if AIML student.
    `
  },

  {
    name: "Persistent Systems",
    logoUrl: "https://commons.wikimedia.org/wiki/File:Persistent_Systems_Logo.svg",
    sector: "Product Engineering",
    website: "https://persistent.com",
    status: "upcoming",
    ctc: "4–8 LPA",

    roles: [
      "Software Engineer",
      "Product Developer"
    ],

    techStack: [
      "Java", "Python", "Node.js",
      "React", "Docker", "Kubernetes"
    ],

    companyOverview: `
Persistent Systems is a product engineering services company based in Pune.
Focuses on cloud computing, enterprise solutions, and SaaS platforms.
Known for strong technical interviews and good work culture.
Works with healthcare, BFSI, and high-tech industry verticals.
    `,

    recruitmentRounds: [
      {
        title: "Aptitude Test",
        description: "AMCAT-based logical, quantitative, and verbal reasoning."
      },
      {
        title: "Coding Round",
        description: "2 DSA problems of medium difficulty (arrays, linked lists, trees)."
      },
      {
        title: "Technical Interview",
        description: "Deep dive into projects, DSA problem-solving, DBMS, and OOP."
      },
      {
        title: "HR Round",
        description: "Culture fit, relocation, career goals discussion."
      }
    ],

    aptitudePatterns: `
Logical reasoning + moderate quantitative aptitude.
Coding MCQs on Java/Python.
    `,

    interviewPatterns: `
Explain your GitHub project in detail.
Time complexity of sorting algorithms.
Write code for array manipulation / string problems.
    `,

    jdText: `
Product-based work environment with exposure to cutting-edge tech.
Focus on scalable backend systems and cloud-native applications.
    `,

    prepTips: `
Solve 100+ DSA problems on LeetCode.
Keep GitHub projects polished and documented.
Practice explaining system design basics.
    `
  },

  {
    name: "Hexaware Technologies",
    logoUrl: "https://commons.wikimedia.org/wiki/File:Hexaware_new_logo.svg",
    sector: "IT Services & BPO",
    website: "https://hexaware.com",
    status: "upcoming",
    ctc: "3.5–6 LPA",

    roles: [
      "Graduate Engineer Trainee",
      "Software Engineer"
    ],

    techStack: [
      "Java", "Python", "SQL",
      "Selenium", "REST APIs", "Cloud Basics"
    ],

    companyOverview: `
Hexaware Technologies is a global IT and BPO company headquartered in Mumbai.
Specializes in automation-led transformation and AI-powered services.
Works in BFSI, healthcare, manufacturing, and travel sectors.
Known for a supportive work culture and fast growth opportunities.
    `,

    recruitmentRounds: [
      {
        title: "Online Aptitude Test",
        description: "Verbal, quantitative, logical, and basic coding sections."
      },
      {
        title: "Technical Interview",
        description: "OOP concepts, basic SQL queries, project discussion."
      },
      {
        title: "HR Round",
        description: "Personality, communication, relocation readiness."
      }
    ],

    aptitudePatterns: `
Quant: Percentages, Averages, Number Series.
Logical: Pattern recognition, syllogism.
Verbal: Grammar, reading comprehension.
    `,

    interviewPatterns: `
Explain difference between OOP and Procedural programming.
Write SQL query for second highest salary.
Describe any project you built.
    `,

    jdText: `
Hexaware hires freshers for IT services, automation testing, and cloud support roles.
Training provided on proprietary tools and client-specific platforms.
    `,

    prepTips: `
Practice SQL queries — joins, subqueries, aggregate functions.
Revise OOP with Java examples.
Prepare HR questions around adaptability and teamwork.
    `
  },

  {
    name: "Tech Mahindra",
    logoUrl: "https://commons.wikimedia.org/wiki/File:Tech_Mahindra_New_Logo.svg",
    sector: "IT Services & Telecom",
    website: "https://techmahindra.com",
    status: "upcoming",
    ctc: "3.25–6 LPA",

    roles: [
      "Software Engineer",
      "Associate Software Engineer",
      "SMART Hire Engineer"
    ],

    techStack: [
      "Java", "Python", "SQL",
      "Networking Basics", "5G Concepts", "Cloud"
    ],

    companyOverview: `
Tech Mahindra is a Mahindra Group company specializing in IT and telecom solutions.
Strong presence in 5G, networking, and enterprise IT services.
Recruits in bulk through campus drives and SMART hiring.
Works with telecom giants, BFSI, and manufacturing companies globally.
    `,

    recruitmentRounds: [
      {
        title: "Online Test",
        description: "Aptitude, logical reasoning, verbal ability, and basic coding MCQs."
      },
      {
        title: "Coding Round",
        description: "1–2 coding problems in Java/Python (Easy to Medium level)."
      },
      {
        title: "Technical Interview",
        description: "OOP, DBMS, networking basics, project discussion."
      },
      {
        title: "HR Round",
        description: "Soft skills, relocation, bond and offer discussion."
      }
    ],

    aptitudePatterns: `
Quant: Time-Speed, Ratios, Profit & Loss.
Logical: Series completion, arrangements.
Verbal: Synonyms, antonyms, comprehension.
    `,

    interviewPatterns: `
What is the OSI model?
Explain inheritance with an example.
Write code for string palindrome check.
    `,

    jdText: `
Tech Mahindra hires for telecom, IT services, and cloud development roles.
Freshers are trained on domain-specific tools before deployment.
    `,

    prepTips: `
Study networking basics — OSI model, TCP/IP, DNS.
Revise OOP and basic DSA.
Practice coding in Java or Python.
    `
  },

  {
    name: "Amdocs",
    logoUrl: "https://commons.wikimedia.org/wiki/File:Amdocs-2017-brand-mark.svg",
    sector: "Telecom IT Solutions",
    website: "https://amdocs.com",
    status: "upcoming",
    ctc: "4–8 LPA",

    roles: [
      "Software Developer",
      "Associate Software Engineer",
      "QA Engineer"
    ],

    techStack: [
      "Java", "Python", "SQL",
      "Linux", "REST APIs", "Microservices", "Telecom Protocols"
    ],

    companyOverview: `
Amdocs is a global provider of software and services for telecom and media companies.
Headquartered in Missouri, USA with major development centers in India.
Works with top telecom operators like AT&T, T-Mobile, and Vodafone.
Known for complex enterprise products and good compensation for freshers.
    `,

    recruitmentRounds: [
      {
        title: "Online Aptitude & Coding Test",
        description: "Quant, logical, verbal, and 1–2 coding problems."
      },
      {
        title: "Technical Interview – Round 1",
        description: "DSA problem-solving, OOP, DBMS, Java/Python fundamentals."
      },
      {
        title: "Technical Interview – Round 2",
        description: "System design basics, API concepts, project explanation."
      },
      {
        title: "HR Round",
        description: "Culture fit, team adaptability, salary discussion."
      }
    ],

    aptitudePatterns: `
Quant: Number theory, Percentages, Ratios.
Logical: Puzzles, seating arrangements.
Coding: Easy-Medium DSA problems.
    `,

    interviewPatterns: `
Implement stack using queues.
Explain REST vs SOAP APIs.
Write SQL for finding duplicate records.
    `,

    jdText: `
Amdocs hires for product development in telecom domain.
Work involves BSS/OSS solutions for major global operators.
    `,

    prepTips: `
Learn basics of telecom — BSS, OSS, billing systems.
Solve Medium LeetCode problems consistently.
Prepare REST API concepts thoroughly.
    `
  },

  {
    name: "Netcracker",
    logoUrl: "https://en.wikipedia.org/wiki/File:Netcracker_Technology_logo.svg",
    sector: "Telecom IT Solutions",
    website: "https://netcracker.com",
    status: "upcoming",
    ctc: "4–7 LPA",

    roles: [
      "Junior Software Engineer",
      "QA Engineer",
      "Implementation Analyst"
    ],

    techStack: [
      "Java", "SQL", "XML",
      "REST APIs", "Linux", "OSS/BSS Systems"
    ],

    companyOverview: `
Netcracker Technology is a subsidiary of NEC Corporation.
Provides cloud-native BSS/OSS telecom solutions to global operators.
Headquartered in the USA with development centers in India and Eastern Europe.
Known for niche telecom domain expertise and stable work culture.
    `,

    recruitmentRounds: [
      {
        title: "Online Test",
        description: "Aptitude + basic Java/SQL coding questions."
      },
      {
        title: "Technical Interview",
        description: "Core Java concepts, DBMS, basic Linux commands, project walkthrough."
      },
      {
        title: "HR Round",
        description: "Work preferences, relocation, career goals."
      }
    ],

    aptitudePatterns: `
Moderate aptitude — quant and logical.
Focus on Java and SQL MCQs.
    `,

    interviewPatterns: `
Java: Collections, Exception Handling.
SQL: Joins, stored procedures.
Explain your project architecture.
    `,

    jdText: `
Netcracker recruits for telecom software development and QA roles.
Strong focus on Java, SQL, and telecom domain knowledge.
    `,

    prepTips: `
Master Core Java — Collections, Multithreading, OOP.
Practice complex SQL queries.
Learn about OSS/BSS telecom workflows.
    `
  },

  {
    name: "KPIT Technologies",
    logoUrl: "https://commons.wikimedia.org/wiki/File:KPIT_Technologies_Logo.svg",
    sector: "Automotive IT & Engineering",
    website: "https://kpit.com",
    status: "upcoming",
    ctc: "4–8 LPA",

    roles: [
      "Software Engineer – Embedded",
      "AUTOSAR Developer",
      "Python Developer"
    ],

    techStack: [
      "C", "C++", "Python",
      "AUTOSAR", "CAN Protocol", "RTOS", "Linux"
    ],

    companyOverview: `
KPIT Technologies is a global technology company focused on automotive and mobility software.
Specializes in embedded systems, AUTOSAR, and EV powertrain software.
Works with OEMs like BMW, Volkswagen, and Toyota.
One of the best companies for students from Electronics and Computer engineering.
    `,

    recruitmentRounds: [
      {
        title: "Online Test",
        description: "Aptitude + C/C++ MCQs + embedded concept questions."
      },
      {
        title: "Technical Interview – Round 1",
        description: "C/C++ programming, pointers, memory management, RTOS basics."
      },
      {
        title: "Technical Interview – Round 2",
        description: "Automotive protocols (CAN, LIN, SPI), AUTOSAR architecture."
      },
      {
        title: "HR Round",
        description: "Salary discussion, relocation, career interests."
      }
    ],

    aptitudePatterns: `
Quant: Basic aptitude.
Technical: C pointers, bit manipulation, MCQ on OS and embedded systems.
    `,

    interviewPatterns: `
Explain memory segmentation in C.
What is a semaphore in RTOS?
Difference between CAN and LIN protocols.
    `,

    jdText: `
KPIT hires for automotive embedded software roles.
Work involves developing AUTOSAR components and ECU testing.
    `,

    prepTips: `
Deep dive into C/C++ pointers and memory management.
Study AUTOSAR layered architecture.
Learn CAN protocol basics from documentation.
    `
  },

  {
    name: "PayPal",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
    sector: "Fintech",
    website: "https://paypal.com",
    status: "upcoming",
    ctc: "12–20 LPA",

    roles: [
      "Software Engineer (University Hire)",
      "Data Engineer",
      "SRE Associate"
    ],

    techStack: [
      "Java", "Python", "Node.js",
      "React", "Kafka", "Kubernetes", "AWS"
    ],

    companyOverview: `
PayPal is a global fintech leader in digital payments and financial services.
India offices in Chennai and Bengaluru handle major product development.
Highly competitive campus hiring with strong DSA rounds.
Offers excellent growth, mentorship, and compensation for freshers.
    `,

    recruitmentRounds: [
      {
        title: "Online Coding Test",
        description: "2–3 DSA problems (Medium to Hard). Timed, proctored test."
      },
      {
        title: "Technical Interview – Round 1",
        description: "Data structures, algorithms, time/space complexity analysis."
      },
      {
        title: "Technical Interview – Round 2",
        description: "System design basics, low-level design, coding problem."
      },
      {
        title: "HR / Culture Fit",
        description: "Behavioral questions, values alignment with PayPal's mission."
      }
    ],

    aptitudePatterns: `
Strong DSA focus — graphs, trees, DP, greedy.
No traditional aptitude; purely coding-focused.
    `,

    interviewPatterns: `
Implement LRU Cache.
Find shortest path in a weighted graph.
Explain how you would design a payment gateway.
    `,

    jdText: `
PayPal recruits engineers for scalable fintech product development.
Work involves payment systems, fraud detection, and API development.
    `,

    prepTips: `
Solve 200+ LeetCode problems, focus on Medium/Hard.
Study system design: caching, load balancing, databases.
Practice behavioral interviews using STAR method.
    `
  },

  {
    name: "Paytm",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/42/Paytm_logo.png",
    sector: "Fintech",
    website: "https://paytm.com",
    status: "upcoming",
    ctc: "6–14 LPA",

    roles: [
      "Software Development Engineer",
      "Backend Engineer",
      "Data Analyst"
    ],

    techStack: [
      "Java", "Go", "Python",
      "MySQL", "Redis", "Kafka", "Microservices"
    ],

    companyOverview: `
Paytm is India's leading digital payments and financial services company.
Operates a super-app model covering payments, banking, and e-commerce.
Strong engineering culture with exposure to high-scale distributed systems.
Actively recruits from top engineering campuses across India.
    `,

    recruitmentRounds: [
      {
        title: "Online Coding Test",
        description: "2–3 DSA problems. Focus on arrays, trees, graphs, and string manipulation."
      },
      {
        title: "Technical Interview – Round 1",
        description: "DSA deep dive, OOP, DBMS, CS fundamentals."
      },
      {
        title: "Technical Interview – Round 2",
        description: "System design, scalability concepts, and architecture discussion."
      },
      {
        title: "HR Round",
        description: "Cultural fit, passion for fintech, salary negotiation."
      }
    ],

    aptitudePatterns: `
Heavy DSA focus — arrays, graphs, DP, trees.
No traditional aptitude section.
    `,

    interviewPatterns: `
Design a UPI transaction system.
Explain database indexing and its trade-offs.
Write code for detecting cycle in a linked list.
    `,

    jdText: `
Paytm hires engineers for high-scale payment and financial product development.
Work involves backend services, data pipelines, and API integrations.
    `,

    prepTips: `
Solve LeetCode medium-hard consistently.
Study Redis, Kafka, and microservices basics.
Understand UPI, NPCI, and payment systems architecture.
    `
  },

  
  
  // ════════════════════════════════════════════════
  // 🔵 EXPECTED (Some roles are tech-adjacent)
  // ════════════════════════════════════════════════

  {
    name: "Bentley Systems",
    logoUrl: "https://commons.wikimedia.org/wiki/File:Bentley_Systems_logo.svg",
    sector: "Engineering Software",
    website: "https://bentley.com",
    status: "expected",
    ctc: "5–10 LPA",

    roles: [
      "Software Engineer",
      "QA Engineer",
      "DevOps Engineer"
    ],

    techStack: [
      "C++", "C#", ".NET",
      "Python", "SQL", "Azure DevOps", "Microservices"
    ],

    companyOverview: `
Bentley Systems is a US-based software company specializing in infrastructure engineering software.
Products like MicroStation and OpenRoads are used by engineers worldwide.
Strong engineering culture with focus on 3D modeling, simulation, and digital twins.
Recruits from CS, IT, and ECE streams for software development and QA.
    `,

    recruitmentRounds: [
      {
        title: "Online Assessment",
        description: "Aptitude + coding problems in C++/Python."
      },
      {
        title: "Technical Interview – Round 1",
        description: "DSA, OOP in C++/C#, problem-solving, debugging."
      },
      {
        title: "Technical Interview – Round 2",
        description: "System design, software architecture concepts, past project deep dive."
      },
      {
        title: "HR Round",
        description: "Career goals, team collaboration, relocation."
      }
    ],

    aptitudePatterns: `
Standard aptitude + C++/Python coding problems.
Focus on algorithmic thinking and OOP.
    `,

    interviewPatterns: `
Design a class hierarchy for a 3D geometry engine.
Explain virtual functions and polymorphism in C++.
Write a program to find connected components in a graph.
    `,

    jdText: `
Bentley recruits for engineering software product development.
Work involves geometry algorithms, simulation tools, and cloud infrastructure.
    `,

    prepTips: `
Strong C++ skills are essential — focus on STL, templates, OOP.
Practice system design for desktop + cloud hybrid applications.
Explore Bentley's MicroStation product documentation for context.
    `
  },

  {
    name: "BNY Mellon",
    logoUrl: "https://commons.wikimedia.org/wiki/File:BNY_Mellon.svg",
    sector: "Financial Technology",
    website: "https://bnymellon.com",
    status: "expected",
    ctc: "8–18 LPA",

    roles: [
      "Technology Analyst",
      "Software Engineer",
      "Data Engineer"
    ],

    techStack: [
      "Java", "Python", "SQL",
      "Spring Boot", "AWS", "Kafka", "React"
    ],

    companyOverview: `
BNY Mellon is one of the world's oldest and largest financial institutions.
Its India tech center in Pune handles major product engineering and data analytics.
Recruits tech talent for core banking, investment management, and risk systems.
Excellent compensation, global exposure, and structured growth paths for freshers.
    `,

    recruitmentRounds: [
      {
        title: "Online Coding Test",
        description: "2–3 DSA problems (Medium difficulty) + aptitude section."
      },
      {
        title: "Technical Interview – Round 1",
        description: "DSA, Java OOP, DBMS, data structures implementation."
      },
      {
        title: "Technical Interview – Round 2",
        description: "System design, financial domain questions, past projects."
      },
      {
        title: "HR Round",
        description: "Behavioral questions, values alignment, compensation discussion."
      }
    ],

    aptitudePatterns: `
DSA-heavy online test + basic quantitative aptitude.
Finance domain MCQs may appear.
    `,

    interviewPatterns: `
Implement producer-consumer using Java threads.
Design a simple stock trading system.
Explain CAP theorem in distributed systems.
    `,

    jdText: `
BNY Mellon hires engineers for fintech product development in asset management.
Work involves building APIs, data pipelines, and financial processing systems.
    `,

    prepTips: `
Solve LeetCode Medium problems — focus on graphs and DP.
Study distributed systems basics (CAP, eventual consistency).
Learn Spring Boot and REST API development.
    `
  },

  {
    name: "Stantec",
    logoUrl: "https://imgbin.com/png/mfzNT6ki/logo-stantec-architecture-design-brand-png",
    sector: "Engineering & Environmental Consulting",
    website: "https://stantec.com",
    status: "expected",
    ctc: "4–8 LPA",

    roles: [
      "Software Developer (Tech Roles)",
      "GIS Analyst",
      "Digital Solutions Engineer"
    ],

    techStack: [
      "Python", "SQL", "GIS Tools",
      "ArcGIS", "AutoCAD", "Azure", "Power BI"
    ],

    companyOverview: `
Stantec is a Canadian engineering and environmental consulting firm.
Offers technology roles in digital infrastructure, GIS, and smart city solutions.
Works in water, energy, buildings, and transportation sectors.
India operations focus on tech-enabled engineering design and analytics.
    `,

    recruitmentRounds: [
      {
        title: "Online Assessment",
        description: "Aptitude + domain-specific technical MCQs."
      },
      {
        title: "Technical Interview",
        description: "Python/SQL, GIS concepts, engineering tool knowledge."
      },
      {
        title: "HR Round",
        description: "Culture fit, sustainability values, career goals."
      }
    ],

    aptitudePatterns: `
Moderate aptitude + analytical reasoning.
Domain-specific questions on GIS or engineering software.
    `,

    interviewPatterns: `
Explain a GIS project you worked on.
Write Python script for data processing.
Describe experience with AutoCAD or similar tools.
    `,

    jdText: `
Stantec hires tech professionals for digital engineering and smart infrastructure projects.
Roles involve data analytics, GIS mapping, and tool development.
    `,

    prepTips: `
Learn Python for data processing and automation.
Explore ArcGIS or QGIS basics for GIS roles.
Build a portfolio with relevant engineering data projects.
    `
  },

  {
    name: "Google",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    sector: "Technology (Search, Cloud, AI)",
    website: "https://google.com/about/careers",
    status: "expected",
    ctc: "20–45 LPA",

    roles: [
      "Software Engineer (University Graduate)",
      "Associate Product Manager",
      "Site Reliability Engineer"
    ],

    techStack: [
      "C++", "Java", "Python",
      "Go", "Kubernetes", "BigQuery",
      "TensorFlow", "Distributed Systems"
    ],

    companyOverview: `
Google is one of the world's most valuable technology companies.
Products include Search, Maps, YouTube, Android, and Google Cloud.
Campus hiring is extremely competitive — among the most rigorous globally.
India offices in Bengaluru and Hyderabad handle major product and infra work.
Offers exceptional compensation, learning culture, and global mobility.
    `,

    recruitmentRounds: [
      {
        title: "Resume Shortlisting",
        description: "Strong GPA, competitive programming history, open source contributions preferred."
      },
      {
        title: "Online Coding Test",
        description: "2–3 algorithmic problems of Hard difficulty. LeetCode Hard level."
      },
      {
        title: "Phone/Video Interview x2",
        description: "Live coding rounds with Google engineers. Data structures, algorithms, and problem-solving."
      },
      {
        title: "Onsite / Virtual Onsite (3–5 rounds)",
        description: "DSA, system design, behavioral (Googleyness), and role-specific rounds."
      }
    ],

    aptitudePatterns: `
No traditional aptitude — purely algorithmic.
Focus: graphs, DP, segment trees, advanced data structures.
    `,

    interviewPatterns: `
Design Google Maps routing algorithm.
Implement a thread-safe LRU cache.
Optimize a given O(n²) algorithm to O(n log n).
    `,

    jdText: `
Google hires for product engineering, infrastructure, and AI research roles.
Engineers work on products used by billions of people globally.
    `,

    prepTips: `
Solve 300+ LeetCode problems, including Hard problems.
Study system design: load balancers, distributed caching, databases.
Practice mock interviews on Pramp or interviewing.io.
Read "Cracking the Coding Interview" by Gayle McDowell.
    `
  },

  {
    name: "Microsoft",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    sector: "Technology (Cloud, Software, AI)",
    website: "https://careers.microsoft.com",
    status: "expected",
    ctc: "20–45 LPA",

    roles: [
      "Software Engineer (SWE)",
      "Program Manager (PM)",
      "Data & Applied Scientist"
    ],

    techStack: [
      "C#", "C++", "Python",
      "Azure", "TypeScript", "React",
      "Kubernetes", "Machine Learning"
    ],

    companyOverview: `
Microsoft is a global leader in cloud computing, software, and AI.
Products include Windows, Azure, Office 365, GitHub, and Xbox.
India offices in Hyderabad (GTSC) and Bengaluru are major engineering hubs.
Known for a strong collaborative culture and exceptional career growth paths.
One of the most sought-after campus employers in India.
    `,

    recruitmentRounds: [
      {
        title: "Resume Shortlisting",
        description: "Academic record, internships, open source, and competitive programming considered."
      },
      {
        title: "Online Coding Test",
        description: "2–3 DSA problems (Medium to Hard) with time constraints."
      },
      {
        title: "Technical Interview x3",
        description: "DSA, OOP, system design concepts, and code quality evaluation."
      },
      {
        title: "HR / As Appropriate (AA) Round",
        description: "Behavioral questions aligned with Microsoft's Growth Mindset values."
      }
    ],

    aptitudePatterns: `
No aptitude test — purely coding and system design.
Focus: trees, graphs, DP, string algorithms, design patterns.
    `,

    interviewPatterns: `
Serialize and deserialize a binary tree.
Design a URL shortener like bit.ly.
Implement a task scheduler with priority queues.
    `,

    jdText: `
Microsoft hires for cloud infrastructure, developer tools, AI platforms, and enterprise software.
Engineers work on products that impact billions of users globally.
    `,

    prepTips: `
Solve 200–300 LeetCode problems, including graph and DP problems.
Study system design — Azure architecture patterns are a bonus.
Practice Growth Mindset behavioral questions (STAR method).
Explore GitHub and Azure documentation for product familiarity.
    `
  }
];

  // ─────────────────────────────────────────────────────────
  // 📊 APTITUDE (REAL EXAM LEVEL)
  // ─────────────────────────────────────────────────────────
  const aptitude = [
    {
      topic: 'Quantitative',
      difficulty: 'Medium',
      question: `
A train 120 meters long is running at a speed of 54 km/hr.
In what time will it pass a man standing on the platform?

Options:
A) 6 sec
B) 8 sec
C) 10 sec
D) 12 sec
      `,
      answer: 'B',
      explanation: `
Speed = 54 km/hr = 15 m/s
Time = Distance / Speed = 120 / 15 = 8 sec
      `
    },

    {
      topic: 'Quantitative',
      difficulty: 'Medium',
      question: `
A sum of money doubles itself in 5 years at simple interest.
In how many years will it become 3 times?

Options:
A) 10
B) 12
C) 15
D) 20
      `,
      answer: 'A',
      explanation: `
SI for double = 100% in 5 years
Rate = 20% per year

For 3x → 200% → 200/20 = 10 years
      `
    },

    {
      topic: 'Logical',
      difficulty: 'Medium',
      question: `
Statement:
All roses are flowers.
Some flowers are red.

Conclusion:
1. Some roses are red
2. All flowers are roses

Options:
A) Only 1
B) Only 2
C) Both
D) None
      `,
      answer: 'D'
    }
  ];

  await AptitudeQuestion.insertMany(aptitude);
  console.log(`✅ ${aptitude.length} aptitude questions added`);

  // ─────────────────────────────────────────────────────────
  // 💻 PROBLEMS (BULK ADD, NO DELETE)
  // ─────────────────────────────────────────────────────────
  const problems = [];

  // Arrays (sample generator)
  for (let i = 1; i <= 30; i++) {
    problems.push({
      title: `Array Problem ${i}`,
      source: 'LeetCode',
      difficulty: 'Easy',
      topic: 'Arrays'
    });
  }

  for (let i = 1; i <= 30; i++) {
    problems.push({
      title: `String Problem ${i}`,
      source: 'LeetCode',
      difficulty: 'Medium',
      topic: 'Strings'
    });
  }

  for (let i = 1; i <= 30; i++) {
    problems.push({
      title: `Recursion Problem ${i}`,
      source: 'LeetCode',
      difficulty: 'Medium',
      topic: 'Recursion'
    });
  }

  await Problem.insertMany(problems);
  console.log(`✅ ${problems.length} problems added`);

  console.log('\n🎉 SEED COMPLETE\n');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});