import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-unified";
import { RateLimiter } from "@/lib/RateLimiter";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Rate limiters for different user types with IP-based tracking
const unauthenticatedLimiter = RateLimiter.createChatbotLimiter(5); // 5 queries per 24 hours
const authenticatedLimiter = RateLimiter.createChatbotLimiter(10); // 10 queries per 24 hours

// Input/Output limits
const MAX_INPUT_TOKENS = 1000; // ~750 words
const MAX_OUTPUT_TOKENS = 1500; // ~1125 words
const MAX_MESSAGE_LENGTH = 4000; // characters

// Token estimation function (rough approximation: 1 token ≈ 0.75 words ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = forwarded || realIP || 'unknown';
  
  // Handle comma-separated IPs (take first one)
  return clientIP.split(',')[0].trim();
}

// Enhanced knowledge base for Zenith Forum with detailed information
const zenithKnowledge = `
You are Zen, the AI assistant for Zenith Forum - a college department forum with four specialized clubs. You can provide detailed information, page summaries, and help with navigation.

## Zenith Forum Overview
Zenith is a comprehensive college department forum that connects students through four specialized clubs, fostering learning, growth, and community engagement.

## Four Clubs (Detailed Information):

### 1. Ascend (Coding Club)
- **Focus**: Programming challenges, hackathons, tech talks, code sharing and collaboration
- **Activities**: Weekly coding challenges, monthly hackathons, tech talks by industry experts, open-source project contributions
- **Skills Developed**: Programming languages (Python, JavaScript, Java, C++), web development, mobile app development, AI/ML, cybersecurity
- **Events**: Annual 48-hour hackathon, coding bootcamps, tech conferences, internship placement drives
- **Community**: 150+ active members, mentorship programs, study groups
- **Resources**: Coding labs, online course subscriptions, GitHub organizations

### 2. Aster (Soft Skills Club)
- **Focus**: Communication workshops, leadership training, presentation and interpersonal skills
- **Activities**: Public speaking sessions, leadership workshops, team building exercises, mock interviews
- **Skills Developed**: Communication, leadership, teamwork, negotiation, emotional intelligence, presentation skills
- **Events**: Leadership summits, communication workshops, personality development sessions, networking events
- **Community**: 90+ members, peer mentoring, confidence building programs
- **Resources**: Presentation tools, communication labs, library of soft skills books

### 3. Achievers (Higher Studies Club)
- **Focus**: Graduate school preparation, competitive exams, research opportunities
- **Activities**: GRE/GMAT prep sessions, research paper writing, university application guidance, scholarship information
- **Skills Developed**: Research methodology, academic writing, test preparation, application strategy
- **Events**: University fair, research symposiums, alumni networking, study abroad seminars
- **Community**: 70+ ambitious students, alumni network, research mentors
- **Resources**: Test prep materials, research databases, application templates

### 4. Altogether (Holistic Personality Growth)
- **Focus**: Life skills, wellness, personal development, mental health awareness
- **Activities**: Wellness workshops, meditation sessions, life skills training, career counseling
- **Skills Developed**: Stress management, time management, mindfulness, career planning, financial literacy
- **Events**: Wellness retreats, personal development workshops, career guidance sessions, mental health awareness programs
- **Community**: 130+ members focused on holistic growth, support groups, wellness mentors
- **Resources**: Wellness center, meditation spaces, career counseling services

## User Roles & Hierarchy:

### Club Management (Per Club):
- **Coordinator**: Primary club leader, overall strategy and vision, member coordination
- **Co-Coordinator**: Assistant leader, supports coordinator, handles day-to-day operations
- **Secretary**: Administrative tasks, meeting minutes, documentation, communication
- **Media**: Social media management, content creation, event promotion, photography

### Zenith Committee (Overall Forum):
- **President**: Overall forum leader, represents all clubs, strategic decisions
- **Vice President**: Secondary leadership, supports president, inter-club coordination
- **Innovation Head**: New initiatives, technology adoption, process improvement
- **Treasurer**: Financial management, budget planning, expense tracking
- **Secretary**: Administrative coordination, documentation, official communication
- **Outreach**: External relations, partnerships, community engagement, industry connections

## Platform Features:

### Core Features:
- **Announcements**: Important updates, club news, event notifications, deadline reminders
- **Assignments**: Club tasks, project submissions, skill-building exercises, deadlines tracking
- **Discussions**: Forum-style conversations, Q&A sections, peer help, knowledge sharing
- **Events**: Club events, workshops, competitions, social gatherings, registration management
- **User Profiles**: Personal information, club affiliations, achievements, progress tracking

### Advanced Features:
- **Dashboard**: Personalized hub showing user's clubs, recent activities, upcoming events
- **Event Calendar**: Comprehensive calendar with all club events, deadlines, important dates
- **Resource Library**: Study materials, templates, guides, video tutorials
- **Achievement System**: Badges, certificates, leaderboards, recognition programs
- **Notification System**: Real-time updates, email notifications, mobile push notifications

## Current Events & Activities:

### Upcoming Events:
1. **Tech Talk: AI in Education** (Ascend)
   - Date: January 30, 2025, 2:00 PM
   - Location: Auditorium A
   - Speaker: Industry expert on AI applications in education
   - Expected attendance: 45+ students
   - Registration: Open to all students

2. **Communication Workshop** (Aster)
   - Date: February 2, 2025, 10:00 AM
   - Location: Conference Room B
   - Focus: Advanced presentation skills and public speaking
   - Expected attendance: 28+ students
   - Prerequisites: Basic communication skills

3. **Study Group Session** (Achievers)
   - Date: February 5, 2025, 4:00 PM
   - Location: Study Hall
   - Topic: GRE preparation and study strategies
   - Expected attendance: 23+ students
   - Materials: Practice tests and study guides provided

### Recent Announcements:
1. **New Hackathon Registration Open** (Ascend)
   - 48-hour coding challenge with exciting prizes
   - Teams of 2-4 members allowed
   - Themes: AI/ML, Web Development, Mobile Apps
   - Registration deadline: February 15, 2025

2. **Leadership Workshop This Weekend** (Aster)
   - Intensive leadership training with certified trainers
   - Interactive sessions and group activities
   - Certificate of completion provided
   - Limited seats available

3. **GRE Mock Test Available** (Achievers)
   - Full-length practice test with detailed analysis
   - Personalized feedback and improvement suggestions
   - Score prediction and progress tracking
   - Free for club members

## Navigation Help:
- **Home/Landing**: Public access, Zenith overview, upcoming events showcase
- **Dashboard**: Main hub after login, personalized content, club activities
- **Club Pages**: Individual pages for each club with detailed information
- **Events**: Comprehensive event listing with filtering and registration
- **Login/Register**: Authentication system with email verification
- **Profile**: Personal settings, club memberships, achievements
- **Admin Panel**: For management members with enhanced privileges

## Guidelines & Best Practices:
- **Discussion Etiquette**: Be respectful, constructive, and helpful in all interactions
- **Content Guidelines**: Keep posts relevant to club topics and forum purpose
- **Event Participation**: Register on time, attend regularly, engage actively
- **Resource Sharing**: Share knowledge, help peers, contribute to community learning
- **Feedback Culture**: Provide constructive feedback, be open to learning and improvement

## Page-Specific Information:
Based on the current page, I can provide specific information about:
- Dashboard: Overview of user's club activities and personalized content
- Club Pages: Detailed information about specific clubs and their activities
- Events: Comprehensive event details, schedules, and registration information
- Profile: User settings, preferences, and club membership management

I can answer questions about navigation, provide detailed club information, summarize page content, explain user roles, and help with any forum-related queries. I can also provide complex analysis and detailed explanations about any aspect of the Zenith Forum.
`;

