// Gerenciador de Ordens de Serviço (LocalStorage)
const STORAGE_KEYS = {
  clients: 'os_clients_v1',
  vehicles: 'os_vehicles_v1',
  products: 'os_products_v1',
  orders: 'os_orders_v1'
};

/* Utils */
const $ = (sel) => document.querySelector(sel);
const $all = (sel) => Array.from(document.querySelectorAll(sel));
const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
const uid = ()=> Date.now().toString(36) + Math.random().toString(36).slice(2,6);

function getData(key){ return JSON.parse(localStorage.getItem(key) || '[]'); }
function setData(key, data){ localStorage.setItem(key, JSON.stringify(data)); }

function showToast(msg, type='success'){
  const container = document.getElementById('toast-container');
  if(!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type==='error' ? 'toast-error' : 'toast-success'}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(()=>{ t.classList.add('fade-out'); setTimeout(()=> t.remove(), 450); }, 2600);
}

/* Logo and site title (stored in localStorage) */
const LOGO_KEY = 'os_logo_v1';
const SITE_TITLE_KEY = 'os_site_title_v1';

function loadLogo(){
  const data = localStorage.getItem(LOGO_KEY);
  const slot = document.querySelector('.logo-slot');
  if(!slot) return;
  slot.innerHTML = '';
  if(data){
    const img = document.createElement('img'); img.src = data; img.className = 'logo-img'; img.alt = 'Logo';
    slot.appendChild(img);
  } else {
    const ph = document.createElement('div'); ph.className = 'logo-placeholder'; ph.textContent = 'Logo'; slot.appendChild(ph);
  }
}

function setSiteTitle(title){
  if(!title) return;
  localStorage.setItem(SITE_TITLE_KEY, title);
  loadSiteTitle();
}

function loadSiteTitle(){
  const t = localStorage.getItem(SITE_TITLE_KEY) || 'Oficina - Gerenciador de OS';
  document.querySelectorAll('.nav-brand').forEach(el=> el.textContent = t);
}

// create hidden file input and attach change handler; does not bind to UI buttons
function ensureLogoFileInput(){
  let input = document.getElementById('logo-file-input');
  if(!input){
    input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.id = 'logo-file-input'; input.style.display='none'; document.body.appendChild(input);
  }
  return input;
}

// trigger file selection and return dataURL via callback (does not auto-save)
function selectLogoFile(callback){
  const input = ensureLogoFileInput();
  input.onchange = (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f){ input.value=''; return; }
    const reader = new FileReader();
    reader.onload = ()=>{
      const data = reader.result;
      if(typeof callback === 'function') callback(data, f);
      input.value='';
    };
    reader.readAsDataURL(f);
  };
  input.click();
}

function saveLogoData(dataURL){
  try{ localStorage.setItem(LOGO_KEY, dataURL); loadLogo(); showToast('Logo salva', 'success'); }
  catch(err){ showToast('Erro ao salvar logo', 'error'); }
}

function removeLogo(){ localStorage.removeItem(LOGO_KEY); loadLogo(); }

/* Dark mode removed */

/* Clientes */
function renderClients(){
  const clients = getData(STORAGE_KEYS.clients);
  const list = $('#clients-list'); if(list) list.innerHTML = '';
  const sel = $('#select-client'); if(sel) sel.innerHTML = '<option value="">-- Selecione --</option>';
  clients.forEach(c=>{
    const li = document.createElement('li');
    li.textContent = `${c.nome} • ${c.whatsapp || ''}`;
    if(list) list.appendChild(li);
    if(sel){ const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.nome; sel.appendChild(opt); }
  });
}

/* Veículos */
function renderVehicles(){
  const vehicles = getData(STORAGE_KEYS.vehicles);
  const list = $('#vehicles-list'); if(list) list.innerHTML = '';
  const sel = $('#select-vehicle'); if(sel) sel.innerHTML = '<option value="">-- Selecione --</option>';
  vehicles.forEach(v=>{
    const li = document.createElement('li');
    li.textContent = `${v.marca} ${v.modelo} • ${v.placa || ''}`;
    if(list) list.appendChild(li);
    if(sel){ const opt = document.createElement('option'); opt.value = v.id; opt.textContent = `${v.marca} ${v.modelo} • ${v.placa}`; sel.appendChild(opt); }
  });
}

