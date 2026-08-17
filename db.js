const DB_NAME = 'tabu-game';
const DB_VERSION = 1;
const STORE = 'cartas';

const DB = {
  db: null,
  
  async init() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },

  async add(card) {
    await this.init();
    if (!card.id) card.id = 'c-' + Date.now();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).put(card);
      req.onsuccess = () => resolve(card.id);
      req.onerror = () => reject(req.error);
    });
  },

  async get(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async getAll() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async delete(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
};

const SAMPLE_CARDS = [
  { palavra: 'Gato', proibida1: 'Animal', proibida2: 'Bigodes' },
  { palavra: 'Livro', proibida1: 'Páginas', proibida2: 'Ler' },
  { palavra: 'Carro', proibida1: 'Rodas', proibida2: 'Conduzir' },
  { palavra: 'Viagem', proibida1: 'Avião', proibida2: 'Destino' },
  { palavra: 'Restaurante', proibida1: 'Comida', proibida2: 'Garfo' },
  { palavra: 'Telefone', proibida1: 'Chamar', proibida2: 'Número' },
  { palavra: 'Praia', proibida1: 'Mar', proibida2: 'Areia' },
  { palavra: 'Festa', proibida1: 'Alegria', proibida2: 'Celebração' }
];
