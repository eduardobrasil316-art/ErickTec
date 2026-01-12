<<<<<<< HEAD
// Simple Remote sync client using Supabase REST API (no external libs).
// This file expects `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY` to be set
// (create `supabase-config.js` from `supabase-config.example.js`).

(function(window){
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  const STORAGE_KEYS = {
    clients: 'os_clients_v1',
    vehicles: 'os_vehicles_v1',
    products: 'os_products_v1',
    orders: 'os_orders_v1'
  };

  function hasConfig(){ return url && key; }

  function apiPath(table){
    // Supabase REST endpoint
    return url.replace(/\/$/, '') + '/rest/v1/' + table;
  }

  function headers(){
    return {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    };
  }

  async function fetchAll(table){
    if(!hasConfig()) return null;
    const p = apiPath(table) + '?select=*';
    const res = await fetch(p, { headers: headers() });
    if(!res.ok) throw new Error('Remote fetch failed: ' + res.status);
    return await res.json();
  }

  async function upsert(table, obj){
    if(!hasConfig()) return null;
    const p = apiPath(table);
    const res = await fetch(p, { method: 'POST', headers: Object.assign({}, headers(), { 'Prefer': 'return=representation' }), body: JSON.stringify(obj) });
    if(!res.ok) throw new Error('Remote upsert failed: ' + res.status + ' ' + (await res.text()));
    return await res.json();
  }

  async function remove(table, id){
    if(!hasConfig()) return null;
    const p = apiPath(table) + `?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(p, { method: 'DELETE', headers: headers() });
    if(!res.ok) throw new Error('Remote delete failed: ' + res.status + ' ' + (await res.text()));
    return true;
  }

  // Map our resource names to DB table names
  const TABLE_MAP = { clients: 'clients', vehicles: 'vehicles', products: 'products', orders: 'orders' };

  // Public API
  const Remote = {
    available: hasConfig(),
    // download all remote tables and write to localStorage
    async syncDownload(){
      if(!hasConfig()) return;
      try{
        const [clients, vehicles, products, orders] = await Promise.all([
          fetchAll(TABLE_MAP.clients),
          fetchAll(TABLE_MAP.vehicles),
          fetchAll(TABLE_MAP.products),
          fetchAll(TABLE_MAP.orders)
        ]);
        if(Array.isArray(clients)) localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
        if(Array.isArray(vehicles)) localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles));
        if(Array.isArray(products)) localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
        if(Array.isArray(orders)) localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
        console.info('Remote: syncDownload complete');
      }catch(err){ console.warn('Remote sync error', err); }
    },
    // push (create or update) a single record
    async push(resource, record){
      if(!hasConfig()) return;
      const table = TABLE_MAP[resource]; if(!table) return;
      try{ await upsert(table, record); console.info('Remote: pushed', resource, record.id || 'no-id'); }
      catch(err){ console.warn('Remote push error', err); }
    },
    async delete(resource, id){
      if(!hasConfig()) return;
      const table = TABLE_MAP[resource]; if(!table) return;
      try{ await remove(table, id); console.info('Remote: deleted', resource, id); }
      catch(err){ console.warn('Remote delete error', err); }
    }
  };

  window.Remote = Remote;
})(window);
=======
// Simple Remote sync client using Supabase REST API (no external libs).
// This file expects `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY` to be set
// (create `supabase-config.js` from `supabase-config.example.js`).

(function(window){
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  const STORAGE_KEYS = {
    clients: 'os_clients_v1',
    vehicles: 'os_vehicles_v1',
    products: 'os_products_v1',
    orders: 'os_orders_v1'
  };

  function hasConfig(){ return url && key; }

  function apiPath(table){
    // Supabase REST endpoint
    return url.replace(/\/$/, '') + '/rest/v1/' + table;
  }

  function headers(){
    return {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    };
  }

  async function fetchAll(table){
    if(!hasConfig()) return null;
    const p = apiPath(table) + '?select=*';
    const res = await fetch(p, { headers: headers() });
    if(!res.ok) throw new Error('Remote fetch failed: ' + res.status);
    return await res.json();
  }

  async function upsert(table, obj){
    if(!hasConfig()) return null;
    const p = apiPath(table);
    const res = await fetch(p, { method: 'POST', headers: Object.assign({}, headers(), { 'Prefer': 'return=representation' }), body: JSON.stringify(obj) });
    if(!res.ok) throw new Error('Remote upsert failed: ' + res.status + ' ' + (await res.text()));
    return await res.json();
  }

  async function remove(table, id){
    if(!hasConfig()) return null;
    const p = apiPath(table) + `?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(p, { method: 'DELETE', headers: headers() });
    if(!res.ok) throw new Error('Remote delete failed: ' + res.status + ' ' + (await res.text()));
    return true;
  }

  // Map our resource names to DB table names
  const TABLE_MAP = { clients: 'clients', vehicles: 'vehicles', products: 'products', orders: 'orders' };

  // Public API
  const Remote = {
    available: hasConfig(),
    // download all remote tables and write to localStorage
    async syncDownload(){
      if(!hasConfig()) return;
      try{
        const [clients, vehicles, products, orders] = await Promise.all([
          fetchAll(TABLE_MAP.clients),
          fetchAll(TABLE_MAP.vehicles),
          fetchAll(TABLE_MAP.products),
          fetchAll(TABLE_MAP.orders)
        ]);
        if(Array.isArray(clients)) localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
        if(Array.isArray(vehicles)) localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles));
        if(Array.isArray(products)) localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
        if(Array.isArray(orders)) localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
        console.info('Remote: syncDownload complete');
      }catch(err){ console.warn('Remote sync error', err); }
    },
    // push (create or update) a single record
    async push(resource, record){
      if(!hasConfig()) return;
      const table = TABLE_MAP[resource]; if(!table) return;
      try{ await upsert(table, record); console.info('Remote: pushed', resource, record.id || 'no-id'); }
      catch(err){ console.warn('Remote push error', err); }
    },
    async delete(resource, id){
      if(!hasConfig()) return;
      const table = TABLE_MAP[resource]; if(!table) return;
      try{ await remove(table, id); console.info('Remote: deleted', resource, id); }
      catch(err){ console.warn('Remote delete error', err); }
    }
  };

  window.Remote = Remote;
})(window);
>>>>>>> d583700c613fe4e98c8760b79a0b4e2686b51992
