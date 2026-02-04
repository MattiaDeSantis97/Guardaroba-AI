// ===================================
// MAIN APPLICATION - VERSIONE INTELLIGENTE
// ===================================

const app = {
    wardrobe: [],
    apiKey: '',
    
    init() {
        console.log('🎨 Initializing Wardrobe AI...');
        
        // 1. RECUPERA E PULISCE LA CHIAVE
        if (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_API_KEY) {
            // .trim() rimuove spazi vuoti accidentali all'inizio o alla fine
            this.apiKey = CONFIG.GEMINI_API_KEY.trim();
            // Rimuove eventuali virgolette extra se le hai copiate per sbaglio
            this.apiKey = this.apiKey.replace(/['"]/g, '');
        }
        
        // Nascondi box configurazione
        const apiSetup = document.getElementById('apiSetup');
        if (this.apiKey && apiSetup) apiSetup.style.display = 'none';
        
        window.app = this;
        this.setupEventListeners();
        try { this.displayWardrobe(); } catch (e) {}
        this.updateStats();
        
        // Avviso silenzioso in console
        console.log("App pronta con chiave (ultimi 4 car):", this.apiKey.slice(-4));
    },
    
    async generateOutfit() {
        // Fallback rilettura chiave
        if (!this.apiKey && typeof CONFIG !== 'undefined') {
            this.apiKey = CONFIG.GEMINI_API_KEY.trim().replace(/['"]/g, '');
        }

        if (!this.apiKey || this.apiKey.length < 20) {
            alert('Errore: La API Key in config.js sembra non valida o troppo corta.');
            return;
        }
        
        const resultDiv = document.getElementById('outfitResult');
        if (resultDiv) resultDiv.innerHTML = '<div class="loading">⏳ Sto cercando il modello giusto...</div>';
        
        try {
            const wardrobeDesc = this.wardrobe.map(i => `${i.name} (${i.category}, ${i.color})`).join(', ');
            const occasion = document.getElementById('occasionSelect').value;
            const notes = document.getElementById('outfitNotes').value;

            const prompt = `Sei un esperto di moda. Ho: ${wardrobeDesc}. Occasione: ${occasion}. Note: ${notes}. Crea un outfit. Rispondi SOLO JSON: {"outfit": ["capo1", "capo2"], "suggerimento": "testo"}`;
            
            // CHIAMATA API
            const response = await this.callGeminiAPI(prompt);
            this.displayGeneratedOutfit(response);
            
        } catch (error) {
            console.error(error);
            if (resultDiv) resultDiv.innerHTML = `<div class="generated-outfit" style="border-color:red"><h3>❌ Errore AI</h3><p>${error.message}</p><p style="font-size:12px">Verifica che la tua API Key su Google AI Studio sia attiva.</p></div>`;
        }
    },

    async callGeminiAPI(prompt) {
        // LISTA DI MODELLI DA PROVARE (Se uno fallisce, proviamo l'altro)
        // Usiamo le versioni specifiche "-001" che sono più stabili degli alias
        const modelsToTry = [
            'gemini-1.5-flash-001', // Più veloce e recente
            'gemini-1.5-flash',     // Alias standard
            'gemini-pro'            // Vecchio ma affidabile
        ];

        let lastError = null;

        for (const model of modelsToTry) {
            try {
                console.log(`Tentativo con modello: ${model}...`);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                const data = await response.json();

                if (!response.ok) {
                    // Se l'errore è "Not Found", proviamo il prossimo modello
                    if (data.error && data.error.code === 404) {
                        console.warn(`Modello ${model} non trovato, passo al prossimo...`);
                        lastError = data.error.message;
                        continue; 
                    }
                    throw new Error(data.error?.message || 'Errore Google API');
                }

                if (!data.candidates || !data.candidates[0].content) throw new Error('Nessuna risposta generata');

                const text = data.candidates[0].content.parts[0].text;
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(jsonStr);

            } catch (e) {
                lastError = e.message;
                // Se non è un 404, è un errore serio (es. chiave scaduta), quindi ci fermiamo
                if (!e.message.includes("not found")) throw e;
            }
        }

        // Se siamo qui, tutti i modelli hanno fallito
        throw new Error(`Nessun modello disponibile per questa API Key. Ultimo errore: ${lastError}`);
    },

    // --- FUNZIONI DI SUPPORTO (Non modificate) ---
    setupEventListeners() { document.querySelectorAll('input[type="text"]').forEach(i => i.addEventListener('keypress', e => { if (e.key === 'Enter') e.preventDefault(); })); },
    switchTab(t) { document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); event?.target.closest('.tab').classList.add('active'); document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active')); document.getElementById(t+'Tab').classList.add('active'); this.currentTab=t; if(t==='stats')this.updateStats(); },
    saveApiKey() {},
    saveWardrobe() { if(window.saveToFirebase)window.saveToFirebase(this.wardrobe,this.apiKey); try{if(typeof CONFIG!=='undefined')localStorage.setItem(CONFIG.STORAGE_KEYS.WARDROBE,JSON.stringify(this.wardrobe));}catch(e){} },
    previewImage(e) { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>{const p=document.getElementById('imagePreview');if(p){p.src=ev.target.result;p.style.display='block';}}; r.readAsDataURL(f); },
    addClothingItem(e) { if(e)e.preventDefault(); const n=document.getElementById('itemName').value, c=document.getElementById('itemCategory').value; if(!n||!c)return; 
    this.wardrobe.push({id:Date.now(),name:n,category:c,color:document.getElementById('itemColor').value,season:document.getElementById('itemSeason').value,photo:document.getElementById('imagePreview')?.src||'',timesWorn:0,favorite:false});
    this.saveWardrobe(); this.displayWardrobe(); this.updateStats(); document.getElementById('addItemForm').reset(); alert('Aggiunto!'); },
    deleteItem(id) { if(confirm('Eliminare?')){this.wardrobe=this.wardrobe.filter(i=>i.id!==id);this.saveWardrobe();this.displayWardrobe();this.updateStats();} },
    toggleFavorite(id) { const i=this.wardrobe.find(x=>x.id===id); if(i){i.favorite=!i.favorite;this.saveWardrobe();this.displayWardrobe();} },
    filterWardrobe() { this.displayWardrobe(); },
    displayWardrobe() { const g=document.getElementById('wardrobeGrid'); if(!g)return; g.innerHTML=this.wardrobe.map(i=>`<div class="clothing-item"><img src="${i.photo}"><h3>${i.name}</h3><button class="delete-btn" onclick="app.deleteItem(${i.id})">🗑️</button></div>`).join('')||'<p>Vuoto</p>'; },
    displayGeneratedOutfit(d) { const r=document.getElementById('outfitResult'); if(!r)return; r.innerHTML=`<div class="generated-outfit"><h3>✨ Outfit</h3><p>${d.suggerimento}</p><p>Capi: ${d.outfit.join(', ')}</p></div>`; },
    updateStats() { const t=document.getElementById('totalItems'); if(t)t.textContent=this.wardrobe.length; }
};

window.app = app;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => app.init()); else app.init();
