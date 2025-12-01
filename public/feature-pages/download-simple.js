// Simple download headers test - focused on MIME type issue reproduction
function initSimpleDownloadTest() {
    const mimeTypeSelect = document.getElementById('mimeType');
    const downloadOptionsSelect = document.getElementById('downloadOptions');
    const testBtn = document.getElementById('testBtn');
    const headersDiv = document.getElementById('headers');
    const resultsDiv = document.getElementById('results');

    let testCounter = 0;

    function logResult(message) {
        const timestamp = new Date().toLocaleTimeString();
        const currentText = resultsDiv.textContent;
        const newText = currentText.includes('Click "Download') 
            ? `[${timestamp}] ${message}\n`
            : `${currentText}[${timestamp}] ${message}\n`;
        resultsDiv.textContent = newText;
        resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

    function updateHeadersDisplay() {
        const mimeType = mimeTypeSelect.value;
        const downloadOption = downloadOptionsSelect.value;

        const actualMimeType = mimeType === 'octet-stream' 
            ? 'application/octet-stream'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        let headers = `Content-Type: ${actualMimeType}
Content-Disposition: attachment; filename="test-document.docx"`;

        if (downloadOption !== 'none') {
            headers += `\nX-Download-Options: ${downloadOption}`;
        }

        headers += '\nCache-Control: no-cache, no-store, must-revalidate';

        headersDiv.textContent = headers;
    }

    async function performDownloadTest() {
        testCounter++;
        const mimeType = mimeTypeSelect.value;
        const downloadOption = downloadOptionsSelect.value;

        logResult(`=== TEST #${testCounter} STARTED ===`);
        logResult(`MIME Type: ${mimeType === 'octet-stream' ? 'application/octet-stream (WRONG)' : 'Correct Word MIME type'}`);
        logResult(`X-Download-Options: ${downloadOption === 'none' ? 'Not set' : downloadOption}`);

        // Check if Express server is available
        try {
            logResult('Checking if Express server is running...');
            const healthResponse = await fetch('/api/health');
            
            if (healthResponse.ok) {
                logResult('✅ Express server detected - using real server endpoint');
                await performServerDownload(mimeType, downloadOption);
            } else {
                throw new Error('Server not available');
            }
        } catch (error) {
            logResult('⚠️ Express server not available');
            logResult('💡 Run "npm run server" to test with real HTTP headers');
            performClientDownload(mimeType, downloadOption);
        }
    }

    async function performServerDownload(mimeType, downloadOption) {
        try {
            const params = new URLSearchParams({
                file: 'docx',
                mimeType: mimeType,
                headers: downloadOption === 'none' ? 'none' : downloadOption,
                test: testCounter
            });

            const serverUrl = `/api/download-test?${params.toString()}`;
            logResult(`Server endpoint: ${serverUrl}`);

            // Make HEAD request first to inspect headers
            logResult('🔍 Inspecting response headers...');
            const headResponse = await fetch(serverUrl, { method: 'HEAD' });
            
            const responseHeaders = {};
            headResponse.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            logResult(`Response Content-Type: ${responseHeaders['content-type'] || 'Not set'}`);
            logResult(`Response X-Download-Options: ${responseHeaders['x-download-options'] || 'Not set'}`);
            logResult(`Response Content-Disposition: ${responseHeaders['content-disposition'] || 'Not set'}`);

            // Trigger actual download
            logResult('💾 Starting download...');
            const link = document.createElement('a');
            link.href = serverUrl;
            link.download = `test-${testCounter}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            logResult('✅ Download triggered successfully');

            // Special warning for the problematic case
            if (mimeType === 'octet-stream') {
                logResult('🚨 CUSTOMER ISSUE REPRODUCTION:');
                logResult('   - Word document served as application/octet-stream');
                logResult('   - Browser may show generic file icon in download bubble');
                logResult('   - "Open" button may be disabled or open wrong app');
                logResult('   - Word may show permission/corruption errors');
            }

        } catch (error) {
            logResult(`❌ Server download failed: ${error.message}`);
        }
    }

    function performClientDownload(mimeType, downloadOption) {
        logResult('📝 Creating client-side Word document...');
        
        // Simple Word document content (not real DOCX, but demonstrates the concept)
        const wordContent = `MIME Type Test Document

This is a test document to reproduce the MIME type issue.

Test Details:
- Test #: ${testCounter}
- MIME Type Setting: ${mimeType}
- X-Download-Options: ${downloadOption}
- Created: ${new Date().toISOString()}

Issue Description:
When Word documents are served with application/octet-stream instead of the correct MIME type, browsers may not handle them correctly.

Note: This is a text version. For real testing, use the Express server with actual DOCX files.`;

        const actualMimeType = mimeType === 'octet-stream' 
            ? 'application/octet-stream'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        const blob = new Blob([wordContent], { type: actualMimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `test-${testCounter}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        logResult(`✅ Client-side download completed`);
        logResult(`📄 File: test-${testCounter}.docx`);
        logResult(`🏷️ MIME Type: ${actualMimeType}`);
        logResult('⚠️ Note: Client downloads cannot set X-Download-Options header');
        
        if (mimeType === 'octet-stream') {
            logResult('🚨 This simulates the customer issue with wrong MIME type');
        }
    }

    // Event listeners
    testBtn.addEventListener('click', performDownloadTest);
    mimeTypeSelect.addEventListener('change', updateHeadersDisplay);
    downloadOptionsSelect.addEventListener('change', updateHeadersDisplay);

    // Initialize display
    updateHeadersDisplay();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimpleDownloadTest);
} else {
    initSimpleDownloadTest();
}

// Export for navigation - follows the pattern onNavigate_[route]
window.onNavigate_download_simple = initSimpleDownloadTest;
