# NextHeir Mobile App - PRD

## Overview
NextHeir is a premium React Native (Expo) mobile app for AI-powered inheritance and wealth distribution planning for high-net-worth families. It's a mobile port of the heir-planner.preview.emergentagent.com web app, excluding the family tree feature.

## Tech Stack
- Frontend: Expo Router, React Native, Reanimated, AsyncStorage
- Backend: FastAPI, MongoDB (motor), JWT auth, ReportLab (PDF), emergentintegrations (Gemini 3 Flash)
- AI: Gemini 3 Flash via Emergent LLM key

## Key Features
1. **Authentication**: Email/password JWT + Mobile OTP (mocked - always `123456`)
2. **Assets**: CRUD for property, business, investment, precious metals, other
3. **Family Members**: CRUD with relationships, age, financial needs (low/med/high), notes
4. **Scenarios**: Create distribution scenarios with per-asset, per-member percentage allocations; equal split helper
5. **AI Fairness Analysis**: Gemini-generated fairness score (0-100), risks, strengths, recommendations
6. **AI Chat**: Multi-turn conversation with context from user's estate snapshot
7. **Share Scenario**: Generates public share token + URL via OS share sheet
8. **Export PDF**: Generates branded PDF report (ReportLab) via expo-sharing

## Design
- Premium "Jewel & Luxury" theme — Obsidian (#0A0A0E) + Champagne Gold (#D4AF37)
- Floating animations on key elements, fade-in-up staggered list entrances
- Premium fintech/legal feel, NOT poppy or funky
- Bottom tab navigation: Home, Assets, Family, Scenarios, AI Chat

## Excluded
- Family Tree visualization (per user request)

## API Endpoints (all /api prefix)
- POST /auth/register, /auth/login, /auth/mobile/request-otp, /auth/mobile/verify-otp
- GET /auth/me, /dashboard
- CRUD /assets, /family, /scenarios
- POST /scenarios/{id}/analyze (AI)
- POST /chat, GET /chat/history, DELETE /chat/history
- POST /scenarios/{id}/share, GET /shared/{token}
- GET /scenarios/{id}/pdf
