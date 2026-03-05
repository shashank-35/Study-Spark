import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import { fileURLToPath } from "url";
// pdf-parse's package entry executes a test file on import in some environments.
// To avoid that, require the implementation file directly using createRequire.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

// ── Coding Lab Routes ────────────────────────────────────────────────────
import registerExecuteRoute from "./routes/execute.js";
import registerSubmissionsRoute from "./routes/submissions.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 8787;

// Groq API configuration (llama-3.3-70b-versatile)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

let groq = null;

if (!GROQ_API_KEY) {
  console.warn("⚠️ Groq API key is not set. AI endpoints will return a fallback message.");
  console.warn("Set GROQ_API_KEY in .env to enable AI features: https://console.groq.com");
} else {
  groq = new Groq({ apiKey: GROQ_API_KEY });
  console.log("🔑 Groq API Key:", GROQ_API_KEY.substring(0, 12) + "...");
  console.log("🤖 Groq Model: llama-3.3-70b-versatile initialized");
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Ensure directories
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");
const textsDir = path.join(dataDir, "texts");
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(textsDir, { recursive: true });

// Simple JSON storage for file metadata
const metaPath = path.join(dataDir, "files.json");
function readMeta() {
  try {
    const raw = fs.readFileSync(metaPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function writeMeta(list) {
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(metaPath, JSON.stringify(list, null, 2));
}

// Static serving for uploaded files
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || "");
    cb(null, unique + ext);
  },
});

const upload = multer({ storage });

async function extractTextFromFile(filePath, mimeType) {
  try {
    if (mimeType && mimeType.includes("pdf")) {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text || "";
    }
    // Fallback: treat as text
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function suggestQuestionsFromText(text) {
  if (!text) return [];
  const sentences = text
    .split(/\n\s*\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
    .slice(0, 500);

  const keywords = ["what", "why", "how", "explain", "define", "difference", "advantages", "disadvantages", "uses", "algorithm"];
  const questions = [];
  for (const s of sentences) {
    const lower = s.toLowerCase();
    if (s.endsWith("?") || keywords.some((k) => lower.includes(k))) {
      questions.push(s.replace(/^[0-9]+\.|^[*-]\s*/, ""));
    }
    if (questions.length >= 25) break;
  }
  return questions;
}

// Helper function to format conversation history
function formatConversationHistory(messages) {
  return messages.slice(-6).map(msg => {
    const role = msg.role === 'user' ? 'Student' : 'Study Spark';
    return `${role}: ${msg.content}`;
  }).join('\n');
}

// Smart context management - rank content by relevance
function createSmartContext(contextText, query, maxTokens = 8000) {
  if (!contextText || !query) return '';
  
  const chunks = contextText.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 50);
  const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  
  // Score chunks by relevance
  const scoredChunks = chunks.map(chunk => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    
    queryTerms.forEach(term => {
      const matches = (chunkLower.match(new RegExp(term, 'g')) || []).length;
      score += matches * 2;
      if (chunkLower.includes(term)) score += 1;
    });
    
    return { chunk, score };
  });
  
  // Sort by relevance and take top chunks within token limit
  const relevantChunks = scoredChunks
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0)
    .slice(0, 5)
    .map(item => item.chunk);
  
  const smartContext = relevantChunks.join('\n\n');
  return smartContext.length > maxTokens ? smartContext.substring(0, maxTokens) + '...' : smartContext;
}

// Enhanced response validation
function validateResponse(response, query) {
  if (!response || response.length < 50) return null;
  
  // Check for poor quality indicators
  const poorQualityIndicators = [
    'Practical Assignment',
    'echo "Enter',
    'read basic',
    'shell script',
    '1. 1 2. Practical'
  ];
  
  const hasPoorQuality = poorQualityIndicators.some(indicator => 
    response.includes(indicator)
  );
  
  if (hasPoorQuality) {
    return generateStructuredResponse(query);
  }
  
  return response;
}

// Generate structured educational responses
function generateStructuredResponse(query) {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('array')) {
    return generateArrayExplanation();
  } else if (queryLower.includes('pointer')) {
    return generatePointerExplanation();
  } else if (queryLower.includes('java') || queryLower.includes('oop')) {
    return generateOOPExplanation();
  } else if (queryLower.includes('database') || queryLower.includes('sql')) {
    return generateDatabaseExplanation();
  }
  
  return `🌟 **Study Spark - BCA Learning Assistant**\n\nI'm here to help you master BCA concepts! I can explain:\n\n📚 **Programming:** C/C++, Java, Python, Data Structures\n🗄️ **Databases:** SQL, Normalization, ACID Properties\n🌐 **Web Dev:** HTML, CSS, JavaScript, Frameworks\n🔗 **Networks:** OSI Model, TCP/IP, Protocols\n\n💡 **Ask me specific questions like:**\n• "Explain arrays in C programming"\n• "What is inheritance in Java?"\n• "How does SQL normalization work?"\n\nWhat would you like to learn today?`;
}

