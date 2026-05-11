# CropGuard

AI-powered crop protection and pest detection system for Zimbabwean farmers. Identify pests affecting your maize, sorghum, rapoko and other crops with instant AI analysis and expert treatment recommendations.

## Features

- 🤖 **AI-Powered Pest Detection** - Upload crop images for instant identification
- 🔐 **Secure Authentication** - User registration and login required to submit reports
- 🗺️ **Detection Map** - Visualize pest outbreaks across Zimbabwe regions
- 📊 **Pest History** - Track and rate treatment effectiveness
- 📚 **Knowledge Base** - Comprehensive pest information and treatment guides
- 🌾 **Crop-Focused** - Specialized for maize, sorghum, rapoko and other staple crops
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API + TanStack Query
- **Backend**: PHP + MySQL
- **Icons**: Lucide React
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/           # React components
│   ├── pest/            # Pest-related components
│   ├── ui/              # shadcn UI components
│   └── AppLayout.tsx    # Main app layout
├── pages/               # Route pages
├── contexts/            # React Context providers
├── lib/                 # Utilities and integration
├── data/                # Static data and constants
└── hooks/               # Custom React hooks
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/cropguard.git
cd cropguard
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API configuration:
```env
VITE_API_URL=http://localhost/pestguard/backend/api
```

4. Start development server
```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Deployment

### Deploy to Netlify

1. **Connect GitHub Repository**
   - Sign up/login to [Netlify](https://netlify.com)
   - Click "Connect to Git"
   - Select your GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add Environment Variables**
   - Go to Site Settings → Build & Deploy → Environment
   - Add your API configuration as environment variables:
     - `VITE_API_URL` (pointing to your backend)
     - Any Vision API keys as needed

4. **Deploy**
   - Netlify will automatically build and deploy on every push to your main branch

The `netlify.toml` configuration file in the root handles routing and caching automatically.

## Key Features Implementation

### Mandatory Sign-In for Image Upload
- Users must authenticate to upload crop pest images
- Authentication powered by PHP backend
- Protected routes ensure data security

### Crop-Focused Design
- Primary crops: Maize, Sorghum, Rapoko
- Tailored pest identification for Zimbabwean farming regions
- Location-specific recommendations

### Real-Time Pest Detection
- AI-powered pest identification from images
- Instant analysis and recommendations
- Integration with Vision APIs

## Database Schema

Key tables in the PHP backend database:
- `users` - User accounts with farmer profiles
- `pest_reports` - Pest sightings and reports
- `treatments` - Treatment recommendations
- `pest_history` - Treatment effectiveness tracking

## Security

- Passwords hashed and stored securely in the backend database
- Secure API endpoints with authentication checks
- HTTPS enforced on production
- Environment variables for sensitive credentials

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com) components
- Hosted on [Netlify](https://netlify.com)
- Backend powered by PHP + MySQL
- Icons from [Lucide React](https://lucide.dev)

---

**CropGuard** - Protecting Zimbabwean Agriculture with AI Technology
