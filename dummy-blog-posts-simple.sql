-- Dummy Blog Posts (Posts) Data for Zenith Clubs
-- This file contains sample blog posts for different clubs

-- Insert dummy blog posts for each club
INSERT INTO posts (title, content, excerpt, author_id, club_id, status, slug, tags, created_at, updated_at) VALUES 

-- Computer Science Club Blog Posts
('The Future of Artificial Intelligence in Education', 
 '# The Future of Artificial Intelligence in Education

## Introduction
Artificial Intelligence is revolutionizing how we learn and teach. From personalized learning experiences to automated grading systems, AI is reshaping the educational landscape.

## Key Applications

### 1. Personalized Learning
AI algorithms can analyze student performance data to create customized learning paths that adapt to individual learning styles and pace.

### 2. Intelligent Tutoring Systems
```python
# Example of an AI-powered learning system
class IntelligentTutor:
    def __init__(self, student_profile):
        self.student = student_profile
        self.learning_path = self.generate_path()
    
    def adapt_content(self, performance_data):
        # Adjust difficulty based on student performance
        if performance_data.accuracy < 0.7:
            self.reduce_difficulty()
        elif performance_data.accuracy > 0.9:
            self.increase_difficulty()
```

### 3. Automated Assessment
AI can provide instant feedback on assignments and help identify areas where students need additional support.

## Conclusion
As we move forward, the integration of AI in education must be thoughtful and ethical, ensuring that technology enhances rather than replaces human connection in learning.',
 'Exploring how artificial intelligence is transforming education with personalized learning, intelligent tutoring systems, and automated assessment tools.',
 '550e8400-e29b-41d4-a716-446655440020', 
 'cs', 
 'published', 
 'future-of-ai-in-education', 
 '{"artificial-intelligence", "education", "machine-learning", "technology"}',
 NOW() - INTERVAL '2 days', 
 NOW() - INTERVAL '2 days'),

-- Robotics Club Blog Post
('Building Your First Arduino Robot: A Complete Guide', 
 '# Building Your First Arduino Robot: A Complete Guide

Welcome to the exciting world of robotics! In this comprehensive guide, we will walk you through creating your very first Arduino-based robot.

## What You Need

### Hardware Components
- Arduino Uno microcontroller
- Ultrasonic sensor (HC-SR04)
- Servo motors (2x)
- Wheels and chassis
- Breadboard and jumper wires
- 9V battery pack

## Step-by-Step Assembly

### 1. Setting Up the Chassis
Start by assembling your robot frame. Most beginner kits come with pre-cut acrylic or plastic pieces.

### 2. Wiring the Arduino
```cpp
// Basic robot control code
#include <Servo.h>

Servo leftWheel;
Servo rightWheel;

const int trigPin = 9;
const int echoPin = 10;

void setup() {
  leftWheel.attach(6);
  rightWheel.attach(5);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
}

void loop() {
  long distance = getDistance();
  
  if (distance > 20) {
    moveForward();
  } else {
    turnRight();
    delay(500);
  }
}
```

## Next Steps
Once you have mastered the basics:
1. Add LED indicators for different states
2. Implement line-following capabilities
3. Add Bluetooth control via smartphone app

Happy building! 🤖',
 'Learn to build your first Arduino robot with this step-by-step guide covering hardware assembly, programming, and troubleshooting tips.',
 '550e8400-e29b-41d4-a716-446655440020', 
 'robotics', 
 'published', 
 'building-first-arduino-robot-guide', 
 '{"arduino", "robotics", "diy", "programming", "electronics"}',
 NOW() - INTERVAL '5 days', 
 NOW() - INTERVAL '5 days'),

