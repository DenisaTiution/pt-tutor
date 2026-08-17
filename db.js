// Minimal IndexedDB helper and schema
const DB_NAME = 'pt-tutor';
const DB_VERSION = 1;
const stores = ['alunos','planos','sessoes','vocab','gramatica','recursos','areas'];

const DB = {
  db: null,
  async init(){
    if (this.db) return;
    this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        for (const s of stores){
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
        }
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    });
  },
  tx(store, mode='readonly'){
    const t = this.db.transaction(store, mode);
    return { store: t.objectStore(store), done: new Promise((res,rej)=>t.oncomplete=res) };
  },
  async add(store, item){
    await this.init();
    if (!item.id) item.id = uuid();
    const { store:os } = this.tx(store, 'readwrite');
    os.put(item);
    return item.id;
  },
  async get(store, id){
    await this.init();
    return new Promise((res,rej)=>{
      const { store:os } = this.tx(store);
      const r = os.get(id);
      r.onsuccess = ()=>res(r.result);
      r.onerror = ()=>rej(r.error);
    });
  },
  async getAll(store){
    await this.init();
    return new Promise((res,rej)=>{
      const { store:os } = this.tx(store);
      const r = os.getAll();
      r.onsuccess = ()=>res(r.result);
      r.onerror = ()=>rej(r.error);
    });
  },
  async delete(store, id){
    await this.init();
    const { store:os } = this.tx(store,'readwrite');
    os.delete(id);
  },
  async clear(store){
    await this.init();
    const { store:os } = this.tx(store,'readwrite');
    os.clear();
  },
  async exportAll(){
    await this.init();
    const out = {};
    for (const s of stores){
      out[s] = await this.getAll(s);
    }
    return out;
  },
  async importAll(data){
    await this.init();
    for (const s of stores){
      if (data[s] && Array.isArray(data[s])){
        // clear store then add
        const tx = this.db.transaction(s,'readwrite');
        tx.objectStore(s).clear();
        for (const item of data[s]) tx.objectStore(s).put(item);
        await new Promise(r=>tx.oncomplete=r);
      }
    }
  },
  async loadSample(sample){
    if (!sample) sample = await (await fetch('sample-data.json')).json();
    await this.importAll(sample);
  }
};

// small uuid helper
function uuid(){
  return 'id-'+([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c/4).toString(16)
  );
}