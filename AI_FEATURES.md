# AI-Powered Features Guide

## Overview

The Intelligent Onboarding System now includes advanced AI capabilities powered by Claude API, featuring:

1. **AI Chat Assistant** - 24/7 conversational support for onboarding questions
2. **Adaptive Learning Engine** - Personalized learning path recommendations

---

## AI Chat Assistant

### What It Does

The AI Chat Assistant is a floating chatbot available on:
- Employee Detail pages (`/employees/:id`)
- New Hire Portal (`/portal/:employeeId`)

It helps employees by:
- Answering questions about their onboarding tasks
- Providing guidance on task completion
- Explaining company policies and procedures
- Offering encouragement and support
- Escalating complex issues to HR when needed

### How to Use

1. **Open the Chat Widget**
   - Click the blue message bubble (💬) in the bottom-right corner
   - The chat window opens with a welcome message

2. **Send Messages**
   - Type your question in the input field
   - Press Enter or click the Send button
   - The AI responds within seconds

3. **Context-Aware Responses**
   - The AI knows your:
     - Current role and department
     - Joining date
     - Task list and deadlines
     - Completion progress
   - It provides personalized answers based on YOUR onboarding journey

### Example Questions

- "What tasks do I need to complete this week?"
- "When is my IT setup due?"
- "Can you explain the HR compliance process?"
- "What should I do first?"
- "Who is my manager?"
- "Am I on track with my onboarding?"

### Features

✅ **Context-Aware** - Understands your role, progress, and deadlines  
✅ **Multi-Turn Conversations** - Remember previous messages in the chat  
✅ **Real-Time Responses** - Instant answers powered by Claude API  
✅ **Escalation Support** - Recognizes when to involve human HR team  
✅ **Always Available** - 24/7 support with no waiting

---

## Adaptive Learning Engine

### What It Does

The Adaptive Learning Engine analyzes your onboarding progress and recommends:

- **Optimal Learning Pace** - Slow, Normal, or Fast based on your performance
- **Focus Areas** - Which categories need attention
- **Priority Tasks** - What to tackle first for maximum efficiency
- **Completion Timeline** - Estimated date when you'll finish onboarding
- **Key Insights** - AI-generated observations about your progress

### How to Use

1. **Access the Panel**
   - Go to Employee Detail page
   - Click "By Category" tab
   - Scroll down to "Adaptive Learning Path"

2. **Generate Recommendations**
   - Click the "⚡ Generate" button
   - The AI analyzes your progress (takes 2-5 seconds)
   - Recommendations appear instantly

3. **Understand Your Recommendations**
   - **Learning Pace**: 🐢 Slow | ⚡ Normal | 🚀 Fast
   - **Focus Areas**: Key categories to concentrate on
   - **Priority Tasks**: Tasks most impactful to complete next
   - **Completion Date**: When you'll finish at current pace
   - **Key Insights**: Personalized observations

### What Gets Analyzed

The adaptive engine looks at:
- Overall completion percentage
- Completion rate per category
- Task completion velocity (tasks/day)
- Time since joining
- Task priority and due dates
- Department and role requirements

### Benefits

✨ **Personalized Path** - Different for every employee based on progress  
✨ **Smart Pacing** - Suggests speed adjustments based on your performance  
✨ **Focused Effort** - Highlights where to spend time for maximum impact  
✨ **Deadline Awareness** - Predicts completion date based on current pace  
✨ **Continuous Learning** - Generate new recommendations anytime

---

## Technical Setup

### Enabling AI Features

AI features require the **Anthropic Claude API Key**:

