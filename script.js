// Global variables
let currentStep = 0;
let chatData = {};
let generatedTemplates = null;
let isGenerating = false;
let templateConfig = null;

// Dynamic question system
let questions = [];
let questionKeys = [];
let additionalQuestions = [];
let canAskMoreQuestions = true;

function initializeQuestions() {
    questions = [
        "¿Cuál es el nombre de tu servidor?",
        "Selecciona el tipo de comunidad"
    ];
    
    questionKeys = ["serverName", "serverType"];
}

function getQuestionsForServerType(serverType) {
    const serverTypeLower = serverType.toLowerCase();
    
    if (serverTypeLower.includes('clan de minecraft')) {
        return [
            { key: 'gameMode', text: '¿En qué modalidades/versiones están ubicados? (Ej: 1.21 #2, 1.20 #1, Box PvP)' },
            { key: 'features', text: '¿Qué ofrecen a los miembros? (Ej: base grande, granjas OP, sorteos semanales, kits)' },
            { key: 'roles', text: '¿Qué roles reclutan? (Ej: guerreros, builders, farmers, moderadores)' },
            { key: 'alliances', text: '¿Tienen alianzas con otros clanes? (opcional)', optional: true }
        ];
    } else if (serverTypeLower.includes('gaming/entretenimiento')) {
        return [
            { key: 'games', text: '¿Qué juegos principales manejan? (Ej: Valorant, LOL, COD)' },
            { key: 'features', text: '¿Qué actividades gaming ofrecen? (Ej: torneos, ranked teams, eventos)' },
            { key: 'community', text: '¿Qué tipo de ambiente gaming buscan? (Ej: competitivo, casual, pro)' },
            { key: 'platforms', text: '¿En qué plataformas juegan? (opcional)', optional: true }
        ];
    } else if (serverTypeLower.includes('social/anime')) {
        return [
            { key: 'theme', text: '¿Cuál es la temática principal? (Ej: anime específico, manga, otaku general)' },
            { key: 'features', text: '¿Qué actividades sociales ofrecen? (Ej: watch parties, debates, fan art)' },
            { key: 'community', text: '¿Qué tipo de ambiente buscan crear? (Ej: amigable, activo, no tóxico)' },
            { key: 'channels', text: '¿Qué canales especiales tienen? (opcional)', optional: true }
        ];
    } else if (serverTypeLower.includes('roleplay')) {
        return [
            { key: 'rpTheme', text: '¿Cuál es la temática del RP? (Ej: medieval, moderno, fantasía, anime)' },
            { key: 'features', text: '¿Qué elementos de RP ofrecen? (Ej: canales de RP, sistemas, eventos)' },
            { key: 'roles', text: '¿Qué roles pueden interpretar los usuarios?' },
            { key: 'rules', text: '¿Tienen reglas especiales para el RP? (opcional)', optional: true }
        ];
    } else {
        // General/Other
        return [
            { key: 'theme', text: '¿Cuál es la temática principal de tu servidor?' },
            { key: 'features', text: '¿Qué actividades y características principales ofrecen?' },
            { key: 'community', text: '¿Qué tipo de ambiente buscan crear?' },
            { key: 'special', text: '¿Algo especial que los distinga? (opcional)', optional: true }
        ];
    }
}

const commonOptionalQuestions = [
    { key: 'staff', text: 'Staff principal con sus roles (formato: ID-Rol, ej: 1234567890123456789-Owner, 9876543210987654321-Manager) (opcional)', optional: true },
    { key: 'banner', text: 'Link del banner/imagen del servidor (opcional)', optional: true },
    { key: 'serverLink', text: 'Link de invitación del servidor (Ej: discord.gg/ejemplo)', optional: false },
    { key: 'additionalInfo', text: 'Información adicional que quieras destacar (opcional)', optional: true }
];

const optionalQuestions = ["staff", "banner", "additionalInfo"];

