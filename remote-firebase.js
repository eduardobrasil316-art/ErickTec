(function(window){
  // Firestore-based Remote sync client (uses compat SDK).
  // Expects window.FIREBASE_CONFIG defined (via firebase-config.js) and Firebase compat scripts loaded.
  const STORAGE_KEYS = {
    clients: 'os_clients_v1',
    vehicles: 'os_vehicles_v1',
    products: 'os_products_v1',
    orders: 'os_orders_v1'
  };
  const TABLE_MAP = { clients: 'clients', vehicles: 'vehicles', products: 'products', orders: 'orders' };

  function hasConfig(){ return !!window.FIREBASE_CONFIG && typeof firebase !== 'undefined'; }

  let __unsubscribers = {};

  function init(){
    if(!hasConfig()) return false;
    if(window.__firebase_initialized) return true;
    firebase.initializeApp(window.FIREBASE_CONFIG);
    window.__firebase_db = firebase.firestore();
    window.__firebase_initialized = true;

    // auth state listener: when a user signs in, set up per-user listeners
    firebase.auth().onAuthStateChanged(user=>{
      if(user){
        setupListenersForUser(user.uid);
        // trigger an event so UI can react
        window.dispatchEvent(new CustomEvent('remote-auth-changed', { detail: { user: { uid: user.uid, email: user.email } } }));
      } else {
        clearListeners();
        window.dispatchEvent(new CustomEvent('remote-auth-changed', { detail: { user: null } }));
      }
    });

    return true;
  }

  function clearListeners(){
    Object.keys(__unsubscribers).forEach(k=>{ try{ __unsubscribers[k](); }catch(e){} });
    __unsubscribers = {};
  }

  function setupListenersForUser(uid){
    clearListeners();
    Object.keys(TABLE_MAP).forEach(resource=>{
      try{
        const col = TABLE_MAP[resource];
        const q = window.__firebase_db.collection(col).where('owner','==', uid);
        __unsubscribers[resource] = q.onSnapshot(snapshot=>{
          const arr = [];
          snapshot.forEach(doc=>{ const d = doc.data(); d.id = doc.id; arr.push(d); });
          localStorage.setItem(STORAGE_KEYS[resource], JSON.stringify(arr));
          window.dispatchEvent(new CustomEvent('remote-data-updated', { detail: { resource, items: arr } }));
          console.info('RemoteFirebase: snapshot updated', resource);
        }, err=>{ console.warn('RemoteFirebase snapshot error', resource, err); });
      }catch(err){ console.warn('RemoteFirebase init listener error', err); }
    });
  }

  async function syncDownload(){
    if(!hasConfig()) return;
    init();
    const db = window.__firebase_db;
    const user = firebase.auth().currentUser;
    if(!user) return;
    const promises = Object.keys(TABLE_MAP).map(async resource=>{
      const col = TABLE_MAP[resource];
      const snap = await db.collection(col).where('owner','==', user.uid).get();
      const arr = [];
      snap.forEach(doc=>{ const d = doc.data(); d.id = doc.id; arr.push(d); });
      localStorage.setItem(STORAGE_KEYS[resource], JSON.stringify(arr));
      return arr;
    });
    return Promise.all(promises);
  }

  async function push(resource, record){
    if(!hasConfig()) return;
    init();
    const db = window.__firebase_db;
    const col = TABLE_MAP[resource]; if(!col) return;
    const id = record.id || db.collection(col).doc().id;
    const user = firebase.auth().currentUser;
    const toSave = Object.assign({}, record, { id, owner: user ? user.uid : (record.owner || null) });
    // ensure id is stored as doc id (we'll also store in fields)
    await db.collection(col).doc(id).set(toSave, { merge: true });
  }

  async function remove(resource, id){
    if(!hasConfig()) return;
    init();
    const db = window.__firebase_db;
    const col = TABLE_MAP[resource]; if(!col) return;
    await db.collection(col).doc(id).delete();
  }

  const RemoteFirebase = {
    available: hasConfig(),
    syncDownload,
    push,
    delete: remove
  };

  // Export as Remote for compatibility with existing code
  window.Remote = RemoteFirebase;
  window.RemoteFirebase = RemoteFirebase;
})(window);
