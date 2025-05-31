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
        "¿Qué tipo de comunidad es? (Ej: Minecraft/Gaming, Social/Anime, NSFW, RP/Roleplay, Apoyo/Network, Café/Chill)"
    ];
    
    questionKeys = ["serverName", "serverType"];
}

function getQuestionsForServerType(serverType) {
    const serverTypeLower = serverType.toLowerCase();
    
    if (serverTypeLower.includes('minecraft') || serverTypeLower.includes('gaming') || serverTypeLower.includes('clan')) {
        return [
            { key: 'gameMode', text: '¿En qué modalidades/versiones están ubicados? (Ej: 1.21 #2, 1.20 #1, Box PvP)' },
            { key: 'features', text: '¿Qué ofrecen a los miembros? (Ej: base grande, granjas OP, sorteos semanales, kits)' },
            { key: 'roles', text: '¿Qué roles reclutan? (Ej: guerreros, builders, farmers, moderadores)' },
            { key: 'alliances', text: '¿Tienen alianzas con otros clanes? (opcional)', optional: true }
        ];
    } else if (serverTypeLower.includes('nsfw') || serverTypeLower.includes('semi-nsfw')) {
        return [
            { key: 'contentType', text: '¿Qué tipo de contenido ofrecen?' },
            { key: 'features', text: '¿Qué beneficios especiales tienen? (Ej: bot economía, sorteos de nitro, contenido exclusivo)' },
            { key: 'safety', text: '¿Qué medidas de seguridad implementan?' },
            { key: 'verification', text: '¿Cómo es el proceso de verificación? (opcional)', optional: true }
        ];
    } else if (serverTypeLower.includes('rp') || serverTypeLower.includes('roleplay') || serverTypeLower.includes('café')) {
        return [
            { key: 'rpTheme', text: '¿Cuál es la temática del RP? (Ej: café, medieval, moderno, anime)' },
            { key: 'features', text: '¿Qué elementos de RP ofrecen? (Ej: canales de RP, sistemas, eventos)' },
            { key: 'roles', text: '¿Qué roles pueden interpretar los usuarios?' },
            { key: 'rules', text: '¿Tienen reglas especiales para el RP? (opcional)', optional: true }
        ];
    } else if (serverTypeLower.includes('apoyo') || serverTypeLower.includes('network') || serverTypeLower.includes('alianza')) {
        return [
            { key: 'serviceType', text: '¿Qué tipo de apoyo ofrecen? (Ej: alianzas, promoción, blacklist, reclutamiento)' },
            { key: 'features', text: '¿Qué servicios específicos brindan? (Ej: canales de promoción, staff hunting, partnerships)' },
            { key: 'requirements', text: '¿Qué buscan en los servidores que se unen?' },
            { key: 'benefits', text: '¿Qué beneficios obtienen los miembros? (opcional)', optional: true }
        ];
    } else {
        // Social/Anime/General
        return [
            { key: 'theme', text: '¿Cuál es la temática principal? (Ej: anime, manga, gaming, general)' },
            { key: 'features', text: '¿Qué actividades ofrecen? (Ej: chat activo, bots de entretenimiento, eventos, sorteos)' },
            { key: 'community', text: '¿Qué tipo de ambiente buscan crear? (Ej: amigable, activo, no tóxico)' },
            { key: 'channels', text: '¿Qué tipo de canales especiales tienen? (opcional)', optional: true }
        ];
    }
}