// Function to get relevant database information based on query
function getRelevantInfo(
  message: string,
  currentPage: string,
  pageContent: string
) {
  const lowerMessage = message.toLowerCase();
  let contextInfo = "";

  // Page-specific context
  if (currentPage.includes("/dashboard")) {
    contextInfo +=
      "\nCURRENT PAGE: Dashboard - User's main hub showing club activities, announcements, and personalized content.\n";
    contextInfo +=
      "PAGE SUMMARY: The dashboard shows user's joined clubs, recent announcements, upcoming events, and quick statistics. It provides easy navigation to all forum features.\n";
  } else if (currentPage.includes("/clubs")) {
    contextInfo +=
      "\nCURRENT PAGE: Clubs - Browse and discover all four specialized clubs with search and filtering.\n";
    contextInfo +=
      "PAGE SUMMARY: This page shows all available clubs (Ascend, Aster, Achievers, Altogether) with detailed information, member counts, and join options.\n";
  } else if (currentPage.includes("/events")) {
    contextInfo +=
      "\nCURRENT PAGE: Events - Comprehensive events listing with filtering and registration.\n";
    contextInfo +=
      "PAGE SUMMARY: Shows all upcoming events from different clubs with dates, locations, attendance tracking, and registration options.\n";
  } else if (currentPage.includes("/login")) {
    contextInfo +=
      "\nCURRENT PAGE: Login - User authentication page for accessing the forum.\n";
    contextInfo +=
      "PAGE SUMMARY: Secure login form for existing users to access their dashboard and club activities.\n";
  } else if (currentPage.includes("/register")) {
    contextInfo +=
      "\nCURRENT PAGE: Register - New user registration with club interest selection.\n";
    contextInfo +=
      "PAGE SUMMARY: Registration form for new users to create accounts and select initial club interests.\n";
  } else if (currentPage === "/") {
    contextInfo +=
      "\nCURRENT PAGE: Home/Landing - Public access page showcasing Zenith highlights and mission.\n";
    contextInfo +=
      "PAGE SUMMARY: Welcome page with Zenith overview, upcoming events showcase, and call-to-action for login/registration.\n";
  }

  // Query-specific information
  if (lowerMessage.includes("event") || lowerMessage.includes("upcoming")) {
    contextInfo += `
UPCOMING EVENTS DETAILS:
1. Tech Talk: AI in Education (Ascend Club)
   - January 30, 2025 at 2:00 PM in Auditorium A
   - Industry expert speaker on AI applications in education
   - 45+ expected attendees, open registration
   
2. Communication Workshop (Aster Club)
   - February 2, 2025 at 10:00 AM in Conference Room B
   - Advanced presentation skills and public speaking
   - 28+ expected attendees, basic communication skills helpful
   
3. Study Group Session (Achievers Club)
   - February 5, 2025 at 4:00 PM in Study Hall
   - GRE preparation and study strategies
   - 23+ expected attendees, materials provided
`;
  }

  if (
    lowerMessage.includes("club") ||
    lowerMessage.includes("ascend") ||
    lowerMessage.includes("aster") ||
    lowerMessage.includes("achievers") ||
    lowerMessage.includes("altogether")
  ) {
    contextInfo += `
CLUB MEMBERSHIP STATISTICS:
- Ascend (Coding): 156 active members, 8 upcoming events
- Aster (Soft Skills): 89 active members, 5 upcoming events  
- Achievers (Higher Studies): 67 active members, 6 upcoming events
- Altogether (Holistic Growth): 134 active members, 7 upcoming events
`;
  }

  if (lowerMessage.includes("announcement")) {
    contextInfo += `
RECENT ANNOUNCEMENTS:
1. New Hackathon Registration Open (Ascend) - HIGH PRIORITY
   - 48-hour coding challenge with prizes
   - Teams of 2-4 members, multiple themes available
   
2. Leadership Workshop This Weekend (Aster) - MEDIUM PRIORITY
   - Intensive training with certified trainers
   - Certificate provided, limited seats
   
3. GRE Mock Test Available (Achievers) - LOW PRIORITY
   - Full-length practice test with analysis
   - Free for club members, score prediction included
`;
  }

  // Add page content summary if requested
  if (lowerMessage.includes("summarize") || lowerMessage.includes("summary")) {
    contextInfo += `\nPAGE CONTENT PREVIEW: ${pageContent.substring(
      0,
      500
    )}...\n`;
  }

  return contextInfo;
}

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      history,
      currentPage = "/",
      pageContent = "",
    } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Input validation and token limits
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { 
          error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`,
          limit: MAX_MESSAGE_LENGTH,
          current: message.length
        },
        { status: 400 }
      );
    }

    const inputTokens = estimateTokens(message);
    if (inputTokens > MAX_INPUT_TOKENS) {
      return NextResponse.json(
        { 
          error: `Message too long. Maximum ${MAX_INPUT_TOKENS} tokens allowed.`,
          limit: MAX_INPUT_TOKENS,
          current: inputTokens,
          suggestion: "Please shorten your message and try again."
        },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    
    // Check authentication status
    const authResult = await verifyAuth(req);
    const isAuthenticated = authResult.success;

    // Apply rate limiting based on authentication status and IP
    const identifier = isAuthenticated ? `user:${authResult.user?.id}` : `ip:${clientIP}`;
    const rateLimiter = isAuthenticated ? authenticatedLimiter : unauthenticatedLimiter;
    
    const rateLimit = await rateLimiter.checkRateLimit(identifier, 'chatbot');
    
    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime);
      const hoursLeft = Math.ceil((rateLimit.resetTime - Date.now()) / (1000 * 60 * 60));
      
      return NextResponse.json(
        { 
          error: isAuthenticated 
            ? `You've reached your daily limit of ${rateLimit.limit} questions. Try again in ${hoursLeft} hours.`
            : `You've reached your daily limit of ${rateLimit.limit} questions. Please log in for more queries or try again in ${hoursLeft} hours.`,
          rateLimited: true,
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          resetTime: resetDate.toISOString(),
          retryAfter: rateLimit.retryAfter,
          authenticated: isAuthenticated
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': resetDate.toISOString(),
            'Retry-After': rateLimit.retryAfter?.toString() || '3600'
          }
        }
      );
    }

    // Use the correct Gemini model with output token limits
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    });

    // Get relevant contextual information
    const contextInfo = getRelevantInfo(message, currentPage, pageContent);

    // Build conversation context
    let conversationContext =
      zenithKnowledge + contextInfo + "\n\nConversation History:\n";

    if (history && history.length > 0) {
      history.forEach((msg: { sender: string; content: string }) => {
        conversationContext += `${msg.sender === "user" ? "User" : "Zen"}: ${
          msg.content
        }\n`;
      });
    }

    conversationContext += `\nUser: ${message}\nZen:`;

    const prompt = `${conversationContext}

Please respond as Zen, the helpful AI assistant for Zenith Forum. You have access to detailed information about all clubs, events, user roles, and platform features. Provide comprehensive, helpful responses.

Response guidelines:
- Keep responses informative yet conversational
- Use bullet points and formatting for complex information
- Provide specific details when asked about events, clubs, or features
- Offer navigation help and suggestions
- If asked to summarize the current page, use the page content provided
- For complex queries, break down information into digestible sections
- Always maintain a helpful, college-appropriate tone
- If the question is outside Zenith Forum scope, politely redirect to forum topics
- Keep responses under ${MAX_OUTPUT_TOKENS} tokens

Current context: User is on ${currentPage} page.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Estimate output tokens
    const outputTokens = estimateTokens(text);

    // Return response with rate limit headers
    return NextResponse.json(
      { 
        response: text,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens
        },
        limits: {
          inputTokens: MAX_INPUT_TOKENS,
          outputTokens: MAX_OUTPUT_TOKENS,
          messageLength: MAX_MESSAGE_LENGTH
        },
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining - 1, // Subtract current request
          resetTime: new Date(rateLimit.resetTime).toISOString(),
          authenticated: isAuthenticated
        }
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
        }
      }
    );
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Zen is temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