-- Drama Club Blog Post
('The Art of Method Acting: Techniques for Authentic Performance', 
 '# The Art of Method Acting: Techniques for Authentic Performance

Method acting has revolutionized modern theater and film, creating some of the most memorable and emotionally powerful performances in entertainment history.

## What is Method Acting?

Method acting is an approach to acting that encourages actors to use their **personal experiences** and emotions to create authentic characters.

## Core Techniques

### 1. Emotional Memory
Actors draw upon their own past experiences to connect with their character emotional state.

### 2. Sense Memory
This involves recreating physical sensations and environmental conditions through imagination and muscle memory.

### 3. Substitution
When an actor cannot relate to their character situation, they substitute it with a similar experience from their own life.

## Famous Method Actors

- **Marlon Brando** - Revolutionized film acting with his naturalistic approach
- **Daniel Day-Lewis** - Known for staying in character throughout entire film productions
- **Meryl Streep** - Masters accents and mannerisms through intensive preparation

## Tips for Beginning Method Actors

1. **Start small** - Begin with simple emotional exercises
2. **Keep a journal** - Document your emotional and physical observations
3. **Work with partners** - Practice scene work and improvisations
4. **Take care of yourself** - Do not let character work overwhelm your personal life

Join us for our **Acting Masterclass** on August 30th at 6:00 PM in the Theater Hall!',
 'Explore the fundamentals of method acting, from emotional memory to sense substitution, with practical exercises and insights from legendary performers.',
 '550e8400-e29b-41d4-a716-446655440020', 
 'drama', 
 'published', 
 'art-of-method-acting-techniques', 
 '{"method-acting", "theater", "performance", "acting-techniques", "emotion"}',
 NOW() - INTERVAL '3 days', 
 NOW() - INTERVAL '3 days'),

-- Music Club Blog Post
('Jazz Improvisation: Finding Your Voice Through Musical Freedom', 
 '# Jazz Improvisation: Finding Your Voice Through Musical Freedom

Jazz improvisation is the **heart and soul** of jazz music - the magical moment when musicians create spontaneous melodies, harmonies, and rhythms that have never existed before and may never exist again.

## The Essence of Jazz Improvisation

Improvisation in jazz is like having a **musical conversation**. Each musician contributes their unique voice while listening and responding to others, creating a collaborative masterpiece in real-time.

## Fundamental Elements

### 1. Scales and Modes
Understanding the building blocks of jazz harmony:

- **Major and Minor Scales**
- **Blues Scale** - The foundation of jazz expression
- **Dorian Mode** - Perfect for minor key improvisation
- **Mixolydian Mode** - Essential for dominant chord solos

### 2. Chord Progressions
Master these essential progressions:

```
ii-V-I Progression:
Dm7 - G7 - CMaj7

Jazz Standard Turnaround:
CMaj7 - A7 - Dm7 - G7
```

## Great Jazz Improvisers

### 🎺 **Miles Davis**
*"Do not fear mistakes. There are none."*

Revolutionary trumpeter who constantly reinvented jazz through different periods: bebop, cool jazz, fusion.

### 🎷 **John Coltrane**
Master of extended improvisation and spiritual expression through music.

## Practice Strategies

### Daily Routine
1. **Warm-up** with scales (15 minutes)
2. **Chord progression practice** (20 minutes)
3. **Transcription work** (15 minutes)
4. **Free improvisation** (10 minutes)

Join our **Jazz Night** on September 1st at 8:00 PM at Music Hall!',
 'Discover the art of jazz improvisation with techniques, tips, and insights from legendary musicians to help you develop your unique musical voice.',
 '550e8400-e29b-41d4-a716-446655440020', 
 'music', 
 'published', 
 'jazz-improvisation-finding-your-voice', 
 '{"jazz", "improvisation", "music-theory", "performance", "creativity"}',
 NOW() - INTERVAL '1 day', 
 NOW() - INTERVAL '1 day'),