1. **Get an API Key**
   - Visit [console.anthropic.com](https://console.anthropic.com)
   - Create an account or sign in
   - Go to "API Keys" section
   - Create a new API key

2. **Configure the System**
   ```bash
   # In the root directory:
   cp .env.example .env
   
   # Edit .env and add:
   ANTHROPIC_API_KEY=sk-ant-YOUR-KEY-HERE
   ```

3. **Restart Backend**
   ```bash
   cd backend
   npm run dev
   ```

4. **Verify**
   - Reload the app in browser
   - You'll see chat bubble and adaptive learning button
   - If disabled, check that ANTHROPIC_API_KEY is set correctly

### Disabling AI Features

If you want to run without AI:
- Don't set `ANTHROPIC_API_KEY` in `.env`
- Chat widgets won't appear
- All other features work normally

---

## Backend API Reference

### Chat Endpoints

#### POST `/api/chat/message`

Send a message and get AI response.

**Request:**
```json
{
  "employeeId": 1,
  "message": "What should I do next?",
  "conversationHistory": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello!" }
  ]
}
```

**Response:**
```json
{
  "message": "Based on your tasks, I recommend completing..."
}
```

#### POST `/api/chat/recommendations`

Get adaptive learning recommendations.

**Request:**
```json
{
  "employeeId": 1
}
```

**Response:**
```json
{
  "focus_areas": ["IT Setup", "HR Compliance"],
  "suggested_tasks": ["Complete GitHub access", "Sign employment agreement"],
  "learning_pace": "normal",
  "estimated_completion_date": "2026-07-15",
  "key_insights": "You're on track. Focus on completing..."
}
```

---

## Conversation History

The system maintains conversation context across multiple messages. This means:

- The AI remembers what you asked before
- You don't need to repeat context
- Follow-up questions are understood
- Natural, flowing conversations

**Conversation Example:**
```
You: "What's my first task?"
AI: "Your first task is Laptop & Equipment Setup, due tomorrow..."

You: "How long does that usually take?"
AI: "Most employees complete it in 1-2 hours. Since it's due tomorrow..."
```

---

## Limitations & Notes

⚠️ **Important:**

- AI responses are informative but not official HR decisions
- Complex issues should be escalated to your manager
- The AI has access to your current task list but not performance reviews
- Responses are generated in real-time (5-10 second typical latency)
- Requires internet connection for Claude API calls

---

## Troubleshooting

### Chat Widget Not Appearing

**Problem:** No chat bubble visible on Employee Detail page

**Solution:**
1. Check that `ANTHROPIC_API_KEY` is set in `.env`
2. Restart backend: `npm run dev` in `/backend`
3. Reload browser page
4. Check browser console for errors

### Slow Chat Responses

**Problem:** AI takes >15 seconds to respond

**Possible Causes:**
- High API latency (Anthropic's infrastructure)
- Network connection slow
- Large conversation history (triggers longer processing)

**Solution:**
- Check internet connection speed
- Try again in a moment
- Clear older conversations if available

### Generic Responses

**Problem:** AI responses don't seem personalized

**Solution:**
- The system loads employee context at request time
- Make sure employee profile is fully filled out
- Try a more specific question about your tasks
- The AI learns from task list and completion data

---

## Future Enhancements

Potential improvements:

📋 **Conversation Persistence** - Save chat history for later review  
📊 **Performance Metrics** - Track which recommendations lead to faster completion  
🎯 **Goal Setting** - AI helps set custom learning goals  
📱 **Mobile Optimization** - Better chat interface for mobile devices  
🤖 **Multi-Lingual Support** - Chat in different languages  

---

## Example Workflows

### Workflow 1: Getting Started (New Hire)

```
New Hire: "Hi, I just joined. What do I need to do?"
AI: "Welcome! Based on your Software Engineer role, here's your priority..."

New Hire: "How long do these usually take?"
AI: "Most engineers complete onboarding in about 30 days..."

New Hire: "Can you show me what's due this week?"
AI: "Your tasks due this week are: [list with deadlines]"

New Hire: "Thanks, let me get started!"
```

### Workflow 2: Getting Unstuck

```
Employee: "I'm stuck on task X"
AI: "Let me help! Here's what task X involves..."

Employee: "I need help, can I talk to someone?"
AI: "This sounds complex. I recommend reaching out to your manager..."

Employee: "Okay, thanks for the help"
AI: "Happy to help! Feel free to ask anytime."
```

### Workflow 3: Getting Adaptive Recommendations

```
[Employee at 45% completion after 15 days]
Manager: "Generate recommendations for this employee"
AI: "Analysis shows: Focus on HR Compliance (only 20% done)..."
AI: "Recommended pace: Normal"
AI: "Estimated completion: 2026-07-20"
AI: "Key insight: Catch up on compliance to improve overall progress"
```

---

## Support

For issues with AI features:

1. **Check the setup** - Verify `ANTHROPIC_API_KEY` is set
2. **Check the console** - Browser console may show API errors
3. **Test connectivity** - Ensure API can reach Anthropic servers
4. **Reach out** - Contact your system administrator

---

**Last Updated:** June 26, 2026  
**Version:** 1.0 - Initial AI Release
