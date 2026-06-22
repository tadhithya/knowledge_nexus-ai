import { useState, useRef } from 'react';

export default function Admin() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setMessage('');

    let totalChunks = 0;
    let errors = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/upload/`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Upload failed');
        }

        const data = await res.json();
        totalChunks += data.chunks_added;
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    setUploading(false);
    
    if (errors.length === 0) {
      setMessage(`✅ Success! Added ${totalChunks} chunks from ${files.length} files to the knowledge base.`);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setMessage(`⚠️ Finished with errors. Added ${totalChunks} chunks. Errors: ${errors.join(', ')}`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: '2rem', borderRadius: '1rem', color: 'white', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⚙️</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Admin Dashboard</h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Manage the RAG Knowledge Base and system settings.</p>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '2rem', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.2rem', marginBottom: '1rem' }}>Upload Document to Knowledge Base</h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Upload PDF or text files. The AI will chunk, embed, and store them locally using ChromaDB, so it can answer questions based on your private data.
        </p>

        <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '0.75rem', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: files.length > 0 ? 'rgba(255,255,255,0.08)' : 'transparent' }} onClick={() => fileInputRef.current?.click()}>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt"
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          {files.length > 0 ? (
            <p style={{ margin: 0, fontWeight: 600, color: '#38bdf8' }}>{files.length} file{files.length > 1 ? 's' : ''} selected</p>
          ) : (
            <p style={{ margin: 0, color: '#94a3b8' }}>Click to browse or drag and drop<br/><span style={{ fontSize: '0.8rem' }}>Supports .pdf, .txt (Multiple files allowed)</span></p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          style={{
            marginTop: '1.5rem',
            width: '100%',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: files.length === 0 || uploading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.1rem',
            cursor: files.length === 0 || uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {uploading ? 'Processing & Embedding...' : `Upload & Embed ${files.length > 0 ? files.length : ''} Document${files.length > 1 ? 's' : ''}`}
        </button>

        {message && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '0.5rem', background: message.includes('Success') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.includes('Success') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: message.includes('Success') ? '#86efac' : '#fca5a5' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
