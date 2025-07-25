# 🚀 Zenith Forum - Complete Setup Guide

A modern, responsive college forum platform with AI chatbot integration, built with Next.js, PostgreSQL, and Gemini AI.

## ✨ Features

- 🏠 **Modern Landing Page** - Responsive home page accessible to all users
- 🔐 **Authentication System** - Email/password login with JWT tokens
- 🎯 **Four Specialized Clubs** - Ascend (Coding), Aster (Soft Skills), Achievers (Higher Studies), Altogether (Holistic Growth)
- 👥 **Role-Based Access** - Club coordinators, secretaries, and Zenith committee members
- 🤖 **Zen AI Chatbot** - Gemini-powered assistant for navigation and FAQ
- 📱 **Responsive Design** - Works perfectly on mobile and desktop
- 💬 **Real-time Features** - Announcements, discussions, and events

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with bcryptjs
- **AI**: Google Gemini API with RAG
- **UI Components**: Lucide React, Headless UI

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Google Gemini API key

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd zenith

# Install dependencies
npm install
```

### 2. Set Up PostgreSQL Database

Follow the detailed guide in [POSTGRESQL_SETUP.md](./POSTGRESQL_SETUP.md) or use these quick steps:

#### For Windows:

1. Install PostgreSQL from official website
2. Create database and user via pgAdmin or psql

#### For Ubuntu:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
```

#### Create Database:

```sql
CREATE DATABASE zenith_forum;
CREATE USER zenith_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE zenith_forum TO zenith_user;
\q
```

### 3. Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database
DATABASE_URL="postgresql://zenith_user:your_password@localhost:5432/zenith_forum?schema=public"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
JWT_SECRET="your-jwt-secret-here"

# Gemini AI
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in and create a new API key
3. Add it to your `.env.local` file

### 5. Set Up Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Create database tables
npm run db:push

# Seed with sample data
npm run db:seed
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application!

## 🔑 Demo Credentials

### Regular User:

- **Email**: `demo@zenith.edu`
- **Password**: `demo123`

### Admin/President:

- **Email**: `president@zenith.edu`
- **Password**: `demo123`

## 📱 Mobile Development Setup

For React Native mobile app development:

### Ubuntu Setup:

```bash
npm run mobile:setup:ubuntu
npm run mobile:init
npm run mobile:android
```

### Windows Setup:

```bash
npm run mobile:setup:windows
# Follow the displayed instructions
npm run mobile:init
npm run mobile:android
```

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional aesthetic suitable for college use
- **Responsive Layout**: Mobile-first design that works on all devices
- **Interactive Elements**: Smooth animations and hover effects
- **Accessibility**: WCAG compliant with proper contrast and navigation
- **Professional Branding**: Zenith-themed colors and typography

## 🤖 Zen Chatbot Features

The AI assistant can help with:

- Forum navigation guidance
- Club information and details
- User role explanations
- Event information
- FAQ responses
- General forum support

## 🏗️ Architecture Overview

```
zenith/
├── src/
│   ├── app/                 # Next.js 15 App Router
│   │   ├── api/            # API routes
│   │   ├── login/          # Login page
│   │   └── page.tsx        # Landing page
│   ├── components/         # React components
│   │   ├── ZenChatbot.tsx  # AI chatbot
│   │   └── Layout.tsx      # Main layout
│   └── lib/                # Utilities
│       ├── prisma.ts       # Database client
│       └── auth.ts         # Authentication
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Sample data
├── shared/                 # Cross-platform code
│   ├── types.ts           # TypeScript types
│   ├── utils.ts           # Utility functions
│   └── api.ts             # API client
└── mobile/                # React Native setup
```

## 📚 Available Scripts

### Development:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database:

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

### Mobile:

- `npm run mobile:init` - Initialize React Native project
- `npm run mobile:android` - Run Android app
- `npm run mobile:ios` - Run iOS app (macOS only)

## 🔧 Customization

### Adding New Clubs:

1. Update `ClubType` enum in `prisma/schema.prisma`
2. Add club data in `prisma/seed.ts`
3. Update club information in components

### Modifying User Roles:

1. Update `UserRole` enum in `prisma/schema.prisma`
2. Adjust permission checks in API routes
3. Update UI based on roles

### Customizing AI Responses:

1. Edit knowledge base in `src/app/api/chatbot/zen/route.ts`
2. Add new FAQ entries to database
3. Update chatbot personality and responses

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Error**:

   - Check PostgreSQL is running
   - Verify DATABASE_URL in `.env.local`
   - Ensure user has proper permissions

2. **Prisma Client Error**:

   ```bash
   npm run db:generate
   rm -rf node_modules/.prisma
   npm install
   ```

3. **Gemini API Error**:

   - Verify API key is correct
   - Check API quotas and billing
   - Ensure proper network access

4. **Build Errors**:
   - Clear Next.js cache: `rm -rf .next`
   - Update dependencies: `npm update`
   - Check TypeScript errors: `npm run lint`

### Development Tips:

- Use `npm run db:studio` to visually inspect database
- Check browser console for client-side errors
- Monitor API responses in Network tab
- Use Prisma logging for database queries

## 🚀 Deployment

### Vercel Deployment:

1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy with automatic builds

### Database Hosting:

- **Neon**: Free PostgreSQL hosting
- **Railway**: Easy database deployment
- **Supabase**: PostgreSQL with additional features

## 📄 License

MIT License - feel free to use this project for educational purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy coding! 🎉**

For detailed setup instructions, check the individual setup guides:

- [PostgreSQL Setup](./POSTGRESQL_SETUP.md)
- [Mobile Setup](./mobile/setup-windows.md)
- [Ubuntu Mobile Setup](./mobile/setup-ubuntu.sh)
