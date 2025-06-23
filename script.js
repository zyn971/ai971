document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyButton = document.getElementById('saveApiKey');
    const apiKeyContainer = document.getElementById('apiKeyContainer');
    const modelSelection = document.getElementById('modelSelection');
    const mistralCard = document.getElementById('mistralCard');
    const geminiCard = document.getElementById('geminiCard');
    const inputArea = document.getElementById('inputArea');
    const modelInfo = document.getElementById('modelInfo');
    const modelInfoName = document.getElementById('modelInfoName');
    const selectedModelIndicator = document.getElementById('selectedModelIndicator');
    const currentModelName = document.getElementById('currentModelName');
    
    let selectedModel = null;
    let geminiApiKey = '';
    
    // Tambahkan pesan pembuka
    addMessage("Halo! Saya ZenAI, asisten AI Anda. Silakan pilih model AI yang ingin Anda gunakan:", false);
    addMessage("1. Mistral 7B - Gratis, tanpa API key\n2. Gemini Pro - Lebih canggih, butuh API key", false);
    
    // Model selection event listeners
    mistralCard.addEventListener('click', function() {
        selectModel('mistral');
    });
    
    geminiCard.addEventListener('click', function() {
        selectModel('gemini');
    });
    
    function selectModel(model) {
        selectedModel = model;
        
        // Update UI
        mistralCard.classList.remove('selected');
        geminiCard.classList.remove('selected');
        
        if (model === 'mistral') {
            mistralCard.classList.add('selected');
            apiKeyContainer.style.display = 'none';
            inputArea.style.display = 'block';
            modelInfo.style.display = 'block';
            modelInfoName.textContent = 'Mistral 7B';
            selectedModelIndicator.style.display = 'flex';
            currentModelName.textContent = 'Mistral 7B';
            document.body.classList.add('model-mistral');
            document.body.classList.remove('model-gemini');
            
            // Add confirmation message
            addMessage(`Anda memilih Mistral 7B - model open-source gratis. Siap membantu!`, false);
            
            // Enable input
            messageInput.focus();
        } else {
            geminiCard.classList.add('selected');
            apiKeyContainer.style.display = 'flex';
            inputArea.style.display = 'none';
            modelInfo.style.display = 'none';
            document.body.classList.add('model-gemini');
            document.body.classList.remove('model-mistral');
            
            // Check if API key is already saved
            const savedApiKey = localStorage.getItem('gemini-api-key');
            if (savedApiKey) {
                geminiApiKey = savedApiKey;
                apiKeyInput.value = '••••••••••••••••';
                activateGemini();
            } else {
                addMessage("Silakan masukkan API key Gemini Anda untuk melanjutkan:", false);
            }
        }
    }
    
    function activateGemini() {
        apiKeyContainer.style.display = 'none';
        inputArea.style.display = 'block';
        modelInfo.style.display = 'block';
        modelInfoName.textContent = 'Gemini Pro';
        selectedModelIndicator.style.display = 'flex';
        currentModelName.textContent = 'Gemini Pro';
        
        // Add confirmation message
        addMessage(`Anda memilih Gemini Pro - model canggih dari Google. Siap membantu!`, false);
        
        // Enable input
        messageInput.focus();
    }
    
    // Save Gemini API key
    saveApiKeyButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            geminiApiKey = apiKey;
            localStorage.setItem('gemini-api-key', apiKey);
            activateGemini();
        } else {
            alert("Harap masukkan API key yang valid");
        }
    });
    
    // Function to add a new message to the chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user' : 'ai');
        
        const messageHeader = document.createElement('div');
        messageHeader.classList.add('message-header');
        
        const icon = document.createElement('i');
        icon.classList.add('fas', isUser ? 'fa-user' : 'fa-robot');
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = isUser ? 'Anda' : 'ZenAI';
        
        messageHeader.appendChild(icon);
        messageHeader.appendChild(nameSpan);
        
        const contentP = document.createElement('p');
        contentP.textContent = content;
        
        messageDiv.appendChild(messageHeader);
        messageDiv.appendChild(contentP);
        
        chatMessages.appendChild(messageDiv);
        
        // Apply animation
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        setTimeout(() => {
            messageDiv.style.animation = 'fadeInUp 0.4s forwards';
        }, 50);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv;
    }
    
    // Function to get AI response
    async function getAIResponse(userMessage) {
        if (!selectedModel) {
            addMessage("Silakan pilih model AI terlebih dahulu.", false);
            return;
        }
        
        // Show thinking indicator
        const thinkingMessage = addMessage('Memproses...', false);
        thinkingMessage.classList.add('thinking');
        
        try {
            let aiResponse = '';
            
            if (selectedModel === 'mistral') {
                // Using Mistral via Hugging Face API
                const response = await fetch(
                    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
                    {
                        headers: { 
                            "Authorization": "Bearer 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",
                            "Content-Type": "application/json" 
                        },
                        method: "POST",
                        body: JSON.stringify({
                            inputs: `<s>[INST] Anda adalah ZenAI, asisten AI yang membantu. Gunakan Bahasa Indonesia. ${userMessage} [/INST]`,
                            parameters: {
                                max_new_tokens: 300,
                                temperature: 0.7,
                                top_p: 0.9
                            }
                        }),
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Request gagal dengan status ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data || !data[0] || !data[0].generated_text) {
                    throw new Error('Respon tidak valid dari layanan AI');
                }
                
                aiResponse = data[0].generated_text;
                const startIndex = aiResponse.indexOf('[/INST]') + 8;
                if (startIndex > 7) {
                    aiResponse = aiResponse.substring(startIndex).trim();
                }
            } else {
                // Using Gemini via Google API
                if (!geminiApiKey) {
                    throw new Error('API key Gemini tidak tersedia');
                }
                
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: `Anda adalah ZenAI, asisten AI yang membantu. Gunakan Bahasa Indonesia. ${userMessage}`
                                }]
                            }],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 300
                            }
                        })
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Request gagal dengan status ${response.status}`);
                }
                
                const data = await response.json();
                aiResponse = data.candidates[0].content.parts[0].text;
            }
            
            // Remove thinking indicator
            chatMessages.removeChild(thinkingMessage);
            
            // Add the actual response
            addMessage(aiResponse, false);
        } catch (error) {
            console.error('Error:', error);
            
            // Remove thinking indicator
            chatMessages.removeChild(thinkingMessage);
            
            // Show error message
            let errorMsg = "Maaf, terjadi kesalahan. Silakan coba lagi.";
            
            if (selectedModel === 'gemini' && error.message.includes('API key')) {
                errorMsg = "API key Gemini tidak valid. Silakan periksa key Anda.";
            }
            
            const errorMessage = addMessage(errorMsg, false);
        }
    }
    
    // Handle send button click
    sendButton.addEventListener('click', function() {
        const message = messageInput.value.trim();
        if (message) {
            // Add user message
            addMessage(message, true);
            
            // Clear input
            messageInput.value = '';
            
            // Get AI response
            getAIResponse(message);
        }
    });
    
    // Handle Enter key in input
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
    
    // Add focus effect
    messageInput.addEventListener('focus', function() {
        this.style.boxShadow = '0 0 20px var(--glow-color)';
    });
    
    messageInput.addEventListener('blur', function() {
        this.style.boxShadow = '0 0 0 rgba(142, 76, 255, 0)';
    });
});
