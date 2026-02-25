import asyncio
import os
import sys
from llm_utils import test_connection, load_settings

async def main():
    settings = load_settings()
    providers = settings.get("providers", {})
    
    print("--- LLM CONNECTION AUDIT ---")
    for name, config in providers.items():
        if not config.get("api_key") or config["api_key"] == "your_key_here":
            print(f"[-] {name.upper()}: Skipped (No API Key)")
            continue
            
        print(f"[*] {name.upper()}: Testing...")
        success, message = await test_connection(name, config)
        if success:
            print(f"[+] {message}")
        else:
            print(f"[!] {name.upper()} Failed: {message}")
    print("----------------------------")

if __name__ == "__main__":
    # Ensure we are in the backend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    asyncio.run(main())
