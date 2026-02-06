// ===================================
// MAIN APPLICATION - VERSIONE GEMINI 2.5
// ===================================

const app = {
    wardrobe: [],
    apiKey: '',
    
    init() {
        console.log('🎨 Initializing Wardrobe AI...');
        
        // 1. RECUPERA LA CHIAVE DAL CONFIG
        if (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_API_KEY) {
            this.apiKey = CONFIG.GEMINI_API_KEY.trim().replace(/['"]/g, '');
        }
        
        // Nascondi box configurazione
        const apiSetup = document.getElementById('apiSetup');
        if (this.apiKey && apiSetup) apiSetup.style.display = 'none';
        
        window.app = this;
        this.setupEventListeners();
        try { this.displayWardrobe(); } catch (e) {}
        this.updateStats();
    },
    
    async generateOutfit() {
        // Fallback rilettura chiave
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
            
            // CHIAMATA API
            const response = await this.callGeminiAPI(prompt);
            this.displayGeneratedOutfit(response);
            
        } catch (error) {
            console.error(error);
            if (resultDiv) resultDiv.innerHTML = `<div class="generated-outfit" style="border-color:red"><h3>❌ Errore</h3><p>${error.message}</p></div>`;
        }
    },

    async callGeminiAPI(prompt) {
        // Usiamo il percorso relativo. Vercel capirà automaticamente che deve chiamare il file nella cartella /api
        const proxyUrl = '/api/proxy'; 
        
        console.log('Chiamata sicura via Vercel...');

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Errore Server Vercel');
        }

        // Se la chiamata fallisce lato server o non ci sono candidati
        if (data.error) throw new Error(data.error);
        if (!data.candidates || !data.candidates[0].content) throw new Error('Nessuna risposta generata');

        const text = data.candidates[0].content.parts[0].text;
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    },

    // --- FUNZIONI STANDARD ---
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