function generateArrayExplanation() {
  return `🌟 **Arrays in C Programming**\n\nAn **array** is a collection of elements of the same data type stored in contiguous memory locations.\n\n**📋 Key Concepts:**\n• **Declaration:** \`int arr[5];\` (creates array of 5 integers)\n• **Initialization:** \`int arr[] = {1, 2, 3, 4, 5};\`\n• **Indexing:** Elements accessed using \`arr[0]\`, \`arr[1]\`, etc.\n• **Memory:** Elements stored consecutively in memory\n\n**💻 Example Code:**\n\`\`\`c\n#include <stdio.h>\nint main() {\n    int numbers[5] = {10, 20, 30, 40, 50};\n    \n    // Print all elements\n    for(int i = 0; i < 5; i++) {\n        printf("Element %d: %d\\n", i, numbers[i]);\n    }\n    return 0;\n}\n\`\`\`\n\n**🎯 Real-world Applications:**\n• Storing student grades\n• Managing inventory items\n• Image pixel data\n• Game board representations\n\n**❓ Practice Questions:**\n1. How do you find the largest element in an array?\n2. What's the difference between arrays and pointers?\n3. How do you reverse an array?\n\nWould you like me to explain any of these concepts in detail?`;
}

function generatePointerExplanation() {
  return `📍 **Pointers in C Programming**\n\nA **pointer** is a variable that stores the memory address of another variable.\n\n**🔑 Key Concepts:**\n• **Declaration:** \`int *ptr;\` (pointer to integer)\n• **Address operator:** \`&variable\` gets address\n• **Dereference:** \`*ptr\` gets value at address\n• **NULL pointer:** \`ptr = NULL;\` (safe initialization)\n\n**💻 Example Code:**\n\`\`\`c\n#include <stdio.h>\nint main() {\n    int num = 42;\n    int *ptr = &num;  // ptr stores address of num\n    \n    printf("Value: %d\\n", num);      // 42\n    printf("Address: %p\\n", &num);   // memory address\n    printf("Pointer: %p\\n", ptr);    // same address\n    printf("Value via pointer: %d\\n", *ptr); // 42\n    return 0;\n}\n\`\`\`\n\n**🎯 Why Use Pointers:**\n• Dynamic memory allocation\n• Efficient array handling\n• Function parameter passing\n• Data structure implementation\n\n**⚠️ Common Mistakes:**\n• Uninitialized pointers (wild pointers)\n• Accessing NULL pointers\n• Memory leaks with malloc/free\n\n**❓ Practice Questions:**\n1. What's the difference between \`int *p\` and \`int **p\`?\n2. How do you swap two numbers using pointers?\n\nNeed help with any specific pointer concept?`;
}

function generateOOPExplanation() {
  return `☕ **Object-Oriented Programming (Java)**\n\nOOP is a programming paradigm based on objects that contain data (attributes) and code (methods).\n\n**🏗️ Four Pillars of OOP:**\n\n**1. Encapsulation** 🔒\n• Bundle data and methods together\n• Use private/public access modifiers\n• Data hiding and security\n\n**2. Inheritance** 🧬\n• Create new classes from existing ones\n• \`class Child extends Parent\`\n• Code reusability and hierarchy\n\n**3. Polymorphism** 🎭\n• Same method, different behaviors\n• Method overriding and overloading\n• Runtime and compile-time polymorphism\n\n**4. Abstraction** 🎨\n• Hide complex implementation details\n• Abstract classes and interfaces\n• Focus on what, not how\n\n**💻 Example:**\n\`\`\`java\nclass Animal {\n    protected String name;\n    public void makeSound() { }\n}\n\nclass Dog extends Animal {\n    public Dog(String name) { this.name = name; }\n    public void makeSound() { System.out.println(\"Woof!\"); }\n}\n\`\`\`\n\n**🎯 Benefits:**\n• Code reusability\n• Modularity and organization\n• Easier maintenance\n• Real-world modeling\n\n**❓ Practice Questions:**\n1. What's the difference between abstract class and interface?\n2. How does method overriding work?\n\nWhich OOP concept would you like to explore further?`;
}

