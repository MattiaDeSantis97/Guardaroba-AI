// ===================================
// MAIN APPLICATION - VERSIONE FIX 1.5
// ===================================

const app = {
    wardrobe: [],
    apiKey: '',
    currentTab: 'wardrobe',
    
    init() {
        console.log('🎨 Initializing Wardrobe AI...');
        
        // 1. MESSAGGIO DI DEBUG (Se non vedi questo, è la cache!)
        alert("VERSIONE AGGIORNATA CARICATA! ✅");

        // 2. RECUPERA LA CHIAVE (Prova dal config, se no la chiede)
        if (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_API_KEY) {
            this.apiKey = CONFIG.GEMINI_API_KEY;
        }
        
        // Nascondi box configurazione se la chiave c'è
        const apiSetup = document.getElementById('apiSetup');
        if (this.apiKey && apiSetup) {
            apiSetup.style.display = 'none';
        }
        
        window.app = this;
        this.setupEventListeners();
        
        try { this.displayWardrobe(); } catch (e) {}
        this.updateStats();
    },
    
    // --- FUNZIONE DI GENERAZIONE OUTFIT (Cuore del problema) ---
    async generateOutfit() {
        // Fallback chiave
        if (!this.apiKey && typeof CONFIG !== 'undefined') this.apiKey = CONFIG.GEMINI_API_KEY;

        if (!this.apiKey) {
            alert('Errore: API Key mancante in config.js');
            return;
        }
        
        const resultDiv = document.getElementById('outfitResult');
        if (resultDiv) resultDiv.innerHTML = '<div class="loading">⏳ Generazione in corso...</div>';
        
        try {
            const wardrobeDesc = this.wardrobe.map(i => `${i.name} (${i.category}, ${i.color})`).join(', ');
            const occasion = document.getElementById('occasionSelect').value;
            const notes = document.getElementById('outfitNotes').value;

            const prompt = `Sei un esperto di moda. Ho: ${wardrobeDesc}. Occasione: ${occasion}. Note: ${notes}. Crea un outfit. Rispondi SOLO JSON: {"outfit": ["capo1", "capo2"], "suggerimento": "testo"}`;
            
            // CHIAMATA API DIRETTA
            const response = await this.callGeminiAPI(prompt);
            this.displayGeneratedOutfit(response);
            
        } catch (error) {
            console.error(error);
            if (resultDiv) resultDiv.innerHTML = `<div class="generated-outfit" style="border-color:red"><h3>❌ Errore</h3><p>${error.message}</p></div>`;
        }
    },

    async callGeminiAPI(prompt) {
        // --- URL BLINDATO (Hardcoded) ---
        // Usiamo gemini-1.5-flash che è il più veloce e supportato
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
        
        console.log("Tentativo chiamata a:", url); // Debug in console

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        
        // Gestione errori specifica di Google
        if (!response.ok) {
            throw new Error(data.error?.message || 'Errore Google API');
        }
        
        if (!data.candidates || !data.candidates[0].content) throw new Error('Nessuna risposta generata');
        
        const text = data.candidates[0].content.parts[0].text;
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    },

    // --- LE ALTRE FUNZIONI STANDARD (Non toccare) ---
    setupEventListeners() {
        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
            });
        });
    },
    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        if(event && event.target) event.target.closest('.tab').classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tabName + 'Tab').classList.add('active');
        this.currentTab = tabName;
        if(tabName === 'stats') this.updateStats();
    },
    saveApiKey() {},
    saveWardrobe() {
        if (window.saveToFirebase) window.saveToFirebase(this.wardrobe, this.apiKey);
        try { if (typeof CONFIG !== 'undefined') localStorage.setItem(CONFIG.STORAGE_KEYS.WARDROBE, JSON.stringify(this.wardrobe)); } catch (e) {}
    },
    previewImage(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
        };
        reader.readAsDataURL(file);
    },
    addClothingItem(event) {
        if (event) event.preventDefault();
        const name = document.getElementById('itemName').value;
        const cat = document.getElementById('itemCategory').value;
        const col = document.getElementById('itemColor').value;
        const seas = document.getElementById('itemSeason').value;
        const img = document.getElementById('imagePreview');
        if (!name || !cat) return;
        this.wardrobe.push({
            id: Date.now(), name, category: cat, color: col, season: seas,
            photo: (img && img.src) ? img.src : 'https://via.placeholder.com/200',
            timesWorn: 0, favorite: false
        });
        this.saveWardrobe(); this.displayWardrobe(); this.updateStats();
        document.getElementById('addItemForm').reset();
        if(img) img.style.display = 'none';
        alert('Vestito aggiunto! 👔');
    },
    deleteItem(id) {
        if (confirm('Eliminare?')) { this.wardrobe = this.wardrobe.filter(i => i.id !== id); this.saveWardrobe(); this.displayWardrobe(); this.updateStats(); }
    },
    toggleFavorite(id) {
        const item = this.wardrobe.find(i => i.id === id);
        if(item) { item.favorite = !item.favorite; this.saveWardrobe(); this.displayWardrobe(); }
    },
    incrementWorn(id) {
        const item = this.wardrobe.find(i => i.id === id);
        if(item) { item.timesWorn++; this.saveWardrobe(); }
    },
    filterWardrobe() { this.displayWardrobe(); },
    displayWardrobe() {
        const grid = document.getElementById('wardrobeGrid');
        if (!grid) return;
        const cat = document.getElementById('filterCategory')?.value;
        const col = document.getElementById('filterColor')?.value;
        const seas = document.getElementById('filterSeason')?.value;
        
        let filtered = this.wardrobe.filter(item => 
            (!cat || item.category === cat) && (!col || item.color === col) && (!seas || item.season === seas)
        );
        grid.innerHTML = filtered.length ? '' : '<div class="empty-state"><p>Nessun capo.</p></div>';
        filtered.forEach(item => {
            grid.innerHTML += `
                <div class="clothing-item">
                    <img src="${item.photo}" loading="lazy">
                    <span class="category">${item.category}</span>
                    <h3>${item.name}</h3>
                    <div class="tags">🎨 ${item.color} | 🌤️ ${item.season}</div>
                    <button class="delete-btn" onclick="app.deleteItem(${item.id})">🗑️ Elimina</button>
                </div>`;
        });
    },
    displayGeneratedOutfit(data) {
        const resultDiv = document.getElementById('outfitResult');
        if (!resultDiv) return;
        let html = `<div class="generated-outfit"><h3>✨ Outfit Suggerito</h3><div class="outfit-items">`;
        let foundAny = false;
        data.outfit.forEach(name => {
            const item = this.wardrobe.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
            if(item) {
                html += `<div class="outfit-item"><img src="${item.photo}"><p><strong>${item.name}</strong></p></div>`;
                foundAny = true;
            }
        });
        if(!foundAny) html += `<p>Suggeriti: ${data.outfit.join(', ')}</p>`;
        html += `</div><div class="ai-suggestion"><p>${data.suggerimento}</p></div></div>`;
        resultDiv.innerHTML = html;
    },
    updateStats() {
        const el = document.getElementById('totalItems');
        if(el) el.textContent = this.wardrobe.length;
    }
};

window.app = app;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => app.init());
else app.init();
