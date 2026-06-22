
import requests

print('1. Uploading Document for RAG...')
with open('test_doc.txt', 'w') as f:
    f.write('Knowledge Nexus AI internal codename is Project Crimson.')
files = {'file': open('test_doc.txt', 'rb')}
r = requests.post('http://localhost:8000/api/v1/upload/', files=files)
print(r.json())

print('\n2. Testing RAG Chat...')
r = requests.post('http://localhost:8000/api/v1/chat/', json={'query': 'What is the internal codename of Knowledge Nexus AI?'})
print(r.json()['answer'])

print('\n3. Testing Math Engine...')
r = requests.post('http://localhost:8000/api/v1/chat/', json={'query': 'Calculate 245 * 18 for me.'})
print(r.json()['answer'])

print('\n4. Testing Memory...')
requests.post('http://localhost:8000/api/v1/chat/', json={'query': 'My name is Tharun and my favorite color is crimson.'})
r = requests.post('http://localhost:8000/api/v1/chat/', json={'query': 'What is my name and favorite color?'})
print(r.json()['answer'])

