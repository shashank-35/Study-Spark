# Study Spark Learning Platform

A comprehensive BCA (Bachelor of Computer Applications) learning platform with AI-powered chatbot and file upload capabilities.

## Features

- 🤖 **AI Chatbot**: Powered by Google Gemini 2.5 Flash API for intelligent study assistance
- 📁 **File Upload**: Support for PDF, DOC, DOCX, and TXT files with automatic content analysis
- 📚 **Subject Management**: Organize study materials by BCA subjects
- 🧠 **Smart Q&A**: Get contextual answers based on uploaded study materials
- 📊 **Progress Tracking**: Monitor your learning progress across different subjects
- 🎯 **Study Planning**: AI-generated study plans and recommendations
- 📖 **Study Materials**: Admin can upload PDF materials per subject with real-time sync
- 💾 **Database Integration**: Supabase for persistent material storage and real-time updates

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev:all
```

This will start both the frontend (Vite) and backend (Express) servers concurrently.

### Alternative: Run Servers Separately

**Frontend only:**
```bash
npm run dev
```

**Backend only:**
```bash
npm run api
```

## API Endpoints

- `POST /api/upload` - File upload endpoint
- `POST /api/chat` - Chat with Gemini AI
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:subject/files` - Get files by subject
- `GET /api/health` - Health check

## Study Materials Feature

### Overview
Admins can upload PDF study materials for each subject. These materials are stored in Supabase and displayed dynamically to users in real-time.

### How to Use

**For Admins:**
1. Go to Admin Panel → Materials tab
2. Select a subject
3. Click "Choose PDF" to upload a study material
4. Material is saved to Supabase and synced in real-time

**For Users:**
1. Go to Subject Library (SubjectSelector)
2. Each subject card shows uploaded materials
3. Click **View** (👁️) to open PDF in new tab
4. Click **Download** (⬇️) to download PDF

### Supabase Setup

**Required Table: `study_materials`**

Run this SQL in your Supabase dashboard:

```sql
CREATE TABLE study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_url VARCHAR(500),
  file_data TEXT,
  file_type VARCHAR(50) DEFAULT 'pdf',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Enable Realtime:**
1. Go to Supabase Dashboard → Replication
2. Enable Realtime for `study_materials` table

**Configure RLS (for development):**
1. Go to Authentication → Policies
2. Disable RLS on `study_materials` table (development only)

**For Production, use these policies:**
```sql
-- Allow anyone to read
CREATE POLICY "Enable read access" ON study_materials
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Enable insert" ON study_materials
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Enable delete" ON study_materials
  FOR DELETE USING (auth.role() = 'authenticated');
```

## Testing the Upload Function

1. Make sure the server is running (`npm run api`)
2. Open the application in your browser
3. Click on the chatbot icon
4. Use the "Upload Notes" button to upload a PDF, DOC, DOCX, or TXT file
5. The system will analyze the file and extract study questions
6. You can then ask questions about the uploaded content

## Testing the Chatbot

1. The chatbot is powered by Google Gemini 2.5 Flash API
2. Ask questions about BCA subjects like:
   - "Explain pointers in C programming"
   - "What is Object-Oriented Programming?"
   - "Create a study plan for Database Management"
   - "Help me understand data structures"

## File Upload Support

- **PDF files**: Full text extraction and analysis
- **DOC/DOCX files**: Text extraction and processing
- **TXT files**: Direct text processing
- **File size limit**: 10MB maximum
- **Automatic question generation**: AI extracts potential study questions from content

## Troubleshooting

### Upload Not Working
- Check if the server is running (`npm run api`)
- Verify file size is under 10MB
- Ensure file type is supported (PDF, DOC, DOCX, TXT)
- Check browser console for error messages

### Chatbot Not Responding
- Verify the Gemini API key is valid
- Check server console for API errors
- Ensure the server is running and accessible

### Server Issues
- Check if port 8787 is available
- Verify all dependencies are installed
- Check server console for error logs

## Development

### Project Structure
```
├── src/                    # Frontend React components
│   ├── components/        # UI components
│   │   └── StudySparkChatbot.tsx  # Main chatbot component
│   └── ...
├── server/                # Backend Express server
│   └── index.js          # Main server file with Gemini API integration
└── ...
```

### Key Technologies
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **AI**: Google Gemini 2.5 Flash API
- **File Processing**: pdf-parse, multer
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions

## License

This project is for educational purposes.
