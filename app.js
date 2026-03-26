// ===================================
// MAIN APPLICATION - VERSIONE GEMINI 2.5
// ===================================

const app = {
    wardrobe: [],
    apiKey: '',
    
    init() {
        if (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_API_KEY) {
            this.apiKey = CONFIG.GEMINI_API_KEY.trim().replace(/['"]/g, '');
        }
        
        const apiSetup = document.getElementById('apiSetup');
        if (this.apiKey && apiSetup) apiSetup.style.display = 'none';
        
        window.app = this;
        this.setupEventListeners();
        try { this.displayWardrobe(); } catch (e) {}
        this.updateStats();
    },
    
    async generateOutfit() {
        if (!this.apiKey && typeof CONFIG !== 'undefined') {
            this.apiKey = CONFIG.GEMINI_API_KEY.trim().replace(/['"]/g, '');
        }

        if (!this.apiKey) {
            alert('Errore: API Key mancante in config.js');
            return;
        }
        
        const resultDiv = document.getElementById('outfitResult');
        if (resultDiv) resultDiv.innerHTML = '<div class="loading">⏳ Generazione outfit con Gemini 2.5...</div>';
        
        try {
            const wardrobeDesc = this.wardrobe.map(i => `${i.name} (${i.category}, ${i.color})`).join(', ');
            const occasion = document.getElementById('occasionSelect').value;
            const notes = document.getElementById('outfitNotes').value;

            const prompt = `Sei un esperto di moda. Ho: ${wardrobeDesc}. Occasione: ${occasion}. Note: ${notes}. Crea un outfit. Rispondi SOLO JSON: {"outfit": ["capo1", "capo2"], "suggerimento": "testo"}`;
            
            const response = await this.callGeminiAPI(prompt);
            this.displayGeneratedOutfit(response);
            
        } catch (error) {
            if (resultDiv) resultDiv.innerHTML = `<div class="generated-outfit" style="border-color:red"><h3>❌ Errore</h3><p>${error.message}</p></div>`;
        }
    },

    async callGeminiAPI(prompt) {
        const modelName = 'gemini-2.5-flash'; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Errore Google API');
        }

        if (!data.candidates || !data.candidates[0].content) throw new Error('Nessuna risposta generata');

        const text = data.candidates[0].content.parts[0].text;
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    },

    setupEventListeners() { 
        document.querySelectorAll('input[type="text"]').forEach(i => i.addEventListener('keypress', e => { 
            if (e.key === 'Enter') e.preventDefault(); 
        })); 
    },

    switchTab(t) { 
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); 
        if (event && event.target) {
            const closestTab = event.target.closest('.tab');
            if(closestTab) closestTab.classList.add('active'); 
        }
        document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active')); 
        const tabElement = document.getElementById(t+'Tab');
        if (tabElement) tabElement.classList.add('active'); 
        this.currentTab = t; 
        if (t === 'stats') this.updateStats(); 
    },

    saveApiKey() {},

    saveWardrobe() { 
        if (window.saveToFirebase) window.saveToFirebase(this.wardrobe, this.apiKey); 
        try {
            if (typeof CONFIG !== 'undefined') {
                localStorage.setItem(CONFIG.STORAGE_KEYS.WARDROBE, JSON.stringify(this.wardrobe));
            }
        } catch(e) {} 
    },

    previewImage(e) { 
        const f = e.target.files[0]; 
        if (!f) return; 
        const r = new FileReader(); 
        r.onload = ev => {
            const p = document.getElementById('imagePreview');
            if (p) {
                p.src = ev.target.result;
                p.style.display = 'block';
            }
        }; 
        r.readAsDataURL(f); 
    },

    addClothingItem(e) { 
        if (e) e.preventDefault(); 
        const n = document.getElementById('itemName').value;
        const c = document.getElementById('itemCategory').value; 
        if (!n || !c) return; 
        
        const photoSrc = document.getElementById('imagePreview')?.src;
        const finalPhoto = (photoSrc && photoSrc !== window.location.href) ? photoSrc : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULTS.PLACEHOLDER_IMAGE : 'https://via.placeholder.com/200?text=No+Image');

        this.wardrobe.push({
            id: Date.now(),
            name: n,
            category: c,
            color: document.getElementById('itemColor').value,
            season: document.getElementById('itemSeason').value,
            photo: finalPhoto,
            timesWorn: 0,
            favorite: false
        });
        
        this.saveWardrobe(); 
        this.displayWardrobe(); 
        this.updateStats(); 
        document.getElementById('addItemForm').reset();
        
        const preview = document.getElementById('imagePreview');
        if (preview) { preview.style.display = 'none'; preview.src = ''; }
    },

    deleteItem(id) { 
        if (confirm('Eliminare?')) {
            this.wardrobe = this.wardrobe.filter(i => i.id !== id);
            this.saveWardrobe();
            this.displayWardrobe();
            this.updateStats();
        } 
    },

    toggleFavorite(id) { 
        const i = this.wardrobe.find(x => x.id === id); 
        if (i) {
            i.favorite = !i.favorite;
            this.saveWardrobe();
            this.displayWardrobe();
        } 
    },

    filterWardrobe() { 
        this.displayWardrobe(); 
    },

    displayWardrobe() { 
        const g = document.getElementById('wardrobeGrid'); 
        if (!g) return; 
        
        g.innerHTML = this.wardrobe.map(i => `
            <div class="clothing-item">
                <img src="${i.photo}" alt="${i.name}">
                <h4>${i.name}</h4>
                <p><strong>Categoria:</strong> ${i.category}</p>
                <p><strong>Colore:</strong> ${i.color}</p>
                <p><strong>Stagione:</strong> ${i.season}</p>
                <button class="delete-btn" onclick="app.deleteItem(${i.id})">Elimina</button>
            </div>
        `).join('') || '<p>Il guardaroba è vuoto.</p>'; 
    },

    displayGeneratedOutfit(d) { 
        const r = document.getElementById('outfitResult'); 
        if (!r) return; 

        const outfitHtml = d.outfit.map(capo => {
            const item = this.wardrobe.find(i => i.name.toLowerCase().includes(capo.toLowerCase()) || capo.toLowerCase().includes(i.name.toLowerCase()));
            const photo = item ? item.photo : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULTS.PLACEHOLDER_IMAGE : 'https://via.placeholder.com/200?text=No+Image');
            
            return `
                <div class="outfit-item clothing-item">
                    <img src="${photo}" alt="${capo}">
                    <p><strong>${capo}</strong></p>
                </div>
            `;
        }).join('');

        r.innerHTML = `
            <div class="generated-outfit">
                <h3>✨ Outfit Suggerito</h3>
                <div class="outfit-items">
                    ${outfitHtml}
                </div>
                <div class="ai-suggestion">${d.suggerimento}</div>
            </div>
        `; 
    },

    updateStats() { 
        const t = document.getElementById('totalItems'); 
        if (t) t.textContent = this.wardrobe.length; 
    }
};

window.app = app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init()); 
} else {
    app.init();
}
