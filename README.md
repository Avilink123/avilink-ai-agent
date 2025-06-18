# 🚀 Avilink AI Agent

A powerful, modern AI assistant with advanced capabilities including DeepSearch, code execution, web browsing, file processing, and multi-LLM support. Built with Next.js, TypeScript, and cutting-edge AI technologies.

![Avilink AI Agent](https://img.shields.io/badge/AI-Agent-blue?style=for-the-badge&logo=openai)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)

## ✨ Features

### 🔍 **DeepSearch**
- Advanced web search with 20+ credible sources
- Intelligent source ranking and relevance scoring
- Real-time information gathering and synthesis

### 💻 **Code Execution**
- Python code execution in secure sandboxed environment
- Real-time output streaming
- Support for data analysis, visualization, and computation

### 🌐 **Web Browsing**
- Intelligent web browsing and content extraction
- Dynamic page interaction capabilities
- Screenshot and content analysis

### 📁 **File Processing**
- Support for PDF, Word, Excel, images, and more
- Intelligent document analysis and extraction
- Batch file processing capabilities

### 🤖 **Multi-LLM Support**
- OpenAI GPT models (GPT-4, GPT-3.5)
- Anthropic Claude models
- DeepSeek models
- Google Gemini models
- Easy model switching and comparison

### 🎨 **Modern UI/UX**
- Clean, responsive design matching Manus AI aesthetics
- Dark/light theme support
- Real-time chat interface
- File drag-and-drop functionality

### 🔧 **Advanced Features**
- Chat history and session management
- Voice input/output capabilities
- Plugin and extension architecture
- Customizable tool configurations
- Real-time collaboration features

## 🚀 Quick Start with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Avilink123/avilink-ai-agent.git
   cd avilink-ai-agent
   ```

2. **Run the setup script**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (see Configuration section below)
   nano .env
   ```

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   Open your browser and navigate to: `http://localhost:3000`

### Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Clone and navigate
git clone https://github.com/Avilink123/avilink-ai-agent.git
cd avilink-ai-agent

# 2. Create environment file
cp .env.example .env

# 3. Build and start services
docker-compose build
docker-compose up -d postgres redis
sleep 10  # Wait for database

# 4. Run migrations
docker-compose run --rm avilink-app npx prisma migrate deploy

# 5. Start the application
docker-compose up -d avilink-app
```

## ⚙️ Configuration

### Required API Keys

Edit your `.env` file with the following API keys:

```env
# LLM Providers (at least one required)
OPENAI_API_KEY="sk-your-openai-api-key-here"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key-here"
DEEPSEEK_API_KEY="sk-your-deepseek-api-key-here"
GEMINI_API_KEY="your-gemini-api-key-here"

# Search APIs (for DeepSearch)
SERP_API_KEY="your-serp-api-key-here"
BRAVE_SEARCH_API_KEY="your-brave-search-api-key-here"

# Database (automatically configured with Docker)
DATABASE_URL="postgresql://avilink:avilink_password@postgres:5432/avilink"

# Security
NEXTAUTH_SECRET="your-super-secret-nextauth-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Getting API Keys

#### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account and navigate to API Keys
3. Generate a new API key

#### Anthropic
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account and generate an API key

#### DeepSeek
1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Register and obtain your API key

#### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Create a project and generate an API key

#### Search APIs
- **SERP API**: Visit [SerpApi](https://serpapi.com/) for web search capabilities
- **Brave Search**: Visit [Brave Search API](https://brave.com/search/api/) for alternative search

## 🛠️ Development

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/Avilink123/avilink-ai-agent.git
cd avilink-ai-agent

# Navigate to the app directory
cd app

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development database
docker-compose up -d postgres redis

# Run database migrations
npx prisma migrate dev

# Start the development server
yarn dev
```

The application will be available at `http://localhost:3000`.

### Project Structure

```
avilink-ai-agent/
├── app/                          # Next.js application
│   ├── app/                      # App router pages
│   │   ├── api/                  # API routes
│   │   │   ├── chat/             # Chat API endpoints
│   │   │   ├── tools/            # Tool execution endpoints
│   │   │   └── files/            # File processing endpoints
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page
│   ├── components/               # React components
│   │   ├── chat/                 # Chat interface components
│   │   ├── layout/               # Layout components
│   │   ├── settings/             # Settings components
│   │   ├── ui/                   # Reusable UI components
│   │   └── welcome/              # Welcome screen components
│   ├── lib/                      # Utility libraries
│   │   ├── db/                   # Database utilities
│   │   ├── tools/                # AI tool implementations
│   │   ├── types.ts              # TypeScript type definitions
│   │   └── utils.ts              # General utilities
│   ├── prisma/                   # Database schema and migrations
│   └── hooks/                    # Custom React hooks
├── scripts/                      # Setup and utility scripts
├── docker-compose.yml            # Docker services configuration
├── Dockerfile                    # Application container
└── README.md                     # This file
```

## 🔧 Available Commands

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f avilink-app

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose down && docker-compose build && docker-compose up -d

# Access application shell
docker-compose exec avilink-app sh

# Run database migrations
docker-compose run --rm avilink-app npx prisma migrate deploy

# Reset database
docker-compose down -v && docker-compose up -d
```

### Development Commands

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linting
yarn lint

# Database operations
npx prisma migrate dev    # Run migrations
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio
npx prisma db seed       # Seed database
```

## 🧪 Testing

```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

## 📊 Monitoring and Logs

### View Application Logs
```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs avilink-app
docker-compose logs postgres
```

### Health Checks
The application includes health check endpoints:
- Application health: `http://localhost:3000/api/health`
- Database health: Built into Docker Compose

## 🔒 Security

- All API keys are stored securely in environment variables
- Database connections use secure authentication
- File uploads are validated and sandboxed
- Code execution runs in isolated containers
- CORS and security headers are properly configured

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 docker-compose up
```

#### Database Connection Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose run --rm avilink-app npx prisma migrate deploy
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh
```

#### API Key Issues
- Ensure all required API keys are set in `.env`
- Check API key validity and quotas
- Verify API key format (some require specific prefixes)

#### Memory Issues
```bash
# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory > 4GB+

# Or reduce resource usage
docker-compose down
docker system prune -f
docker-compose up -d
```

### Getting Help

1. Check the [Issues](https://github.com/Avilink123/avilink-ai-agent/issues) page
2. Review the troubleshooting section above
3. Check Docker and system logs
4. Ensure all prerequisites are installed correctly

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- UI components from [Radix UI](https://www.radix-ui.com/) and [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [PostgreSQL](https://www.postgresql.org/) and [Prisma](https://www.prisma.io/)
- AI capabilities powered by multiple LLM providers

## 📞 Support

For support and questions:
- 📧 Email: support@avilink.ai
- 💬 Discord: [Join our community](https://discord.gg/avilink)
- 📖 Documentation: [docs.avilink.ai](https://docs.avilink.ai)

---

**Made with ❤️ by the Avilink Team**