// Navigation functions
function scrollToGenerator() {
    document.getElementById('generator').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Load template configuration and training data
async function loadTemplateConfig() {
    try {
        const [configResponse, trainingResponse] = await Promise.all([
            fetch('templates.json'),
            fetch('training-data.json')
        ]);
        
        if (!configResponse.ok || !trainingResponse.ok) {
            throw new Error('Failed to load configuration files');
        }
        
        templateConfig = await configResponse.json();
        const trainingData = await trainingResponse.json();
        
        // Merge training data with config
        templateConfig.patterns = trainingData.patterns;
        templateConfig.phrases = trainingData.phrases;
        templateConfig.trainingTemplates = trainingData.templates;
        
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Fallback to default config if files not found
        templateConfig = getDefaultConfig();
    }
}

function getDefaultConfig() {
    return {
        formal: {
            name: "Formal Style",
            icon: "💼",
            class: "formal"
        },
        emotional: {
            name: "Emotional Style", 
            icon: "💖",
            class: "emotional"
        },
        epic: {
            name: "Epic Style",
            icon: "👑", 
            class: "epic"
        },
        patterns: {
            decorativeElements: [
                "▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱",
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                "═══════════════════════════════",
                "╔═══════════════════════════════╗"
            ],
            titles: [
                "⚔️ 『{serverName}』 ⚔️",
                "🔥 **{serverName}** 🔥",
                "✨ **{serverName}** ✨"
            ],
            sectionHeaders: {
                offers: [
                    "✠ ¿Qué ofrecemos? ✠",
                    "🎯 **¿Qué ofrecemos?**",
                    "⚜️ **Ofrecemos:**"
                ],
                requirements: [
                    "✦ ¿Qué buscamos? ✦",
                    "🔱 **Buscamos:**",
                    "✅ **Requisitos:**"
                ]
            }
        },
        phrases: {
            welcomeMessages: [
                "Somos una gran comunidad llamada {serverName} donde todos la pasan muy bien",
                "¿Has estado buscando un clan maravilloso respetuoso?",
                "El clan {serverName} está abierto para todos los usuarios"
            ],
            callToAction: [
                "¡Qué esperas? ¡Únete ya!",
                "🔥 ¡EL DESTINO TE ESPERA! 🔥",
                "¡Únete y sé parte de nosotros!"
            ]
        },
        responses: {
            serverName: {
                filters: ["el nombre de mi servidor es", "se llama", "mi servidor", "nuestro servidor"],
                cleanPatterns: ["^(el nombre de mi servidor es|se llama|mi servidor|nuestro servidor)\\s*", "^(es|se llama)\\s*", "\"", "'"]
            },
            serverType: {
                filters: ["es una comunidad", "somos", "es un servidor de", "tipo"],
                cleanPatterns: ["^(es una comunidad|somos|es un servidor de|tipo)\\s*", "^(de|del|la)\\s*"]
            }
        },
        skipMessages: {
            staff: "Perfecto, continuaremos sin mencionar staff específico.",
            banner: "Entendido, crearemos la plantilla sin banner.",
            additionalInfo: "Muy bien, tenemos toda la información necesaria."
        }
    };
}

// Chat functions
async function startChat() {
    document.getElementById('start-section').classList.add('hidden');
    document.getElementById('chat-interface').classList.remove('hidden');
    
    // Load configuration if not already loaded
    if (!templateConfig) {
        await loadTemplateConfig();
    }
    
    // Enable input and send button
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
    
    // Add enter key listener
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Initialize the dynamic question system
    initializeQuestions();
    currentStep = 0;
    chatData = {};
    canAskMoreQuestions = true;
    
    // Add first message
    addMessage("¡Hola! Soy tu asistente de IA para plantillas de Discord. Te haré preguntas específicas según tu tipo de servidor para crear plantillas auténticas.", false);
    
    setTimeout(() => {
        addMessage(questions[0], false);
        updateProgress();
    }, 1000);
}

function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    if (!isUser) {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar bot';
        avatar.textContent = '🤖';
        messageDiv.appendChild(avatar);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    messageDiv.appendChild(contentDiv);
    
    if (isUser) {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar user';
        avatar.textContent = '👤';
        messageDiv.appendChild(avatar);
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (isGenerating) return;
    
    // Handle conversation continuation after all questions
    if (currentStep >= questions.length) {
        if (message.toLowerCase().includes('generar') || message.toLowerCase().includes('plantillas')) {
            addMessage(message, true);
            addMessage("¡Perfecto! Generando tus 5 plantillas personalizadas ahora...", false);
            disableInput();
            generateTemplates();
            return;
        } else if (generatedTemplates) {
            // Handle post-generation conversation and modifications
            processTemplateModification(message);
            return;
        } else {
            // Continue conversation and update templates in real-time
            addMessage(message, true);
            // Process additional info
            chatData.additionalConversation = (chatData.additionalConversation || '') + ' ' + message;
            addMessage("Información agregada. Escribe 'generar' cuando quieras crear las plantillas, o continúa agregando detalles.", false);
            // Generate updated templates in background
            updateTemplatesInRealTime();
            return;
        }
    }
    
    const questionKey = questionKeys[currentStep];
    
    // Check if current question is optional based on question text or key
    const currentQuestion = questions[currentStep];
    const isOptionalQuestion = currentQuestion && (
        currentQuestion.includes('(opcional)') || 
        optionalQuestions.includes(questionKey) ||
        questionKey === 'alliances' ||
        questionKey === 'staff' ||
        questionKey === 'banner' ||
        questionKey === 'additionalInfo' ||
        questionKey === 'platforms' ||
        questionKey === 'channels' ||
        questionKey === 'rules' ||
        questionKey === 'special'
    );
    
    // Allow empty messages for optional questions
    if (!message && !isOptionalQuestion) {
        return;
    }
    
    // Handle optional questions
    if (!message && isOptionalQuestion) {
        addMessage("(omitido)", true);
        addMessage(templateConfig?.skipMessages[questionKey] || "Continuando...", false);
        chatData[questionKey] = null;
    } else {
        // Add user message
        addMessage(message, true);
        
        // Clean and filter the response
        const cleanedMessage = cleanUserResponse(message, questionKey);
        chatData[questionKey] = cleanedMessage;
    }
    
    // Clear input
    input.value = '';
    
    // Dynamic question expansion after server type
    if (currentStep === 1 && chatData.serverType) {
        const typeQuestions = getQuestionsForServerType(chatData.serverType);
        typeQuestions.forEach(q => {
            questions.push(q.text);
            questionKeys.push(q.key);
        });
        // Add common optional questions
        commonOptionalQuestions.forEach(q => {
            questions.push(q.text);
            questionKeys.push(q.key);
        });
    }
    
    // Move to next question or continue conversation
    currentStep++;
    updateProgress();
    
    setTimeout(() => {
        if (currentStep < questions.length) {
            if (currentStep === 1) {
                // Show dropdown for server type selection
                addServerTypeDropdown();
            } else {
                addMessage(questions[currentStep], false);
            }
        } else {
            // Continue conversation instead of generating immediately
            addMessage("¿Te gustaría agregar más detalles específicos o generar las plantillas ahora? (escribe 'generar' para crear las plantillas o continúa agregando información)", false);
            canAskMoreQuestions = true;
        }
    }, 1000);
}

// Clean user responses using AI-like filtering
function cleanUserResponse(message, questionKey) {
    if (!templateConfig || !templateConfig.responses || !templateConfig.responses[questionKey]) {
        // Special handling for staff IDs
        if (questionKey === 'staff') {
            return formatStaffIds(message);
        }
        return message;
    }
    
    const config = templateConfig.responses[questionKey];
    let cleaned = message.toLowerCase();
    
    // Apply clean patterns
    config.cleanPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Trim and capitalize first letter
    cleaned = cleaned.trim();
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    // Remove quotes
    cleaned = cleaned.replace(/^["']|["']$/g, '');
    
    // Special handling for staff IDs
    if (questionKey === 'staff') {
        return formatStaffIds(cleaned || message);
    }
    
    return cleaned || message;
}

function formatStaffIds(input) {
    if (!input) return input;
    
    // Check if input contains ID-Role format
    const staffEntries = input.split(',').map(entry => entry.trim());
    const formattedStaff = [];
    
    staffEntries.forEach(entry => {
        // Pattern for ID-Role format (1234567890123456789-Owner)
        const idRolePattern = /(\d{17,19})\s*[-]\s*(.+)/;
        const match = entry.match(idRolePattern);
        
        if (match) {
            const id = match[1];
            const role = match[2].trim();
            formattedStaff.push(`<@${id}> - ${role}`);
        } else {
            // Try to extract just numeric ID
            const idPattern = /\b\d{17,19}\b/;
            const idMatch = entry.match(idPattern);
            if (idMatch) {
                formattedStaff.push(`<@${idMatch[0]}>`);
            } else {
                // Keep original if no ID pattern found
                formattedStaff.push(entry);
            }
        }
    });
    
    return formattedStaff.length > 0 ? formattedStaff.join('\n') : input;
}

function addServerTypeDropdown() {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar bot';
    avatar.textContent = '🤖';
    messageDiv.appendChild(avatar);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const selectElement = document.createElement('select');
    selectElement.id = 'server-type-select';
    selectElement.style.width = '100%';
    selectElement.style.padding = '8px';
    selectElement.style.backgroundColor = '#36393f';
    selectElement.style.color = 'white';
    selectElement.style.border = '1px solid #5865f2';
    selectElement.style.borderRadius = '4px';
    selectElement.style.marginTop = '8px';
    
    const options = [
        { value: '', text: 'Selecciona el tipo de servidor...' },
        { value: 'Clan de Minecraft', text: 'Clan de Minecraft' },
        { value: 'Gaming/Entretenimiento', text: 'Gaming/Entretenimiento' },
        { value: 'Social/Anime', text: 'Social/Anime' },
        { value: 'Roleplay', text: 'Roleplay' },
        { value: 'General', text: 'General/Otro' }
    ];
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        selectElement.appendChild(optionElement);
    });
    
    selectElement.addEventListener('change', function() {
        if (this.value) {
            chatData.serverType = this.value;
            addMessage(this.value, true);
            
            // Expand questions based on selection
            const typeQuestions = getQuestionsForServerType(this.value);
            typeQuestions.forEach(q => {
                questions.push(q.text);
                questionKeys.push(q.key);
            });
            commonOptionalQuestions.forEach(q => {
                questions.push(q.text);
                questionKeys.push(q.key);
            });
            
            currentStep++;
            updateProgress();
            
            setTimeout(() => {
                if (currentStep < questions.length) {
                    addMessage(questions[currentStep], false);
                }
            }, 500);
        }
    });
    
    contentDiv.innerHTML = 'Selecciona el tipo de comunidad:';
    contentDiv.appendChild(selectElement);
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateTemplatesInRealTime() {
    // Generate templates in background without showing them
    try {
        const templates = createTemplates(chatData);
        generatedTemplates = templates;
        console.log('Templates updated in real-time:', templates);
    } catch (error) {
        console.error('Error updating templates:', error);
    }
}

function updateProgress() {
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    
    const progress = (currentStep / questions.length) * 100;
    progressText.textContent = `${currentStep}/${questions.length} preguntas`;
    progressFill.style.width = `${Math.min(progress, 100)}%`;
}

function disableInput() {
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    input.disabled = true;
    sendBtn.disabled = true;
    document.getElementById('send-icon').textContent = '⏳';
}

function enableInput() {
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    input.disabled = false;
    sendBtn.disabled = false;
    document.getElementById('send-icon').textContent = '📤';
    input.focus();
}

// Template generation
function generateTemplates() {
    isGenerating = true;
    
    try {
        // Add loading message
        addMessage("Generando tus 5 plantillas personalizadas...", false);
        
        // Simulate AI processing time
        setTimeout(() => {
            const templates = createTemplates(chatData);
            generatedTemplates = templates;
            
            console.log('Templates generated:', templates); // Debug log
            
            addMessage("¡Increíble! He generado 5 plantillas únicas para ti. Revísalas a continuación.", false);
            
            setTimeout(() => {
                showResults(templates);
                // Enable conversation after showing results
                enableContinuousChat();
            }, 1000);
            
            isGenerating = false;
        }, 2000);
    } catch (error) {
        console.error('Error generating templates:', error);
        addMessage("Hubo un error generando las plantillas. Por favor intenta de nuevo.", false);
        isGenerating = false;
    }
}

function createTemplates(data) {
    console.log('Creating templates with data:', data); // Debug log
    
    const templates = {};
    
    // Ensure we have minimum required data
    if (!data.serverName) {
        data.serverName = "Mi Servidor";
    }
    if (!data.serverType) {
        data.serverType = "Gaming";
    }
    
    // Generate each template type - now 5 templates
    const templateTypes = ['formal', 'emotional', 'epic', 'friendly', 'professional'];
    
    templateTypes.forEach(type => {
        try {
            const template = buildTemplateFromConfig(data, type);
            templates[type] = {
                content: template,
                characterCount: template.length,
                name: getTemplateName(type),
                icon: getTemplateIcon(type)
            };
            console.log(`Generated ${type} template:`, templates[type]); // Debug log
        } catch (error) {
            console.error(`Error generating ${type} template:`, error);
            // Fallback template
            templates[type] = {
                content: `**${data.serverName}**\n\nSomos una comunidad ${data.serverType} increíble.\n\n¡Únete a nosotros!`,
                characterCount: 50,
                name: getTemplateName(type),
                icon: getTemplateIcon(type)
            };
        }
    });
    
    return templates;
}

function getTemplateName(type) {
    const names = {
        formal: "Estilo Formal",
        emotional: "Estilo Emocional", 
        epic: "Estilo Épico",
        friendly: "Estilo Amigable",
        professional: "Estilo Profesional"
    };
    return names[type] || type;
}

function getTemplateIcon(type) {
    const icons = {
        formal: "💼",
        emotional: "💖",
        epic: "👑",
        friendly: "😊",
        professional: "🎯"
    };
    return icons[type] || "📝";
}

function buildTemplateFromConfig(data, type) {
    return generateAuthenticTemplate(data, type);
}

function generateAuthenticTemplate(data, templateType) {
    // Ensure templateConfig is available
    if (!templateConfig || !templateConfig.patterns) {
        console.warn('Template config not loaded, using defaults');
        templateConfig = getDefaultConfig();
    }
    
    const patterns = templateConfig.patterns || {};
    const phrases = templateConfig.phrases || {};
    
    // Safely get random element
    const getRandomElement = (array) => {
        if (!array || !Array.isArray(array) || array.length === 0) {
            return '';
        }
        return array[Math.floor(Math.random() * array.length)];
    };
    
    // Helper function to generate authentic Minecraft features
    const generateMinecraftFeatures = (userFeatures) => {
        const minecraftElements = patterns.minecraftElements || [];
        const userItems = userFeatures ? userFeatures.split(',').map(item => item.trim()) : [];
        
        // Combine user features with random Minecraft elements
        const combinedFeatures = [...userItems];
        
        // Add 2-3 random Minecraft-specific elements
        for (let i = 0; i < 3 && i < minecraftElements.length; i++) {
            const randomElement = getRandomElement(minecraftElements);
            if (!combinedFeatures.some(item => item.toLowerCase().includes(randomElement.toLowerCase().split(' ')[0]))) {
                combinedFeatures.push(randomElement);
            }
        }
        
        return combinedFeatures;
    };
    
    // Helper function to generate requirements list
    const generateRequirementsList = (userRequirements) => {
        const baseRequirements = patterns.requirements || [];
        const userItems = userRequirements ? userRequirements.split(',').map(item => item.trim()) : [];
        
        // Always include basic requirements
        const essentialRequirements = [
            "No estar en otro clan",
            "Ser activo en NauticMC", 
            "No ser tóxico"
        ];
        
        // Combine with user requirements
        return [...essentialRequirements, ...userItems].slice(0, 6);
    };
    
    let template = '';
    
    if (templateType === 'formal') {
        // Formal template structure with authentic Minecraft clan styling
        const decorativeLine = getRandomElement(patterns.decorativeElements) || "═══════════════════════════════";
        const titleStyle = (getRandomElement(patterns.titles) || "⚔️ {serverName} ⚔️").replace('{serverName}', data.serverName);
        
        template += `${decorativeLine}\n`;
        template += `${titleStyle}\n`;
        template += `${decorativeLine}\n\n`;
        
        // Welcome section with authentic clan messaging
        const welcomeMsg = (getRandomElement(phrases.welcomeMessages) || "Somos una gran comunidad llamada {serverName} donde todos la pasan muy bien").replace('{serverName}', data.serverName);
        template += `${welcomeMsg}\n\n`;
        
        // Location section (very important for Minecraft clans)
        const locationHeader = getRandomElement(patterns.sectionHeaders?.location) || "🌍 **Estamos en:**";
        template += `${locationHeader}\n`;
        if (data.gameMode) {
            template += `${data.gameMode}\n\n`;
        } else {
            // Default NauticMC locations
            template += `1.21 #1\n1.21 #2\n\n`;
        }
        
        // Offers section with Minecraft-specific features
        const offersHeader = getRandomElement(patterns.sectionHeaders?.offers) || "🎉 **LO QUE OFRECEMOS** 🎉";
        template += `${offersHeader}\n`;
        
        const features = generateMinecraftFeatures(data.features || data.theme || data.gameMode);
        features.forEach((feature, index) => {
            const icon = index % 3 === 0 ? '💎' : index % 3 === 1 ? '🏠' : '⚙️';
            template += `${icon} **⇒ ${feature}**\n`;
        });
        template += '\n';
        
        // Requirements section with authentic clan needs
        const reqHeader = getRandomElement(patterns.sectionHeaders?.requirements) || "📜 **BUSCAMOS NUEVOS MIEMBROS** 📜";
        template += `${reqHeader}\n`;
        
        // Generate role requirements
        const roles = data.roles || data.community || "Guerreros, Farmers, Builders";
        const roleList = roles.split(',').map(role => role.trim());
        roleList.forEach(role => {
            const icon = role.toLowerCase().includes('guerr') ? '⚔️' : 
                        role.toLowerCase().includes('farm') ? '🧑‍🌾' : 
                        role.toLowerCase().includes('build') ? '🏗️' : '⭐';
            template += `${icon} **⇒ ${role}**\n`;
        });
        template += '\n';
        
        // Basic requirements
        template += `📋 **REQUISITOS BÁSICOS**\n`;
        const requirements = generateRequirementsList(data.community);
        requirements.forEach(req => {
            template += `✅ ${req}\n`;
        });
        template += '\n';
        
        // Alliances section (very common in Minecraft clans)
        if (data.alliances) {
            const allianceHeader = getRandomElement(patterns.sectionHeaders?.alliances) || "🤝 **ALIANZAS**";
            template += `${allianceHeader}\n`;
            const alliances = data.alliances.split(',').map(ally => ally.trim());
            alliances.forEach(ally => {
                template += `⚔️ ${ally}\n`;
            });
            template += '\n';
        }
        
        // Leaders section
        if (data.staff) {
            const staffHeader = getRandomElement(patterns.sectionHeaders?.leaders) || "👑 **FUNDADORES DEL CLAN** 👑";
            template += `${staffHeader}\n`;
            template += `${data.staff}\n\n`;
        }
        
        // Call to action with Discord link
        const callToAction = getRandomElement(phrases.callToAction) || "¡Qué esperas? ¡Únete ya!";
        template += `🚀 ${callToAction}\n`;
        const serverLink = data.serverLink || "https://discord.gg/ejemplo";
        template += `🔗 **Discord:** ${serverLink}`;
        
    } else if (templateType === 'emotional') {
        // Emotional template with clan family vibes
        template += `💖 ═══════════════════════════════ 💖\n`;
        template += `        ✨ **${data.serverName}** ✨\n`;
        template += `💖 ═══════════════════════════════ 💖\n\n`;
        
        template += `🌟 **¡Bienvenido a nuestro hogar digital!** 🌟\n\n`;
        
        const welcomeMsg = (getRandomElement(phrases.welcomeMessages) || "Somos una gran comunidad donde todos la pasan muy bien").replace('{serverName}', data.serverName);
        template += `${welcomeMsg}\n\n`;
        
        // Location with emotional touch
        template += `🏠 **Nuestro hogar en NauticMC:**\n`;
        if (data.gameMode) {
            template += `💕 ${data.gameMode}\n\n`;
        } else {
            template += `💕 1.21 #1 y #2 (¡donde nacen las amistades!)\n\n`;
        }
        
        template += `🎁 **En nuestra familia encontrarás:**\n`;
        const features = generateMinecraftFeatures(data.features || data.theme);
        features.forEach(feature => {
            template += `💝 ${feature} - Te hará sentir parte de algo especial\n`;
        });
        template += '\n';
        
        template += `🤗 **Buscamos personas como tú:**\n`;
        const roles = data.roles || "Guerreros, Farmers, Builders";
        const roleList = roles.split(',').map(role => role.trim());
        roleList.forEach(role => {
            template += `❤️ ${role} - Cada miembro es valioso para nosotros\n`;
        });
        template += '\n';
        
        if (data.staff) {
            template += `👑 **Nuestra querida familia de líderes:**\n`;
            template += `💕 ${data.staff}\n`;
            template += `Son personas increíbles que dedican su corazón para hacer de este lugar nuestro hogar.\n\n`;
        }
        
        const emotionalCall = getRandomElement(phrases.callToAction) || "¡Te esperamos con los brazos abiertos!";
        template += `🏠 ${emotionalCall}\n`;
        const serverLink = data.serverLink || "discord.gg/ejemplo";
        template += `💌 **Tu nuevo hogar te espera:** ${serverLink}`;
        
    } else if (templateType === 'epic') {
        // Epic template with legendary clan power
        template += `⚔️ ═══════════════════════════════ ⚔️\n`;
        template += `    🔥 **${data.serverName}** 🔥\n`;
        template += `⚔️ ═══════════════════════════════ ⚔️\n\n`;
        
        template += `🛡️ **¡PREPÁRATE PARA LA BATALLA DEFINITIVA!** ⚡\n\n`;
        
        // Epic clan description
        const epicPhrase = getRandomElement(phrases.epicPhrases) || "De las sombras a la gloria";
        template += `⚡ **${epicPhrase.toUpperCase()}:**\n`;
        template += `Desde las profundidades de NauticMC hasta las alturas más épicas, hemos forjado un IMPERIO que trasciende todas las expectativas. No somos simplemente un clan, somos una FUERZA IMPARABLE que domina cada modalidad.\n\n`;
        
        // Epic location
        template += `🌍 **DOMINIOS DE PODER:**\n`;
        if (data.gameMode) {
            template += `⚡ ${data.gameMode} - TERRITORIO BAJO NUESTRO CONTROL\n\n`;
        } else {
            template += `⚡ 1.21 #1, #2, #3 - DOMINAMOS MÚLTIPLES DIMENSIONES\n\n`;
        }
        
        template += `💥 **ARSENAL ÉPICO QUE CONTROLAMOS:**\n`;
        const features = generateMinecraftFeatures(data.features || data.theme);
        features.forEach(feature => {
            template += `🔥 ${feature} - PODER QUE DESTROZA A LA COMPETENCIA\n`;
        });
        template += '\n';
        
        template += `⚡ **¡RECLUTAMOS SOLO A LOS MÁS LEGENDARIOS!**\n`;
        template += `Solo aquellos dignos de portar nuestros colores pueden unirse a nuestras filas:\n`;
        const roles = data.roles || "Guerreros, Farmers, Builders";
        const roleList = roles.split(',').map(role => role.trim());
        roleList.forEach(role => {
            template += `⚔️ ${role} - MAESTROS DE SU ARTE\n`;
        });
        template += '\n';
        
        if (data.alliances) {
            template += `🤝 **ALIANZAS DE GUERRA ETERNA:**\n`;
            const alliances = data.alliances.split(',').map(ally => ally.trim());
            alliances.forEach(ally => {
                template += `🔥 ${ally} - HERMANOS EN BATALLA\n`;
            });
            template += '\n';
        }
        
        if (data.staff) {
            template += `👑 **NUESTROS EMPERADORES SUPREMOS:**\n`;
            template += `⚔️ ${data.staff}\n`;
            template += `Guerreros legendarios que han conquistado incontables batallas y guían nuestro imperio hacia la gloria eterna.\n\n`;
        }
        
        const epicCall = getRandomElement(phrases.callToAction) || "¡EL DESTINO TE ESPERA!";
        template += `🚀 **${epicCall.toUpperCase()}**\n`;
        template += `El destino ha conspirado para traerte hasta aquí. Las estrellas se han alineado y los dioses de NauticMC han susurrado tu nombre.\n\n`;
        
        const serverLink = data.serverLink || "discord.gg/ejemplo";
        template += `⚔️ **EL PORTAL AL PODER ABSOLUTO:** ${serverLink} ⚔️`;
        
    } else if (templateType === 'friendly') {
        // Friendly template with casual, welcoming tone
        template += `🌈 ══════════════════════════════ 🌈\n`;
        template += `    😊 **${data.serverName}** 😊\n`;
        template += `🌈 ══════════════════════════════ 🌈\n\n`;
        
        template += `👋 **¡Hola! ¿Buscas un lugar genial para jugar?** 🎮\n\n`;
        
        const friendlyWelcome = `¡Has llegado al lugar perfecto! En ${data.serverName} somos como una gran familia donde todos nos llevamos súper bien y nos ayudamos mutuamente.`;
        template += `${friendlyWelcome}\n\n`;
        
        // Location with friendly approach
        template += `🏡 **Nuestro rinconcito en NauticMC:**\n`;
        if (data.gameMode) {
            template += `🎯 ${data.gameMode} (¡ahí nos la pasamos genial!)\n\n`;
        } else {
            template += `🎯 1.21 #1 y #2 (¡súper divertido!)\n\n`;
        }
        
        template += `🎁 **Cosas geniales que tenemos:**\n`;
        const features = generateMinecraftFeatures(data.features || data.theme);
        features.forEach(feature => {
            template += `🌟 ${feature} - ¡Te va a encantar!\n`;
        });
        template += '\n';
        
        template += `🤝 **¿Quiénes pueden unirse?**\n`;
        template += `¡Todos son bienvenidos! Especialmente si eres:\n`;
        const roles = data.roles || "Guerreros, Farmers, Builders";
        const roleList = roles.split(',').map(role => role.trim());
        roleList.forEach(role => {
            template += `😊 ${role} - ¡Nos encanta conocer gente nueva!\n`;
        });
        template += '\n';
        
        if (data.staff) {
            template += `👥 **Nuestro equipo genial:**\n`;
            template += `🌟 ${data.staff}\n`;
            template += `Son súper buena onda y siempre están dispuestos a ayudar.\n\n`;
        }
        
        template += `🚀 ¡Ven y únete a la diversión!\n`;
        template += `Prometemos que te vas a divertir muchísimo con nosotros.\n\n`;
        const serverLink = data.serverLink || "discord.gg/ejemplo";
        template += `💬 **¡Nos vemos en Discord!** ${serverLink}`;
        
    } else if (templateType === 'professional') {
        // Professional template with clean, organized structure
        template += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        template += `    🎯 ${data.serverName}\n`;
        template += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        template += `📋 **INFORMACIÓN GENERAL**\n`;
        template += `Servidor: ${data.serverType}\n`;
        if (data.gameMode) {
            template += `Modalidad: ${data.gameMode}\n`;
        }
        template += `Estado: Activo | Reclutando\n\n`;
        
        template += `🔧 **SERVICIOS Y CARACTERÍSTICAS**\n`;
        const features = generateMinecraftFeatures(data.features || data.theme);
        features.forEach((feature, index) => {
            template += `${index + 1}. ${feature}\n`;
        });
        template += '\n';
        
        template += `👤 **PERFILES SOLICITADOS**\n`;
        const roles = data.roles || "Guerreros, Farmers, Builders";
        const roleList = roles.split(',').map(role => role.trim());
        roleList.forEach((role, index) => {
            template += `• ${role}\n`;
        });
        template += '\n';
        
        template += `📜 **REQUISITOS DE MEMBRESÍA**\n`;
        const requirements = generateRequirementsList(data.community);
        requirements.forEach((req, index) => {
            template += `${index + 1}. ${req}\n`;
        });
        template += '\n';
        
        if (data.staff) {
            template += `👨‍💼 **ADMINISTRACIÓN**\n`;
            template += `${data.staff}\n\n`;
        }
        
        template += `📞 **CONTACTO Y SOLICITUDES**\n`;
        const serverLink = data.serverLink || "discord.gg/ejemplo";
        template += `Discord: ${serverLink}\n`;
        template += `Proceso: Solicitud directa en Discord\n`;
        template += `Tiempo de respuesta: 24-48 horas`;
    }
    
    // Add additional info if provided
    if (data.additionalInfo) {
        template += `\n\n📌 **Información adicional:**\n${data.additionalInfo}`;
    }
    
    // Ensure template doesn't exceed 2000 characters
    if (template.length > 2000) {
        template = template.substring(0, 1997) + "...";
    }
    
    return template;
}

// These functions are now handled within generateAuthenticTemplate
// They have been replaced with more integrated logic that uses the training data patterns

function showResults(templates) {
    document.getElementById('results').classList.remove('hidden');
    
    const templatesGrid = document.getElementById('templates-grid');
    templatesGrid.innerHTML = '';
    
    Object.keys(templates).forEach(type => {
        const template = templates[type];
        const templateCard = createTemplateCard(type, template);
        templatesGrid.appendChild(templateCard);
    });
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

function enableContinuousChat() {
    // Enable input after showing results
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    input.disabled = false;
    sendBtn.disabled = false;
    document.getElementById('send-icon').textContent = '📤';
    
    // Add feedback message
    setTimeout(() => {
        addMessage("¿Qué te parecen las plantillas? 😊", false);
        addMessage("Puedes pedirme que modifique algo específico, que agregue o quite elementos, o que cambie el tono. También puedes continuar nuestra conversación normal. ¡Estoy aquí para ayudarte!", false);
    }, 2000);
}

function processTemplateModification(message) {
    addMessage(message, true);
    
    // Parse modification request
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('modificar') || lowerMessage.includes('cambiar') || 
        lowerMessage.includes('agregar') || lowerMessage.includes('quitar') ||
        lowerMessage.includes('más') || lowerMessage.includes('menos')) {
        
        addMessage("Perfecto, entiendo que quieres modificar las plantillas. Procesando tus cambios...", false);
        
        // Disable input while processing
        disableInput();
        
        // Add modification to chat data
        chatData.modifications = (chatData.modifications || []);
        chatData.modifications.push(message);
        
        // Regenerate templates with modifications
        setTimeout(() => {
            const updatedTemplates = createTemplates(chatData);
            generatedTemplates = updatedTemplates;
            
            addMessage("¡Listo! He actualizado las plantillas según tus indicaciones. Revisa los cambios:", false);
            
            setTimeout(() => {
                updateTemplatesDisplay(updatedTemplates);
                // Re-enable input after updating templates
                enableInput();
                addMessage("¿Qué te parecen los cambios? Puedes seguir pidiendo modificaciones o hacer cualquier otra pregunta.", false);
            }, 1000);
        }, 2000);
        
    } else if (lowerMessage.includes('genial') || lowerMessage.includes('perfecto') || 
               lowerMessage.includes('me gustan') || lowerMessage.includes('excelente')) {
        
        addMessage("¡Me alegra que te gusten! 🎉 ¿Hay algo más en lo que pueda ayudarte o algún detalle que quieras ajustar?", false);
        
    } else {
        // Continue normal conversation
        addMessage("Entendido. ¿Te gustaría que modifique algo específico de las plantillas o tienes alguna otra pregunta?", false);
    }
}

function createTemplateCard(type, template) {
    const card = document.createElement('div');
    card.className = 'template-card';
    
    const charCount = template.characterCount;
    const charClass = charCount <= 1800 ? 'good' : charCount <= 1950 ? 'warning' : 'danger';
    
    card.innerHTML = `
        <div class="template-header">
            <div class="template-info">
                <span class="template-icon">${template.icon}</span>
                <span class="template-name">${template.name}</span>
            </div>
            <span class="char-count ${charClass}">${charCount}/2000</span>
        </div>
        <div class="template-content">
            <div class="template-preview">${template.content}</div>
        </div>
        <div class="template-actions">
            <button class="btn-copy" onclick="copyTemplate('${type}')">
                <span id="copy-icon-${type}">📋</span>
                <span id="copy-text-${type}">Copiar</span>
            </button>
            <button class="btn-download-single" onclick="downloadTemplate('${type}')" title="Descargar">
                📥
            </button>
        </div>
    `;
    
    return card;
}

function copyTemplate(type) {
    const template = generatedTemplates[type];
    if (!template) return;
    
    navigator.clipboard.writeText(template.content).then(() => {
        const icon = document.getElementById(`copy-icon-${type}`);
        const text = document.getElementById(`copy-text-${type}`);
        const button = icon.parentElement;
        
        icon.textContent = '✅';
        text.textContent = 'Copiado';
        button.classList.add('copied');
        
        setTimeout(() => {
            icon.textContent = '📋';
            text.textContent = 'Copiar';
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Error copying to clipboard:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = template.content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

function downloadTemplate(type) {
    const template = generatedTemplates[type];
    if (!template) return;
    
    const blob = new Blob([template.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla-${type}-${chatData.serverName || 'servidor'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadAllTemplates() {
    if (!generatedTemplates) return;
    
    let allContent = '';
    Object.keys(generatedTemplates).forEach(type => {
        const template = generatedTemplates[type];
        allContent += `=== ${template.name.toUpperCase()} ===\n`;
        allContent += `Caracteres: ${template.characterCount}/2000\n\n`;
        allContent += template.content;
        allContent += '\n\n' + '='.repeat(50) + '\n\n';
    });
    
    const blob = new Blob([allContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantillas-${chatData.serverName || 'servidor'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function startOver() {
    // Reset all variables
    currentStep = 0;
    chatData = {};
    generatedTemplates = null;
    isGenerating = false;
    questions = [];
    questionKeys = [];
    canAskMoreQuestions = true;
    
    // Hide results and chat interface
    document.getElementById('results').classList.add('hidden');
    document.getElementById('chat-interface').classList.add('hidden');
    document.getElementById('start-section').classList.remove('hidden');
    
    // Clear chat messages
    document.getElementById('chat-messages').innerHTML = '';
    
    // Reset input
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    document.getElementById('send-icon').textContent = '📤';
    
    // Reset progress
    document.getElementById('progress-text').textContent = '0/2 preguntas';
    document.getElementById('progress-fill').style.width = '0%';
    
    // Scroll to generator
    scrollToGenerator();
}

function updateTemplatesDisplay(templates) {
    const templatesGrid = document.getElementById('templates-grid');
    templatesGrid.innerHTML = '';
    
    Object.keys(templates).forEach(type => {
        const template = templates[type];
        const templateCard = createTemplateCard(type, template);
        templatesGrid.appendChild(templateCard);
    });
    
    // Add update animation
    templatesGrid.style.opacity = '0.5';
    setTimeout(() => {
        templatesGrid.style.opacity = '1';
    }, 300);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load template configuration on page load
    loadTemplateConfig();
    
    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
