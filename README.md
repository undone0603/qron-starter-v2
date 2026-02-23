# QRON - Living QR Codes

> AI-generated scannable portals that evolve.

## 🚀 Demo

Visit the live application: [qron-starter-v2-psi.vercel.app](https://qron-starter-v2-psi.vercel.app)

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Development](#development)
- [Database](#database)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 📖 About

QRON creates intelligent, evolving QR codes powered by AI. These aren't static QR codes—they're dynamic portals that adapt and learn.

## ✨ Features

- 🤖 AI-generated QR code designs
- 📊 Real-time analytics with Vercel Analytics
- 🔐 Secure authentication via Supabase
- 💎 Web3 integration with ThirdWeb
- ✨ Smooth animations with Framer Motion
- 🎨 Responsive design with Tailwind CSS
- 📱 Mobile-first approach

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 14.1.0](https://nextjs.org/)
- **UI Library:** [React 18.2.0](https://react.dev/)
- **Styling:** [Tailwind CSS 3.4.1](https://tailwindcss.com/)
- **Animation:** [Framer Motion 10.18.0](https://www.framer.com/motion/)
- **Icons:** [Lucide React 0.309.0](https://lucide.dev/)
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/)

### Backend & Services
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication:** [@supabase/auth-helpers-nextjs](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- **AI/ML:** [FAL AI Serverless Client](https://www.fal.ai/)
- **Web3:** [ThirdWeb SDK & React](https://thirdweb.com/)
- **Analytics:** [Vercel Analytics](https://vercel.com/analytics)
- **QR Code Generation:** [qrcode](https://www.npmjs.com/package/qrcode)

### Developer Tools
- **Language:** TypeScript 5.3.0
- **Linting:** ESLint 8.56.0
- **CSS Processing:** PostCSS, Autoprefixer
- **Node Version:** ≥18.0.0

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Supabase account
- Vercel account (for deployment)
- FAL AI API key
- ThirdWeb API key (optional, for Web3 features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/undone0603/qron-starter-v2.git
   cd qron-starter-v2/qron-starter-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables** (see [Environment Variables](#environment-variables))

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# FAL AI
FAL_API_KEY=your_fal_ai_key

# ThirdWeb (optional)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

## 🔧 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on localhost:3000 |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint on codebase |
| `npm run db:migrate` | Push database schema to Supabase |
| `npm run db:reset` | Reset database to initial state |

### Code Quality

The project uses ESLint to maintain code quality:
```bash
npm run lint
```

## 🗄️ Database

This project uses Supabase (PostgreSQL). Database migrations are stored in `supabase/migrations/`.

### Setup Database

1. Link your Supabase project:
   ```bash
   supabase link --project-ref <project-id>
   ```

2. Push schema to Supabase:
   ```bash
   npm run db:migrate
   ```

3. Reset database (development only):
   ```bash
   npm run db:reset
   ```

## 🚀 Deployment

This project is optimized for [Vercel](https://vercel.com/). Deployment is automatic on push to `main` branch.

### Manual Deployment

```bash
vercel deploy
```

### Environment Variables on Vercel

Add the following to your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `FAL_API_KEY`
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`

## 📁 Project Structure

```
qron-starter-v2/
├── app/                    # Next.js 14 app directory
├── components/             # Reusable React components
├── lib/                    # Utility functions and helpers
├── public/                 # Static assets
├── styles/                 # Global styles
├── supabase/
│   ├── migrations/         # Database schema migrations
│   └── functions/          # Supabase edge functions
├── .env.local.example      # Environment variables template
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code passes linting:
```bash
npm run lint
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues, questions, or suggestions, please [open an issue](https://github.com/undone0603/qron-starter-v2/issues) on GitHub.

---

**Live Demo:** [qron-starter-v2-psi.vercel.app](https://qron-starter-v2-psi.vercel.app)
**Repository:** [github.com/undone0603/qron-starter-v2](https://github.com/undone0603/qron-starter-v2)