function generateDatabaseExplanation() {
  return `🗄️ **Database Management Systems**\n\nA **database** is an organized collection of structured information stored electronically.\n\n**📊 Key Concepts:**\n\n**Relational Databases:**\n• Data stored in tables (rows and columns)\n• Primary keys for unique identification\n• Foreign keys for relationships\n• ACID properties (Atomicity, Consistency, Isolation, Durability)\n\n**SQL Basics:**\n\`\`\`sql\n-- Create table\nCREATE TABLE students (\n    id INT PRIMARY KEY,\n    name VARCHAR(50),\n    grade DECIMAL(3,2)\n);\n\n-- Insert data\nINSERT INTO students VALUES (1, 'John Doe', 85.5);\n\n-- Query data\nSELECT * FROM students WHERE grade > 80;\n\n-- Update data\nUPDATE students SET grade = 90 WHERE id = 1;\n\`\`\`\n\n**🔄 Normalization:**\n• **1NF:** Eliminate duplicate columns\n• **2NF:** Remove partial dependencies\n• **3NF:** Remove transitive dependencies\n• Reduces redundancy and anomalies\n\n**🎯 Real-world Applications:**\n• Student management systems\n• E-commerce platforms\n• Banking systems\n• Social media platforms\n\n**❓ Practice Questions:**\n1. What's the difference between INNER and LEFT JOIN?\n2. How do you design a many-to-many relationship?\n3. What are database indexes and why use them?\n\nWhich database concept needs clarification?`;
}

// Groq API function using llama-3.3-70b-versatile
async function generateGroqResponse(messages, contextText = "") {
  try {
    if (!groq) return null;
    console.log('🤖 Generating Groq response with:', {
      messagesCount: messages.length,
      contextLength: contextText.length,
      lastMessage: messages[messages.length - 1]?.content
    });

    const userMessage = messages[messages.length - 1]?.content || "Hello";

    // Create smart context based on query relevance
    const smartContext = createSmartContext(contextText, userMessage, 6000);

    // Format conversation history
    const conversationHistory = messages.length > 1 ? formatConversationHistory(messages) : '';

    // Build system prompt
    const systemPrompt = `You are Study Spark, an expert BCA (Bachelor of Computer Applications) tutor with deep knowledge in:

🎓 CORE SUBJECTS:
• C/C++ Programming: pointers, arrays, data structures, algorithms, memory management
• Java & OOP: inheritance, polymorphism, encapsulation, abstraction, design patterns
• Database Management: SQL queries, normalization, ACID properties, indexing, transactions
• Web Development: HTML5, CSS3, JavaScript, React, Node.js, REST APIs
• Computer Networks: OSI model, TCP/IP, HTTP/HTTPS, routing, security protocols
• Data Structures: arrays, linked lists, stacks, queues, trees, graphs, hash tables
• Algorithms: sorting, searching, recursion, dynamic programming, complexity analysis

TEACHING METHODOLOGY:
• Always explain concepts step-by-step with clear examples
• Provide practical coding examples with proper syntax
• Use analogies and real-world applications
• Include visual representations when helpful
• End responses with practice questions or next steps
• Be encouraging and build confidence
• Use emojis strategically for engagement

${smartContext ? `RELEVANT STUDY MATERIALS:\n${smartContext}\n\n` : ''}`;

    // Build messages array for Groq chat completion
    const groqMessages = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    if (conversationHistory) {
      // Add prior messages from history
      for (const msg of messages.slice(0, -1)) {
        groqMessages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Add current user message
    groqMessages.push({ role: "user", content: userMessage });

    console.log('📤 Making Groq API request...');

    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 2048,
      top_p: 0.95,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "";

    console.log('✅ Groq response received, length:', responseText.length);

    // Validate and improve response quality
    const validatedResponse = validateResponse(responseText, userMessage);

    if (!validatedResponse) {
      console.log('⚠️ Response validation failed, using structured fallback');
      return generateStructuredResponse(userMessage);
    }

    return validatedResponse;

  } catch (error) {
    console.error('❌ Groq API error:', error.message);

    if (error.status === 401) {
      console.error('🔑 Invalid GROQ_API_KEY — check your .env file');
    } else if (error.status === 429) {
      console.error('📊 Rate limit reached — wait a moment and try again');
    }

    console.error('Full error:', error);
    return null;
  }
}

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    console.log('Upload request received:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file'
    });

    if (!req.file) {
      console.log('No file in upload request');
      return res.status(400).json({ error: "No file uploaded" });
    }

    const subject = (req.body.subject || "").toString();
    const scope = (req.body.scope || "subject").toString(); // 'subject' or 'user'
    const userId = (req.body.userId || "").toString();

    console.log('Processing file:', req.file.originalname);

    const text = await extractTextFromFile(req.file.path, req.file.mimetype);
    console.log('Extracted text length:', text.length);

    const id = path.basename(req.file.filename, path.extname(req.file.filename));
    const textFilePath = path.join(textsDir, id + ".txt");
    fs.writeFileSync(textFilePath, text, "utf-8");

    const list = readMeta();
    const record = {
      id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      subject: subject || null,
      scope,
      userId: userId || null,
    };
    list.push(record);
    writeMeta(list);

    const suggestions = suggestQuestionsFromText(text);
    console.log('Generated suggestions:', suggestions.length);

    const response = {
      id,
      name: req.file.originalname,
      subject: record.subject,
      scope: record.scope,
      url: `/uploads/${req.file.filename}`,
      questionSuggestions: suggestions.slice(0, 15),
      preview: text.slice(0, 1000),
    };

    console.log('Upload successful:', response.id);
    return res.json(response);
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({ error: "Upload failed: " + e.message });
  }
});

