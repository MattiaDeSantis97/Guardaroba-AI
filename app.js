// ===================================
// MAIN APPLICATION
// ===================================

/**
 * Wardrobe AI Application
 * Main application logic for managing wardrobe and generating AI outfits
 */

const app = {
    // State
    wardrobe: [],
    apiKey: '',
    currentTab: 'wardrobe',
    
    // ===================================
    // INITIALIZATION
    // ===================================
    
    // In app.js
init() {
    console.log('🎨 Initializing Wardrobe AI...');
    // this.loadWardrobe();  <-- RIMUOVI o COMMENTA
    // this.loadApiKey();    <-- RIMUOVI o COMMENTA

    // Lascia solo questo per il setup iniziale della UI vuota
    this.displayWardrobe(); 
    this.updateStats();
    this.setupEventListeners();

    // Rendiamo l'app accessibile globalmente per firebase-logic.js
    window.app = this; 
},
    
    setupEventListeners() {
        // Prevent form submission on enter in text inputs
        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                }
            });
        });
    },
    
    // ===================================
    // TAB MANAGEMENT
    // ===================================
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        event.target.closest('.tab').classList.add('active');
        event.target.closest('.tab').setAttribute('aria-selected', 'true');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        this.currentTab = tabName;
        
        // Update stats when switching to stats tab
        if (tabName === 'stats') {
            this.updateStats();
        }
    },
    
    // ===================================
    // API KEY MANAGEMENT
    // ===================================
    
    loadApiKey() {
        const savedKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
        if (savedKey) {
            this.apiKey = savedKey;
            document.getElementById('apiKeyInput').value = savedKey;
            this.markApiAsConfigured();
        }
    },
    
    saveApiKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key) {
        this.showNotification('Inserisci una API key valida', 'error');
        return;
    }

    this.apiKey = key;
    this.markApiAsConfigured();
    this.showNotification('API Key salvata! ✅', 'success');

    // Salva anche su Firebase
    if (window.saveToFirebase) {
        window.saveToFirebase(this.wardrobe, this.apiKey);
    }
},
    
    markApiAsConfigured() {
        const apiSetup = document.getElementById('apiSetup');
        apiSetup.classList.add('configured');
        apiSetup.querySelector('h3').textContent = '✅ API Configurata';
    },
    
    // ===================================
    // WARDROBE MANAGEMENT
    // ===================================
    
    loadWardrobe() {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.WARDROBE);
        if (saved) {
            try {
                this.wardrobe = JSON.parse(saved);
                console.log(`📦 Loaded ${this.wardrobe.length} items from storage`);
            } catch (error) {
                console.error('Error loading wardrobe:', error);
                this.wardrobe = [];
            }
        }
    },
    
    saveWardrobe() {
    // Salvataggio locale (backup opzionale)
    try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.WARDROBE, JSON.stringify(this.wardrobe));
    } catch (e) {}

    // SALVATAGGIO CLOUD (Nuovo)
    if (window.saveToFirebase) {
        window.saveToFirebase(this.wardrobe, this.apiKey);
    }
},
    
    // ===================================
    // IMAGE HANDLING
    // ===================================
    
    previewImage(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!CONFIG.DEFAULTS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            this.showNotification('Formato immagine non supportato', 'error');
            return;
        }
        
        // Validate file size
        if (file.size > CONFIG.DEFAULTS.MAX_IMAGE_SIZE) {
            this.showNotification('Immagine troppo grande (max 5MB)', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.onerror = () => {
            this.showNotification('Errore nel caricamento dell\'immagine', 'error');
        };
        reader.readAsDataURL(file);
    },
    
    // ===================================
    // CLOTHING ITEM OPERATIONS
    // ===================================
    
    addClothingItem(event) {
        event.preventDefault();
        
        const item = {
            id: Date.now(),
            name: document.getElementById('itemName').value.trim(),
            category: document.getElementById('itemCategory').value,
            color: document.getElementById('itemColor').value,
            season: document.getElementById('itemSeason').value,
            photo: document.getElementById('imagePreview').src || CONFIG.DEFAULTS.PLACEHOLDER_IMAGE,
            timesWorn: 0,
            favorite: false,
            addedDate: new Date().toISOString()
        };
        
        this.wardrobe.push(item);
        this.saveWardrobe();
        this.displayWardrobe();
        this.updateStats();
        
        // Reset form
        document.getElementById('addItemForm').reset();
        document.getElementById('imagePreview').style.display = 'none';
        
        this.showNotification('Vestito aggiunto al guardaroba! 👔', 'success');
        
        // Scroll to the wardrobe grid on mobile
        if (window.innerWidth < 768) {
            document.getElementById('wardrobeGrid').scrollIntoView({ behavior: 'smooth' });
        }
    },
    
    deleteItem(id) {
        const item = this.wardrobe.find(i => i.id === id);
        if (!item) return;
        
        if (confirm(`Sei sicuro di voler eliminare "${item.name}"?`)) {
            this.wardrobe = this.wardrobe.filter(item => item.id !== id);
            this.saveWardrobe();
            this.displayWardrobe();
            this.updateStats();
            this.showNotification('Capo eliminato', 'success');
        }
    },
    
    toggleFavorite(id) {
        const item = this.wardrobe.find(i => i.id === id);
        if (!item) return;
        
        item.favorite = !item.favorite;
        this.saveWardrobe();
        this.displayWardrobe();
        
        const message = item.favorite ? 'Aggiunto ai preferiti ⭐' : 'Rimosso dai preferiti';
        this.showNotification(message, 'success');
    },
    
    incrementWorn(id) {
        const item = this.wardrobe.find(i => i.id === id);
        if (item) {
            item.timesWorn++;
            this.saveWardrobe();
        }
    },
    
    // ===================================
    // FILTERING & DISPLAY
    // ===================================
    
    filterWardrobe() {
        this.displayWardrobe();
    },
    
    displayWardrobe() {
        const category = document.getElementById('filterCategory').value;
        const color = document.getElementById('filterColor').value;
        const season = document.getElementById('filterSeason').value;
        
        let filtered = this.wardrobe.filter(item => {
            return (!category || item.category === category) &&
                   (!color || item.color === color) &&
                   (!season || item.season === season);
        });
        
        const grid = document.getElementById('wardrobeGrid');
        grid.innerHTML = '';
        
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>Nessun capo trovato. Aggiungi il tuo primo vestito! 👕</p>
                </div>
            `;
            return;
        }
        
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'clothing-item';
            div.innerHTML = `
                <img src="${item.photo}" alt="${item.name}" loading="lazy">
                <span class="category">${item.category}</span>
                <h3>${item.name}</h3>
                <div class="tags">
                    🎨 ${item.color} | 🌤️ ${item.season}
                </div>
                <div class="stats">
                    👔 Indossato ${item.timesWorn} volt${item.timesWorn === 1 ? 'a' : 'e'}
                    ${item.favorite ? '⭐ Preferito' : ''}
                </div>
                <button class="favorite-btn ${item.favorite ? 'favorited' : ''}" 
                        onclick="app.toggleFavorite(${item.id})"
                        aria-label="${item.favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}">
                    ${item.favorite ? '⭐ Preferito' : '☆ Aggiungi ai preferiti'}
                </button>
                <button class="delete-btn" 
                        onclick="app.deleteItem(${item.id})"
                        aria-label="Elimina ${item.name}">
                    🗑️ Elimina
                </button>
            `;
            grid.appendChild(div);
        });
    },
    
    // ===================================
    // OUTFIT GENERATION
    // ===================================
    
    async generateOutfit() {
        if (!this.apiKey) {
            this.showNotification('Configura prima la tua API key di Gemini!', 'error');
            // Scroll to API setup
            document.getElementById('apiSetup').scrollIntoView({ behavior: 'smooth' });
            return;
        }
        
        if (this.wardrobe.length < 3) {
            this.showNotification('Aggiungi almeno 3 capi al guardaroba per generare outfit!', 'warning');
            this.switchTab('wardrobe');
            return;
        }
        
        const occasion = document.getElementById('occasionSelect').value;
        const notes = document.getElementById('outfitNotes').value.trim();
        const resultDiv = document.getElementById('outfitResult');
        
        resultDiv.innerHTML = '<div class="loading">⏳ Generazione outfit in corso...</div>';
        
        try {
            const wardrobeDescription = this.wardrobe.map(item => 
                `${item.name} (${item.category}, ${item.color}, ${item.season})`
            ).join(', ');
            
            const prompt = `Sei un esperto consulente di moda italiano. Ho questi capi nel mio guardaroba: ${wardrobeDescription}.

Occasione: ${occasion}
${notes ? `Note aggiuntive: ${notes}` : ''}

Crea un outfit completo scegliendo i capi più adatti dal mio guardaroba. Rispondi SOLO in formato JSON con questa struttura esatta:
{
    "outfit": ["nome capo 1", "nome capo 2", "nome capo 3"],
    "suggerimento": "breve spiegazione dello styling (max 2-3 frasi)",
    "consiglio_meteo": "suggerimento basato sulla stagione (max 1 frase)"
}

IMPORTANTE: 
- Scegli SOLO capi che ho effettivamente nel guardaroba
- Usa i nomi ESATTI dei capi
- Crea outfit bilanciati (es: 1 parte superiore + 1 parte inferiore + 1 accessorio/scarpe)
- Considera colori e stagioni compatibili`;
            
            const response = await this.callGeminiAPI(prompt);
            
            if (!response || !response.outfit || !Array.isArray(response.outfit)) {
                throw new Error('Formato risposta non valido');
            }
            
            this.displayGeneratedOutfit(response);
            
        } catch (error) {
            console.error('Error generating outfit:', error);
            resultDiv.innerHTML = `
                <div class="generated-outfit" style="border-color: var(--danger-color);">
                    <h3>❌ Errore</h3>
                    <p>Si è verificato un errore nella generazione dell'outfit.</p>
                    <p style="font-size: 12px; color: var(--gray-500); margin-top: 10px;">
                        ${error.message}
                    </p>
                    <p style="font-size: 12px; color: var(--gray-500); margin-top: 5px;">
                        Verifica che la tua API key sia corretta e che hai abbastanza capi nel guardaroba.
                    </p>
                </div>
            `;
        }
    },
    
    async callGeminiAPI(prompt) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CONFIG.API_CONFIG.REQUEST_TIMEOUT);
        
        try {
            const response = await fetch(
                `${CONFIG.GEMINI_API_URL}?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        }
                    }),
                    signal: controller.signal
                }
            );
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                throw new Error('Risposta API non valida');
            }
            
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Formato risposta non valido - JSON non trovato');
            }
            
            return JSON.parse(jsonMatch[0]);
            
        } catch (error) {
            clearTimeout(timeout);
            if (error.name === 'AbortError') {
                throw new Error('Richiesta timeout - riprova');
            }
            throw error;
        }
    },
    
    displayGeneratedOutfit(outfitData) {
        const selectedItems = outfitData.outfit.map(name => {
            return this.wardrobe.find(item => 
                item.name.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(item.name.toLowerCase())
            );
        }).filter(item => item);
        
        if (selectedItems.length === 0) {
            throw new Error('Nessun capo corrispondente trovato');
        }
        
        // Increment worn counter
        selectedItems.forEach(item => this.incrementWorn(item.id));
        
        let outfitHTML = '<div class="generated-outfit">';
        outfitHTML += '<h3>✨ Il Tuo Outfit Perfetto</h3>';
        outfitHTML += '<div class="outfit-items">';
        
        selectedItems.forEach(item => {
            outfitHTML += `
                <div class="outfit-item">
                    <img src="${item.photo}" alt="${item.name}" loading="lazy">
                    <p><strong>${item.name}</strong></p>
                    <p style="font-size: 14px; color: var(--gray-500);">${item.category}</p>
                </div>
            `;
        });
        
        outfitHTML += '</div>';
        outfitHTML += `
            <div class="ai-suggestion">
                <h4>💡 Suggerimento Styling</h4>
                <p>${outfitData.suggerimento}</p>
                ${outfitData.consiglio_meteo ? `<p style="margin-top: 10px;"><strong>🌤️ ${outfitData.consiglio_meteo}</strong></p>` : ''}
            </div>
        `;
        outfitHTML += '</div>';
        
        document.getElementById('outfitResult').innerHTML = outfitHTML;
        this.saveWardrobe();
        this.updateStats();
    },
    
    // ===================================
    // STATISTICS
    // ===================================
    
    updateStats() {
        // Total items
        document.getElementById('totalItems').textContent = this.wardrobe.length;
        
        // Total categories
        const categories = [...new Set(this.wardrobe.map(item => item.category))];
        document.getElementById('totalCategories').textContent = categories.length;
        
        // Most used color
        const colorCount = {};
        this.wardrobe.forEach(item => {
            colorCount[item.color] = (colorCount[item.color] || 0) + 1;
        });
        const mostUsedColor = Object.keys(colorCount).length > 0
            ? Object.keys(colorCount).reduce((a, b) => colorCount[a] > colorCount[b] ? a : b)
            : '-';
        document.getElementById('mostUsedColor').textContent = mostUsedColor;
        
        // Dominant season
        const seasonCount = {};
        this.wardrobe.forEach(item => {
            seasonCount[item.season] = (seasonCount[item.season] || 0) + 1;
        });
        const dominantSeason = Object.keys(seasonCount).length > 0
            ? Object.keys(seasonCount).reduce((a, b) => seasonCount[a] > seasonCount[b] ? a : b)
            : '-';
        document.getElementById('seasonCoverage').textContent = dominantSeason;
        
        // Top items
        this.displayTopItems();
    },
    
    displayTopItems() {
        const topItems = [...this.wardrobe]
            .sort((a, b) => b.timesWorn - a.timesWorn)
            .slice(0, 5);
        
        const topList = document.getElementById('topItemsList');
        topList.innerHTML = '';
        
        if (topItems.length === 0) {
            topList.innerHTML = '<div class="empty-state"><p>Nessun dato disponibile</p></div>';
            return;
        }
        
        topItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'top-item';
            div.innerHTML = `
                <img src="${item.photo}" alt="${item.name}" loading="lazy">
                <div>
                    <strong>${index + 1}. ${item.name}</strong>
                    <p style="color: var(--gray-500); font-size: 14px;">
                        ${item.category} - Indossato ${item.timesWorn} volt${item.timesWorn === 1 ? 'a' : 'e'}
                    </p>
                </div>
            `;
            topList.appendChild(div);
        });
    },
    
    // ===================================
    // NOTIFICATIONS
    // ===================================
    
    showNotification(message, type = 'info') {
        // Simple alert for now - can be enhanced with custom notification system
        const emoji = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        alert(`${emoji[type] || ''} ${message}`);
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = app;
}