/* Produtos (Estoque) */
function renderProducts(){
  const products = getData(STORAGE_KEYS.products);
  const list = $('#products-list'); if(!list) return; list.innerHTML = '';
  products.forEach(p=>{
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between';
    li.innerHTML = `<div>${p.name} • ${p.sku||''} • R$ ${fmt(p.price||0)} • Qtd: ${p.qty||0}</div>
      <div class="flex gap-2">
        <button class="btn-ghost btn-edit-product" data-id="${p.id}">Editar</button>
        <button class="btn-ghost btn-del-product" data-id="${p.id}">Excluir</button>
      </div>`;
    list.appendChild(li);
  });

  // attach product handlers
  $all('.btn-del-product').forEach(b=> b.addEventListener('click', e=>{
    const id = e.currentTarget.dataset.id;
    if(!confirm('Excluir produto?')) return;
    const arr = getData(STORAGE_KEYS.products).filter(x=>x.id!==id);
    setData(STORAGE_KEYS.products, arr); renderProducts();
    showToast('Produto excluído', 'success');
  }));
  $all('.btn-edit-product').forEach(b=> b.addEventListener('click', e=>{
    const id = e.currentTarget.dataset.id;
    const p = getData(STORAGE_KEYS.products).find(x=>x.id===id);
    if(!p) return showToast('Produto não encontrado', 'error');
    const f = $('#form-product'); f.name.value = p.name; f.sku.value = p.sku || ''; f.price.value = p.price || 0; f.qty.value = p.qty || 0; $('#current-product-id').value = p.id;
    // switch to produtos tab if necessary
    $all('.tab-button').forEach(x=> x.classList.remove('active'));
    $all('.tab-panel').forEach(pn=> pn.classList.add('hidden'));
    document.querySelector('.tab-button[data-tab="produtos"]').classList.add('active');
    document.getElementById('tab-produtos').classList.remove('hidden');
  }));
}

function renderProductsDatalist(){
  const products = getData(STORAGE_KEYS.products);
  let dl = document.getElementById('products-datalist');
  if(!dl){ dl = document.createElement('datalist'); dl.id = 'products-datalist'; document.body.appendChild(dl); }
  dl.innerHTML = '';
  products.forEach(p=>{
    const opt = document.createElement('option');
    // display name (SKU optional) but value will be name so user can type name or sku
    opt.value = p.name || '';
    dl.appendChild(opt);
  });
}

/* Peças (tabela dinâmica) */
function addPartRow(part={name:'', qty:1, unit:0, productId:'', sku:''}){
  const tbody = $('#parts-table tbody');
  const tr = document.createElement('tr');
  // product search input with global datalist
  tr.innerHTML = `
    <td class="px-2">
      <input class="input part-product-search" list="products-datalist" placeholder="Buscar produto (nome ou SKU)">
      <input class="input w-full part-name mt-1" placeholder="Nome da peça" value="${part.name||''}">
      <input type="hidden" class="part-product-id" value="${part.productId||''}">
      <input type="hidden" class="part-sku" value="${part.sku||''}">
    </td>
    <td class="px-2"><input type="number" min="0" class="input part-qty" value="${part.qty||1}"></td>
    <td class="px-2"><input type="number" min="0" step="0.01" class="input part-unit" value="${part.unit||0}"></td>
    <td class="px-2 text-right"><span class="part-line-total">0,00</span></td>
    <td class="px-2"><button class="btn-ghost btn-remove-part">🗑️</button></td>
  `;
  tbody.appendChild(tr);

  const qty = tr.querySelector('.part-qty');
  const unit = tr.querySelector('.part-unit');
  const name = tr.querySelector('.part-name');
  const total = tr.querySelector('.part-line-total');
  const prodSearch = tr.querySelector('.part-product-search');
  const prodIdInput = tr.querySelector('.part-product-id');
  const skuInput = tr.querySelector('.part-sku');

  // when user types or selects from datalist, try to match product by name or SKU
  function matchAndApply(value){
    const products = getData(STORAGE_KEYS.products);
    const v = (value||'').trim().toLowerCase();
    if(!v) return;
    let match = products.find(p=> (p.name||'').toLowerCase() === v || (p.sku||'').toLowerCase() === v);
    if(!match) {
      // try contains search
      match = products.find(p=> (p.name||'').toLowerCase().includes(v) || (p.sku||'').toLowerCase().includes(v));
    }
    if(match){
      name.value = match.name || name.value;
      unit.value = match.price || unit.value;
      if(match.qty !== undefined) qty.max = match.qty;
      prodIdInput.value = match.id || '';
      skuInput.value = match.sku || '';
      updateLine();
    } else {
      prodIdInput.value = '';
      skuInput.value = '';
    }
  }

  if(prodSearch){
    prodSearch.addEventListener('input', (e)=> matchAndApply(e.target.value));
    // if initial part has productId or sku, try to prefill
    if(part.productId){
      const p = getData(STORAGE_KEYS.products).find(x=> x.id === part.productId);
      if(p){ prodSearch.value = p.name; name.value = p.name; unit.value = p.price || unit.value; prodIdInput.value = p.id; skuInput.value = p.sku || ''; if(p.qty !== undefined) qty.max = p.qty; }
    } else if(part.sku){
      const p = getData(STORAGE_KEYS.products).find(x=> (x.sku||'').toLowerCase() === (part.sku||'').toLowerCase());
      if(p){ prodSearch.value = p.name; name.value = p.name; unit.value = p.price || unit.value; prodIdInput.value = p.id; skuInput.value = p.sku || ''; if(p.qty !== undefined) qty.max = p.qty; }
    } else if(part.name){
      // try match by name
      const p = getData(STORAGE_KEYS.products).find(x=> (x.name||'').toLowerCase() === (part.name||'').toLowerCase());
      if(p){ prodSearch.value = p.name; name.value = p.name; unit.value = p.price || unit.value; prodIdInput.value = p.id; skuInput.value = p.sku || ''; if(p.qty !== undefined) qty.max = p.qty; }
      else { prodSearch.value = part.name; }
    }
  }

  function updateLine(){
    const q = parseFloat(qty.value) || 0;
    const u = parseFloat(unit.value) || 0;
    total.textContent = fmt(q*u);
    updateTotals();
  }

  qty.addEventListener('input', updateLine);
  unit.addEventListener('input', updateLine);
  name.addEventListener('input', ()=>{});
  tr.querySelector('.btn-remove-part').addEventListener('click', ()=>{ tr.remove(); updateTotals(); });
  updateLine();
}