app.get("/api/subjects", (req, res) => {
  const list = readMeta();
  const subjectToCount = {};
  for (const r of list) {
    const s = r.subject || "Uncategorized";
    subjectToCount[s] = (subjectToCount[s] || 0) + 1;
  }
  const items = Object.entries(subjectToCount).map(([name, count]) => ({ name, count }));
  res.json({ subjects: items });
});

app.get("/api/subjects/:subject/files", (req, res) => {
  const subjectName = req.params.subject;
  const list = readMeta().filter((r) => (r.subject || "") === subjectName);
  const files = list.map((r) => ({
    id: r.id,
    name: r.originalName,
    url: `/uploads/${r.storedName}`,
    uploadedAt: r.uploadedAt,
    size: r.size,
    mimetype: r.mimetype,
  }));
  res.json({ files });
});

function loadTextById(id) {
  try {
    const p = path.join(textsDir, id + ".txt");
    return fs.readFileSync(p, "utf-8");
  } catch {
    return "";
  }
}

function generateGeneralBCAResponse(question) {
  const q = question.toLowerCase();

  // Programming concepts
  if (q.includes('c programming') || q.includes('c language')) {
    return `🌟 **C Programming Fundamentals**

C is a powerful, general-purpose programming language that serves as the foundation for many modern languages:

**Key Concepts:**
• **Variables & Data Types**: int, float, char, double, etc.
• **Control Structures**: if-else, loops (for, while, do-while), switch
• **Functions**: Modular code organization with parameters and return values
• **Arrays**: Fixed-size collections of similar data types
• **Pointers**: Variables that store memory addresses (advanced topic)
• **Structures**: User-defined data types for complex data

**Why Learn C?**
• Foundation for system programming
• Helps understand how computers work at a low level
• Essential for BCA curriculum
• Used in embedded systems and operating systems

💡 **Quick Tip**: Start with basic programs like "Hello World", then move to variables, loops, and functions!

What specific aspect of C programming would you like to explore?`;
  }

  if (q.includes('pointer') || q.includes('pointers')) {
    return `📍 **Understanding Pointers in C**

Pointers are one of the most powerful (and confusing!) concepts in C programming:

**What are Pointers?**
• Variables that store memory addresses
• Allow direct memory manipulation
• Essential for dynamic memory allocation

**Basic Syntax:**
\`\`\`c
int x = 10;        // Regular variable
int *ptr = &x;     // Pointer declaration and assignment
printf("%d", *ptr); // Dereferencing (getting the value)
\`\`\`

**Common Uses:**
• **Dynamic Memory**: \`malloc()\`, \`calloc()\`, \`free()\`
• **Arrays**: Pointers and arrays are closely related
• **Functions**: Pass by reference, function pointers
• **Strings**: Working with character arrays

**Important Notes:**
• Always initialize pointers (avoid wild pointers)
• Check for NULL before dereferencing
• Memory leaks happen when you forget to free allocated memory

🎯 **Example**: A pointer to an integer takes the address of an int variable and can access/modify its value indirectly.

Would you like me to explain any specific pointer concept or show you some code examples?`;
  }

  if (q.includes('java') || q.includes('oop') || q.includes('object oriented')) {
    return `☕ **Java & Object-Oriented Programming**

Java is a robust, object-oriented programming language perfect for BCA students:

**OOP Fundamentals:**
• **Classes & Objects**: Blueprints and instances
• **Encapsulation**: Data hiding with private/public access
• **Inheritance**: Code reuse through parent-child relationships
• **Polymorphism**: One interface, multiple implementations
• **Abstraction**: Showing only essential features

**Java Advantages:**
• Platform independent ("Write once, run anywhere")
• Automatic memory management (Garbage Collection)
• Rich standard library
• Strong community support

**Key Topics for BCA:**
• Basic syntax and data types
• Classes, objects, and constructors
• Exception handling (try-catch)
• Collections framework
• Multithreading basics
• File I/O operations

💻 **Example**: Understanding inheritance helps you reuse code and create hierarchical relationships between classes.

What specific Java or OOP concept would you like me to explain in detail?`;
  }

  if (q.includes('database') || q.includes('sql') || q.includes('dbms')) {
    return `🗄️ **Database Management Systems**

Databases are crucial for storing, managing, and retrieving data efficiently:

**Core Concepts:**
• **Relational Databases**: Tables with rows and columns (MySQL, PostgreSQL)
• **SQL Queries**: SELECT, INSERT, UPDATE, DELETE operations
• **Normalization**: Organizing data to reduce redundancy
• **Primary Keys**: Unique identifiers for records
• **Foreign Keys**: Links between related tables
• **Indexes**: Speed up data retrieval

**Essential SQL Commands:**
\`\`\`sql
-- Create table
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    grade DECIMAL(3,2)
);

-- Insert data
INSERT INTO students VALUES (1, 'John Doe', 85.5);

-- Query data
SELECT * FROM students WHERE grade > 80;

-- Update data
UPDATE students SET grade = 90 WHERE id = 1;
\`\`\`

**BCA Topics:**
• ER Diagrams (Entity-Relationship)
• Database design principles
• Transaction management (ACID properties)
• Stored procedures and triggers
• NoSQL vs Relational databases

🎯 **Pro Tip**: Understanding normalization helps prevent data anomalies and ensures data integrity.

What specific database concept or SQL operation would you like me to explain?`;
  }

  if (q.includes('data structure') || q.includes('algorithm')) {
    return `🧠 **Data Structures & Algorithms**

The backbone of efficient programming and problem-solving:

**Essential Data Structures:**
• **Arrays**: Fixed-size, contiguous memory locations
• **Linked Lists**: Dynamic size, non-contiguous memory
• **Stacks**: LIFO (Last In, First Out) operations
• **Queues**: FIFO (First In, First Out) operations
• **Trees**: Hierarchical data (Binary Tree, BST)
• **Graphs**: Networks of connected nodes
• **Hash Tables**: Key-value pair storage for fast lookup

**Algorithm Complexity:**
• **O(1)**: Constant time (best case)
• **O(log n)**: Logarithmic (binary search)
• **O(n)**: Linear (simple search)
• **O(n²)**: Quadratic (bubble sort)

**BCA Focus Areas:**
• Understanding time and space complexity
• Choosing the right data structure for problems
• Common sorting and searching algorithms
• Recursion and its applications
• Dynamic programming basics

💡 **Quick Tip**: Always consider both time and space complexity when choosing algorithms!

Which data structure or algorithm concept would you like me to explain with examples?`;
  }

  if (q.includes('web development') || q.includes('html') || q.includes('css') || q.includes('javascript')) {
    return `🌐 **Web Development Fundamentals**

Building modern websites and web applications:

**Core Technologies:**
• **HTML**: Structure and content of web pages
• **CSS**: Styling and layout (colors, fonts, responsive design)
• **JavaScript**: Interactive functionality and dynamic content
• **Responsive Design**: Works on all devices (mobile-first approach)

**Modern Web Development:**
• **Frontend Frameworks**: React, Vue, Angular
• **Backend Technologies**: Node.js, Python Django, PHP
• **Databases**: MongoDB, MySQL for web apps
• **APIs**: RESTful services for data exchange

**BCA Learning Path:**
1. **HTML/CSS Basics**: Structure and styling
2. **JavaScript Fundamentals**: Variables, functions, DOM manipulation
3. **Responsive Design**: Media queries, flexbox, grid
4. **Modern Frameworks**: React components and state management
5. **Backend Integration**: APIs and database connections

🎨 **Pro Tip**: Start with vanilla HTML/CSS/JavaScript before moving to frameworks!

What specific web development topic would you like me to cover in detail?`;
  }

  // General technology topics
  if (q.includes('machine learning') || q.includes('ml') || q.includes('ai') || q.includes('artificial intelligence')) {
    return `🤖 **Machine Learning & Artificial Intelligence**

Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed:

**Key Concepts:**
• **Supervised Learning**: Learning from labeled training data (classification, regression)
• **Unsupervised Learning**: Finding patterns in unlabeled data (clustering, dimensionality reduction)
• **Reinforcement Learning**: Learning through trial and error with rewards/penalties
• **Neural Networks**: Brain-inspired algorithms that recognize patterns
• **Deep Learning**: Neural networks with multiple layers for complex tasks

**Popular Algorithms:**
• **Linear Regression**: Predicting continuous values
• **Decision Trees**: Tree-based classification and regression
• **Random Forest**: Ensemble of decision trees
• **Support Vector Machines**: Finding optimal decision boundaries
• **Neural Networks**: Deep learning models for complex patterns

**Real-World Applications:**
• **Image Recognition**: Self-driving cars, medical diagnosis
• **Natural Language Processing**: Chatbots, translation services
• **Recommendation Systems**: Netflix, Amazon suggestions
• **Fraud Detection**: Banking and financial security
• **Predictive Analytics**: Weather forecasting, stock market

**Getting Started:**
1. Learn Python programming
2. Study statistics and linear algebra
3. Practice with libraries like scikit-learn, TensorFlow
4. Work on real datasets and projects

💡 **Pro Tip**: Start with simple datasets and gradually move to more complex problems!

What specific ML/AI concept would you like me to explain in more detail?`;
  }

  if (q.includes('cybersecurity') || q.includes('security') || q.includes('hacking')) {
    return `🔒 **Cybersecurity Fundamentals**

Protecting computer systems, networks, and data from digital attacks:

**Core Security Concepts:**
• **Confidentiality**: Information only accessible to authorized users
• **Integrity**: Data remains accurate and unaltered
• **Availability**: Systems and data accessible when needed
• **Authentication**: Verifying user identity
• **Authorization**: Granting appropriate access permissions

**Common Threats:**
• **Malware**: Viruses, trojans, ransomware
• **Phishing**: Social engineering attacks via email/fake websites
• **DDoS Attacks**: Overwhelming systems with traffic
• **SQL Injection**: Exploiting database vulnerabilities
• **Man-in-the-Middle**: Intercepting communications

**Security Best Practices:**
• Use strong, unique passwords for each account
• Enable two-factor authentication (2FA)
• Keep software and systems updated
• Use antivirus/antimalware software
• Be cautious with email attachments and links
• Backup important data regularly

**Career Paths in Cybersecurity:**
• Security Analyst
• Penetration Tester (Ethical Hacker)
• Security Engineer
• Cryptographer
• Incident Response Specialist

🛡️ **Remember**: Security is everyone's responsibility, not just IT professionals!

What specific cybersecurity topic would you like me to explain further?`;
  }

  if (q.includes('blockchain') || q.includes('cryptocurrency') || q.includes('bitcoin')) {
    return `⛓️ **Blockchain Technology**

A decentralized, distributed ledger technology that maintains a continuously growing list of records:

**How Blockchain Works:**
• **Blocks**: Contain transaction data and are linked together
• **Cryptographic Hash**: Each block contains hash of previous block
• **Consensus Mechanisms**: Proof of Work, Proof of Stake ensure agreement
• **Decentralization**: No single point of control or failure
• **Immutability**: Once recorded, data cannot be altered

**Key Features:**
• **Transparency**: All participants can view transactions
• **Security**: Cryptographic protection against tampering
• **Decentralization**: No central authority required
• **Traceability**: Complete transaction history
• **Smart Contracts**: Self-executing contracts with terms in code

**Applications Beyond Cryptocurrency:**
• **Supply Chain Management**: Track products from origin to consumer
• **Healthcare**: Secure patient data sharing
• **Voting Systems**: Tamper-proof election processes
• **Real Estate**: Streamlined property transactions
• **Digital Identity**: Secure, decentralized identity verification

**Popular Platforms:**
• **Bitcoin**: Digital currency and payment system
• **Ethereum**: Smart contract platform
• **Hyperledger**: Enterprise blockchain solutions
• **Binance Smart Chain**: DeFi and dApp platform

🚀 **Future Impact**: Blockchain is revolutionizing finance, supply chains, and digital trust!

What aspect of blockchain technology interests you most?`;
  }

  if (q.includes('cloud computing') || q.includes('aws') || q.includes('azure') || q.includes('gcp')) {
    return `☁️ **Cloud Computing**

Delivering computing services over the internet, including servers, storage, databases, networking, software, and more:

**Service Models:**
• **IaaS (Infrastructure as a Service)**: Virtual machines, storage, networks
• **PaaS (Platform as a Service)**: Development platforms, databases, middleware
• **SaaS (Software as a Service)**: Ready-to-use applications (Gmail, Dropbox)

**Deployment Models:**
• **Public Cloud**: Services offered over public internet (AWS, Azure, GCP)
• **Private Cloud**: Dedicated infrastructure for single organization
• **Hybrid Cloud**: Combination of public and private clouds
• **Multi-Cloud**: Using multiple public cloud providers

**Major Cloud Providers:**
• **Amazon Web Services (AWS)**: Largest market share, comprehensive services
• **Microsoft Azure**: Strong enterprise integration, Windows-focused
• **Google Cloud Platform (GCP)**: AI/ML expertise, data analytics strength

**Benefits:**
• **Cost Efficiency**: Pay only for what you use
• **Scalability**: Easily scale resources up or down
• **Reliability**: High availability and disaster recovery
• **Security**: Advanced security features and compliance
• **Innovation**: Access to latest technologies and services

**Popular Services:**
• **Compute**: EC2 (AWS), Virtual Machines (Azure), Compute Engine (GCP)
• **Storage**: S3 (AWS), Blob Storage (Azure), Cloud Storage (GCP)
• **Databases**: RDS (AWS), SQL Database (Azure), Cloud SQL (GCP)

🌐 **Cloud Skills**: Essential for modern IT careers!

What specific cloud computing topic would you like me to explain?`;
  }

  if (q.includes('mobile development') || q.includes('android') || q.includes('ios') || q.includes('app development')) {
    return `📱 **Mobile App Development**

Creating applications for mobile devices like smartphones and tablets:

**Native Development:**
• **Android (Java/Kotlin)**: Java or Kotlin programming for Android apps
• **iOS (Swift/Objective-C)**: Swift or Objective-C for iPhone/iPad apps
• **Cross-platform**: React Native, Flutter, Xamarin for both platforms

**Development Process:**
1. **Planning**: Define features, target audience, monetization
2. **Design**: Create user interface and user experience
3. **Development**: Write code, integrate APIs, test functionality
4. **Testing**: Manual and automated testing across devices
5. **Deployment**: Publish to App Store/Play Store
6. **Maintenance**: Updates, bug fixes, feature additions

**Essential Skills:**
• **Programming Languages**: Java, Kotlin, Swift, JavaScript/TypeScript
• **UI/UX Design**: Understanding of mobile interfaces
• **APIs Integration**: RESTful APIs, JSON handling
• **Database Management**: SQLite, Realm, Firebase
• **Version Control**: Git for code management

**Popular Tools & Frameworks:**
• **Android Studio**: Official IDE for Android development
• **Xcode**: Apple's development environment for iOS
• **React Native**: Facebook's framework for cross-platform apps
• **Flutter**: Google's UI toolkit for beautiful, fast apps

**Monetization Strategies:**
• **Free with Ads**: Display advertisements
• **Freemium**: Basic features free, premium features paid
• **Paid Apps**: One-time purchase price
• **In-App Purchases**: Unlock additional content or features

💰 **App Market**: Billions of smartphone users create huge opportunities!

What specific aspect of mobile development interests you?`;
  }

  // Default general response for any other topic
  return `🎓 **General Knowledge Assistant**

I'm here to help you learn about any topic! While I specialize in BCA (Bachelor of Computer Applications) and computer science topics, I can provide information on a wide range of subjects.

**Common Topics I Can Help With:**
• **Programming**: C, C++, Java, Python, JavaScript, and more
• **Web Development**: HTML, CSS, React, Node.js, databases
• **Data Science**: Machine Learning, AI, data analysis
• **Cybersecurity**: Network security, ethical hacking basics
• **Cloud Computing**: AWS, Azure, GCP services
• **Mobile Development**: Android, iOS, React Native
• **Blockchain**: Cryptocurrency, smart contracts
• **Computer Science Fundamentals**: Algorithms, data structures

**Study Tips:**
• Break complex topics into smaller, manageable parts
• Practice with real examples and projects
• Use multiple resources (videos, books, online tutorials)
• Join communities and study groups
• Apply what you learn through hands-on projects

💡 **Ask me anything!** I'm here to help you understand and master new concepts.

What specific topic or question would you like me to help you with?`;
}

