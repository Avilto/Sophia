// Sophia Advanced AI Assistant Core
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const body = document.body;
    const voiceBtn = document.getElementById('voice-btn');
    const voiceStatusText = document.getElementById('voice-status');
    const conversationHistory = document.getElementById('conversation-history');
    const textInput = document.getElementById('text-input');
    const sendBtn = document.getElementById('send-btn');
    const webcam = document.getElementById('webcam');
    const hudCanvas = document.getElementById('hud-canvas');
    const visualizerCanvas = document.getElementById('visualizer-canvas');
    const toggleVisionBtn = document.getElementById('toggle-vision');
    const themeSelector = document.getElementById('theme-selector');

    // IoT Switches
    const switchLights = document.getElementById('switch-lights');
    const switchDoor = document.getElementById('switch-door');
    const switchAcs = document.getElementById('switch-acs');
    const switchShield = document.getElementById('switch-shield');

    // HW Bars
    const cpuBar = document.getElementById('cpu-bar');
    const ramBar = document.getElementById('ram-bar');
    const tempBar = document.getElementById('temp-bar');
    const cpuVal = document.getElementById('cpu-val');
    const ramVal = document.getElementById('ram-val');
    const tempVal = document.getElementById('temp-val');

    // App State
    let isListening = false;
    let isSpeaking = false;
    let cameraActive = false;
    let simulatedDetections = [];
    let currentTheme = 'default';
    
    // Web Speech API initialization
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            voiceBtn.classList.add('listening');
            voiceBtn.textContent = 'ESCUCHANDO...';
            voiceStatusText.textContent = 'Sophia está escuchando tu voz...';
        };

        recognition.onerror = (e) => {
            console.error('Speech recognition error', e);
            voiceStatusText.textContent = 'Error en reconocimiento de voz.';
            resetVoiceState();
        };

        recognition.onend = () => {
            resetVoiceState();
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            addMessage(transcript, 'user');
            processCommand(transcript);
        };
    } else {
        voiceBtn.textContent = 'Voz no soportada';
        voiceBtn.disabled = true;
        voiceStatusText.textContent = 'Reconocimiento de voz no soportado en este navegador.';
    }

    // Reset Voice State helper
    function resetVoiceState() {
        isListening = false;
        voiceBtn.classList.remove('listening');
        voiceBtn.textContent = 'HABLAR CON SOPHIA';
        voiceStatusText.textContent = 'Sophia está lista.';
    }

    // Speech Synthesis
    function speak(text) {
        if (!window.speechSynthesis) return;
        
        // Cancel active speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        
        // Try to find a premium Spanish female voice if possible
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(voice => voice.lang.startsWith('es') && voice.name.toLowerCase().includes('google') || voice.name.toLowerCase().includes('sabrina') || voice.name.toLowerCase().includes('helena'));
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }

        utterance.onstart = () => {
            isSpeaking = true;
            voiceStatusText.textContent = 'Sophia está hablando...';
        };

        utterance.onend = () => {
            isSpeaking = false;
            voiceStatusText.textContent = 'Sophia está lista.';
        };

        utterance.onerror = () => {
            isSpeaking = false;
            voiceStatusText.textContent = 'Sophia está lista.';
        };

        window.speechSynthesis.speak(utterance);
    }

    // Voice button trigger
    voiceBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                isSpeaking = false;
            }
            try {
                recognition.start();
            } catch (err) {
                console.error(err);
            }
        }
    });

    // Chat Message System
    function addMessage(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${sender}`;
        
        const senderName = document.createElement('span');
        senderName.className = 'bubble-sender';
        senderName.textContent = sender === 'user' ? 'Usuario' : 'Sophia';
        
        const textNode = document.createTextNode(text);
        
        bubble.appendChild(senderName);
        bubble.appendChild(textNode);
        conversationHistory.appendChild(bubble);
        conversationHistory.scrollTop = conversationHistory.scrollHeight;

        if (sender === 'sophia') {
            speak(text);
        }
    }

    // Command Processor
    function processCommand(command) {
        const cmd = command.toLowerCase().trim();
        
        // 1. Greet commands
        if (cmd.includes('hola') || cmd.includes('buenos días') || cmd.includes('buenas tardes')) {
            addMessage('Hola, señor. Espero que esté teniendo un excelente día. ¿En qué le puedo asistir hoy?', 'sophia');
            return;
        }

        // 2. Who are you
        if (cmd.includes('quién eres') || cmd.includes('tu nombre') || cmd.includes('quien eres')) {
            addMessage('Soy Sophia, su asistente de inteligencia artificial personal. Diseñada para coordinar sus sistemas tecnológicos, analizar datos visuales y proporcionarle soporte de realidad aumentada.', 'sophia');
            return;
        }

        // 3. IoT Lights command
        if (cmd.includes('luces') || cmd.includes('luz')) {
            if (cmd.includes('enciende') || cmd.includes('encender') || cmd.includes('activar') || cmd.includes('activa')) {
                if (!switchLights.checked) {
                    switchLights.checked = true;
                    triggerLightSwitch();
                    addMessage('Entendido. Encendiendo el sistema de iluminación inteligente del laboratorio.', 'sophia');
                } else {
                    addMessage('Las luces ya se encuentran activas, señor.', 'sophia');
                }
            } else if (cmd.includes('apaga') || cmd.includes('apagar') || cmd.includes('desactivar') || cmd.includes('desactiva')) {
                if (switchLights.checked) {
                    switchLights.checked = false;
                    triggerLightSwitch();
                    addMessage('Apagando las luces del laboratorio. Entrando en modo de ahorro energético.', 'sophia');
                } else {
                    addMessage('Las luces ya están apagadas, señor.', 'sophia');
                }
            } else {
                addMessage('El estado actual de las luces es ' + (switchLights.checked ? 'activado' : 'desactivado') + '.', 'sophia');
            }
            return;
        }

        // 4. Secure shield command
        if (cmd.includes('escudo') || cmd.includes('seguridad') || cmd.includes('firewall')) {
            if (cmd.includes('activa') || cmd.includes('enciende') || cmd.includes('conectar')) {
                switchShield.checked = true;
                addMessage('Cortafuegos y escudos de seguridad perimetral activados al cien por ciento.', 'sophia');
            } else if (cmd.includes('desactiva') || cmd.includes('apaga')) {
                switchShield.checked = false;
                addMessage('Advertencia: Escudos de seguridad perimetral desactivados. El sistema ahora es vulnerable.', 'sophia');
            } else {
                addMessage('El estado del escudo de seguridad es ' + (switchShield.checked ? 'activo' : 'inactivo') + '.', 'sophia');
            }
            return;
        }

        // 5. Vision activation
        if (cmd.includes('visión') || cmd.includes('vision') || cmd.includes('cámara') || cmd.includes('camara') || cmd.includes('ver')) {
            if (cmd.includes('activa') || cmd.includes('enciende') || cmd.includes('iniciar') || cmd.includes('abre')) {
                if (!cameraActive) {
                    startCamera();
                    addMessage('Iniciando feed de video en tiempo real. Ejecutando algoritmos de visión artificial y realidad aumentada.', 'sophia');
                } else {
                    addMessage('La visión de cámara ya está activa y analizando el entorno.', 'sophia');
                }
            } else if (cmd.includes('apaga') || cmd.includes('detener') || cmd.includes('cierra')) {
                if (cameraActive) {
                    stopCamera();
                    addMessage('Visión y cámara desactivados.', 'sophia');
                } else {
                    addMessage('La cámara ya se encuentra apagada.', 'sophia');
                }
            } else {
                addMessage('El sistema de visión está actualmente ' + (cameraActive ? 'activo' : 'inactivo') + '.', 'sophia');
            }
            return;
        }

        // 6. System status
        if (cmd.includes('estado del sistema') || cmd.includes('estado') || cmd.includes('diagnóstico') || cmd.includes('diagnostico')) {
            const activeIoTCount = [switchLights.checked, switchDoor.checked, switchAcs.checked, switchShield.checked].filter(Boolean).length;
            addMessage(`Estado del sistema: Frecuencia de CPU a ${cpuVal.textContent}, uso de memoria RAM a ${ramVal.textContent}, y temperatura del núcleo a ${tempVal.textContent}. Tenemos ${activeIoTCount} de 4 dispositivos IoT en línea y activos. Conexión de red estable.`, 'sophia');
            return;
        }

        // 7. General help or unhandled input
        addMessage('He recibido la instrucción: "' + command + '". Mis bases de datos sugieren que este comando requiere servicios externos aún no conectados, pero he registrado la consulta en mi bitácora.', 'sophia');
    }

    // Send text message on button click or Enter key
    sendBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (text) {
            addMessage(text, 'user');
            textInput.value = '';
            processCommand(text);
        }
    });

    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });

    // Theme selector change
    themeSelector.addEventListener('change', (e) => {
        setTheme(e.target.value);
    });

    function setTheme(themeName) {
        body.className = '';
        if (themeName !== 'default') {
            body.classList.add(`theme-${themeName}`);
        }
        currentTheme = themeName;
    }

    // Switch triggers for styling simulation
    function triggerLightSwitch() {
        if (switchLights.checked) {
            setTheme('emerald');
            themeSelector.value = 'emerald';
        } else {
            setTheme('default');
            themeSelector.value = 'default';
        }
    }

    switchLights.addEventListener('change', triggerLightSwitch);

    // Camera and Vision (WebRTC & Mock HUD Overlay)
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480, facingMode: "user" },
                audio: false 
            });
            webcam.srcObject = stream;
            cameraActive = true;
            toggleVisionBtn.textContent = "DESACTIVAR VISIÓN";
            document.querySelector('.camera-fallback-msg').style.display = 'none';
            resizeHUDCanvas();
        } catch (err) {
            console.warn("Camera access denied or unavailable. Fallback to simulated view activated.", err);
            // Simulate camera via canvas scan
            cameraActive = true;
            toggleVisionBtn.textContent = "DESACTIVAR VISIÓN";
            document.querySelector('.camera-fallback-msg').innerHTML = "<p>[CÁMARA FÍSICA NO DISPONIBLE]</p><p>SIMULACIÓN DE ENTORNOS AR ACTIVA</p>";
            resizeHUDCanvas();
        }
    }

    function stopCamera() {
        if (webcam.srcObject) {
            const tracks = webcam.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            webcam.srcObject = null;
        }
        cameraActive = false;
        toggleVisionBtn.textContent = "ACTIVAR VISIÓN";
        document.querySelector('.camera-fallback-msg').style.display = 'block';
        document.querySelector('.camera-fallback-msg').innerHTML = "<p>[SISTEMA DE VISIÓN EN ESPERA]</p><p>Di 'Activar visión' o haz clic abajo</p>";
        
        // Clear HUD detections
        simulatedDetections = [];
    }

    toggleVisionBtn.addEventListener('click', () => {
        if (cameraActive) {
            stopCamera();
        } else {
            startCamera();
        }
    });

    // Handle window resize for canvases
    window.addEventListener('resize', () => {
        resizeHUDCanvas();
        resizeVisualizerCanvas();
    });

    function resizeHUDCanvas() {
        if (!hudCanvas) return;
        const rect = hudCanvas.parentElement.getBoundingClientRect();
        hudCanvas.width = rect.width;
        hudCanvas.height = rect.height;
    }

    function resizeVisualizerCanvas() {
        if (!visualizerCanvas) return;
        const rect = visualizerCanvas.parentElement.getBoundingClientRect();
        visualizerCanvas.width = rect.width;
        visualizerCanvas.height = rect.height;
    }

    // Initialize canvas sizes
    resizeHUDCanvas();
    resizeVisualizerCanvas();

    // Simulated vision items
    const visionCatalog = [
        { name: "Humano (Señor)", confidence: "99.8%", width: 140, height: 260 },
        { name: "Pantalla Monitor", confidence: "94.2%", width: 180, height: 120 },
        { name: "Café Espresso", confidence: "88.1%", width: 50, height: 50 },
        { name: "Smartphone", confidence: "95.6%", width: 45, height: 90 },
        { name: "Gafas de lectura", confidence: "82.4%", width: 60, height: 30 },
        { name: "Teclado Mecánico", confidence: "92.0%", width: 150, height: 60 },
        { name: "Libro / Documento", confidence: "79.1%", width: 90, height: 110 }
    ];

    // Create new simulated detections randomly
    function updateSimulatedDetections() {
        if (!cameraActive) {
            simulatedDetections = [];
            return;
        }

        // Randomly decide to add/change detections
        if (simulatedDetections.length === 0 || Math.random() < 0.25) {
            const count = 1 + Math.floor(Math.random() * 3); // 1-3 detections
            simulatedDetections = [];
            
            for (let i = 0; i < count; i++) {
                const item = visionCatalog[Math.floor(Math.random() * visionCatalog.length)];
                // Random position on HUD canvas
                const margin = 50;
                const x = margin + Math.random() * (hudCanvas.width - item.width - margin*2);
                const y = margin + Math.random() * (hudCanvas.height - item.height - margin*2);
                
                simulatedDetections.push({
                    name: item.name,
                    confidence: item.confidence,
                    x: x,
                    y: y,
                    w: item.width,
                    h: item.height,
                    born: Date.now(),
                    duration: 3000 + Math.random() * 4000
                });
            }
        }

        // Filter out expired detections
        simulatedDetections = simulatedDetections.filter(d => Date.now() - d.born < d.duration);
    }

    // HUD Draw Loop
    function drawHUD() {
        requestAnimationFrame(drawHUD);
        if (!hudCanvas) return;
        const ctx = hudCanvas.getContext('2d');
        ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

        if (!cameraActive) return;

        updateSimulatedDetections();

        // Get colors from CSS variables dynamically
        const cyan = getComputedStyle(body).getPropertyValue('--color-cyan').trim() || '#00f0ff';
        const magenta = getComputedStyle(body).getPropertyValue('--color-magenta').trim() || '#ff0055';
        const amber = getComputedStyle(body).getPropertyValue('--color-amber').trim() || '#ffaa00';

        // Draw HUD overlay reticle (center crosshair)
        const cx = hudCanvas.width / 2;
        const cy = hudCanvas.height / 2;
        
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 1;
        
        // Center circle
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = cyan;
        ctx.fill();

        // Cross lines
        ctx.beginPath();
        ctx.moveTo(cx - 50, cy); ctx.lineTo(cx - 35, cy);
        ctx.moveTo(cx + 35, cy); ctx.lineTo(cx + 50, cy);
        ctx.moveTo(cx, cy - 50); ctx.lineTo(cx, cy - 35);
        ctx.moveTo(cx, cy + 35); ctx.lineTo(cx, cy + 50);
        ctx.stroke();

        // Tech corners in HUD
        const padding = 15;
        const len = 20;
        ctx.strokeStyle = cyan;
        
        // Top Left
        ctx.beginPath();
        ctx.moveTo(padding, padding + len); ctx.lineTo(padding, padding); ctx.lineTo(padding + len, padding);
        ctx.stroke();
        // Top Right
        ctx.beginPath();
        ctx.moveTo(hudCanvas.width - padding, padding + len); ctx.lineTo(hudCanvas.width - padding, padding); ctx.lineTo(hudCanvas.width - padding - len, padding);
        ctx.stroke();
        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(padding, hudCanvas.height - padding - len); ctx.lineTo(padding, hudCanvas.height - padding); ctx.lineTo(padding + len, hudCanvas.height - padding);
        ctx.stroke();
        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(hudCanvas.width - padding, hudCanvas.height - padding - len); ctx.lineTo(hudCanvas.width - padding, hudCanvas.height - padding); ctx.lineTo(hudCanvas.width - padding - len, hudCanvas.height - padding);
        ctx.stroke();

        // Draw Bounding Boxes and AR HUD tags
        simulatedDetections.forEach(det => {
            const age = Date.now() - det.born;
            const pulseAlpha = Math.sin(age / 100) * 0.15 + 0.85;

            // Bounding box border
            ctx.strokeStyle = magenta;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(det.x, det.y, det.w, det.h);

            // Bounding box corner brackets
            ctx.fillStyle = magenta;
            const bSize = 6;
            ctx.fillRect(det.x - 1, det.y - 1, bSize, bSize);
            ctx.fillRect(det.x + det.w - bSize + 1, det.y - 1, bSize, bSize);
            ctx.fillRect(det.x - 1, det.y + det.h - bSize + 1, bSize, bSize);
            ctx.fillRect(det.x + det.w - bSize + 1, det.y + det.h - bSize + 1, bSize, bSize);

            // Tech tag line
            ctx.strokeStyle = amber;
            ctx.beginPath();
            ctx.moveTo(det.x + det.w, det.y + 10);
            ctx.lineTo(det.x + det.w + 20, det.y - 10);
            ctx.lineTo(det.x + det.w + 60, det.y - 10);
            ctx.stroke();

            // Tech label text
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Share Tech Mono"';
            ctx.fillText(det.name.toUpperCase(), det.x + det.w + 25, det.y - 25);
            
            ctx.fillStyle = cyan;
            ctx.fillText(`CONF: ${det.confidence}`, det.x + det.w + 25, det.y - 15);
            ctx.fillStyle = magenta;
            ctx.fillText(`OBJ_LOC: [X:${Math.round(det.x)}, Y:${Math.round(det.y)}]`, det.x + det.w + 25, det.y - 5);
        });

        // Scan scanline UI text
        ctx.fillStyle = cyan;
        ctx.font = '11px "Share Tech Mono"';
        ctx.fillText("SISTEMA DE ANÁLISIS HUD v1.0", padding + 5, padding + 35);
        ctx.fillText(`RESOLUCIÓN: ${hudCanvas.width}x${hudCanvas.height}`, padding + 5, padding + 48);
        ctx.fillText(`ESTADO DE FLUJO: ACTIVO`, padding + 5, padding + 61);
    }

    // Hologram Waveform Animation Loop
    let phase = 0;
    function drawHologramWaveform() {
        requestAnimationFrame(drawHologramWaveform);
        if (!visualizerCanvas) return;
        const ctx = visualizerCanvas.getContext('2d');
        ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

        const cx = visualizerCanvas.width / 2;
        const cy = visualizerCanvas.height / 2;
        
        const cyan = getComputedStyle(body).getPropertyValue('--color-cyan').trim() || '#00f0ff';
        const magenta = getComputedStyle(body).getPropertyValue('--color-magenta').trim() || '#ff0055';
        
        phase += 0.05;

        // Draw multiple circles of tech rings
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 1;

        // Outer dotted ring
        ctx.setLineDash([2, 8]);
        ctx.beginPath();
        ctx.arc(cx, cy, 115, phase * 0.1, phase * 0.1 + Math.PI * 2);
        ctx.stroke();

        // Inner dashed ring rotating other way
        ctx.strokeStyle = magenta;
        ctx.setLineDash([12, 15]);
        ctx.beginPath();
        ctx.arc(cx, cy, 95, -phase * 0.2, -phase * 0.2 + Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]); // Reset dash

        // Draw interactive waveform inside orb
        if (isSpeaking) {
            // Draw active sine waves (speaking state)
            ctx.strokeStyle = magenta;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let i = -60; i <= 60; i += 2) {
                const x = cx + i;
                const amplitude = Math.sin(phase * 2) * 20 + 5;
                const y = cy + Math.sin(i * 0.15 + phase * 4) * Math.cos(i * 0.03) * amplitude * 0.6;
                
                if (i === -60) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Second overlapping wave
            ctx.strokeStyle = cyan;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = -60; i <= 60; i += 2) {
                const x = cx + i;
                const amplitude = Math.sin(phase * 1.5) * 15 + 2;
                const y = cy + Math.sin(i * 0.2 - phase * 3) * Math.cos(i * 0.02) * amplitude * 0.5;
                if (i === -60) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        } else if (isListening) {
            // Pulsing target lines when listening
            ctx.strokeStyle = magenta;
            ctx.lineWidth = 1.5;
            
            const radius = 60 + Math.sin(phase * 5) * 6;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Radiating pulses
            ctx.strokeStyle = 'rgba(255, 0, 85, 0.3)';
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 20, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Calm state waveform
            ctx.strokeStyle = cyan;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = -50; i <= 50; i += 2) {
                const x = cx + i;
                const y = cy + Math.sin(i * 0.1 + phase) * 3;
                if (i === -50) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }

    // Hardware simulation stats
    function simulateHardwareStats() {
        setInterval(() => {
            const cpu = 15 + Math.floor(Math.random() * 25); // 15% - 40%
            const ram = 45 + Math.floor(Math.random() * 8);   // 45% - 53%
            const temp = 38 + Math.floor(Math.random() * 12); // 38°C - 50°C

            cpuBar.style.width = `${cpu}%`;
            cpuVal.textContent = `${cpu}%`;

            ramBar.style.width = `${ram}%`;
            ramVal.textContent = `${ram}%`;

            tempBar.style.width = `${(temp / 100) * 100}%`;
            tempVal.textContent = `${temp}°C`;
        }, 3000);
    }

    // Initial hardware run
    cpuBar.style.width = '24%';
    ramBar.style.width = '48%';
    tempBar.style.width = '42%';

    // Start Loops
    drawHUD();
    drawHologramWaveform();
    simulateHardwareStats();

    // Sophia welcome message after a short delay
    setTimeout(() => {
        addMessage('Sistemas cargados. Todos los canales locales en línea. Hola, señor. Estoy lista para sus comandos.', 'sophia');
    }, 1500);
});
