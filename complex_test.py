import requests
import time

print("Starting Complex RAG Task...")

# 1. Upload the complex document
print("\n[1] Uploading 'sample_contract.txt' to Knowledge Base...")
files = {'file': open('sample_contract.txt', 'rb')}
r_upload = requests.post('http://localhost:8000/api/v1/upload/', files=files)
if r_upload.status_code == 200:
    print("Upload Success:", r_upload.json())
else:
    print("Upload Failed:", r_upload.text)

# Wait a second for embedding to settle
time.sleep(1)

# 2. Ask the complex question requiring multi-hop reasoning
query = (
    "Based on the PROJECT STARFIRE SPECIFICATION AND LEGAL AGREEMENT, "
    "if Nova Propulsion Labs bypasses the Pre-Ignition Resonance Sweep and the tachyon matrix "
    "destabilizes after Phase 3 has commenced, who is liable for the damages, and what is the "
    "cancellation penalty if ASD decides to terminate the agreement because of this breach?"
)

print("\n[2] Asking complex multi-part question:")
print(f"Query: {query}")
print("\nWaiting for AI Agent response...\n")

r_chat = requests.post('http://localhost:8000/api/v1/chat/', json={'query': query})
if r_chat.status_code == 200:
    print("Response:")
    print("-" * 50)
    print(r_chat.json().get('answer', r_chat.text))
    print("-" * 50)
else:
    print("Chat Request Failed:", r_chat.text)