function scoreChunksAgainstQuery(chunks, query) {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
  return chunks
    .map((c, i) => {
      const text = c.toLowerCase();
      let score = 0;
      for (const t of terms) {
        const occurrences = (text.match(new RegExp(`\\b${t}\\b`, "g")) || []).length;
        score += occurrences * 2;
        if (text.includes(t)) score += 1;
      }
      return { idx: i, score, text: c };
    })
    .sort((a, b) => b.score - a.score);
}

app.post("/api/chat", async (req, res) => {
  try {
    console.log('Chat request received:', {
      body: req.body,
      messagesCount: req.body.messages?.length || 0
    });

    const { messages = [], subject = null, fileId = null } = req.body || {};

    if (!messages || messages.length === 0) {
      console.log('No messages in chat request');
      return res.json({ content: "Please provide a message to chat." });
    }

    let contextText = "";
    if (fileId) {
      console.log('Loading context from file ID:', fileId);
      contextText += loadTextById(fileId);
      console.log('File context length:', contextText.length);
    }
    if (!contextText && subject) {
      console.log('Loading context from subject:', subject);
      const meta = readMeta().filter((r) => (r.subject || "") === subject);
      for (const m of meta) {
        contextText += "\n\n" + loadTextById(m.id);
        if (contextText.length > 250000) break;
      }
      console.log('Subject context length:', contextText.length);
    }
    if (!contextText) {
      console.log('Using fallback context from all files');
      // fallback: use all subject files lightly
      const meta = readMeta();
      for (const m of meta.slice(0, 5)) {
        contextText += "\n\n" + loadTextById(m.id).slice(0, 50000);
      }
      console.log('Fallback context length:', contextText.length);
    }

    if (!groq) {
      return res.json({
        content:
          "⚠️ AI is not configured on the server (missing GROQ_API_KEY).\n\nSet GROQ_API_KEY in .env to enable chat. Get a free key at https://console.groq.com",
      });
    }

    // Call Groq API
    console.log('Attempting Groq API call...');
    const groqResponse = await generateGroqResponse(messages, contextText);

    if (groqResponse) {
      console.log('Groq API response received, length:', groqResponse.length);
      return res.json({ content: groqResponse });
    }

    console.log('Groq API failed, trying simple call without context');
    // Fallback: simple call without file context
    try {
      const userMessage = messages[messages.length - 1]?.content || "Hello";

      const simpleFallback = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are Study Spark, an expert BCA tutor. Answer clearly and helpfully with examples." },
          { role: "user", content: userMessage },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_completion_tokens: 2048,
      });

      const simpleText = simpleFallback.choices[0]?.message?.content || "";
      if (simpleText && simpleText.length > 20) {
        console.log('Simple Groq response received, length:', simpleText.length);
        return res.json({ content: simpleText });
      }
    } catch (simpleError) {
      console.error('Simple Groq call also failed:', simpleError.message);
    }

    console.log('All Groq attempts failed, returning error message');
    return res.json({
      content: "❌ I'm having trouble connecting to the AI service right now. Please check:\n1. Your internet connection\n2. The server is running\n3. Try again in a moment\n\nThe chatbot will work once the connection is restored!"
    });
  } catch (e) {
    console.error('Chat error:', e);
    return res.status(500).json({ content: "Sorry, something went wrong while answering. Please try again." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// ── Daily AI Study Plan ─────────────────────────────────────────────────
// Generates a personalised study plan based on user data, cached for 24 h.
const studyPlanCache = new Map(); // key: `${userId}:${dateStr}` → plan JSON

app.post("/api/study-plan", async (req, res) => {
  try {
    const { userId, subjects = [], progress = {}, pendingTasks = [], studyMinutes = 0, weakSubjects = [], quizCount = 0 } = req.body || {};

    if (!userId) return res.status(400).json({ error: "userId required" });

    const dateStr = new Date().toISOString().split("T")[0];
    const cacheKey = `${userId}:${dateStr}`;

    // Return cached plan if it exists for today
    if (studyPlanCache.has(cacheKey)) {
      return res.json(studyPlanCache.get(cacheKey));
    }

    if (!groq) {
      const fallback = {
        plan: [
          "Review your most recent subject for 30 minutes",
          "Complete 1 pending quiz",
          "Revisit any weak topics from yesterday",
        ],
        estimated_time: "60 minutes",
        generated_at: new Date().toISOString(),
      };
      studyPlanCache.set(cacheKey, fallback);
      return res.json(fallback);
    }

    const subjectList = subjects.length > 0 ? subjects.join(", ") : "general BCA subjects";
    const weakList = weakSubjects.length > 0 ? weakSubjects.join(", ") : "none identified yet";
    const taskList = pendingTasks.length > 0 ? pendingTasks.slice(0, 5).join("; ") : "none";

    const prompt = `You are an AI study planner for a BCA student. Generate a concise daily study plan.

Student context:
- Subjects enrolled: ${subjectList}
- Overall study time so far: ${studyMinutes} minutes
- Quizzes completed: ${quizCount}
- Weak subjects: ${weakList}
- Pending tasks: ${taskList}
- Progress data: ${JSON.stringify(progress).slice(0, 500)}

Return a JSON object (no markdown, no code fences) with exactly this schema:
{
  "plan": ["step 1", "step 2", "step 3", "step 4"],
  "estimated_time": "X minutes"
}

Rules:
- Generate 3-5 actionable study steps
- Each step should be specific with a subject name and duration
- Prioritise weak subjects and pending tasks
- Total estimated time should be realistic (45-90 minutes)
- Be encouraging and concise`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful study planner AI. Return valid JSON only." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 512,
    });

    const raw = chatCompletion.choices[0]?.message?.content || "";
    // Extract JSON from response (handle possible markdown fences)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    let parsed;
    try {
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      parsed = {
        plan: ["Study your weakest subject for 30 minutes", "Complete 1 quiz", "Review yesterday's notes"],
        estimated_time: "60 minutes",
      };
    }

    const result = {
      plan: Array.isArray(parsed.plan) ? parsed.plan.slice(0, 5) : ["Study for 30 minutes"],
      estimated_time: parsed.estimated_time || "60 minutes",
      generated_at: new Date().toISOString(),
    };

    studyPlanCache.set(cacheKey, result);
    return res.json(result);
  } catch (e) {
    console.error("Study plan error:", e);
    return res.status(500).json({ error: "Failed to generate study plan" });
  }
});

// Test Groq API endpoint
app.get("/api/test-groq", async (req, res) => {
  try {
    console.log('Testing Groq API...');
    if (!groq) {
      return res.json({
        success: false,
        message: 'GROQ_API_KEY is not set. Get a free key at https://console.groq.com',
      });
    }
    const testResponse = await generateGroqResponse([
      { role: 'user', content: 'Hello, can you explain what is C programming in one sentence?' }
    ]);

    if (testResponse) {
      res.json({
        success: true,
        response: testResponse,
        message: 'Groq API (llama-3.3-70b) is working correctly'
      });
    } else {
      res.json({
        success: false,
        message: 'Groq API failed to generate response'
      });
    }
  } catch (error) {
    console.error('Groq test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Groq API test failed'
    });
  }
});

// Keep old endpoint as alias
app.get("/api/test-gemini", (req, res) => res.redirect("/api/test-groq"));

// ── Register Coding Lab routes ────────────────────────────────────────────
registerExecuteRoute(app);
registerSubmissionsRoute(app);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] Groq API (llama-3.3-70b-versatile) integration enabled`);
  console.log(`[api] Coding Lab routes registered: /api/execute, /api/submissions`);
});
