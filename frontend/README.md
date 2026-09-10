# NEXORA Frontend

React + Vite client for the NEXORA packaged-food intelligence platform.

## Stack

- React + Vite
- React Router
- Tailwind CSS
- Axios
- React Hook Form + Zod
- Lucide React
- Recharts
- html5-qrcode (real camera barcode scanning)
- react-hot-toast

## Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default API URL: `http://localhost:5000/api`

## Flow

Landing → Sign up / Login → Mandatory personalization → Home → Search / Scan / Upload → Product → Analysis (scores, verification, recommendations, Ask Nexora) → History / Profile

## Notes

- No fake product data or client-side scoring
- Auth token stored in `localStorage` as `nexora_token`
- Protected routes require authentication and completed personalization
