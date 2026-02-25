# Contributing to OpenGrant

Thank you for your interest in contributing to OpenGrant! We welcome all kinds of contributions, from bug reports to feature requests to code improvements.

## 🚀 Getting Started

### Prerequisites
- Git
- Python 3.10+
- Node.js 18+
- GitHub account

### Local Setup

1. **Fork the repository**
   ```bash
   # Go to https://github.com/opengrant-dev/opengrant.dev
   # Click "Fork" button
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/opengrant.dev.git
   cd opengrant.dev
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Set up backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/Scripts/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env and add your LLM_API_KEY
   ```

5. **Set up frontend**
   ```bash
   cd frontend
   npm install
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8765

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

7. **Visit** http://localhost:5173

## 📝 Making Changes

### Code Style
- **Python**: Follow PEP 8 using Black formatter
  ```bash
  pip install black
  black backend/
  ```

- **JavaScript**: ESLint configuration provided
  ```bash
  cd frontend
  npm run lint
  ```

### Commit Messages
Write clear commit messages:
```
feat: add new funding source for Rust projects
^    ^
|    └─ summary in lower case
└─ type: feat, fix, docs, style, refactor, test, chore
```

### Testing
Before submitting PR:
```bash
# Backend
cd backend
python -m pytest  # if tests exist

# Frontend
cd frontend
npm run lint
npm run build
```

## 🔐 Security

Found a security vulnerability? **Please don't create a public issue.**
- Email: ChiranjibAI@users.noreply.github.com
- Subject: "Security Report: [brief description]"

## 📋 Pull Request Process

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Go to https://github.com/opengrant-dev/opengrant.dev
   - Click "New Pull Request"
   - Fill in the template
   - Describe your changes clearly

3. **PR Requirements**
   - [ ] Code follows project style
   - [ ] All tests pass
   - [ ] No new warnings in console
   - [ ] Changes documented
   - [ ] Commit messages are clear
   - [ ] No API keys/secrets in code

4. **Review Process**
   - Maintainers will review within 48 hours
   - We may request changes
   - Once approved, PR will be merged

## 🎯 What to Contribute

### Good First Issues
- Bug fixes
- Documentation improvements
- Test coverage
- Small feature additions
- UI/UX improvements

### Before Starting Major Work
- Open a **discussion** or **issue** first
- Describe what you want to build
- Get feedback from maintainers
- Avoids duplicate work

## 📚 Documentation

All documentation should be:
- Clear and concise
- Include examples
- Updated when code changes

**Files to update**:
- `README.md` - Main documentation
- `SECURITY.md` - Security procedures
- Code comments - For complex logic

## 🐛 Reporting Bugs

Include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- System info (OS, Python/Node version)

## 💡 Feature Requests

Include:
- What problem does it solve?
- Use case / example
- Proposed solution
- Alternative approaches considered

## 📞 Questions?

- **Discussions**: GitHub Discussions tab
- **Issues**: For bugs and features
- **Email**: ChiranjibAI@users.noreply.github.com

---

**Thank you for contributing to OpenGrant! Together we're making open source funding accessible to everyone.** 🚀
