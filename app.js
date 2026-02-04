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
        
        // RECUPERA LA CHIAVE DAL CONFIG
        if (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_API_KEY) {
            this.apiKey = CONFIG.GEMINI_API_KEY;
        }
        
        // Nascondi box configurazione
        const apiSetup = document.getElementById('apiSetup');
        if (apiSetup) apiSetup.style.display = 'none';
        
        // Rendi l'app globale
        window.app = this;
        
        this.setupEventListeners();
        
        try {
            this.displayWardrobe();
        } catch (e) {
            console.warn("Display wardrobe saltato:", e);
        }
        
        this.updateStats();
    },
    
    setupEventListeners() {
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
    
    saveApiKey() {
        // Funzione legacy mantenuta per evitare errori
    },
    
    // ===================================
    // WARDROBE MANAGEMENT
    // ===================================
    
    saveWardrobe() {
        if (window.saveToFirebase) {
            window.saveToFirebase(this.wardrobe, this.apiKey);
        }
        try {
            if (typeof CONFIG !== 'undefined') {
                localStorage.setItem(CONFIG.STORAGE_KEYS.WARDROBE, JSON.stringify(this.wardrobe));
            }
        } catch (e) {}
    },
    
    previewImage(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) { 
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
    
    addClothingItem(event) {
        if (event) event.preventDefault();
        
        const nameInput = document.getElementById('itemName');
        const catInput = document.getElementById('itemCategory');
        const colInput = document.getElementById('itemColor');
        const seasInput = document.getElementById('itemSeason');
        const imgPrev = document.getElementById('imagePreview');

        if (!nameInput || !catInput) return;

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
    
    filterWardrobe() {
        this.displayWardrobe();
    },
    
    displayWardrobe() {
        const catEl = document.getElementById('filterCategory');
        const colEl = document.getElementById('filterColor');
        const seasEl = document.getElementById('filterSeason');
        const grid = document.getElementById('wardrobeGrid');

        if (!grid) return;

        const category = catEl ? catEl.value : '';
        const color = colEl ? colEl.value : '';
        const season = seasEl ? seasEl.value : '';
        
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
    // OUTFIT GENERATION (AGGIORNATO)
    // ===================================
    
    async generateOutfit() {
        // Fallback per recuperare la chiave se mancante
        if (!this.apiKey && typeof CONFIG !== 'undefined') {
            this.apiKey = CONFIG.GEMINI_API_KEY;
        }

        if (!this.apiKey) {
            this.showNotification('Errore: API Key mancante in config.js', 'error');
            return;
        }
        
        const resultDiv = document.getElementById('outfitResult');
        if (resultDiv) resultDiv.innerHTML = '<div class="loading">⏳ Generazione outfit in corso con Gemini Flash...</div>';
        
        try {
            const wardrobeDescription = this.wardrobe.map(item => 
                `${item.name} (${item.category}, ${item.color}, ${item.season})`
            ).join(', ');
            
            const occasion = document.getElementById('occasionSelect').value;
            const notes = document.getElementById('outfitNotes').value;

            const prompt = `Sei un esperto di moda. Ho questi capi: ${wardrobeDescription}.
Occasione: ${occasion}. Note: ${notes}.
Scegli un outfit completo usando SOLO i miei capi.
Rispondi SOLO con questo JSON esatto:
{
    "outfit": ["nome esatto capo 1", "nome esatto capo 2"],
    "suggerimento": "consiglio di stile"
}`;
            
            const response = await this.callGeminiAPI(prompt);
            this.displayGeneratedOutfit(response);
            
        } catch (error) {
            console.error(error);
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="generated-outfit" style="border-color: red;">
                        <h3>❌ Errore</h3>
                        <p>${error.message}</p>
                        <p style="font-size:12px">Controlla che la chiave in config.js sia corretta.</p>
                    </div>`;
            }
        }
    },

    async callGeminiAPI(prompt) {
        // --- URL HARDCODED PER SICUREZZA ---
        // Usiamo gemini-1.5-flash che è il modello attuale raccomandato
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Errore nella richiesta a Google Gemini');
        }
        
        const data = await response.json();
        if (!data.candidates || !data.candidates[0].content) throw new Error('Nessuna risposta generata');
        
        const text = data.candidates[0].content.parts[0].text;
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    },

    displayGeneratedOutfit(data) {
        const resultDiv = document.getElementById('outfitResult');
        if (!resultDiv) return;
        
        const selectedItems = [];
        data.outfit.forEach(name => {
            const found = this.wardrobe.find(item => item.name.toLowerCase().includes(name.toLowerCase()));
            if (found) selectedItems.push(found);
        });

        if (selectedItems.length === 0) {
            resultDiv.innerHTML = `<p>L'IA ha suggerito capi che non ho trovato: ${data.outfit.join(', ')}</p>`;
            return;
        }

        let html = `<div class="generated-outfit"><h3>✨ Outfit Suggerito</h3><div class="outfit-items">`;
        selectedItems.forEach(item => {
            html += `
                <div class="outfit-item">
                    <img src="${item.photo}" alt="${item.name}">
                    <p><strong>${item.name}</strong></p>
                </div>`;
            this.incrementWorn(item.id);
        });
        html += `</div><div class="ai-suggestion"><p>${data.suggerimento}</p></div></div>`;
        
        resultDiv.innerHTML = html;
        this.saveWardrobe();
    },
    
    updateStats() {
        const totalEl = document.getElementById('totalItems');
        if (totalEl) totalEl.textContent = this.wardrobe.length;
        
        const categories = [...new Set(this.wardrobe.map(item => item.category))];
        const catEl = document.getElementById('totalCategories');
        if (catEl) catEl.textContent = categories.length;
        
        const colorCount = {};
        this.wardrobe.forEach(item => { colorCount[item.color] = (colorCount[item.color] || 0) + 1; });
        const mostUsedColor = Object.keys(colorCount).length > 0
            ? Object.keys(colorCount).reduce((a, b) => colorCount[a] > colorCount[b] ? a : b)
            : '-';
        const colElStat = document.getElementById('mostUsedColor');
        if (colElStat) colElStat.textContent = mostUsedColor;
        
        const topItems = [...this.wardrobe].sort((a, b) => b.timesWorn - a.timesWorn).slice(0, 5);
        const topList = document.getElementById('topItemsList');
        if (topList) {
            topList.innerHTML = topItems.length ? '' : '<p>Nessun dato</p>';
            topItems.forEach(item => {
                topList.innerHTML += `<div class="top-item"><img src="${item.photo}"><div><strong>${item.name}</strong><br><small>${item.timesWorn} volte</small></div></div>`;
            });
        }
    },
    
    showNotification(message, type = 'info') {
        alert(message);
    }
};

window.app = app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
