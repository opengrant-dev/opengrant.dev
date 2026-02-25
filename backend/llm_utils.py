import os
import json
import asyncio
import httpx
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

SETTINGS_PATH = os.path.join(os.path.dirname(__file__), "settings.json")

def load_settings():
    """Load settings from JSON, with robust error handling and defaults for ALL providers."""
    default_providers = {
        "groq": {
            "api_key": os.getenv("GROQ_API_KEY", ""),
            "base_url": "https://api.groq.com/openai/v1",
            "model": "llama-3.3-70b-versatile"
        },
        "openai": {
            "api_key": os.getenv("OPENAI_API_KEY", ""),
            "base_url": "https://api.openai.com/v1",
            "model": "gpt-4o"
        },
        "anthropic": {
            "api_key": os.getenv("ANTHROPIC_API_KEY", ""),
            "base_url": "https://api.anthropic.com/v1",
            "model": "claude-3-5-sonnet-latest"
        },
        "gemini": {
            "api_key": os.getenv("GEMINI_API_KEY", ""),
            "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
            "model": "gemini-1.5-flash"
        },
        "ollama": {
            "api_key": "ollama",
            "base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
            "model": os.getenv("OLLAMA_MODEL", "llama2")
        },
        "nvidia": {
            "api_key": os.getenv("NVIDIA_API_KEY", ""),
            "base_url": "https://integrate.api.nvidia.com/v1",
            "model": "meta/llama-3.1-70b-instruct"
        },
        "openrouter": {
            "api_key": os.getenv("OPENROUTER_API_KEY", ""),
            "base_url": "https://openrouter.ai/api/v1",
            "model": "meta-llama/llama-3.1-70b-instruct:free"
        }
    }

    try:
        if os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, "r") as f:
                data = json.load(f)
                if not isinstance(data, dict):
                    data = {"provider": "groq", "providers": default_providers}

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

    return {"provider": "groq", "providers": default_providers}

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
        self.internal_client = None

        # Provider-specific client setup
        if provider == "anthropic":
            try:
                import anthropic
                self.internal_client = anthropic.AsyncAnthropic(api_key=self.api_key)
                self.internal = self.internal_client
            except (ImportError, Exception) as e:
                # Fallback to OpenAI compatible mode
                self.internal = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url, timeout=60.0)
        elif provider == "gemini":
            # Gemini works via OpenAI compatibility layer
            self.internal = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url, timeout=60.0)
        elif provider == "nvidia":
            # NVIDIA NIM API is OpenAI compatible
            self.internal = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url, timeout=60.0)
        elif provider == "openrouter":
            # OpenRouter is OpenAI compatible
            self.internal = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url, timeout=60.0)
        else:
            # Groq, OpenAI, Ollama (all OpenAI compatible)
            self.internal = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url, timeout=60.0)

    @property
    def chat(self): return self

    @property
    def completions(self): return self

    async def create(self, **kwargs):
        """Unified create method for chat completions across all providers."""
        model = kwargs.get("model") or self.model
        messages = kwargs.get("messages", [])

        # Anthropic native handling (not OpenAI compatible)
        if self.provider == "anthropic" and self.internal_client is not None:
            try:
                system = next((m["content"] for m in messages if m["role"] == "system"), None)
                user_msg = [m for m in messages if m["role"] != "system"]

                anth_args = {
                    "model": model,
                    "max_tokens": kwargs.get("max_tokens", 4000),
                    "messages": user_msg,
                    "temperature": kwargs.get("temperature", 0.7)
                }

                if system:
                    anth_args["system"] = system

                response = await self.internal_client.messages.create(**anth_args)

                # Shim to OpenAI response format
                class Message:
                    def __init__(self, content):
                        self.content = content

                class Choice:
                    def __init__(self, content):
                        self.message = Message(content)

                class Resp:
                    def __init__(self, content):
                        self.choices = [Choice(content)]

                return Resp(response.content[0].text)
            except Exception as e:
                # Fallback to OpenAI compatibility mode
                return await self._openai_call(kwargs)

        # OpenAI-compatible providers (Groq, OpenAI, Gemini, NVIDIA, OpenRouter, Ollama)
        return await self._openai_call(kwargs)

    async def _openai_call(self, kwargs):
        """Handle OpenAI-compatible API calls with fallback error handling."""
        try:
            return await self.internal.chat.completions.create(**kwargs)
        except Exception as e:
            error_str = str(e).lower()

            # Handle response_format not supported (common in Ollama)
            if "response_format" in error_str and "response_format" in kwargs:
                new_kwargs = kwargs.copy()
                del new_kwargs["response_format"]
                try:
                    return await self.internal.chat.completions.create(**new_kwargs)
                except Exception:
                    pass

            # Handle temperature/max_tokens issues
            if "temperature" in error_str and "temperature" in kwargs:
                new_kwargs = kwargs.copy()
                new_kwargs.pop("temperature", None)
                try:
                    return await self.internal.chat.completions.create(**new_kwargs)
                except Exception:
                    pass

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
    """Tests the connection and model availability for all providers."""
    try:
        model = config.get("model", "")
        api_key = config.get("api_key", "")
        base_url = config.get("base_url", "")

        # Validate API key exists for cloud providers
        if provider_name != "ollama" and not api_key:
            return False, f"No API key set for {provider_name}. Set {provider_name.upper()}_API_KEY env var."

        # Ollama specific check
        if provider_name == "ollama":
            available = await get_ollama_models(base_url)
            if not available:
                return False, f"Ollama not found at {base_url}. Ensure Ollama is running locally."
            if model not in available and f"{model}:latest" not in available:
                return False, f"Model '{model}' not available. Available: {', '.join(available[:3])}"

        # Test connection with minimal request
        client = LLMShim(provider_name, config)
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "hi"}],
                max_tokens=5,
                temperature=0.7
            )
            return True, f"✓ {provider_name.upper()} Connected: {model}"
        except Exception as test_e:
            error_msg = str(test_e)
            if "401" in error_msg or "unauthorized" in error_msg.lower():
                return False, f"Invalid API key for {provider_name}"
            elif "404" in error_msg:
                return False, f"Model '{model}' not found on {provider_name}"
            elif "rate" in error_msg.lower():
                return False, f"Rate limited on {provider_name}. Try again later."
            else:
                return False, error_msg[:100]

    except Exception as e:
        return False, str(e)[:150]