const commonOptionalQuestions = [
    { key: 'staff', text: 'Menciona a tu staff/líderes principales (opcional)', optional: true },
    { key: 'banner', text: 'Link del banner/imagen del servidor (opcional)', optional: true },
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
    const questionKey = questionKeys[currentStep];
    
    // Allow empty messages for optional questions
    if (!message && !optionalQuestions.includes(questionKey)) {
        return;
    }
    
    if (isGenerating) return;
    
    // Handle optional questions
    if (!message && optionalQuestions.includes(questionKey)) {
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
    
    // Move to next question or generate
    currentStep++;
    updateProgress();
    
    setTimeout(() => {
        if (currentStep < questions.length) {
            addMessage(questions[currentStep], false);
        } else {
            // Start generation immediately when we have all basic info
            addMessage("¡Perfecto! Tengo toda la información que necesito. Generando tus plantillas ahora...", false);
            disableInput();
            generateTemplates();
        }
    }, 1000);
}

// Clean user responses using AI-like filtering
function cleanUserResponse(message, questionKey) {
    if (!templateConfig || !templateConfig.responses || !templateConfig.responses[questionKey]) {
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
    
    return cleaned || message;
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

// Template generation
function generateTemplates() {
    isGenerating = true;
    
    try {
        // Add loading message
        addMessage("Generando tus plantillas personalizadas...", false);
        
        // Simulate AI processing time
        setTimeout(() => {
            const templates = createTemplates(chatData);
            generatedTemplates = templates;
            
            console.log('Templates generated:', templates); // Debug log
            
            addMessage("¡Increíble! He generado tus plantillas. Revísalas a continuación.", false);
            
            setTimeout(() => {
                showResults(templates);
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
    
    // Generate each template type
    const templateTypes = ['formal', 'emotional', 'epic'];
    
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
        epic: "Estilo Épico"
    };
    return names[type] || type;
}

function getTemplateIcon(type) {
    const icons = {
        formal: "💼",
        emotional: "💖",
        epic: "👑"
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
    
    let template = '';
    
    if (templateType === 'formal') {
        // Formal template structure
        const decorativeLine = getRandomElement(patterns.decorativeElements) || "═══════════════════════════════";
        const titleStyle = (getRandomElement(patterns.titles) || "⚔️ {serverName} ⚔️").replace('{serverName}', `**${data.serverName}**`);
        
        template += `${decorativeLine}\n\n`;
        template += `${titleStyle}\n\n`;
        template += `${decorativeLine}\n\n`;
        
        // Offers section
        const offersHeader = getRandomElement(patterns.sectionHeaders?.offers) || "✠ ¿Qué ofrecemos? ✠";
        template += `${offersHeader}\n`;
        template += generateOffersList(data.features || data.contentType || data.theme || "Gran comunidad activa", 'formal');
        
        // Requirements section
        if (data.roles || data.requirements || data.community) {
            const reqHeader = getRandomElement(patterns.sectionHeaders?.requirements) || "✦ ¿Qué buscamos? ✦";
            template += `\n${reqHeader}\n`;
            template += generateRequirementsList(data.roles || data.requirements || data.community, 'formal');
        }
        
        // Staff section
        if (data.staff) {
            template += `\n**👑 Staff:**\n${data.staff}\n`;
        }
        
        // Call to action
        const callToAction = getRandomElement(phrases.callToAction) || "¡Únete a nosotros!";
        template += `\n${callToAction}`;
        
    } else if (templateType === 'emotional') {
        // Emotional template structure
        template += `💖 ═══════════════════════════════ 💖\n`;
        template += `        ✨ **${data.serverName}** ✨\n`;
        template += `💖 ═══════════════════════════════ 💖\n\n`;
        
        template += `🌟 **¡Bienvenido a nuestro hogar!** 🌟\n\n`;
        
        const welcomeMsg = (getRandomElement(phrases.welcomeMessages) || "Somos una gran comunidad donde todos la pasan muy bien").replace('{serverName}', data.serverName);
        template += `${welcomeMsg}\n\n`;
        
        template += `🤗 **En nuestra comunidad encontrarás:**\n`;
        template += generateOffersList(data.features || data.contentType || data.theme || "Ambiente amigable y acogedor", 'emotional');
        
        if (data.roles || data.requirements || data.community) {
            template += `\n💕 **Buscamos personas como tú:**\n`;
            template += generateRequirementsList(data.roles || data.requirements || data.community, 'emotional');
        }
        
        if (data.staff) {
            template += `\n❤️ **Nuestro increíble equipo:**\n${data.staff}\n`;
        }
        
        template += `\n🏠 **¡Ven y forma parte de nuestra familia!**\n`;
        const emotionalCall = getRandomElement(phrases.callToAction) || "¡Te esperamos con los brazos abiertos!";
        template += `💕 ${emotionalCall} 🤗`;
        
    } else if (templateType === 'epic') {
        // Epic template structure
        template += `⚔️ ═══════════════════════════════ ⚔️\n`;
        template += `    🔥 **${data.serverName}** 🔥\n`;
        template += `⚔️ ═══════════════════════════════ ⚔️\n\n`;
        
        template += `🛡️ **¡PREPÁRATE PARA LA BATALLA!** ⚡\n\n`;
        
        template += `💥 Somos una comunidad ÉPICA que domina:\n`;
        template += generateOffersList(data.features || data.contentType || data.theme || "Poder absoluto y gloria eterna", 'epic');
        
        if (data.roles || data.requirements || data.community) {
            template += `\n⚡ **¡RECLUTAMOS GUERREROS!**\n`;
            template += generateRequirementsList(data.roles || data.requirements || data.community, 'epic');
        }
        
        if (data.staff) {
            template += `\n👑 **NUESTROS LÍDERES SUPREMOS:**\n⚔️ ${data.staff}\n`;
        }
        
        template += `\n🚀 **¡ÚNETE A LA LEYENDA!**\n`;
        const epicCall = getRandomElement(phrases.callToAction) || "¡EL DESTINO TE ESPERA!";
        template += `🔥 ${epicCall} 🔥`;
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

function generateOffersList(features, style) {
    if (!features) return '';
    
    const items = features.split(',').map(item => item.trim()).filter(item => item.length > 0);
    let list = '';
    
    items.forEach((item, index) => {
        if (style === 'formal') {
            list += `• ${item}\n`;
        } else if (style === 'emotional') {
            list += `💝 ${item}\n`;
        } else if (style === 'epic') {
            list += `🔥 ${item}\n`;
        }
    });
    
    return list;
}

function generateRequirementsList(requirements, style) {
    if (!requirements) return '';
    
    const items = requirements.split(',').map(item => item.trim()).filter(item => item.length > 0);
    let list = '';
    
    items.forEach((item, index) => {
        if (style === 'formal') {
            list += `• ${item}\n`;
        } else if (style === 'emotional') {
            list += `🤗 ${item}\n`;
        } else if (style === 'epic') {
            list += `⚡ ${item}\n`;
        }
    });
    
    return list;
}

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