function clearParts(){ $('#parts-table tbody').innerHTML = ''; updateTotals(); }

function updateTotals(){
  const rows = $all('#parts-table tbody tr');
  let sum = 0;
  rows.forEach(r=>{
    const q = parseFloat(r.querySelector('.part-qty').value) || 0;
    const u = parseFloat(r.querySelector('.part-unit').value) || 0;
    sum += q*u;
  });
  $('#total-parts').textContent = fmt(sum);
  const labor = parseFloat($('#work-value').value) || 0;
  $('#total-grand').textContent = fmt(sum + labor);
}

/* Ordens */
function renderOrders(){
  const orders = getData(STORAGE_KEYS.orders).slice().reverse();
  const q = $('#orders-search').value.trim().toLowerCase();
  const statusFilter = $('#filter-status').value;
  const clients = getData(STORAGE_KEYS.clients);
  const vehicles = getData(STORAGE_KEYS.vehicles);

  const el = $('#orders-list'); el.innerHTML = '';

  orders.filter(o=>{
    if(statusFilter && o.status !== statusFilter) return false;
    if(!q) return true;
    const client = clients.find(c=>c.id===o.clientId)?.nome || '';
    const vehicle = vehicles.find(v=>v.id===o.vehicleId)?.placa || '';
    return (client+vehicle+ (o.id||'')).toLowerCase().includes(q);
  }).forEach(o=>{
    const div = document.createElement('div');
    div.className = 'p-3 border rounded flex items-center justify-between';
    const clientName = clients.find(c=>c.id===o.clientId)?.nome || '—';
    const vehicleText = vehicles.find(v=>v.id===o.vehicleId)? `${vehicles.find(v=>v.id===o.vehicleId).marca} ${vehicles.find(v=>v.id===o.vehicleId).modelo} • ${vehicles.find(v=>v.id===o.vehicleId).placa}` : '—';
    const partsTotal = (o.parts||[]).reduce((s,p)=>s + (p.qty||0)*(p.unit||0),0);
    const grand = partsTotal + (o.laborValue||0);
    div.innerHTML = `
      <div>
        <div class="font-medium">OS ${o.id} • <span class="text-sm text-gray-600">${clientName}</span></div>
        <div class="text-sm text-gray-600">${vehicleText} • ${o.status}</div>
      </div>
      <div class="flex items-center gap-2">
        <div class="text-right mr-4">R$ ${fmt(grand)}</div>
        <button class="btn-ghost btn-view" data-id="${o.id}">Ver</button>
        <button class="btn-ghost btn-edit" data-id="${o.id}">Editar</button>
        <button class="btn-ghost btn-del" data-id="${o.id}">Excluir</button>
        <button class="btn-primary btn-print-order" data-id="${o.id}">Imprimir</button>
      </div>
    `;
    el.appendChild(div);
  });

  // attach handlers
  $all('.btn-del').forEach(b=> b.addEventListener('click', e=>{
    const id = e.currentTarget.dataset.id;
    if(confirm('Remover essa ordem?')){
      const orders = getData(STORAGE_KEYS.orders).filter(x=>x.id!==id);
      setData(STORAGE_KEYS.orders, orders); renderOrders();
    }
  }));
  $all('.btn-edit').forEach(b=> b.addEventListener('click', e=> loadOrder(e.currentTarget.dataset.id)));
  $all('.btn-view').forEach(b=> b.addEventListener('click', e=> viewOrder(e.currentTarget.dataset.id)));
  $all('.btn-print-order').forEach(b=> b.addEventListener('click', e=> printOrder(e.currentTarget.dataset.id)));
}

