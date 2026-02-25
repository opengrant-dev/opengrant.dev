import httpx
import asyncio
import json

async def test_endpoints():
    base_url = "http://localhost:8765"
    
    print("--- Testing /health ---")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{base_url}/health")
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Connection failed: {e}")

    print("\n--- Testing /api/bounties ---")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{base_url}/api/bounties")
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                print(f"Found {data.get('total')} bounties.")
                if data.get('bounties'):
                    print(f"First bounty: {data['bounties'][0]['title']}")
            else:
                print(f"Error: {resp.text}")
    except Exception as e:
        print(f"Connection failed: {e}")

    print("\n--- Testing /api/monetize/generate ---")
    # Note: Requires a valid LLM_API_KEY to succeed fully
    try:
        async with httpx.AsyncClient() as client:
            # We need a real repo_id from the DB or a recent submit
            # For testing, we'll try to find an existing repo or just check the endpoint structure
            resp = await client.post(f"{base_url}/api/monetize/generate", json={"repo_id": "non-existent"})
            print(f"Status (expected 404 for non-existent): {resp.status_code}")
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
