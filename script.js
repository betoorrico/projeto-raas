document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('password-input');
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const errorMsg = document.getElementById('error-msg');

    const PASSWORD = "bolinho21";

    function handleLogin() {
        const value = passwordInput.value;

        if (value === PASSWORD) {
            // Success
            loginContainer.style.opacity = '0';
            loginContainer.style.transform = 'scale(0.9)';

            setTimeout(() => {
                loginContainer.classList.add('hidden');
                loginContainer.style.display = 'none'; // Ensure it's gone

                dashboardContainer.classList.remove('hidden');
            }, 400);

        } else {
            // Error
            errorMsg.classList.remove('hidden');
            loginContainer.classList.remove('shake'); // Reset animation
            void loginContainer.offsetWidth; // Trigger reflow
            loginContainer.classList.add('shake');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    loginBtn.addEventListener('click', handleLogin);

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    // Reset error on input
    passwordInput.addEventListener('input', () => {
        errorMsg.classList.add('hidden');
    });

    // Tab Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.remove('active-content');
                content.classList.add('hidden-content'); // Helper for display:none
                content.style.display = 'none'; // Force hide
            });

            // Show target content
            const targetId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.remove('hidden-content');
                targetContent.classList.add('active-content');
                targetContent.style.display = 'flex'; // Force flex
            }
        });
    });

    // --- Supabase Integration ---
    const SUPABASE_URL = 'https://wobnvubplojytzoxsilz.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYm52dWJwbG9qeXR6b3hzaWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTU4MTYsImV4cCI6MjA3NTI5MTgxNn0.E7JaUENFdZC5Wk2BQ4QoJRu5PeL6KmHroY42A42RY0M';

    // Check if Supabase client is available
    if (typeof supabase !== 'undefined') {
        const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        async function fetchTrainingData() {
            const container = document.getElementById('training-data-container');
            if (!container) return;

            try {
                const { data, error } = await _supabase
                    .from('respostas_rag')
                    .select('pergunta, "resposta_rag_p&r", resposta_rag_docs'); // Quoted for special char

                if (error) throw error;

                if (!data || data.length === 0) {
                    container.innerHTML = '<div class="loading-spinner">No data found in database.</div>';
                    return;
                }

                // Clear loading spinner
                container.innerHTML = '';

                data.forEach((row, index) => {
                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'rag-row';

                    // 1. Column: Pergunta
                    const col1 = createColumn('Pergunta', row.pergunta);
                    rowDiv.appendChild(col1);

                    // 2. Column: Resposta Agent P&R
                    // Accessing property with special char
                    // PASS THE QUESTION TEXT for the feedback button
                    const col2 = createColumn('Resposta Agente P&R', row['resposta_rag_p&r'], true, row.pergunta);
                    rowDiv.appendChild(col2);

                    // 3. Column: Resposta Agent Docs
                    // note: user prompt said 'resposta_rag_docs', using that key
                    const col3 = createColumn('Resposta Agente Docs', row.resposta_rag_docs, true, row.pergunta);
                    rowDiv.appendChild(col3);

                    // 4. Column: Resposta Humano - REMOVED per user request
                    // The interaction is now handled via the "No" button modal

                    container.appendChild(rowDiv);
                });

            } catch (err) {
                console.error('Error fetching data:', err);
                container.innerHTML = `<div class="loading-spinner error">Error loading data: ${err.message}</div>`;
            }
        }

        function createColumn(title, content, withFeedback = false, questionText = "") {
            const col = document.createElement('div');
            col.className = 'rag-col';

            // Base Content
            col.innerHTML = `<h3>${title}</h3><p>${content || '<em>(Empty)</em>'}</p>`;

            // Feedback Section
            if (withFeedback) {
                const feedbackBox = document.createElement('div');
                feedbackBox.className = 'feedback-box';

                const label = document.createElement('span');
                label.className = 'feedback-label';
                label.innerText = 'Essa resposta foi boa?';
                feedbackBox.appendChild(label);

                const btnsDiv = document.createElement('div');
                btnsDiv.className = 'feedback-btns';

                // YES Button
                const btnYes = document.createElement('button');
                btnYes.className = 'btn-feedback btn-yes';
                btnYes.innerText = 'Sim';
                btnYes.onclick = function () {
                    this.classList.toggle('active');
                    // Optional: remove 'active' from 'No' if 'Yes' is clicked
                    if (this.classList.contains('active')) {
                        const siblingNo = this.nextElementSibling;
                        if (siblingNo) siblingNo.classList.remove('active');
                    }
                };
                btnsDiv.appendChild(btnYes);

                // NO Button
                const btnNo = document.createElement('button');
                btnNo.className = 'btn-feedback btn-no';
                btnNo.innerText = 'Não';
                btnNo.onclick = function () {
                    // Logic: Toggle active state
                    this.classList.toggle('active');

                    if (this.classList.contains('active')) {
                        // Open Modal if clicked "No"
                        // Also unselect 'Yes'
                        const siblingYes = this.previousElementSibling;
                        if (siblingYes) siblingYes.classList.remove('active');

                        openFeedbackModal(questionText);
                    }
                };
                btnsDiv.appendChild(btnNo);

                feedbackBox.appendChild(btnsDiv);
                col.appendChild(feedbackBox);
            }

            return col;
        }

        // Initial fetch
        fetchTrainingData();

        // Auto-refresh every 5 seconds
        setInterval(fetchTrainingData, 5000);

    } else {
        console.error('Supabase client not loaded.');
    }

    // --- Modal Logic ---
    window.openFeedbackModal = function (questionText) {
        const modal = document.getElementById('feedback-modal');
        const questionEl = document.getElementById('modal-question-text');

        questionEl.innerText = questionText || "Pergunta desconhecida";
        modal.classList.add('active-modal');
    };

    window.closeFeedbackModal = function () {
        const modal = document.getElementById('feedback-modal');
        const input = document.getElementById('modal-human-response');

        // Reset Modal State
        modal.classList.remove('active-modal');
        input.value = ''; // Reset input

        // Reset Gemini Chat
        const chatPanel = document.getElementById('gemini-chat-panel');
        const modalContent = modal.querySelector('.modal-content');
        if (chatPanel) chatPanel.classList.remove('active-panel');
        if (modalContent) modalContent.classList.remove('expanded');
    };

    window.toggleGeminiChat = function () {
        const chatPanel = document.getElementById('gemini-chat-panel');
        const modalContent = document.querySelector('.modal-content');

        if (chatPanel && modalContent) {
            chatPanel.classList.toggle('active-panel');
            modalContent.classList.toggle('expanded');
        }
    };

    window.submitFeedback = function () {
        const input = document.getElementById('modal-human-response');
        const response = input.value;
        const question = document.getElementById('modal-question-text').innerText;

        if (!response.trim()) {
            alert("Por favor, escreva uma resposta.");
            return;
        }

        console.log("Submitting feedback:", {
            question: question,
            human_response: response
        });

        // Here you would send data to Supabase

        alert("Resposta enviada e treinamento iniciado! (Simulado)");
        closeFeedbackModal();
    };

    // Close on outside click
    window.onclick = function (event) {
        const modal = document.getElementById('feedback-modal');
        if (event.target === modal) {
            closeFeedbackModal();
        }
    };

    // --- Upload Logic (Process Creator) ---
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const fileListEl = document.getElementById('upload-file-list');
    let uploadedFiles = [];

    if (uploadZone && fileInput) {
        // Drag & Drop Events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            uploadZone.classList.add('drag-over');
        }

        function unhighlight(e) {
            uploadZone.classList.remove('drag-over');
        }

        uploadZone.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }

        // Click to upload
        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('click', (e) => e.stopPropagation()); // Prevent circular click

        fileInput.addEventListener('change', function () {
            if (this.files.length > 0) {
                handleFiles(this.files);
                this.value = ''; // Reset input to allow selecting the same file again or new sequence
            }
        });

        function handleFiles(files) {
            const newFiles = Array.from(files);
            const uniqueNewFiles = [];

            newFiles.forEach(file => {
                // Check if file already exists
                const exists = uploadedFiles.some(existing =>
                    existing.name === file.name &&
                    existing.size === file.size
                );

                if (exists) {
                    console.warn(`Arquivo ignorado (duplicado): ${file.name}`);
                    // Optional: alert user or just skip silently
                } else {
                    uniqueNewFiles.push(file);
                }
            });

            if (uniqueNewFiles.length < newFiles.length) {
                // Determine if we should alert about duplicates (optional, doing simple alert for now)
                // alert("Alguns arquivos duplicados foram ignorados.");
            }

            uploadedFiles = [...uploadedFiles, ...uniqueNewFiles];
            renderFileList();
        }

        function renderFileList() {
            const draftsSection = document.getElementById('drafts-section');
            if (draftsSection) {
                if (uploadedFiles.length > 0) {
                    draftsSection.classList.remove('hidden');
                } else {
                    draftsSection.classList.add('hidden');
                }
            }

            fileListEl.innerHTML = '';
            uploadedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'uploaded-file-item';
                if (file.processedResult) {
                    item.classList.add('processed');
                    item.onclick = () => openResponseModal(file.processedResult, index);
                }

                // Determine icon based on type (simple logic)
                let iconPath = "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"; // Default Doc
                if (file.type.startsWith('image/')) {
                    iconPath = "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z";
                } else if (file.type.startsWith('video/')) {
                    iconPath = "M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z";
                }

                item.innerHTML = `
                    <div class="file-info">
                        <svg class="file-status-icon" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <svg class="file-type-icon" viewBox="0 0 24 24">
                            <path d="${iconPath}"/>
                        </svg>
                        <span class="file-name">${file.name}</span>
                    </div>
                    <button class="remove-file-btn" onclick="removeFile(${index})">
                        <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                `;
                // item.onclick logic handled above for processed items
                fileListEl.appendChild(item);
            });
        }

        // Global function to remove file (needs to be on window)
        window.removeFile = function (index) {
            // Stop propagation if clicked inside
            if (event) event.stopPropagation();

            uploadedFiles.splice(index, 1);
            renderFileList();
        };

        // --- Response Modal Logic ---
        let currentModalFileIndex = -1;

        window.openResponseModal = function (text, index = -1) {
            const modal = document.getElementById('response-modal');
            const textArea = document.getElementById('response-text-area');
            const filenameInput = document.getElementById('modal-filename');

            currentModalFileIndex = index;

            if (modal && textArea) {
                // Ensure text is string
                if (typeof text !== 'string') {
                    text = JSON.stringify(text, null, 2);
                }
                textArea.value = text;

                // Populate Filename
                if (filenameInput) {
                    if (index > -1 && uploadedFiles[index]) {
                        filenameInput.value = uploadedFiles[index].name;
                    } else {
                        filenameInput.value = "Desconhecido";
                    }
                }

                modal.classList.add('active-modal');
            }
        };

        // Toast Notification Helper
        function showToast() {
            const toast = document.getElementById('toast-notification');
            if (toast) {
                toast.classList.remove('hidden');
                // Trigger reflow
                void toast.offsetWidth;
                toast.classList.add('show');

                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        toast.classList.add('hidden');
                    }, 500); // Wait for transition
                }, 3000); // 3 seconds visible
            }
        }


        window.finishProcess = async function () {
            const textArea = document.getElementById('response-text-area');
            const filenameInput = document.getElementById('modal-filename');
            let contentText = "";
            let fileName = "arquivo_desconhecido";

            if (textArea) contentText = textArea.value;

            if (filenameInput) fileName = filenameInput.value;

            // Using URLSearchParams (application/x-www-form-urlencoded) for better CORS support
            const formData = new URLSearchParams();
            formData.append("file_name", fileName);
            formData.append("processo", contentText);

            // DEBUG: Verify data capture (Commented out)
            // alert(`PREPARANDO ENVIO...`);

            console.log("Finishing process, sending URLSearchParams");

            try {
                // Change button text to indicate processing
                const finishBtns = document.querySelectorAll('.finish-btn');
                file_name: fileName,
                    processo: contentText
            })
                });


