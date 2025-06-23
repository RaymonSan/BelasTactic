# BelasTactic - Dutch Tax Strategy SaaS

> *"Making Belastingdienst paperwork feel like a spa day."*

An open-source SaaS application that helps Dutch individuals optimize their tax strategy using AI-powered analysis and transparent calculations.

## 🚀 Phase 1 - Foundation & Local AI Setup ✅

Phase 1 is **COMPLETE**! We have successfully set up:

- ✅ Next.js 14 monorepo with app router
- ✅ TypeScript configuration with strict mode  
- ✅ Core dependencies (tRPC, Zod, React Hook Form, etc.)
- ✅ Ollama installation with Llama 3.1 8B model
- ✅ Basic AI service abstraction layer
- ✅ Environment configuration
- ✅ Health check API endpoint
- ✅ Test page for verification

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **AI**: Local Ollama (Llama 3.1 8B) + OpenAI embeddings (future)
- **Database**: Supabase (PostgreSQL + pgvector) - Phase 2
- **Deployment**: Vercel - Phase 2
- **Styling**: Tailwind CSS

### Project Structure
```
belastactic/
├── src/app/                 # Next.js 14 app router
├── packages/
│   ├── core/               # Shared types & utilities
│   ├── ai/                 # AI services & abstractions
│   └── tax-rules/          # Dutch tax logic (Phase 5)
├── scripts/                # Automation scripts
└── docs/                   # Phase documentation
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ (LTS recommended)
- macOS with Homebrew (for Ollama)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd belastactic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install and setup Ollama**
   ```bash
   # Install Ollama
   brew install ollama
   
   # Start Ollama service
   brew services start ollama
   
   # Download Llama 3.1 8B model (optimized for M2 MacBook)
   ollama pull llama3.1:8b
   
   # Test the model
   ollama run llama3.1:8b "Explain Dutch Box 1 income tax"
   ```

4. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Verify setup**
   - Open http://localhost:3000/test
   - Click "Check Health Status" to verify all services
   - Click "Test Dutch Tax Question" to test AI integration

## 🧪 Testing the Setup

### Health Check
Visit http://localhost:3000/api/health to see system status:
```json
{
  "status": "healthy",
  "services": {
    "ollama": { "status": "healthy", "message": "Ollama connected with Llama 3.1 8B" },
    "environment": { "status": "healthy" }
  }
}
```

### AI Test
Visit http://localhost:3000/test and use the "Test Dutch Tax Question" button to verify the AI is responding correctly to tax-related queries.

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## 🔧 Configuration

### Environment Variables
Key environment variables for Phase 1:
- `OLLAMA_BASE_URL` - Ollama API endpoint (default: http://localhost:11434)
- `JWT_SECRET` - Secret for JWT tokens
- `NODE_ENV` - Environment (development/production)

### Ollama Configuration
The app uses Llama 3.1 8B model which is optimized for:
- M2 MacBook Pro performance
- Dutch tax domain knowledge
- Cost-effective local processing

## 🐛 Troubleshooting

### Ollama Issues
- **"command not found: ollama"**: Install with `brew install ollama`
- **Model not found**: Run `ollama pull llama3.1:8b`
- **Service not running**: Run `brew services start ollama`
- **Memory issues**: Close other applications, ensure 16GB+ RAM

### Development Issues
- **Port 3000 in use**: Change port with `npm run dev -- -p 3001`
- **TypeScript errors**: Run `npm run type-check` to see details
- **Build fails**: Ensure all dependencies are installed with `npm install`

## 📚 Next Steps (Phase 2)

The next phase will focus on:
- Supabase database setup with EU compliance
- Access code authentication system  
- Automated backup to GitHub
- GDPR compliance foundation

## 🤝 Contributing

This is currently a personal project for friends and family testing. Phase documentation is available in the `/docs` folder.

## 📄 License

MIT License - Open source SaaS

---

**Phase 1 Status**: ✅ COMPLETE  
**Next Phase**: Infrastructure & Authentication  
**Target**: Production-ready MVP in 7 weeks
