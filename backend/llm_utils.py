import os
import json
import asyncio
import httpx
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

SETTINGS_PATH = os.path.join(os.path.dirname(__file__), "settings.json")

def load_settings():
    """Load settings from JSON, with robust error handling and defaults."""
    default_providers = {
        "groq": {"api_key": "", "base_url": "https://api.groq.com/openai/v1", "model": "llama-3.3-70b-versatile"},
        "openai": {"api_key": "", "base_url": "https://api.openai.com/v1", "model": "gpt-4o"},
        "anthropic": {"api_key": "", "base_url": "https://api.anthropic.com/v1", "model": "claude-3-5-sonnet-latest"},
        "gemini": {"api_key": "", "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/", "model": "gemini-1.5-flash"},
        "ollama": {"api_key": "ollama", "base_url": "http://localhost:11434/v1", "model": "llama3.2"}
    }
    
    try:
        if os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, "r") as f:
                data = json.load(f)
                if not isinstance(data, dict):
                    data = {"provider": "ollama", "providers": default_providers}
                
                # Ensure "providers" key exists and is a dict
                if "providers" not in data or not isinstance(data["providers"], dict):
                    data["providers"] = default_providers
                
                # Merge missing providers from defaults
                for p_id, p_config in default_providers.items():
                    if p_id not in data["providers"]:
                        data["providers"][p_id] = p_config
                return data
    except Exception:
        pass
    
    return {"provider": "ollama", "providers": default_providers}

def save_settings(settings):
    with open(SETTINGS_PATH, "w") as f:
        json.dump(settings, f, indent=4)

class LLMShim:
    """A wrapper that makes different LLM providers look like AsyncOpenAI."""
    def __init__(self, provider, config):
        self.provider = provider
        self.config = config
        self.api_key = config.get("api_key") or os.getenv("LLM_API_KEY", "")
        self.base_url = config.get("base_url")
        self.model = config.get("model")
        
        # Internal client setup
        if provider == "anthropic":
            try:
                import anthropic
                self.internal = anthropic.AsyncAnthropic(api_key=self.api_key)
            except (ImportError, Exception):
                self.internal = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
        else:
            # Groq, OpenAI, Ollama, and Gemini (via OpenAI compatibility)
            self.internal = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)

    @property
    def chat(self): return self

    @property
    def completions(self): return self

    async def create(self, **kwargs):
        """Unified create method for chat completions."""
        model = kwargs.get("model") or self.model
        messages = kwargs.get("messages", [])
        
        # Anthropic native handling
        if self.provider == "anthropic" and hasattr(self.internal, 'messages'):
            system = next((m["content"] for m in messages if m["role"] == "system"), None)
            user_msg = [m for m in messages if m["role"] != "system"]
            
            # Robust Anthropics message creation
            anth_args = {
                "model": model,
                "max_tokens": kwargs.get("max_tokens", 4000),
                "messages": user_msg,
                "temperature": kwargs.get("temperature", 0.7)
            }
            
            # Only include system if it's not None
            if system:
                anth_args["system"] = system
                
            response = await self.internal.messages.create(**anth_args)
            
            # OpenAI response structure shim
            class Message:
                def __init__(self, content): self.content = content
            class Choice:
                def __init__(self, content): self.message = Message(content)
            class Resp:
                def __init__(self, content): self.choices = [Choice(content)]
            return Resp(response.content[0].text)

        # Default OpenAI call
        # Some local providers (Ollama via /v1) might fail if response_format is present but unsupported
        # We'll allow it for now as most modern local providers support it, but we can catch it here if needed.
        try:
            return await self.internal.chat.completions.create(**kwargs)
        except Exception as e:
            if "response_format" in str(e).lower() and "response_format" in kwargs:
                # Fallback: remove response_format and retry
                new_kwargs = kwargs.copy()
                del new_kwargs["response_format"]
                return await self.internal.chat.completions.create(**new_kwargs)
            raise e

def get_llm_client():
    """Returns (shim_client, model) for current settings."""
    settings = load_settings()
    p_name = settings.get("provider", "groq")
    config = settings.get("providers", {}).get(p_name, {})
    return LLMShim(p_name, config), config.get("model")

async def get_ollama_models(base_url):
    """Fetch available models from Ollama API."""
    if not base_url: return []
    try:
        tags_url = base_url.replace("/v1", "/api/tags")
        async with httpx.AsyncClient() as client:
            resp = await client.get(tags_url, timeout=3.0)
            if resp.status_code == 200:
                return [m["name"] for m in resp.json().get("models", [])]
    except: pass
    return []

async def test_connection(provider_name: str, config: dict):
    """Tests the connection and model availability."""
    try:
        model = config.get("model")
        base_url = config.get("base_url") or ""
        
        if provider_name == "ollama":
            available = await get_ollama_models(base_url)
            if not available:
                return False, f"Ollama not found at {base_url}. Ensure it's running."
            if model not in available and f"{model}:latest" not in available:
                return False, f"Model '{model}' not found. Pulled: {', '.join(available)}"

        client = LLMShim(provider_name, config)
        await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=5
        )
        return True, f"✓ {provider_name.upper()} Connected: {model}"
    except Exception as e:
        return False, str(e)
