<div align="center">
<img width="1895" height="895" alt="image" src="https://github.com/user-attachments/assets/fa3bf478-5629-445b-aa30-8f56ce31e0ab" />
</div>

🌊 Learn Flow: Adaptive AI Learning Paths
Learn Flow is an intelligent learning ecosystem that turns complex subjects into manageable, personalized roadmaps. By combining the reasoning power of Gemini 1.5/3.0 with a structured diagnostic engine, Learn Flow ensures you don't just see a roadmap—you master it.

✨ Core Features
Dynamic Pathfinding: Generates a 3-layer learning architecture (Milestones → Objectives → Actionable Tasks) using gemini-3-pro-preview.
Knowledge Gap Analysis: A 10-question initial assessment that automatically adjusts the roadmap's difficulty to your level.
Resilient API Architecture: Built-in Exponential Backoff and Request Throttling to ensure 100% uptime even on API Free Tiers.
Daily Momentum: Integrated streak tracking to encourage consistent daily learning habits.
Clean JSON Engineering: Uses strict ResponseMimeType and schema validation to ensure the UI remains stable and reliable.

🛠️ The Tech Stack
Framework: React + TypeScript + Vite
Styling: Tailwind CSS (Dark Mode optimized)
AI Integration: @google/genai (Google Generative AI SDK)
State & Storage: React Hooks + Browser LocalStorage

🏗️ System Architecture
Input: User provides a "Mastery Objective" (e.g., "Quantum Computing").
Queue: The request is placed in a QueuedRequest buffer to respect API Rate Limits.
Generation: Gemini returns a strictly formatted JSON curriculum based on a predefined schema.
Persistence: The plan is saved locally, allowing for offline access and progress tracking.
