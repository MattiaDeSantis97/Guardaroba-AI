# 👗 Guardaroba AI - Wardrobe Management App

Un'applicazione web moderna per gestire il tuo guardaroba e creare outfit perfetti usando l'intelligenza artificiale di Google Gemini.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Caratteristiche

- 📸 **Cataloga i tuoi vestiti** con foto, categoria, colore e stagione
- 🤖 **Generazione outfit AI** usando Google Gemini per ogni occasione
- 🔍 **Filtri avanzati** per categoria, colore e stagione
- 📊 **Statistiche dettagliate** sui capi più indossati
- ⭐ **Sistema preferiti** per marcare i tuoi outfit favoriti
- 📱 **100% Responsive** - funziona perfettamente su mobile, tablet e desktop
- 💾 **Salvataggio locale** - tutti i dati restano nel tuo browser
- 🎨 **Design moderno** con animazioni fluide

## 🚀 Installazione Rapida

### Prerequisiti

- Un browser moderno (Chrome, Firefox, Safari, Edge)
- Una API key gratuita di Google Gemini

### Setup

1. **Scarica tutti i file** nella stessa cartella:
   ```
   guardaroba-ai/
   ├── index.html
   ├── style.css
   ├── app.js
   ├── config.js
   └── .env.example
   ```

2. **Ottieni la tua API key gratuita**:
   - Vai su https://aistudio.google.com/app/apikey
   - Accedi con il tuo account Google
   - Clicca su "Create API Key"
   - Copia la chiave generata

3. **Apri l'applicazione**:
   - Apri `index.html` nel tuo browser
   - Inserisci la tua API key nella sezione di configurazione
   - Inizia ad aggiungere i tuoi vestiti!

## 📖 Come Usare

### 1. Configurazione Iniziale

Al primo avvio, inserisci la tua API key di Gemini:
- Vai nella sezione gialla in alto
- Incolla la tua API key
- Clicca su "Salva API Key"

### 2. Aggiungi Vestiti

Nella tab **Guardaroba**:
1. Compila il form con i dettagli del capo
2. Carica una foto (opzionale ma consigliato)
3. Clicca su "Aggiungi al Guardaroba"

### 3. Genera Outfit

Nella tab **Crea Outfit**:
1. Seleziona l'occasione (es: "Cena elegante")
2. Aggiungi note opzionali (es: "Preferisco colori scuri")
3. Clicca su "Genera Outfit"
4. L'AI ti suggerirà la combinazione perfetta!

### 4. Visualizza Statistiche

Nella tab **Statistiche**:
- Vedi il numero totale di capi
- Scopri i tuoi colori e stagioni preferite
- Controlla quali capi indossi di più

## 🎨 Struttura dei File

```
├── index.html       # Struttura HTML dell'applicazione
├── style.css        # Stili CSS responsive
├── app.js          # Logica JavaScript principale
├── config.js       # Configurazione e costanti
├── .env.example    # Template per variabili d'ambiente
├── .gitignore      # File da escludere da Git
└── README.md       # Questo file
```

## 🔧 Configurazione Avanzata

### Personalizzare le Categorie

Modifica `config.js`:

```javascript
CATEGORIES: [
    'Tua Categoria 1',
    'Tua Categoria 2',
    // ...
]
```

### Modificare i Colori

```javascript
COLORS: [
    'Tuo Colore 1',
    'Tuo Colore 2',
    // ...
]
```

### Aggiungere Nuove Occasioni

```javascript
OCCASIONS: [
    'Tua Occasione 1',
    'Tua Occasione 2',
    // ...
]
```

## 📱 Compatibilità

- ✅ Chrome/Edge (versione 90+)
- ✅ Firefox (versione 88+)
- ✅ Safari (versione 14+)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Breakpoints Responsive

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Large Desktop**: ≥ 1440px

## 🔒 Privacy e Sicurezza

### Dati Locali
- Tutti i tuoi vestiti sono salvati **solo nel tuo browser** (localStorage)
- Nessun dato viene inviato a server esterni (eccetto le richieste API a Gemini)
- Puoi cancellare tutti i dati in qualsiasi momento

### API Key
- La tua API key è salvata localmente nel browser
- **MAI** condividere la tua API key con altri
- Per uso in produzione, implementa un backend per nascondere la chiave

### Sicurezza API Key

⚠️ **IMPORTANTE**: Questa è un'applicazione frontend che salva l'API key nel localStorage del browser. Per un uso in produzione, considera:

1. **Backend Proxy**: Crea un server backend che gestisce le chiamate API
2. **Environment Variables**: Usa variabili d'ambiente server-side
3. **Rate Limiting**: Implementa limiti di richieste
4. **Key Rotation**: Cambia periodicamente l'API key

## 🐛 Troubleshooting

### L'AI non genera outfit
- Verifica che la tua API key sia corretta
- Assicurati di avere almeno 3 capi nel guardaroba
- Controlla la console del browser per errori

### Le immagini non si caricano
- Verifica che il formato sia supportato (JPG, PNG, GIF, WebP)
- Controlla che la dimensione sia < 5MB
- Prova con un'altra immagine

### I dati non vengono salvati
- Verifica che il browser non sia in modalità privata/incognito
- Controlla lo spazio disponibile nel localStorage
- Prova a cancellare la cache del browser

## 🔄 Aggiornamenti Futuri

Funzionalità pianificate:
- [ ] Export/Import del guardaroba in JSON
- [ ] Condivisione outfit sui social
- [ ] Integrazione calendario per pianificare outfit
- [ ] Suggerimenti basati sul meteo in tempo reale
- [ ] Modalità scura
- [ ] PWA (Progressive Web App) per installazione
- [ ] Backend con autenticazione utente

## 📄 Licenza

MIT License - Sentiti libero di usare, modificare e distribuire questo progetto!

## 🤝 Contributi

I contributi sono benvenuti! Se hai suggerimenti o hai trovato bug:
1. Fai fork del progetto
2. Crea un branch per la tua feature
3. Fai commit delle modifiche
4. Push al branch
5. Apri una Pull Request

## 📧 Supporto

Per domande o supporto:
- Apri una Issue su GitHub
- Controlla la documentazione di Gemini: https://ai.google.dev/docs

## 🙏 Ringraziamenti

- Google Gemini per l'API AI
- Font: Segoe UI
- Icone: Emoji native

---

**Made with ❤️ by Guardaroba AI Team**

Versione: 1.0.0 | Ultimo aggiornamento: 2026
