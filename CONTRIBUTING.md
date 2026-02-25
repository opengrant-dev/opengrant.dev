# Contributing to OpenGrant

Thank you for your interest! OpenGrant gets better with every new funding source added and every bug fixed.

## Easiest Way — Add a Funding Source

Open `backend/funding_db.py` and add to `FUNDING_SOURCES`:

```python
{
    "name": "Your Grant Name",
    "type": "grant",            # grant | sponsorship | accelerator | bounty | fellowship | hackathon
    "min_amount": 5000,
    "max_amount": 50000,
    "description": "What this fund supports and who it's for.",
    "url": "https://fund-website.com/apply",
    "category": "foundation",   # platform | foundation | corporate | government | crypto | nonprofit
    "tags": ["keyword1", "keyword2"],
    "eligibility": {"location": "global", "type": "open source project"},
    "focus_areas": ["any"],
    "is_recurring": False,
    "application_required": True,
    "deadline": "Rolling",
},
```

## Development Setup

```bash
git clone https://github.com/ChiranjibAI/opengrant
cd opengrant

# Backend
cd backend
cp .env.example .env   # add your API key
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd ../frontend
npm install && npm run dev
```

## Pull Request Steps

```bash
git fork https://github.com/ChiranjibAI/opengrant
git checkout -b feature/your-feature
# make your changes
git commit -m "feat: describe your change"
git push origin feature/your-feature
# Open PR on GitHub
```

## Guidelines

- Keep PRs focused — one feature or fix per PR
- Test locally before submitting
- Only add funding sources with accurate, verifiable info
- Follow existing code style

## Report a Bug

Open an [Issue](https://github.com/ChiranjibAI/opengrant/issues/new/choose) and select the **Bug Report** template. Please include:
- What happened vs what you expected
- Steps to reproduce
- Relevant logs or screenshots

## Request a Feature

Open an [Issue](https://github.com/ChiranjibAI/opengrant/issues/new/choose) and select the **Feature Request** template.

## License

By contributing, you agree your work will be under the MIT License.
