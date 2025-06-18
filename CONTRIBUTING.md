# Contributing to Avilink AI Agent

We welcome contributions to the Avilink AI Agent project! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment following the README instructions
4. Create a new branch for your feature or bug fix

## Development Setup

### Prerequisites
- Node.js 18+ and yarn
- Docker and Docker Compose
- Git

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/avilink-ai-agent.git
cd avilink-ai-agent

# Install dependencies
cd app
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development database
docker-compose up -d postgres redis

# Run database migrations
npx prisma migrate dev

# Start development server
yarn dev
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Write tests for new features

## Submitting Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Follow the existing patterns and conventions
   - Test your changes thoroughly

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: brief description of your changes"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

## Pull Request Guidelines

- **Title**: Use a clear, descriptive title
- **Description**: Explain what your changes do and why
- **Testing**: Describe how you tested your changes
- **Screenshots**: Include screenshots for UI changes
- **Breaking Changes**: Note any breaking changes

## Types of Contributions

### Bug Fixes
- Fix existing functionality that isn't working correctly
- Include steps to reproduce the bug
- Add tests to prevent regression

### New Features
- Add new AI tools or capabilities
- Improve existing functionality
- Enhance the user interface
- Add new LLM provider support

### Documentation
- Improve README or other documentation
- Add code comments
- Create tutorials or guides

### Performance Improvements
- Optimize existing code
- Reduce bundle size
- Improve loading times

## AI Tools Development

When adding new AI tools:

1. **Extend BaseTool class**
   ```typescript
   export class YourTool extends BaseTool {
     name = 'your_tool';
     description = 'Description of what your tool does';
     parameters = {
       // Define parameters
     };

     async execute(parameters: any) {
       // Implementation
     }
   }
   ```

2. **Register in ToolRegistry**
   ```typescript
   // In tool-registry.ts
   import { YourTool } from './your-tool';
   
   private registerBuiltinTools() {
     const builtinTools = [
       // ... existing tools
       new YourTool()
     ];
   }
   ```

3. **Add tests**
4. **Update documentation**

## Database Changes

For database schema changes:

1. **Update Prisma schema**
   ```prisma
   // In prisma/schema.prisma
   model YourModel {
     // Define your model
   }
   ```

2. **Create migration**
   ```bash
   npx prisma migrate dev --name your-migration-name
   ```

3. **Update types**
   ```typescript
   // In lib/types.ts
   export interface YourModel {
     // Define TypeScript interface
   }
   ```

## Testing

- Write unit tests for new functions
- Test API endpoints with different inputs
- Test UI components with various states
- Ensure Docker setup works correctly

## Code Review Process

1. **Automated Checks**: Ensure all CI checks pass
2. **Code Review**: Maintainers will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

## Community Guidelines

- Be respectful and constructive in discussions
- Help others learn and grow
- Follow the code of conduct
- Ask questions if you're unsure about something

## Getting Help

- **Issues**: Check existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord server
- **Email**: Contact the maintainers directly

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation

Thank you for contributing to Avilink AI Agent! 🚀