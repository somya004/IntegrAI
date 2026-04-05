#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Minimal ConfigAI Client...');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 No node_modules found, using minimal setup...');
  
  // Create minimal HTML file
  const minimalHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ConfigAI - Minimal Setup</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .upload-area { 
            border: 2px dashed #ccc; 
            padding: 40px; 
            text-align: center; 
            margin: 20px 0;
            border-radius: 8px;
        }
        .upload-area:hover { border-color: #007bff; }
        .btn { 
            background: #007bff; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer;
            margin: 5px;
        }
        .btn:hover { background: #0056b3; }
        .result { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
        }
        .loading { color: #007bff; }
        .error { color: #dc3545; }
        .success { color: #28a745; }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState } = React;

        function App() {
            const [file, setFile] = useState(null);
            const [loading, setLoading] = useState(false);
            const [result, setResult] = useState(null);
            const [error, setError] = useState(null);

            const handleFileChange = (e) => {
                setFile(e.target.files[0]);
                setError(null);
                setResult(null);
            };

            const handleUpload = async () => {
                if (!file) {
                    setError('Please select a file first');
                    return;
                }

                setLoading(true);
                setError(null);

                try {
                    // Step 1: Upload file
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('filename', file.name);

                    const uploadResponse = await fetch('http://localhost:5001/api/parser/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (!uploadResponse.ok) {
                        throw new Error('File upload failed');
                    }

                    const uploadResult = await uploadResponse.json();
                    console.log('Upload result:', uploadResult);

                    // Step 2: Parse with AI
                    const aiResponse = await fetch('http://localhost:5001/api/ai/parse', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: uploadResult.extractedText })
                    });

                    if (!aiResponse.ok) {
                        throw new Error('AI parsing failed');
                    }

                    const aiResult = await aiResponse.json();
                    console.log('AI result:', aiResult);

                    setResult(aiResult);

                } catch (err) {
                    setError(err.message);
                    console.error('Error:', err);
                } finally {
                    setLoading(false);
                }
            };

            const handleProceed = async () => {
                if (!result) return;

                try {
                    const saveResponse = await fetch('http://localhost:5001/api/storage/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            configId: \`config_\${Date.now()}\`,
                            data: result.data,
                            timestamp: new Date().toISOString(),
                            parserId: 'minimal'
                        })
                    });

                    if (saveResponse.ok) {
                        alert('Configuration saved! You can now proceed to Integration Registry.');
                        // In a real app, this would navigate to /registry
                    }
                } catch (err) {
                    setError('Failed to save configuration');
                }
            };

            return (
                <div className="container">
                    <h1>🚀 ConfigAI - Minimal Setup</h1>
                    <p>Upload a document to extract integration services using AI.</p>

                    <div className="upload-area">
                        <input 
                            type="file" 
                            onChange={handleFileChange}
                            accept=".txt,.pdf,.docx"
                        />
                        {file && <p>Selected: {file.name}</p>}
                    </div>

                    <button 
                        className="btn" 
                        onClick={handleUpload}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Upload & Parse'}
                    </button>

                    {error && <div className="error">❌ {error}</div>}
                    {loading && <div className="loading">⏳ Processing document...</div>}

                    {result && (
                        <div className="result">
                            <h2>✅ Parsing Complete!</h2>
                            <p><strong>Services Found:</strong> {result.data.services.length}</p>
                            <p><strong>AI Provider:</strong> {result.metadata.provider}</p>
                            
                            <h3>Detected Services:</h3>
                            {result.data.services.map((service, index) => (
                                <div key={index} style={{margin: '10px 0', padding: '10px', background: 'white', borderRadius: '4px'}}>
                                    <strong>{service.name}</strong> ({service.type})
                                    <br/>Confidence: {service.confidence}%
                                    <br/>Authentication: {service.authentication}
                                    <br/>Endpoints: {service.endpoints.length}
                                </div>
                            ))}

                            <button className="btn" onClick={handleProceed}>
                                🚀 Proceed to Integration Registry
                            </button>
                        </div>
                    )}

                    <div style={{marginTop: '40px', padding: '20px', background: '#f0f0f0', borderRadius: '8px'}}>
                        <h3>🔧 Minimal Setup Info</h3>
                        <p>This is a minimal version running without npm install dependencies.</p>
                        <p>Server: <code>http://localhost:5001</code></p>
                        <p>Features: File upload → AI parsing → Save config</p>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;

  fs.writeFileSync('public/minimal.html', minimalHTML);
  console.log('✅ Created minimal HTML file');
  console.log('🌐 Open: http://localhost:3000/public/minimal.html');
  console.log('📁 Or open file directly: client/public/minimal.html');
  
} else {
  console.log('📦 node_modules found, starting React app...');
  const child = spawn('npm', ['start'], { stdio: 'inherit' });
  child.on('error', (err) => {
    console.error('Failed to start React app:', err);
    console.log('🌐 Try opening: http://localhost:3000/public/minimal.html');
  });
}
