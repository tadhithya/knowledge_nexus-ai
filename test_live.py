
import urllib.request
import requests
import time

print('Checking if React Frontend is alive...')
try:
    urllib.request.urlopen('http://localhost:5173')
    print('? Frontend is running at http://localhost:5173')
except Exception as e:
    print('? Frontend check failed:', e)

print('\nChecking if Python Backend is alive...')
try:
    health = requests.get('http://localhost:8000/health').json()
    print('? Backend is running! Health Status:', health)
except Exception as e:
    print('? Backend check failed:', e)

print('\nTesting Chat API Endpoint...')
try:
    r = requests.post('http://localhost:8000/api/v1/chat/', json={'query': 'What is 10 + 10?'})
    print('? Chat API responded:', r.json()['answer'])
except Exception as e:
    print('? Chat API failed:', e)

