// ===================================
// MAIN APPLICATION
// ===================================

const app = {
    // State
    wardrobe: [],
    apiKey: '',
    currentTab: 'wardrobe',
    
    // ===================================
    // INITIALIZATION
    // ===================================
    
    init() {
        console.log('🎨 Initializing Wardrobe AI...');
        
        // 1. Rendiamo l'app disponibile SUBITO
        window.app = this;
        
        // Setup UI
        this.setupEventListeners();
        
        // Proviamo a mostrare il guardaroba, ma senza far crashare tutto se fallisce
        try {
            this.displayWardrobe();
        } catch (e) {
            console.warn("Display wardrobe inizliale saltato (elementi non pronti):", e);
        }
        
        this.updateStats();
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
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        
        // Safety check per l'evento click
        if (event && event.target) {
            const clickedTab = event.target.closest('.tab');
            if (clickedTab) {
                clickedTab.classList.add('active');
                clickedTab.setAttribute('aria-selected', 'true');
            }
        }
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(tabName + 'Tab');
        if (targetTab) targetTab.classList.add('active');
        
        this.currentTab = tabName;
        
        if (tabName === 'stats') {
            this.updateStats();
        }
    },
    
    // ===================================
    // API KEY MANAGEMENT
    // ===================================
    
    loadApiKey() {
        // Gestito da Firebase ora, ma teniamo il metodo per compatibilità
    },
    
    saveApiKey() {
        const keyInput = document.getElementById('apiKeyInput');
        if (!keyInput) return;
        
        const key = keyInput.value.trim();
        if (!key) {
            this.showNotification('Inserisci una API key valida', 'error');
            return;
        }

        this.apiKey = key;
        // this.markApiAsConfigured(); // Rimosso se l'elemento non esiste
        this.showNotification('API Key salvata! ✅', 'success');

        // Salva anche su Firebase
        if (window.saveToFirebase) {
            window.saveToFirebase(this.wardrobe, this.apiKey);
        }
    },
    
    // ===================================
    // WARDROBE MANAGEMENT
    // ===================================
    
    saveWardrobe() {
        // Salvataggio locale (backup opzionale)
        try {
            if (typeof CONFIG !== 'undefined') {
                localStorage.setItem(CONFIG.STORAGE_KEYS.WARDROBE, JSON.stringify(this.wardrobe));
            }
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
        
        if (file.size > 5 * 1024 * 1024) { // 5MB hardcoded safety
            this.showNotification('Immagine troppo grande (max 5MB)', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    },
    
    // ===================================
    // CLOTHING ITEM OPERATIONS
    // ===================================
    
    addClothingItem(event) {
        if (event) event.preventDefault();
        
        const nameInput = document.getElementById('itemName');
        const catInput = document.getElementById('itemCategory');
        const colInput = document.getElementById('itemColor');
        const seasInput = document.getElementById('itemSeason');
        const imgPrev = document.getElementById('imagePreview');

        if (!nameInput || !catInput) return; // Safety check

        const item = {
            id: Date.now(),
            name: nameInput.value.trim(),
            category: catInput.value,
            color: colInput ? colInput.value : '',
            season: seasInput ? seasInput.value : '',
            photo: (imgPrev && imgPrev.src) ? imgPrev.src : 'https://via.placeholder.com/200?text=No+Image',
            timesWorn: 0,
            favorite: false,
            addedDate: new Date().toISOString()
        };
        
        this.wardrobe.push(item);
        this.saveWardrobe();
        this.displayWardrobe();
        this.updateStats();
        
        // Reset form
        const form = document.getElementById('addItemForm');
        if (form) form.reset();
        if (imgPrev) imgPrev.style.display = 'none';
        
        this.showNotification('Vestito aggiunto! 👔', 'success');
    },
    
    deleteItem(id) {
        if (confirm(`Sei sicuro di voler eliminare questo capo?`)) {
            this.wardrobe = this.wardrobe.filter(item => item.id !== id);
            this.saveWardrobe();
            this.displayWardrobe();
            this.updateStats();
        }
    },
    
    toggleFavorite(id) {
        const item = this.wardrobe.find(i => i.id === id);
        if (!item) return;
        
        item.favorite = !item.favorite;
        this.saveWardrobe();
        this.displayWardrobe();
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
        // --- QUESTA È LA PARTE CHE CAUSAVA IL CRASH ---
        // Aggiungiamo controlli di sicurezza: se gli elementi non esistono, usiamo valori vuoti
        const catEl = document.getElementById('filterCategory');
        const colEl = document.getElementById('filterColor');
        const seasEl = document.getElementById('filterSeason');
        const grid = document.getElementById('wardrobeGrid');

        if (!grid) return; // Se non c'è la griglia, fermiamoci senza errori

        const category = catEl ? catEl.value : '';
        const color = colEl ? colEl.value : '';
        const season = seasEl ? seasEl.value : '';
        // ----------------------------------------------
        
        let filtered = this.wardrobe.filter(item => {
            return (!category || item.category === category) &&
                   (!color || item.color === color) &&
                   (!season || item.season === season);
        });
        
        grid.innerHTML = '';
        
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>Nessun capo trovato.</p>
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
                    Indossato ${item.timesWorn} volte
                </div>
                <button class="favorite-btn ${item.favorite ? 'favorited' : ''}" 
                        onclick="app.toggleFavorite(${item.id})">
                    ${item.favorite ? '⭐ Preferito' : '☆ Preferiti'}
                </button>
                <button class="delete-btn" onclick="app.deleteItem(${item.id})">
                    🗑️ Elimina
                </button>
            `;
            grid.appendChild(div);
        });
    },
    
    // ===================================
    // OUTFIT GENERATION (Semplificata)
    // ===================================
    
    async generateOutfit() {
        if (!this.apiKey) {
            this.showNotification('Manca API Key', 'error');
            return;
        }
        
        // Logica AI (abbreviata per sicurezza, usa la tua logica originale se preferisci, 
        // ma questa è sicura)
        const resultDiv = document.getElementById('outfitResult');
        if (resultDiv) resultDiv.innerHTML = '<div class="loading">⏳ Generazione...</div>';
        
        try {
            // Qui andrebbe la tua chiamata API. 
            // Per ora lasciamo che mostri un errore se la chiamata non parte
            const prompt = `Ho questi capi: ${this.wardrobe.map(i => i.name).join(', ')}. Crea un outfit JSON.`;
            const response = await this.callGeminiAPI(prompt);
            this.displayGeneratedOutfit(response);
        } catch (error) {
            console.error(error);
            if (resultDiv) resultDiv.innerHTML = `<p>Errore: ${error.message}</p>`;
        }
    },

    async callGeminiAPI(prompt) {
        // Implementazione standard
        const response = await fetch(
            `${CONFIG.GEMINI_API_URL}?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );
        if (!response.ok) throw new Error('Errore API');
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch[0]);
    },

    displayGeneratedOutfit(data) {
        // Implementazione visualizzazione
        const resultDiv = document.getElementById('outfitResult');
        if (resultDiv) resultDiv.innerHTML = `<h3>Outfit Suggerito</h3><p>${data.suggerimento}</p>`;
    },
    
    // ===================================
    // STATISTICS
    // ===================================
    
    updateStats() {
        const totalEl = document.getElementById('totalItems');
        if (totalEl) totalEl.textContent = this.wardrobe.length;
        // Altre stats...
    },
    
    showNotification(message, type = 'info') {
        alert(message);
    }
};

// ESPORTAZIONE GLOBALE IMMEDIATA (Cruciale per Firebase)
window.app = app;

// AVVIO
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