function loadOrder(id){
  const orders = getData(STORAGE_KEYS.orders);
  const o = orders.find(x=>x.id===id); if(!o) return alert('Ordem não encontrada');
  $('#current-order-id').value = o.id;
  $('#select-client').value = o.clientId || '';
  $('#select-vehicle').value = o.vehicleId || '';
  $('#os-status').value = o.status || 'Aberto';
  $('#work-desc').value = o.laborDesc || '';
  $('#work-value').value = o.laborValue || 0;
  clearParts();
  (o.parts||[]).forEach(p=> addPartRow(p));
  updateTotals();
}

function viewOrder(id){
  loadOrder(id); window.scrollTo({top:0, behavior:'smooth'});
}

function printOrder(id){
  const orders = getData(STORAGE_KEYS.orders);
  const clients = getData(STORAGE_KEYS.clients);
  const vehicles = getData(STORAGE_KEYS.vehicles);
  const o = orders.find(x=>x.id===id);
  if(!o) return alert('Ordem não encontrada');
  const client = clients.find(c=>c.id===o.clientId) || {};
  const vehicle = vehicles.find(v=>v.id===o.vehicleId) || {};

  const partsHtml = (o.parts||[]).map(p=>
    `<tr><td>${p.name}</td><td style="text-align:right">${p.qty}</td><td style="text-align:right">R$ ${fmt(p.unit)}</td><td style="text-align:right">R$ ${fmt(p.qty*p.unit)}</td></tr>`
  ).join('');

  const partsTotal = (o.parts||[]).reduce((s,p)=> s + (p.qty||0)*(p.unit||0),0);
  const grand = partsTotal + (o.laborValue||0);
  const siteTitle = localStorage.getItem(SITE_TITLE_KEY) || 'Oficina - Ordem de Serviço';
  const logoData = localStorage.getItem(LOGO_KEY) || '';

  const html = `
    <html><head><meta charset="utf-8"><title>${siteTitle} - OS ${o.id}</title>
    <style>
      body{font-family: Arial, Helvetica, sans-serif; color:#0b2545; margin:20px}
      h2{margin:0 0 8px 0}
      table{width:100%; border-collapse:collapse}
      th,td{border-bottom:1px solid #ddd;padding:8px}
      .right{text-align:right}
      .header{display:flex; justify-content:space-between; align-items:center}
      .brand{display:flex; align-items:center; gap:12px}
      .brand img{max-height:64px}
    </style>
    </head><body>
    <div class="header"><div class="brand">${logoData ? `<div><img src="${logoData}" alt="logo"/></div>` : ''}<div><h2>${siteTitle}</h2><div>OS: ${o.id}</div></div></div><div><strong>Status:</strong> ${o.status}</div></div>
    <hr />
    <h3>Cliente</h3>
    <div>${client.nome || '—'} • ${client.whatsapp || ''} • ${client.cpf || ''}</div>
    <div>${client.endereco ? 'Endereço: ' + client.endereco : ''}</div>
    <h3>Veículo</h3>
    <div>${vehicle.marca||''} ${vehicle.modelo||''} • ${vehicle.ano||''} • ${vehicle.placa||''} • ${vehicle.km||''}</div>
    <h3>Peças</h3>
    <table><thead><tr><th>Nome</th><th class="right">Qtd</th><th class="right">Valor Unit.</th><th class="right">Total</th></tr></thead><tbody>${partsHtml}</tbody></table>
    <h3>Mão de Obra</h3>
    <div>${o.laborDesc || ''}</div>
    <div style="margin-top:12px;text-align:right"><strong>Total Peças: R$ ${fmt(partsTotal)}</strong><br/><strong>Total Geral: R$ ${fmt(grand)}</strong></div>
    <script>window.print();</script>
    </body></html>`;

  const w = window.open('','_blank','width=900,height=700');
  w.document.write(html); w.document.close();
}

