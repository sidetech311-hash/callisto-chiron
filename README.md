# Nexus Download Manager (Nexus IDM)

A high-speed, multi-threaded internet download manager built with React, Express, and Tailwind CSS.

## Features
- **Multi-threaded Downloading:** Simulates segmented downloading for maximum speed.
- **Real-time Analytics:** Speed tracking charts and progress updates.
- **Smart Categorization:** Automatically sorts files into Video, Music, Documents, etc.
- **Responsive Design:** Works perfectly on both Desktop and Mobile browsers.

## Local Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### Steps
1. **Clone or Download** this project to your machine.
2. **Open Terminal** in the project folder.
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Configure Environment**:
   - Create a `.env` file in the root directory.
   - Add your Gemini API Key:
     ```env
     GEMINI_API_KEY=your_api_key_here
     ```
5. **Start Development Server**:
   ```bash
   npm run dev
   ```
6. **Access the App**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Mobile Use
To use it on your phone right now:
1. Ensure your phone and laptop are on the same Wi-Fi network.
2. Find your laptop's local IP address.
3. Visit `http://YOUR_IP:3000` on your phone's browser.

## Deployment
This app is ready to be deployed to platforms like **Cloud Run**, **Vercel**, or **Heroku**. For mobile stores, consider using **Capacitor** to wrap the web build into a native app.
