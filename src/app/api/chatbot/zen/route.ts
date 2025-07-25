import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

// Knowledge base for Zenith Forum
const zenithKnowledge = `
You are Zen, the AI assistant for Zenith Forum - a college department forum with four specialized clubs:

## Zenith Forum Overview
Zenith is a college department forum that connects students through four specialized clubs, fostering learning, growth, and community engagement.

## Four Clubs:
1. **Ascend (Coding Club)**: Programming challenges, hackathons, tech talks, code sharing and collaboration
2. **Aster (Soft Skills Club)**: Communication workshops, leadership training, presentation and interpersonal skills
3. **Achievers (Higher Studies Club)**: Graduate school preparation, competitive exams, research opportunities
4. **Altogether (Holistic Personality Growth)**: Life skills, wellness, personal development tips

## User Roles:
### Club Management (Per Club):
- Coordinator: Primary club leader
- Co-Coordinator: Assistant leader
- Secretary: Administrative tasks
- Media: Social media and communications

### Zenith Committee (Overall Forum):
- President: Overall forum leader
- Vice President: Secondary leadership
- Innovation Head: New initiatives and technology
- Treasurer: Financial management
- Secretary: Administrative coordination
- Outreach: External relations and partnerships

## Features:
- Announcements: Important updates and news
- Assignments: Tasks and projects from clubs
- Discussions: Forum-style conversations
- Events: Club and general events
- User Profiles: Personal information and club affiliations

## Navigation Help:
- Dashboard: Main hub for club activities
- Club Pages: Individual pages for each club
- Login/Register: Authentication system
- Admin Panel: For management members

## Guidelines:
- Be respectful in discussions
- Stay on-topic for each club
- Follow posting guidelines
- Report inappropriate content
- Participate actively in club activities

Answer questions about navigation, club information, user roles, features, and provide general help about using the forum.
`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Use the correct Gemini model name
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // Build conversation context
    let conversationContext = zenithKnowledge + "\n\nConversation History:\n";

    if (history && history.length > 0) {
      history.forEach((msg: { sender: string; content: string }) => {
        conversationContext += `${msg.sender === "user" ? "User" : "Zen"}: ${
          msg.content
        }\n`;
      });
    }

    conversationContext += `\nUser: ${message}\nZen:`;

    const prompt = `${conversationContext}

Please respond as Zen, the helpful AI assistant for Zenith Forum. Keep responses conversational, helpful, and focused on the forum and its clubs. If the question is outside the scope of Zenith Forum, politely redirect to forum-related topics.

Response guidelines:
- Keep responses concise and helpful
- Use friendly, college-appropriate tone
- Focus on Zenith Forum features and clubs
- Provide specific navigation help when asked
- Encourage participation in club activities`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Zen Chatbot API error:", error);
    return NextResponse.json(
      { error: "Zen is temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
