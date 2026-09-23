# Live Wallpaper Notes App

A personal tool to show a running list of notes as your Windows 11 desktop wallpaper, updating live.

## Features
- **Live Wallpaper**: Polls the notes API and updates your wallpaper without refresh.
- **Notes Manager**: A simple interface to add or clear notes from any device.
- **Secure**: Protected by a single passcode.

## Tech Stack
- Next.js (App Router)
- Upstash Redis
- Vercel Deployment

## Local Development
1. Clone the repository and run `npm install`.
2. Copy `.env.example` to `.env.local` and add your Upstash Redis credentials and a chosen `NOTES_PASSCODE`.
3. Run `npm run dev` to start the development server.

## Vercel Deployment & Upstash Integration
1. Push this repository to GitHub and import it into Vercel.
2. In your Vercel project, go to the **Marketplace** tab and add **Upstash Redis**.
3. This will automatically populate your Vercel Environment Variables with `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
4. Add your own `NOTES_PASSCODE` in the Vercel Environment Variables section.
5. Deploy the project!

## Lively Wallpaper Setup
1. Download and install [Lively Wallpaper](https://rocksdanister.github.io/lively/) on your Windows 11 machine.
2. Open Lively Wallpaper and click the "+" button to add a new wallpaper.
3. Paste the deployed URL of your wallpaper page (e.g., `https://your-app.vercel.app/wallpaper`) into the "Enter URL" field and click Go.
4. Your desktop will now display your live notes, updating automatically as you add new ones!
