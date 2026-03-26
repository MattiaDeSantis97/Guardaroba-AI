// ===================================
// CONFIGURATION FILE
// ===================================

/**
 * Configuration object for the Wardrobe AI application
 * 
 * IMPORTANT: For production use, do NOT hardcode your API key here!
 * Instead, use environment variables or a secure backend service.
 * 
 * This file is meant to be excluded from version control (.gitignore)
 */

const CONFIG = {
    // INCOLLA QUI LA TUA CHIAVE (Non lasciarla vuota)
    GEMINI_API_KEY: '', 
    
    // MODIFICA: Usiamo 'gemini-pro' che è il modello standard e funziona sempre
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    
    // Application Settings
    APP_NAME: 'Il Mio Guardaroba AI',
    APP_VERSION: '1.0.0',
    
    // Storage Keys
    STORAGE_KEYS: {
        WARDROBE: 'wardrobe_data',
        API_KEY: 'gemini_api_key',
        SETTINGS: 'app_settings'
    },
    
    // Default Settings
    DEFAULTS: {
        PLACEHOLDER_IMAGE: 'https://via.placeholder.com/200?text=No+Image',
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    },
    
    // Categories
    CATEGORIES: [
        'Maglietta',
        'Camicia',
        'Felpa',
        'Giacca',
        'Cappotto',
        'Pantaloni',
        'Jeans',
        'Gonna',
        'Vestito',
        'Scarpe',
        'Accessori',
        'Top',
        'Reggiseno',
        'Pantagonna',
        'Calze',
        'Leggings',
        'Costume da bagno',
        'Pareo',
        'Tuta',
        'Cintura',
        'Cappello',
        'Sciarpa',
        'Pantaloncini',
        'T-shirt',
        'Maglione',
        'Cardigan',
        'Giubbotto',
        'Trench',
        'Pantaloni eleganti',
        'Shorts',
        'Gilet'
    ],
    
    // Colors
    COLORS: [
        'Nero',
        'Bianco',
        'Grigio',
        'Blu',
        'Rosso',
        'Verde',
        'Giallo',
        'Arancione',
        'Rosa',
        'Viola',
        'Marrone',
        'Beige',
        'Turchese',
        'Oro',
        'Argento',
        'Multicolore',
        'Fantasia',
        'Trasparente',
        'Celeste',
        'Bordeaux',
        'Lilla',
        'Senape',
        'Corallo',
        'Verde oliva',
        'Verde menta',
        'Grigio chiaro',
        'Grigio scuro',
        'Blu navy',
        'Blu elettrico',
        'Rosso scuro',
        'Rosso ciliegia',
        'Giallo canarino',
        'Arancione bruciato',
        'Rosa confetto',
        'Viola melanzana',
        'Marrone cioccolato',
        'Beige sabbia',
        'Turchese acqua',
        'Oro rosa',
        'Argento lucido',
        'Multicolore fantasia',
        'Fantasia floreale',
        'Fantasia geometrica',
        'Fantasia animalier',
        'Fantasia astratta',
        'Fantasia paisley',
        'Fantasia a righe',
        'Fantasia a pois',
        'Fantasia a quadri',
        'Fantasia tie-dye'
    ],
    
    // Seasons
    SEASONS: [
        'Primavera',
        'Estate',
        'Autunno',
        'Inverno',
        'Tutto l\'anno'
    ],
    
    // Occasions for outfit generation
    OCCASIONS: [
        'Casual quotidiano',
        'Ufficio/Lavoro',
        'Aperitivo con amici',
        'Cena elegante',
        'Sport/Palestra',
        'Festa/Evento serale',
        'Weekend relax',
        'Appuntamento romantico',
        'Viaggio',
        'Cerimonia formale'
    ],
    
    // API Configuration
    API_CONFIG: {
        REQUEST_TIMEOUT: 30000, // 30 seconds
        MAX_RETRIES: 3
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
