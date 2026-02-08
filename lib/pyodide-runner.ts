export const PYODIDE_RUNNER_HTML = `
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>
    <style>
        body { font-family: monospace; background: #0e0e0e; color: #fff; margin: 0; padding: 1rem; }
        .error { color: #ff5555; }
        .success { color: #50fa7b; }
        .output { white-space: pre-wrap; word-break: break-all; }
    </style>
</head>
<body>
    <div id="loading">Loading Python Environment... (First time may take a few seconds)</div>
    <div id="output" class="output"></div>

    <script>
        const outputDiv = document.getElementById('output');
        const loadingDiv = document.getElementById('loading');
        let pyodide = null;

        // Redirect stdout
        function addToOutput(text) {
            // outputDiv.innerText += text + '\\n'; // Basic
            // We'll post message back to parent for the custom console
            window.parent.postMessage({ type: 'PYTHON_OUTPUT', text: text }, '*');
        }

        async function main() {
            try {
                pyodide = await loadPyodide();
                // Redirect standard output
                pyodide.setStdout({ batched: (msg) => addToOutput(msg) });
                pyodide.setStderr({ batched: (msg) => addToOutput(msg) });
                pyodide.setStdin({
                    stdin: () => {
                        const result = window.prompt("Python Input:");
                        return result !== null ? result : "";
                    }
                });
                
                loadingDiv.style.display = 'none';
                window.parent.postMessage({ type: 'PYTHON_READY' }, '*');
            } catch (err) {
                loadingDiv.innerText = 'Failed to load Python environment.';
                loadingDiv.className = 'error';
                window.parent.postMessage({ type: 'PYTHON_ERROR', text: String(err) }, '*');
            }
        }

        main();

        // Listen for code from parent
        window.addEventListener('message', async (event) => {
            if (event.data.type === 'RUN_PYTHON') {
                if (!pyodide) {
                    addToOutput("Python is not ready yet. Please wait...");
                    return;
                }
                const code = event.data.code;
                try {
                    // Clear previous output if needed? Or handled by parent.
                    await pyodide.runPythonAsync(code);
                    window.parent.postMessage({ type: 'PYTHON_DONE' }, '*');
                } catch (err) {
                    const msg = String(err);
                    const cleanMsg = msg.includes('PythonError:') ? msg.split('PythonError:')[1] : msg;
                    window.parent.postMessage({ type: 'PYTHON_ERROR', text: cleanMsg.trim() }, '*');
                }
            }
        });
    </script>
</body>
</html>
`;
