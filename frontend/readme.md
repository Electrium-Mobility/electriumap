## ⚙️ Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/Electrium-Mobility/electriumap.git
   cd electriumap
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Setup Environment Variables**

   Copy the environment template and configure your API keys:

   ```bash
   cp .env-template .env.local
   ```

   Then edit `.env.local` and fill in your actual values:
   - **Firebase credentials** (get from Firebase Console)
   - **Mapbox access token** (get from Mapbox Studio)
   
   See `.env-template` for all required environment variables.

5. **Visit your app**

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Available Scripts

- `npm run dev` – Runs the app in development mode
- `npm run build` – Builds the app for production
- `npm start` – Starts the production build
- `npm run lint` – Runs ESLint on the project
