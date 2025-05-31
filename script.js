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
    
    // Initialize the dynamic question system
    initializeQuestions();
    currentStep = 0;
    chatData = {};
    canAskMoreQuestions = true;
    
    // Add first message
    addMessage("¡Hola! Soy tu asistente de IA para plantillas de Discord. Te haré preguntas específicas según tu tipo de servidor para crear plantillas auténticas.", false);
    
    setTimeout(() => {
        addMessage(questions[0], false);
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
    if (currentStep === 2 && chatData.serverType) {
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
        } else if (canAskMoreQuestions) {
            addMessage("¿Te gustaría agregar algún detalle específico adicional o generar las plantillas ahora? (escribe 'más detalles' para continuar o 'generar' para crear las plantillas)", false);
            canAskMoreQuestions = false;
        } else {
            // Start generation
            addMessage("¡Perfecto! Tengo toda la información que necesito. Generando tus plantillas ahora...", false);
            disableInput();
            generateTemplates();
        }
    }, 1000);
}

// Clean user responses using AI-like filtering
function cleanUserResponse(message, questionKey) {
    if (!templateConfig || !templateConfig.responses[questionKey]) {
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
    
    const progress = ((currentStep + 1) / questions.length) * 100;
    progressText.textContent = `${Math.min(currentStep + 1, questions.length)}/${questions.length} questions`;
    progressFill.style.width = `${progress}%`;
}

function disableInput() {
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    input.disabled = true;
    sendBtn.disabled = true;
    document.getElementById('send-icon').textContent = '⏳';
}

// Template generation (simulated AI)
function generateTemplates() {
    isGenerating = true;
    
    // Simulate AI processing time
    setTimeout(() => {
        const templates = createTemplates(chatData);
        generatedTemplates = templates;
        
        addMessage("¡Increíble! He generado tus plantillas. Revísalas a continuación.", false);
        
        setTimeout(() => {
            showResults(templates);
        }, 1000);
        
        isGenerating = false;
    }, 3000);
}

function createTemplates(data) {
    const templates = {};
    
    // Generate each template type using the JSON configuration
    Object.keys(templateConfig.formal ? {formal: templateConfig.formal, emotional: templateConfig.emotional, epic: templateConfig.epic} : {}).forEach(type => {
        if (templateConfig[type]) {
            const template = buildTemplateFromConfig(data, templateConfig[type]);
            templates[type] = {
                content: template,
                characterCount: template.length
            };
        }
    });
    
    return templates;
}

function buildTemplateFromConfig(data, config) {
    // Use AI-trained patterns to generate authentic templates
    return generateAuthenticTemplate(data, config);
}

function generateAuthenticTemplate(data, configType) {
    const patterns = templateConfig.patterns;
    const phrases = templateConfig.phrases;
    
    // Randomly select elements to create variety
    const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
    
    let template = '';
    
    if (configType.class === 'formal') {
        // Formal template structure based on real examples
        const decorativeLine = getRandomElement(patterns.decorativeElements);
        const titleStyle = getRandomElement(patterns.titles).replace('{serverName}', `**${data.serverName}**`);
        
        template += `${decorativeLine}\n\n`;
        template += `${titleStyle}\n\n`;
        template += `${decorativeLine}\n\n`;
        
        // Offers section
        const offersHeader = getRandomElement(patterns.sectionHeaders.offers);
        template += `${offersHeader}\n\n`;
        template += generateOffersList(data.features, 'formal');
        
        // Requirements section
        const reqHeader = getRandomElement(patterns.sectionHeaders.requirements);
        template += `\n\n${decorativeLine}\n\n`;
        template += `${reqHeader}\n\n`;
        template += generateRequirementsList(data.memberRequirements, 'formal');
        
        // Optional sections
        if (data.staff) {
            const leadersHeader = getRandomElement(patterns.sectionHeaders.leaders);
            template += `\n\n${decorativeLine}\n\n`;
            template += `${leadersHeader}\n\n`;
            template += `${data.staff}`;
        }
        
        if (data.banner) {
            template += `\n\n${decorativeLine}\n\n`;
            template += `𝓑𝓪𝓷𝓮𝓻: ${data.banner}`;
        }
        
        template += `\n\n${decorativeLine}\n\n`;
        template += `${getRandomElement(phrases.callToAction)}\ndiscord.gg/ejemplo`;
        template += `\n\n${decorativeLine}`;
        
    } else if (configType.class === 'emotional') {
        // Emotional template with small caps and hearts
        const emotionalBorder = "💖 ═══════════════════════════════ 💖";
        template += `${emotionalBorder}\n`;
        template += `        ✨ **${data.serverName}** ✨\n`;
        template += `${emotionalBorder}\n\n`;
        
        template += `🌟 **¡Bienvenido a nuestro hogar!** 🌟\n\n`;
        
        const welcomeMsg = getRandomElement(phrases.welcomeMessages).replace('{serverName}', data.serverName);
        template += `${welcomeMsg}\n`;
        template += `💕 ${data.features}\n\n`;
        
        template += `🤗 **Buscamos personas como tú:**\n`;
        template += `${data.memberRequirements}\n\n`;
        
        if (data.staff) {
            template += `👑 **Nuestro increíble equipo:**\n`;
            template += `❤️ ${data.staff}\n\n`;
        }
        
        if (data.banner) {
            template += `🎨 **¡Mira lo que tenemos para ti!**\n`;
            template += `🔗 ${data.banner}\n\n`;
        }
        
        template += `🏠 **¡Ven y forma parte de nuestra familia!**\n`;
        template += `💕 discord.gg/ejemplo 💕\n\n`;
        template += `¡Te esperamos con los brazos abiertos! 🤗`;
        
    } else if (configType.class === 'epic') {
        // Epic template with dramatic styling
        const epicBorder = "⚔️ ═══════════════════════════════ ⚔️";
        template += `${epicBorder}\n`;
        template += `    🔥 **${data.serverName.toUpperCase()}** 🔥\n`;
        template += `${epicBorder}\n\n`;
        
        template += `🛡️ **¡PREPÁRATE PARA LA BATALLA!** ⚡\n\n`;
        
        template += `💥 Somos una comunidad ${data.serverType} ÉPICA que domina:\n`;
        template += `🔥 ${data.features}\n\n`;
        
        template += `⚡ **¡RECLUTAMOS GUERREROS!**\n`;
        template += `🎯 ${data.memberRequirements}\n\n`;
        
        if (data.staff) {
            template += `👑 **NUESTROS LÍDERES SUPREMOS:**\n`;
            template += `⚔️ ${data.staff}\n\n`;
        }
        
        if (data.banner) {
            template += `🏆 **¡OBSERVA NUESTRO PODER!**\n`;
            template += `💥 ${data.banner}\n\n`;
        }
        
        template += `🚀 **¡ÚNETE A LA LEYENDA!**\n`;
        template += `⚔️ discord.gg/ejemplo ⚔️\n\n`;
        template += `🔥 ¡EL DESTINO TE ESPERA! 🔥`;
    }
    
    return template;
}

function generateOffersList(features, style) {
    const items = features.split(',').map(item => item.trim());
    let list = '';
    
    items.forEach(item => {
        if (style === 'formal') {
            list += `-⊱ ${item}\n`;
        } else if (style === 'emotional') {
            list += `💕 ${item}\n`;
        } else {
            list += `🔥 ${item}\n`;
        }
    });
    
    return list;
}

function generateRequirementsList(requirements, style) {
    const items = requirements.split(',').map(item => item.trim());
    let list = '';
    
    items.forEach(item => {
        if (style === 'formal') {
            list += `-⊱ ${item}\n`;
        } else if (style === 'emotional') {
            list += `🤗 ${item}\n`;
        } else {
            list += `⚡ ${item}\n`;
        }
    });
    
    return list;
}

// Fallback function if JSON config fails to load
function getDefaultConfig() {
    return {
        formal: {
            name: "Formal Style",
            icon: "💼",
            class: "formal",
            structure: {
                header: "╔═══════════════════════════════╗\n║          **{serverName}**          ║\n╚═══════════════════════════════╝",
                info: "📋 **INFORMACIÓN DEL SERVIDOR**\n• Tipo: {serverType}\n• Características: {features}",
                requirements: "👥 **REQUISITOS DE MIEMBROS**\n{memberRequirements}",
                staff: "🔧 **STAFF**\n{staff}",
                banner: "🔗 **ENLACE/BANNER**\n{banner}",
                additional: "📌 **INFORMACIÓN ADICIONAL**\n{additionalInfo}",
                footer: "🎯 **¡Únete a nuestra comunidad profesional!**\ndiscord.gg/ejemplo"
            }
        },
        emotional: {
            name: "Emotional Style",
            icon: "💖",
            class: "emotional",
            structure: {
                header: "💖 ═══════════════════════════════ 💖\n        ✨ **{serverName}** ✨\n💖 ═══════════════════════════════ 💖",
                welcome: "🌟 **¡Bienvenido a nuestro hogar!** 🌟",
                info: "Somos una comunidad {serverType} llena de amor y amistad donde encontrarás:\n💕 {features}",
                requirements: "🤗 **Buscamos personas como tú:**\n{memberRequirements}",
                staff: "👑 **Nuestro increíble equipo:**\n❤️ {staff}",
                banner: "🎨 **¡Mira lo que tenemos para ti!**\n🔗 {banner}",
                additional: "💝 **Algo especial:**\n{additionalInfo}",
                footer: "🏠 **¡Ven y forma parte de nuestra familia!**\n💕 discord.gg/ejemplo 💕\n\n¡Te esperamos con los brazos abiertos! 🤗"
            }
        },
        epic: {
            name: "Epic Style",
            icon: "👑",
            class: "epic",
            structure: {
                header: "⚔️ ═══════════════════════════════ ⚔️\n    🔥 **{serverName}** 🔥\n⚔️ ═══════════════════════════════ ⚔️",
                battle: "🛡️ **¡PREPÁRATE PARA LA BATALLA!** ⚡",
                info: "💥 Somos una comunidad {serverType} ÉPICA que domina:\n🔥 {features}",
                requirements: "⚡ **¡RECLUTAMOS GUERREROS!**\n🎯 {memberRequirements}",
                staff: "👑 **NUESTROS LÍDERES SUPREMOS:**\n⚔️ {staff}",
                banner: "🏆 **¡OBSERVA NUESTRO PODER!**\n💥 {banner}",
                additional: "🌟 **MISIÓN ESPECIAL:**\n🔥 {additionalInfo}",
                footer: "🚀 **¡ÚNETE A LA LEYENDA!**\n⚔️ discord.gg/ejemplo ⚔️\n\n🔥 ¡EL DESTINO TE ESPERA! 🔥"
            }
        },
        responses: {
            serverName: {
                cleanPatterns: ["^(el nombre de mi servidor es|se llama|mi servidor|nuestro servidor)\\s*", "^(es|se llama)\\s*", "\"", "'"]
            },
            serverType: {
                cleanPatterns: ["^(es una comunidad|somos|es un servidor de|tipo)\\s*", "^(de|del|la)\\s*"]
            },
            features: {
                cleanPatterns: ["^(ofrecemos|tenemos|características|beneficios)\\s*", "^(son|incluyen)\\s*"]
            },
            memberRequirements: {
                cleanPatterns: ["^(buscamos|necesitamos|requisitos|queremos)\\s*", "^(que sean|personas)\\s*"]
            },
            staff: {
                cleanPatterns: ["^(staff|administradores|moderadores|equipo)\\s*", "^(son|tenemos)\\s*"]
            },
            banner: {
                cleanPatterns: ["^(banner|enlace|link|imagen)\\s*", "^(es|está en)\\s*"]
            },
            additionalInfo: {
                cleanPatterns: ["^(adicional|extra|también|además)\\s*", "^(información|info)\\s*"]
            }
        },
        skipMessages: {
            staff: "Perfecto, continuaremos sin mencionar staff específico.",
            banner: "Entendido, crearemos la plantilla sin banner.",
            additionalInfo: "Muy bien, tenemos toda la información necesaria."
        }
    };
}

function showResults(templates) {
    document.getElementById('results').classList.remove('hidden');
    
    const templatesGrid = document.getElementById('templates-grid');
    templatesGrid.innerHTML = '';
    
    // Use configuration from JSON or fallback
    const templateTypes = [
        { 
            key: 'formal', 
            title: templateConfig?.formal?.name || 'Formal Style', 
            icon: templateConfig?.formal?.icon || '💼', 
            class: templateConfig?.formal?.class || 'formal' 
        },
        { 
            key: 'emotional', 
            title: templateConfig?.emotional?.name || 'Emotional Style', 
            icon: templateConfig?.emotional?.icon || '💖', 
            class: templateConfig?.emotional?.class || 'emotional' 
        },
        { 
            key: 'epic', 
            title: templateConfig?.epic?.name || 'Epic Style', 
            icon: templateConfig?.epic?.icon || '👑', 
            class: templateConfig?.epic?.class || 'epic' 
        }
    ];
    
    templateTypes.forEach(type => {
        const template = templates[type.key];
        if (template) {
            const card = createTemplateCard(type, template);
            templatesGrid.appendChild(card);
        }
    });
    
    // Scroll to results
    // Add "Ask More Questions" button after templates
    const askMoreBtn = document.createElement('div');
    askMoreBtn.className = 'ask-more-section';
    askMoreBtn.innerHTML = `
        <div class="ask-more-content">
            <h3>¿No te convencen las plantillas?</h3>
            <p>Puedo hacer más preguntas específicas para mejorar el resultado</p>
            <button class="btn-ask-more" onclick="askMoreQuestions()">
                Hacer más preguntas específicas
            </button>
        </div>
    `;
    
    const resultsSection = document.getElementById('results');
    resultsSection.appendChild(askMoreBtn);
    
    setTimeout(() => {
        document.getElementById('results').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }, 100);
}

function createTemplateCard(type, template) {
    const card = document.createElement('div');
    card.className = 'template-card';
    
    const charCount = template.characterCount;
    const charClass = charCount > 2000 ? 'danger' : charCount > 1800 ? 'warning' : 'good';
    const charProgress = Math.min((charCount / 2000) * 100, 100);
    
    card.innerHTML = `
        <div class="template-header">
            <div class="template-title ${type.class}">
                <span>${type.icon}</span>
                <span>${type.title}</span>
            </div>
            <div>
                <div class="char-count ${charClass}">${charCount}/2000</div>
                <div class="char-progress">
                    <div class="char-progress-fill ${charClass}" style="width: ${charProgress}%"></div>
                </div>
            </div>
        </div>
        <div class="template-content">
            <div class="template-preview">${template.content}</div>
            <div class="template-actions">
                <button class="btn-copy ${type.class}" onclick="copyTemplate('${type.key}')">
                    <span>📋</span>
                    <span>Copy</span>
                </button>
                <button class="btn-edit" onclick="editTemplate('${type.key}')">✏️</button>
                <button class="btn-regenerate" onclick="regenerateTemplate('${type.key}')">🔄</button>
            </div>
        </div>
    `;
    
    return card;
}

// Template actions
function copyTemplate(templateKey) {
    const template = generatedTemplates[templateKey];
    
    navigator.clipboard.writeText(template.content).then(() => {
        // Update button to show success
        const button = event.target.closest('.btn-copy');
        const originalText = button.innerHTML;
        
        button.innerHTML = '<span>✅</span><span>Copied!</span>';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
        
        // Show toast-like message
        showToast('Template copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy template', 'error');
    });
}

function editTemplate(templateKey) {
    const template = generatedTemplates[templateKey];
    const newContent = prompt('Edit your template:', template.content);
    
    if (newContent !== null) {
        generatedTemplates[templateKey] = {
            content: newContent,
            characterCount: newContent.length
        };
        
        showResults(generatedTemplates);
        showToast('Template updated successfully!');
    }
}

function regenerateTemplate(templateKey) {
    const button = event.target;
    button.disabled = true;
    button.innerHTML = '⏳';
    
    // Simulate regeneration using the new config system
    setTimeout(() => {
        const config = templateConfig[templateKey];
        if (config) {
            const newTemplate = buildTemplateFromConfig(chatData, config);
            generatedTemplates[templateKey] = {
                content: newTemplate,
                characterCount: newTemplate.length
            };
        }
        
        showResults(generatedTemplates);
        showToast('Template regenerated successfully!');
        
        button.disabled = false;
        button.innerHTML = '🔄';
    }, 2000);
}

function downloadAllTemplates() {
    const { formal, emotional, epic } = generatedTemplates;
    
    const content = `FORMAL TEMPLATE:
${formal.content}

EMOTIONAL TEMPLATE:
${emotional.content}

EPIC TEMPLATE:
${epic.content}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatData.serverName || 'discord'}-templates.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Templates downloaded successfully!');
}

function startOver() {
    // Reset everything
    currentStep = 0;
    chatData = {};
    generatedTemplates = null;
    isGenerating = false;
    
    // Reset UI
    document.getElementById('start-section').classList.remove('hidden');
    document.getElementById('chat-interface').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
    
    // Clear chat messages
    document.getElementById('chat-messages').innerHTML = '';
    
    // Reset progress
    document.getElementById('progress-text').textContent = '1/7 questions';
    document.getElementById('progress-fill').style.width = '0%';
    
    // Reset input
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    document.getElementById('send-icon').textContent = '📤';
    
    // Scroll to generator
    scrollToGenerator();
    
    showToast('Ready to create a new template!');
}

// Utility functions
function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    toast.textContent = message;
    
    // Add slide animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
            document.head.removeChild(style);
        }, 300);
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Enter key support for chat input
    const input = document.getElementById('user-input');
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