-- Art Club Blog Post
('Digital Art vs Traditional Art: Bridging Two Worlds', 
 '# Digital Art vs Traditional Art: Bridging Two Worlds

The art world has undergone a **revolutionary transformation** with the advent of digital tools. Rather than replacing traditional methods, digital art has opened new avenues for creative expression while honoring time-tested techniques.

## The Evolution of Artistic Expression

### Traditional Art: The Foundation
Traditional art forms have been humanity primary means of visual expression for **thousands of years**:

- **Painting** - Oil, watercolor, acrylic on canvas
- **Drawing** - Pencil, charcoal, ink on paper  
- **Sculpture** - Clay, marble, bronze, wood
- **Printmaking** - Etching, lithography, screen printing

### Digital Art: The New Frontier
Digital art emerged in the late 20th century and has exploded in popularity:

- **Digital Painting** - Using tablets and styluses
- **3D Modeling** - Creating three-dimensional objects
- **Photo Manipulation** - Transforming photographs
- **Motion Graphics** - Animated visual content

## Popular Digital Art Software

### Professional Tools
- **Adobe Photoshop** - Industry standard for digital painting and photo editing
- **Procreate** - iPad app beloved by digital artists
- **Clip Studio Paint** - Excellent for illustration and comics
- **Blender** - Free 3D modeling and animation software

### Skills That Transfer
- **Composition** - Rule of thirds, balance, focal points
- **Color theory** - Harmony, temperature, value
- **Drawing fundamentals** - Proportion, perspective, anatomy
- **Creative thinking** - Concept development, storytelling

## Conclusion

The future of art lies not in choosing between traditional and digital, but in **understanding and appreciating both**. Each medium offers unique strengths, and the most versatile artists often work fluidly between both worlds.

Join our **Digital Art Workshop** on August 27, 2025 at 3:30 PM in the Art Studio!',
 'Exploring the relationship between traditional and digital art, comparing their strengths, and discovering how modern artists bridge both worlds.',
 '550e8400-e29b-41d4-a716-446655440020', 
 'art', 
 'published', 
 'digital-art-vs-traditional-art-bridging-worlds', 
 '{"digital-art", "traditional-art", "creativity", "technology", "artistic-expression"}',
 NOW() - INTERVAL '4 days', 
 NOW() - INTERVAL '4 days'),

-- Sports Club Blog Post  
('The Science of Athletic Performance: Training Mind and Body', 
 '# The Science of Athletic Performance: Training Mind and Body

Modern athletics has evolved far beyond simple physical training. Today elite athletes understand that **peak performance** requires a holistic approach that integrates physical conditioning, mental preparation, nutrition science, and recovery strategies.

## The Foundation: Physical Training

### Strength and Conditioning
Proper strength training forms the backbone of athletic performance:

#### **Progressive Overload**
Gradually increasing training demands to stimulate adaptation and growth.

#### **Specificity Principle**  
Training movements and energy systems specific to your sport.

#### **Recovery and Adaptation**
Understanding that growth happens during rest, not just during training.

### Training Periodization
```
Macrocycle (Annual Plan)
├── Preparation Phase (Base Building)
├── Competition Phase (Peak Performance)
└── Transition Phase (Active Recovery)

Microcycle (Weekly Plan)
├── High Intensity Days
├── Moderate Intensity Days
└── Recovery Days
```

## The Mental Game

### Sports Psychology Fundamentals

#### **Goal Setting**
- **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound
- **Process vs Outcome**: Focus on controllable actions rather than results
- **Progressive Targets**: Building confidence through incremental achievements

#### **Visualization Techniques**
Elite athletes spend significant time mentally rehearsing their performance.

## Nutrition: Fueling Performance

### Macronutrients for Athletes

#### **Carbohydrates** - The Primary Fuel
- **Pre-Exercise**: 1-4g per kg body weight, 1-4 hours before
- **During Exercise**: 30-60g per hour for sessions > 60 minutes
- **Post-Exercise**: 1.5g per kg body weight within 30 minutes

#### **Proteins** - Building and Repair
- **Daily Intake**: 1.2-2.0g per kg body weight
- **Post-Workout**: 20-25g within 2 hours

## Upcoming Events

### 🏀 **Basketball Tournament**
**Date:** September 10, 2025 at 4:00 PM  
**Location:** Basketball Court  

### 💪 **Fitness Challenge**  
**Date:** August 29, 2025 at 8:00 AM  
**Location:** Sports Complex

Remember: **every expert was once a beginner**. Start where you are, use what you have, and do what you can.',
 'Discover the science behind peak athletic performance, covering physical training, mental preparation, nutrition, recovery, and injury prevention.',
 '550e8400-e29b-41d4-a716-446655440020', 
 'sports', 
 'published', 
 'science-of-athletic-performance-training', 
 '{"athletics", "sports-science", "training", "nutrition", "performance"}',
 NOW() - INTERVAL '6 days', 
 NOW() - INTERVAL '6 days');
