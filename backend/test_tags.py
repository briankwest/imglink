#!/usr/bin/env python3
"""Test script to verify tag functionality"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Test data
test_user = {
    "email": "tagtest@example.com",
    "password": "testpassword123",
    "username": "tagtest"
}

def test_tags():
    # 1. Register a test user
    print("1. Registering test user...")
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=test_user)
        if response.status_code == 400:
            print("   User already exists, continuing...")
        else:
            print(f"   Registration response: {response.status_code}")
    except Exception as e:
        print(f"   Registration error: {e}")
    
    # 2. Login to get token
    print("\n2. Logging in...")
    response = requests.post(f"{BASE_URL}/auth/login", 
                           data={"username": test_user["email"], "password": test_user["password"]})
    if response.status_code != 200:
        print(f"   Login failed: {response.status_code} - {response.text}")
        return
    
    tokens = response.json()
    access_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    print(f"   Login successful, got token")
    
    # 3. Test popular tags endpoint
    print("\n3. Testing popular tags endpoint...")
    response = requests.get(f"{BASE_URL}/tags/popular", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Popular tags: {response.json()}")
    
    # 4. Test tag search endpoint
    print("\n4. Testing tag search endpoint...")
    response = requests.get(f"{BASE_URL}/tags/search?q=test", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Search results: {response.json()}")
    
    # 5. Test adding tags to an image (need an image first)
    print("\n5. Getting user's images...")
    response = requests.get(f"{BASE_URL}/images/me", headers=headers)
    if response.status_code == 200 and response.json():
        image_id = response.json()[0]["id"]
        print(f"   Found image ID: {image_id}")
        
        # Add tags to the image
        print(f"\n6. Adding tags to image {image_id}...")
        tag_data = {"tag_names": ["python", "test", "demo"]}
        response = requests.post(f"{BASE_URL}/images/{image_id}/tags", 
                               json=tag_data, headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   Tags added: {response.json()}")
        else:
            print(f"   Error: {response.text}")
    else:
        print("   No images found for user")
    
    print("\n✅ Tag API test complete!")

if __name__ == "__main__":
    test_tags()