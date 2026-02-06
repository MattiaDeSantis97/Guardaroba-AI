// ===================================
// MAIN APPLICATION - VERSIONE VERCEL PROXY
// ===================================

const app = {
    wardrobe: [],
    // apiKey rimossa per sicurezza (gestita da Vercel)
    
    init() {
        console.log('🎨 Initializing Wardrobe AI...');
        
        // Nascondi box configurazione se esiste
        const apiSetup = document.getElementById('apiSetup');
        if (apiSetup) apiSetup.style.display = 'none';
        
        window.app = this;
        this.setupEventListeners();
        try { this.displayWardrobe(); } catch (e) {}
        this.updateStats();
    },
    
    async generateOutfit() {
        const resultDiv = document.getElementById('outfitResult');
        if (resultDiv) resultDiv.innerHTML = '<div class="loading">⏳ Generazione outfit in corso...</div>';
        
        try {
            // Controllo se il guardaroba è vuoto
            if (this.wardrobe.length === 0) {
                throw new Error("Il guardaroba è vuoto! Aggiungi qualche vestito prima.");
            }

            const wardrobeDesc = this.wardrobe.map(i => `${i.name} (${i.category}, ${i.color})`).join(', ');
            const occasion = document.getElementById('occasionSelect').value;
            const notes = document.getElementById('outfitNotes').value;

            const prompt = `Sei un esperto di moda. Ho: ${wardrobeDesc}. Occasione: ${occasion}. Note: ${notes}. Crea un outfit. Rispondi SOLO JSON: {"outfit": ["capo1", "capo2"], "suggerimento": "testo"}`;
            
            // CHIAMATA AL PROXY VERCEL
            const response = await this.callGeminiAPI(prompt);
            this.displayGeneratedOutfit(response);
            
        } catch (error) {
            console.error(error);
            if (resultDiv) resultDiv.innerHTML = `<div class="generated-outfit" style="border-color:red"><h3>❌ Errore</h3><p>${error.message}</p></div>`;
        }
    },

    async callGeminiAPI(prompt) {
        // Usa il proxy Vercel
        const proxyUrl = '/api/proxy'; 
        console.log('Chiamata sicura via Vercel...');

        try {
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            const data = await response.json();

            // 1. GESTIONE ERRORI MIGLIORATA (Fix per [object Object])
            if (data.error) {
                let errorMsg;
                if (typeof data.error === 'object') {
                    errorMsg = data.error.message || JSON.stringify(data.error);
                } else {
                    errorMsg = data.error;
                }
                throw new Error(errorMsg);
            }

            if (!response.ok) {
                throw new Error(data.error?.message || 'Errore Server Vercel');
            }

            if (!data.candidates || !data.candidates[0].content) {
                throw new Error('Nessuna risposta generata dall\'AI');
            }

            const text = data.candidates[0].content.parts[0].text;
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);

        } catch (error) {
            console.error("Errore API:", error);
            throw new Error(error.message || "Errore di connessione");
        }
    },

    // --- FUNZIONI STANDARD ---
    setupEventListeners() { 
        document.querySelectorAll('input[type="text"]').forEach(i => i.addEventListener('keypress', e => { if (e.key === 'Enter') e.preventDefault(); })); 
    },
    
    switchTab(t) { 
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); 
        if(event && event.target) event.target.closest('.tab').classList.add('active'); 
        document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active')); 
        const targetTab = document.getElementById(t+'Tab');
        if(targetTab) targetTab.classList.add('active'); 
        this.currentTab=t; 
        if(t==='stats') this.updateStats(); 
    },
    
    saveApiKey() {}, // Non serve più
    
    saveWardrobe() { 
        if(window.saveToFirebase) window.saveToFirebase(this.wardrobe, ''); 
        try {
            if(typeof CONFIG!=='undefined') localStorage.setItem(CONFIG.STORAGE_KEYS.WARDROBE, JSON.stringify(this.wardrobe));
        } catch(e){} 
    },
    
    previewImage(e) { 
        const f=e.target.files[0]; 
        if(!f) return; 
        const r=new FileReader(); 
        r.onload=ev=>{
            const p=document.getElementById('imagePreview');
            if(p){
                p.src=ev.target.result;
                p.style.display='block';
            }
        }; 
        r.readAsDataURL(f); 
    },
    
    addClothingItem(e) { 
        if(e) e.preventDefault(); 
        const n=document.getElementById('itemName').value, c=document.getElementById('itemCategory').value; 
        if(!n||!c) return; 
        
        this.wardrobe.push({
            id: Date.now(),
            name: n,
            category: c,
            color: document.getElementById('itemColor').value,
            season: document.getElementById('itemSeason').value,
            photo: document.getElementById('imagePreview')?.src||'',
            timesWorn: 0,
            favorite: false
        });
        
        this.saveWardrobe(); 
        this.displayWardrobe(); 
        this.updateStats(); 
        document.getElementById('addItemForm').reset(); 
        const p = document.getElementById('imagePreview');
        if(p) { p.src=''; p.style.display='none'; }
        alert('Aggiunto!'); 
    },
    
    deleteItem(id) { 
        if(confirm('Eliminare?')){
            this.wardrobe=this.wardrobe.filter(i=>i.id!==id);
            this.saveWardrobe();
            this.displayWardrobe();
            this.updateStats();
        } 
    },
    
    toggleFavorite(id) { 
        const i=this.wardrobe.find(x=>x.id===id); 
        if(i){
            i.favorite=!i.favorite;
            this.saveWardrobe();
            this.displayWardrobe();
        } 
    },
    
    filterWardrobe() { this.displayWardrobe(); },
    
    displayWardrobe() { 
        const g=document.getElementById('wardrobeGrid'); 
        if(!g) return; 
        g.innerHTML=this.wardrobe.map(i=>`<div class="clothing-item"><img src="${i.photo}"><h3>${i.name}</h3><button class="delete-btn" onclick="app.deleteItem(${i.id})">🗑️</button></div>`).join('')||'<p>Vuoto</p>'; 
    },
    
    displayGeneratedOutfit(d) { 
        const r=document.getElementById('outfitResult'); 
        if(!r) return; 
        r.innerHTML=`<div class="generated-outfit"><h3>✨ Outfit Suggerito</h3><p>${d.suggerimento}</p><p><strong>Capi da indossare:</strong> ${d.outfit.join(', ')}</p></div>`; 
    },
    
    updateStats() { 
        const t=document.getElementById('totalItems'); 
        if(t) t.textContent=this.wardrobe.length; 
    }
};

window.app = app;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => app.init()); else app.init();