/* Form handlers */
document.addEventListener('DOMContentLoaded', ()=>{
  if($('#clients-list') || $('#select-client')) renderClients();
  if($('#vehicles-list') || $('#select-vehicle')) renderVehicles();
  if($('#orders-list')) renderOrders();

  // dark mode removed — no initialization required

  // ativa link de navegação conforme página
  $all('.nav-link').forEach(a=>{
    try{
      const href = a.getAttribute('href') || '';
      if(location.pathname.endsWith(href) || (href === 'index.html' && (location.pathname.endsWith('/') || location.pathname.endsWith('index.html')))) a.classList.add('active');
    }catch(e){}
  });

  

  if($('#form-client')){
    $('#form-client').addEventListener('submit', e=>{
    e.preventDefault();
    const f = e.target;
    const nome = f.nome.value.trim();
    if(!nome){ showToast('Preencha o nome do cliente', 'error'); f.nome.focus(); return; }
    const client = { id: uid(), nome, whatsapp: f.whatsapp.value.trim(), cpf: f.cpf.value.trim(), endereco: f.endereco.value.trim() };
    const arr = getData(STORAGE_KEYS.clients); arr.push(client); setData(STORAGE_KEYS.clients, arr); f.reset(); renderClients();
    // seleciona o cliente recém-criado para facilitar abrir a OS
    const sel = $('#select-client'); if(sel) sel.value = client.id;
    showToast('Cliente cadastrado', 'success');
    });
  }

  if($('#form-vehicle')){
    $('#form-vehicle').addEventListener('submit', e=>{
      e.preventDefault();
      const f = e.target;
      const marca = f.marca.value.trim();
      const placa = f.placa.value.trim();
      if(!marca){ showToast('Preencha a marca do veículo', 'error'); f.marca.focus(); return; }
      if(!placa){ showToast('Preencha a placa do veículo', 'error'); f.placa.focus(); return; }
      const v = { id: uid(), marca, modelo: f.modelo.value.trim(), ano: f.ano.value.trim(), placa, km: f.km.value.trim() };
      const arr = getData(STORAGE_KEYS.vehicles); arr.push(v); setData(STORAGE_KEYS.vehicles, arr); f.reset(); renderVehicles();
      const selV = $('#select-vehicle'); if(selV) selV.value = v.id;
      showToast('Veículo cadastrado', 'success');
    });
  }

  if($('#form-product')){
    $('#form-product').addEventListener('submit', e=>{
      e.preventDefault();
      const f = e.target;
      const name = f.name.value.trim();
      if(!name){ showToast('Preencha o nome do produto', 'error'); f.name.focus(); return; }
      const curId = $('#current-product-id').value;
      const p = { id: curId || uid(), name, sku: f.sku.value.trim(), price: parseFloat(f.price.value) || 0, qty: parseInt(f.qty.value) || 0 };
      let arr = getData(STORAGE_KEYS.products);
      if(curId){ arr = arr.map(x=> x.id===curId ? p : x); showToast('Produto atualizado', 'success'); }
      else { arr.push(p); showToast('Produto cadastrado', 'success'); }
      setData(STORAGE_KEYS.products, arr); f.reset(); $('#current-product-id').value = ''; renderProducts();
    });
  }

  // tabs (only when present)
  if($all('.tab-button').length){
    $all('.tab-button').forEach(b=> b.addEventListener('click', e=>{
      const tab = e.currentTarget.dataset.tab;
      $all('.tab-button').forEach(x=> x.classList.remove('active'));
      e.currentTarget.classList.add('active');
      $all('.tab-panel').forEach(p=> p.classList.add('hidden'));
      const sel = document.getElementById('tab-' + tab);
      if(sel) sel.classList.remove('hidden');
    }));
  }

  // render initial products only if product list exists on page
  if($('#products-list')) renderProducts();
  // render datalist for product autocomplete when available
  renderProductsDatalist();
  // logo & site title
  loadLogo(); loadSiteTitle(); ensureLogoFileInput();

  if($('#btn-add-part')) $('#btn-add-part').addEventListener('click', ()=> addPartRow());
  if($('#work-value')) $('#work-value').addEventListener('input', updateTotals);

  if($('#form-os')){
    $('#form-os').addEventListener('submit', e=>{
    e.preventDefault();
    const idCurr = $('#current-order-id').value || uid();
    const clientId = $('#select-client').value;
    const vehicleId = $('#select-vehicle').value;
    if(!clientId){ showToast('Selecione um cliente antes de salvar a OS', 'error'); return; }
    if(!vehicleId){ showToast('Selecione um veículo antes de salvar a OS', 'error'); return; }
    const status = $('#os-status').value;
    const laborDesc = $('#work-desc').value.trim();
    const laborValue = parseFloat($('#work-value').value) || 0;
    const parts = $all('#parts-table tbody tr').map(r=>{
      const nameVal = r.querySelector('.part-name').value.trim();
      const qtyVal = parseFloat(r.querySelector('.part-qty').value) || 0;
      const unitVal = parseFloat(r.querySelector('.part-unit').value) || 0;
      const productIdVal = r.querySelector('.part-product-id') ? r.querySelector('.part-product-id').value : '';
      const skuVal = r.querySelector('.part-sku') ? r.querySelector('.part-sku').value : '';
      return { name: nameVal, qty: qtyVal, unit: unitVal, productId: productIdVal, sku: skuVal };
    }).filter(p=>p.name);

    // validar estoque: preferir match por productId -> sku -> name
    const products = getData(STORAGE_KEYS.products);
    for(const p of parts){
      let prod;
      if(p.productId) prod = products.find(x=> x.id === p.productId);
      if(!prod && p.sku) prod = products.find(x=> (x.sku||'').toLowerCase() === (p.sku||'').toLowerCase());
      if(!prod && p.name) prod = products.find(x=> (x.name||'').toLowerCase() === (p.name||'').toLowerCase());
      if(prod){ if(prod.qty < p.qty){ showToast(`Estoque insuficiente para ${p.name}`, 'error'); return; } }
    }

    // decrementar estoque
    let updatedProducts = products.slice();
    for(const p of parts){
      let idx = -1;
      if(p.productId) idx = updatedProducts.findIndex(x=> x.id === p.productId);
      if(idx < 0 && p.sku) idx = updatedProducts.findIndex(x=> (x.sku||'').toLowerCase() === (p.sku||'').toLowerCase());
      if(idx < 0 && p.name) idx = updatedProducts.findIndex(x=> (x.name||'').toLowerCase() === (p.name||'').toLowerCase());
      if(idx >= 0){ updatedProducts[idx].qty = Math.max(0, (updatedProducts[idx].qty||0) - p.qty); }
    }
    setData(STORAGE_KEYS.products, updatedProducts);

    const orders = getData(STORAGE_KEYS.orders).filter(o=>o.id!==idCurr);
    orders.push({ id: idCurr, clientId, vehicleId, status, laborDesc, laborValue, parts, createdAt: new Date().toISOString() });
    setData(STORAGE_KEYS.orders, orders);
    $('#current-order-id').value = '';
    $('#form-os').reset(); clearParts(); updateTotals(); renderOrders(); renderProducts();
    showToast('Ordem salva e estoque atualizado', 'success');
  });
  }

  if($('#btn-new-os')) $('#btn-new-os').addEventListener('click', ()=>{ $('#current-order-id').value=''; $('#form-os').reset(); clearParts(); updateTotals(); });
  if($('#orders-search')) $('#orders-search').addEventListener('input', renderOrders);
  if($('#filter-status')) $('#filter-status').addEventListener('change', renderOrders);
  if($('#btn-print')) $('#btn-print').addEventListener('click', ()=>{
    const curId = $('#current-order-id').value;
    if(curId) printOrder(curId);
    else alert('Carregue ou salve uma Ordem antes de imprimir.');
  });
});

/* Inicializa com uma linha de peça vazia para usabilidade */
// Inicializa com uma linha de peça vazia para usabilidade somente se existir a tabela
if(document.querySelector('#parts-table')){ addPartRow(); updateTotals(); }