// DEBUG: Verify response
// alert(`RESPOSTA SERVIDOR...`); // Removed

if (response.ok) {
    showToast();
    if (currentModalFileIndex > -1) {
        removeFile(currentModalFileIndex);
    }
    closeResponseModal();
} else {
    const errText = await response.text();
    alert(`Erro ao salvar processo: ${errText}`);
}
            } catch (error) {
    console.error("Finish process error:", error);
    alert(`Erro de conexão: ${error.message}`);
} finally {
    const finishBtns = document.querySelectorAll('.finish-btn');
    finishBtns.forEach(btn => {
        btn.disabled = false;
        btn.innerText = "Concluir Processo";
    });
}
        };

window.closeResponseModal = function () {
    const modal = document.getElementById('response-modal');
    if (modal) {
        modal.classList.remove('active-modal');
    }
};

window.copyResponseText = function () {
    const textArea = document.getElementById('response-text-area');
    if (textArea) {
        textArea.select();
        navigator.clipboard.writeText(textArea.value)
            .then(() => alert("Texto copiado!"))
            .catch(err => console.error('Erro ao copiar:', err));
    }
};


const btnSend = document.getElementById('btn-upload-send');

if (btnSend) {
    btnSend.addEventListener('click', submitFiles);
}

async function submitFiles() {
    if (uploadedFiles.length === 0) {
        alert("Por favor, selecione pelo menos um arquivo.");
        return;
    }

    const WEBHOOK_URL = "https://webhook.manarafluxo.online/webhook/process";
    const btnSend = document.getElementById('btn-upload-send');
    const originalText = btnSend.innerText;

    btnSend.disabled = true;
    btnSend.innerText = "Preparando...";

    try {
        // 1. Initialize Supabase (re-using credentials from top of file scope if available, or redefining)
        const SUPABASE_URL = 'https://wobnvubplojytzoxsilz.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYm52dWJwbG9qeXR6b3hzaWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTU4MTYsImV4cCI6MjA3NTI5MTgxNn0.E7JaUENFdZC5Wk2BQ4QoJRu5PeL6KmHroY42A42RY0M';

        // Ensure supabase client exists
        const _client = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

        if (!_client) throw new Error("Supabase client library not found.");

        const uploadPromises = uploadedFiles.map(async (file) => {
            // Unique file name to avoid collisions
            const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;

            // Update Button Status
            btnSend.innerText = `Enviando para Storage: ${file.name}...`;

            // A. Upload to Supabase Storage
            const { data, error } = await _client
                .storage
                .from('uploads')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw new Error(`Erro no upload para Supabase: ${error.message}`);

            // B. Get Public URL
            const { data: publicData } = _client
                .storage
                .from('uploads')
                .getPublicUrl(fileName);

            return publicData.publicUrl;
        });

        // Wait for all uploads
        const publicUrls = await Promise.all(uploadPromises);
        console.log("Generated Public URLs:", publicUrls);

        // 2. Send URLs to Webhook (Using JSON for clear key-value transmission)
        // UI: Switch to "Analisando" Loading State
        const uploadZone = document.getElementById('upload-zone');
        const fileList = document.getElementById('drafts-section'); // Updated ID
        const loader = document.getElementById('gemini-loader');

        if (uploadZone) uploadZone.classList.add('hidden');
        // Keep list visible per user request
        // if (fileList) fileList.classList.add('hidden'); 

        if (btnSend) {
            // Keep button visible but disabled
            // btnSend.classList.add('hidden'); 
            btnSend.disabled = true;
            btnSend.innerText = "Analisando...";
        }

        if (loader) loader.classList.remove('hidden');

        const payload = {
            file_url: publicUrls[0], // Explicit key user requested or standard
            timestamp: new Date().toISOString()
        };

        console.log("Sending Payload:", payload);

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 3. Handle Response - Modal ONLY opens here, after response is received
        if (response.ok) {
            let jsonResponse;
            try {
                const text = await response.text();
                // Try to parse JSON, if it fails or is empty, fallback
                try {
                    jsonResponse = text ? JSON.parse(text) : {};
                    // Handle Array response (e.g. [{"output": "..."}])
                    if (Array.isArray(jsonResponse) && jsonResponse.length > 0) {
                        jsonResponse = jsonResponse[0];
                    }
                } catch (e) {
                    // Valid response but NOT JSON (e.g. plain text)
                    jsonResponse = { output: text || "Processamento concluído (Sem detalhes)", message: "Success" };
                }
            } catch (e) {
                // Fallback generic
                jsonResponse = {};
            }

            console.log("Webhook Final Response:", jsonResponse);

            if (jsonResponse && jsonResponse.output) {
                // Store result in file object
                if (uploadedFiles.length > 0) {
                    uploadedFiles[0].processedResult = jsonResponse.output;
                }
                openResponseModal(jsonResponse.output, 0);
            } else {
                // Support for likely N8N "response" key or root object
                const resultText = jsonResponse.message || jsonResponse.output || JSON.stringify(jsonResponse);
                if (uploadedFiles.length > 0) {
                    uploadedFiles[0].processedResult = resultText;
                }
                openResponseModal(resultText, 0);
            }

            // DO NOT CLEAR uploadedFiles = []
            renderFileList();
        } else {
            const text = await response.text();
            throw new Error(`Webhook erro ${response.status}: ${text}`);
        }

    } catch (error) {
        console.error("Process error:", error);
        alert(`Erro: ${error.message}`);
    } finally {
        // Restore UI
        const uploadZone = document.getElementById('upload-zone');
        const fileList = document.getElementById('drafts-section'); // Updated ID
        const loader = document.getElementById('gemini-loader');

        if (uploadZone) uploadZone.classList.remove('hidden');
        // if (fileList) fileList.classList.remove('hidden'); // Always visible

        if (btnSend) {
            // btnSend.classList.remove('hidden');
            btnSend.disabled = false;
            btnSend.innerText = originalText;
        }

        if (loader) loader.classList.add('hidden');
    }
}
    }
});
