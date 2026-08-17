// Main app: PT-PT UI
(async function(){
  await DB.init();

  // Elements
  const navBtns = document.querySelectorAll('.nav-btn');
  const pageTitle = document.getElementById('page-title');
  const pageSub = document.getElementById('page-sub');
  const appEl = document.getElementById('app');
  const quickNoteBtn = document.getElementById('quickNoteBtn');
  const quickModal = document.getElementById('quickNoteModal');
  const quickAluno = document.getElementById('quickNoteAluno');
  const quickText = document.getElementById('quickNoteText');
  const quickSave = document.getElementById('quickNoteSave');
  const quickCancel = document.getElementById('quickNoteCancel');
  const loadSampleBtn = document.getElementById('loadSampleBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('fileInput');

  let currentRoute = 'dashboard';
  function setActive(route){
    currentRoute = route;
    navBtns.forEach(b=>b.classList.toggle('active', b.dataset.route===route));
    pageTitle.textContent = routeTitle(route);
    pageSub.textContent = routeSub(route);
  }
  navBtns.forEach(b=>b.addEventListener('click', ()=>{ navigate(b.dataset.route); }));

  document.getElementById('loadSampleBtn').addEventListener('click', async ()=>{
    if (!confirm('Carregar dados de exemplo substituirá dados actuais? Recomendado apenas em novo perfil.')) return;
    await DB.loadSample();
    navigate('dashboard');
  });

  exportBtn.addEventListener('click', async ()=>{
    const data = await DB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pt-tutor-backup.json'; a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', ()=>fileInput.click());
  fileInput.addEventListener('change', async (e)=>{
    const f = e.target.files[0];
    if (!f) return;
    const text = await f.text();
    try{
      const data = JSON.parse(text);
      await DB.importAll(data);
      alert('Importação concluída.');
      navigate('dashboard');
    }catch(err){ alert('Erro na importação: ficheiro inválido.'); }
  });

  quickNoteBtn.addEventListener('click', async ()=>{
    await populateAlunoOptions();
    quickText.value = '';
    quickAluno.value = '';
    quickModal.classList.remove('hidden');
  });
  quickCancel.addEventListener('click', ()=> quickModal.classList.add('hidden'));
  quickSave.addEventListener('click', async ()=>{
    const text = quickText.value.trim();
    if (!text) { alert('Escreva algo nas notas.'); return; }
    const alunoId = quickAluno.value || null;
    const sess = { id: 's-'+Date.now(), alunoId, resumo: text, dataHora: (new Date()).toISOString(), criadoEm: new Date().toISOString() };
    await DB.add('sessoes', sess);
    quickModal.classList.add('hidden');
    alert('Nota guardada.');
    navigate('sessoes');
  });

  async function populateAlunoOptions(){
    const alunos = await DB.getAll('alunos');
    quickAluno.innerHTML = '<option value="">— escolher —</option>';
    for (const a of alunos){
      const opt = document.createElement('option'); opt.value = a.id; opt.textContent = a.nome;
      quickAluno.appendChild(opt);
    }
  }

  function routeTitle(r){ return ({
    dashboard:'Página Inicial',
    alunos:'Alunos',
    planos:'Planeamento de Aulas',
    sessoes:'Histórico de Aulas',
    vocab:'Vocabulário',
    gramatica:'Gramática',
    areas:'Áreas a Praticar',
    recursos:'Recursos / Atividades'
  }[r]||'PT Tutor'); }
  function routeSub(r){ return ({
    dashboard:'Resumo rápido das suas aulas',
    alunos:'Gerir a lista de alunos',
    planos:'Criar e guardar planos de aula',
    sessoes:'Notas e histórico por aluno',
    vocab:'Editar vocabulário',
    gramatica:'Notas de gramática',
    areas:'Áreas que precisam prática',
    recursos:'Atividades e recursos'
  }[r]||''); }

  async function navigate(route){
    setActive(route);
    if (route==='dashboard') return renderDashboard();
    if (route==='alunos') return renderAlunos();
    if (route==='planos') return renderPlanos();
    if (route==='sessoes') return renderSessoes();
    if (route==='vocab') return renderVocab();
    if (route==='gramatica') return renderGramatica();
    if (route==='areas') return renderAreas();
    if (route==='recursos') return renderRecursos();
  }

  // Views (concise implementations)
  async function renderDashboard(){
    const alunos = await DB.getAll('alunos');
    const sessoes = await DB.getAll('sessoes');
    const areas = await DB.getAll('areas');
    appEl.innerHTML = `
      <div class="grid">
        <div class="card">
          <h3>Resumo</h3>
          <p class="small">Alunos: <strong>${alunos.length}</strong></p>
          <p class="small">Aulas registadas: <strong>${sessoes.length}</strong></p>
          <p class="small">Áreas a praticar: <strong>${areas.length}</strong></p>
        </div>
        <div class="card">
          <h3>Últimas notas</h3>
          <div id="latestNotes"></div>
        </div>
        <div class="card">
          <h3>Ações rápidas</h3>
          <div class="action-row">
            <button id="addAlunoBtn" class="primary">Novo Aluno</button>
            <button id="viewAlunosBtn" class="tertiary">Ver Alunos</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('addAlunoBtn').addEventListener('click', ()=> renderAlunoForm());
    document.getElementById('viewAlunosBtn').addEventListener('click', ()=> navigate('alunos'));

    const latest = sessoes.slice(-5).reverse();
    const container = document.getElementById('latestNotes');
    if (!latest.length) container.innerHTML = '<p class="small">Nenhuma nota ainda.</p>';
    else {
      container.innerHTML = latest.map(s=>`<div class="small"><strong>${s.alunoId? 'Aluno:':'Nota:'}</strong> ${s.resumo?.slice(0,120)}</div>`).join('');
    }
  }

  // ALUNOS
  async function renderAlunos(){
    const alunos = await DB.getAll('alunos');
    appEl.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3>Alunos</h3>
          <button id="novoAluno" class="primary">Novo Aluno</button>
        </div>
        <div class="list" id="alunoList"></div>
      </div>
    `;
    document.getElementById('novoAluno').addEventListener('click', ()=> renderAlunoForm());
    const list = document.getElementById('alunoList');
    if (!alunos.length) list.innerHTML = '<p class="small">Sem alunos. Clique em "Novo Aluno".</p>';
    else {
      list.innerHTML = alunos.map(a=>`
        <div class="row card">
          <div>
            <div><strong>${a.nome}</strong> <span class="small">— ${a.nivel||'N/A'}</span></div>
            <div class="small">${a.objectivos||''}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="tertiary" data-id="${a.id}" data-action="view">Abrir</button>
            <button class="tertiary" data-id="${a.id}" data-action="edit">Editar</button>
            <button class="tertiary" data-id="${a.id}" data-action="delete">Apagar</button>
          </div>
        </div>
      `).join('');
      list.querySelectorAll('button').forEach(b=>{
        b.addEventListener('click', async (e)=>{
          const id = b.dataset.id;
          if (b.dataset.action==='view') return renderAlunoView(id);
          if (b.dataset.action==='edit') return renderAlunoForm(id);
          if (b.dataset.action==='delete'){
            if (!confirm('Eliminar aluno?')) return;
            await DB.delete('alunos', id);
            navigate('alunos');
          }
        });
      });
    }
  }

  async function renderAlunoForm(id){
    const edit = id ? await DB.get('alunos', id) : {};
    appEl.innerHTML = `
      <div class="card">
        <h3>${id? 'Editar Aluno':'Novo Aluno'}</h3>
        <label>Nome <input id="alunoNome" value="${edit.nome||''}"></label>
        <label>Nível <input id="alunoNivel" value="${edit.nivel||''}"></label>
        <label>Objectivos <input id="alunoObj" value="${edit.objectivos||''}"></label>
        <label>Notas gerais <textarea id="alunoNotas" rows="4">${edit.notas || ''}</textarea></label>
        <div class="action-row">
          <button id="saveAluno" class="primary">Guardar</button>
          <button id="cancelAluno" class="tertiary">Cancelar</button>
        </div>
      </div>
    `;
    document.getElementById('cancelAluno').addEventListener('click', ()=> navigate('alunos'));
    document.getElementById('saveAluno').addEventListener('click', async ()=>{
      const obj = {
        id: edit.id || 'a-'+Date.now(),
        nome: document.getElementById('alunoNome').value.trim(),
        nivel: document.getElementById('alunoNivel').value.trim(),
        objectivos: document.getElementById('alunoObj').value.trim(),
        notas: document.getElementById('alunoNotas').value.trim(),
        dataCriado: edit.dataCriado||new Date().toISOString(),
        dataAtualizado: new Date().toISOString()
      };
      if (!obj.nome) { alert('Nome é obrigatório'); return; }
      await DB.add('alunos', obj);
      navigate('alunos');
    });
  }

  async function renderAlunoView(id){
    const a = await DB.get('alunos', id);
    const sessoes = (await DB.getAll('sessoes')).filter(s=>s.alunoId===id).sort((x,y)=>new Date(y.dataHora)-new Date(x.dataHora));
    const planos = (await DB.getAll('planos'));
    appEl.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between">
          <div>
            <h3>${a.nome}</h3>
            <div class="small">${a.nivel || ''} — ${a.objectivos || ''}</div>
          </div>
          <div>
            <button id="editAluno" class="tertiary">Editar</button>
            <button id="backAlunos" class="tertiary">Voltar</button>
          </div>
        </div>
        <hr>
        <h4>Histórico de Aulas</h4>
        <div id="sessoesList"></div>
        <h4>Planos relacionados</h4>
        <div id="planosList"></div>
        <h4>Notas gerais</h4>
        <p>${a.notas||'<span class="small">Sem notas.</span>'}</p>
      </div>
    `;
    document.getElementById('editAluno').addEventListener('click', ()=> renderAlunoForm(id));
    document.getElementById('backAlunos').addEventListener('click', ()=> navigate('alunos'));
    const sl = document.getElementById('sessoesList');
    if (!sessoes.length) sl.innerHTML = '<p class="small">Sem sessões registadas.</p>';
    else sl.innerHTML = sessoes.map(s=>`<div class="card small">${new Date(s.dataHora).toLocaleString()} — ${s.resumo?.slice(0,200)}</div>`).join('');
    // planos: simple filter by tag (not linked in sample) - show all planos for now
    const pl = document.getElementById('planosList');
    const allPlanos = await DB.getAll('planos');
    if (!allPlanos.length) pl.innerHTML = '<p class="small">Sem planos.</p>';
    else pl.innerHTML = allPlanos.map(p=>`<div class="small card"><strong>${p.titulo}</strong><div class="small">${p.objectivos||''}</div></div>`).join('');
  }

  // PLANOS (simple)
  async function renderPlanos(){
    const planos = await DB.getAll('planos');
    appEl.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3>Planos de Aula</h3>
          <button id="novoPlano" class="primary">Novo Plano</button>
        </div>
        <div id="planosList" class="list"></div>
      </div>
    `;
    document.getElementById('novoPlano').addEventListener('click', ()=> renderPlanoForm());
    const list = document.getElementById('planosList');
    if (!planos.length) list.innerHTML = '<p class="small">Sem planos.</p>';
    else list.innerHTML = planos.map(p=>`
      <div class="card row">
        <div>
          <strong>${p.titulo}</strong>
          <div class="small">${p.objectivos||''}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="tertiary" data-id="${p.id}" data-action="edit">Editar</button>
          <button class="tertiary" data-id="${p.id}" data-action="delete">Apagar</button>
        </div>
      </div>
    `).join('');
    list.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', async ()=>{
        const id=b.dataset.id;
        if (b.dataset.action==='edit') renderPlanoForm(id);
        if (b.dataset.action==='delete'){ if (!confirm('Apagar plano?')) return; await DB.delete('planos', id); renderPlanos(); }
      });
    });
  }
  async function renderPlanoForm(id){
    const p = id? await DB.get('planos', id):{};
    appEl.innerHTML = `
      <div class="card">
        <h3>${id?'Editar Plano':'Novo Plano'}</h3>
        <label>Título <input id="plTitulo" value="${p.titulo||''}"></label>
        <label>Objectivos <input id="plObj" value="${p.objectivos||''}"></label>
        <label>Descrição <textarea id="plDesc" rows="4">${p.descricao||''}</textarea></label>
        <div class="action-row">
          <button id="savePlano" class="primary">Guardar</button>
          <button id="cancelPlano" class="tertiary">Cancelar</button>
        </div>
      </div>
    `;
    document.getElementById('cancelPlano').addEventListener('click', ()=> navigate('planos'));
    document.getElementById('savePlano').addEventListener('click', async ()=>{
      const obj = {
        id: p.id || 'pl-'+Date.now(),
        titulo: document.getElementById('plTitulo').value.trim(),
        objectivos: document.getElementById('plObj').value.trim(),
        descricao: document.getElementById('plDesc').value.trim(),
        dataCriado: p.dataCriado||new Date().toISOString()
      };
      if (!obj.titulo){ alert('Título obrigatório'); return; }
      await DB.add('planos', obj);
      navigate('planos');
    });
  }

  // SESSÕES (histórico)
  async function renderSessoes(){
    const sessoes = (await DB.getAll('sessoes')).sort((a,b)=>new Date(b.dataHora)-new Date(a.dataHora));
    const alunos = await DB.getAll('alunos');
    appEl.innerHTML = `
      <div class="card">
        <h3>Histórico de Aulas</h3>
        <div id="sList" class="list"></div>
      </div>
    `;
    const sList = document.getElementById('sList');
    if (!sessoes.length) sList.innerHTML = '<p class="small">Sem sessões registadas.</p>';
    else sList.innerHTML = sessoes.map(s=>`
      <div class="card">
        <div class="row">
          <div>
            <strong>${(s.alunoId && (alunos.find(x=>x.id===s.alunoId)||{}).nome) || 'Geral'}</strong>
            <div class="small">${new Date(s.dataHora).toLocaleString()}</div>
            <div class="small">${s.resumo?.slice(0,200)||''}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="tertiary" data-id="${s.id}" data-action="view">Ver</button>
            <button class="tertiary" data-id="${s.id}" data-action="delete">Apagar</button>
          </div>
        </div>
      </div>
    `).join('');
    sList.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', async ()=>{
        const id=b.dataset.id;
        if (b.dataset.action==='view'){ const s = await DB.get('sessoes', id); alert((s.resumo || '').slice(0,200)); }
        if (b.dataset.action==='delete'){ if (!confirm('Eliminar sessão?')) return; await DB.delete('sessoes', id); navigate('sessoes'); }
      });
    });
  }

  // Simple lists for vocab, grammatica, areas, recursos
  async function renderVocab(){ await renderSimpleList('vocab','Vocabulário','palavra'); }
  async function renderGramatica(){ await renderSimpleList('gramatica','Gramática','titulo'); }
  async function renderAreas(){ await renderSimpleList('areas','Áreas a Praticar','nome'); }
  
  async function renderRecursos(){
    const recursos = await DB.getAll('recursos');
    const tabuCards = await DB.getAll('tabu');
    appEl.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3>Recursos / Atividades</h3>
          <div style="display:flex;gap:8px">
            <button id="novoRecurso" class="primary">Novo Recurso</button>
            <button id="jogarTabu" class="secondary">Jogar Tabu</button>
          </div>
        </div>
        <div id="list"></div>
        <hr>
        <h4>Cartas de Tabu (${tabuCards.length})</h4>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button id="novoTabu" class="secondary">Nova Carta Tabu</button>
          <button id="gerirTabu" class="tertiary">Gerir Cartas</button>
        </div>
      </div>
    `;
    document.getElementById('novoRecurso').addEventListener('click', ()=> renderSimpleForm('recursos', null, 'titulo'));
    document.getElementById('jogarTabu').addEventListener('click', ()=> renderTabuGame());
    document.getElementById('novoTabu').addEventListener('click', ()=> renderTabuForm(null));
    document.getElementById('gerirTabu').addEventListener('click', ()=> renderTabuList());
    
    const list = document.getElementById('list');
    if (!recursos.length) list.innerHTML = '<p class="small">Sem recursos.</p>';
    else list.innerHTML = recursos.map(it=>`<div class="card row"><div><strong>${it.titulo||''}</strong><div class="small">${it.descricao||''}</div></div><div style="display:flex;gap:8px"><button class="tertiary" data-id="${it.id}" data-action="edit">Editar</button><button class="tertiary" data-id="${it.id}" data-action="delete">Apagar</button></div></div>`).join('');
    list.querySelectorAll('button').forEach(b=> b.addEventListener('click', async ()=>{
      const id=b.dataset.id;
      if (b.dataset.action==='edit') renderSimpleForm('recursos', id, 'titulo');
      if (b.dataset.action==='delete'){ if(!confirm('Apagar?')) return; await DB.delete('recursos', id); navigate('recursos'); }
    }));
  }

  async function renderSimpleList(store, title, field){
    const items = await DB.getAll(store);
    appEl.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between">
          <h3>${title}</h3>
          <button id="novo" class="primary">Novo</button>
        </div>
        <div id="list"></div>
      </div>
    `;
    document.getElementById('novo').addEventListener('click', ()=> renderSimpleForm(store, null, field));
    const list = document.getElementById('list');
    if (!items.length) list.innerHTML = '<p class="small">Sem itens.</p>';
    else list.innerHTML = items.map(it=>`<div class="card row"><div><strong>${it[field]||''}</strong><div class="small">${it.descricao||it.notas||''}</div></div><div style="display:flex;gap:8px"><button class="tertiary" data-id="${it.id}" data-action="edit">Editar</button><button class="tertiary" data-id="${it.id}" data-action="delete">Apagar</button></div></div>`).join('');
    list.querySelectorAll('button').forEach(b=> b.addEventListener('click', async ()=>{
      const id=b.dataset.id;
      if (b.dataset.action==='edit') renderSimpleForm(store, id, field);
      if (b.dataset.action==='delete'){ if(!confirm('Apagar?')) return; await DB.delete(store, id); renderSimpleList(store, title, field); }
    }));
  }

  async function renderSimpleForm(store, id, field){
    const it = id? await DB.get(store, id):{};
    appEl.innerHTML = `
      <div class="card">
        <h3>${id? 'Editar':'Novo'}</h3>
        <label>${field} <input id="itField" value="${it[field]||''}"></label>
        <label>Descrição / Notas <textarea id="itDesc" rows="4">${it.descricao||it.notas||''}</textarea></label>
        <div class="action-row">
          <button id="saveIt" class="primary">Guardar</button>
          <button id="cancelIt" class="tertiary">Cancelar</button>
        </div>
      </div>
    `;
    document.getElementById('cancelIt').addEventListener('click', ()=> navigate(store==='vocab'?'vocab': store==='gramatica'?'gramatica': store==='areas'?'areas':'recursos'));
    document.getElementById('saveIt').addEventListener('click', async ()=>{
      const obj = {
        id: it.id || store.substring(0,2)+'-'+Date.now(),
        [field]: document.getElementById('itField').value.trim(),
        descricao: document.getElementById('itDesc').value.trim()
      };
      if (!obj[field]) { alert('Preencha o campo principal.'); return; }
      await DB.add(store, obj);
      navigate(store==='vocab'?'vocab': store==='gramatica'?'gramatica': store==='areas'?'areas':'recursos');
    });
  }

  // TABU GAME
  let currentTabuIndex = 0;
  let tabuCards = [];

  async function renderTabuGame(){
    tabuCards = await DB.getAll('tabu');
    if (!tabuCards.length) {
      alert('Sem cartas de Tabu. Crie algumas primeiro!');
      return navigate('recursos');
    }
    currentTabuIndex = 0;
    showTabuCard();
  }

  function showTabuCard(){
    if (currentTabuIndex >= tabuCards.length) {
      appEl.innerHTML = `
        <div class="card" style="text-align:center;padding:40px">
          <h3>Fim do Jogo!</h3>
          <p>Viu ${tabuCards.length} cartas.</p>
          <button id="backRecursos" class="primary">Voltar aos Recursos</button>
        </div>
      `;
      document.getElementById('backRecursos').addEventListener('click', ()=> navigate('recursos'));
      return;
    }
    const card = tabuCards[currentTabuIndex];
    appEl.innerHTML = `
      <div class="card" style="text-align:center;padding:40px;">
        <div class="small" style="margin-bottom:20px">Carta ${currentTabuIndex + 1} / ${tabuCards.length}</div>
        <div style="background:#f0f4f8;padding:30px;border-radius:12px;margin-bottom:30px">
          <h2 style="margin:0;color:#2b6cb0;font-size:48px">${card.palavra}</h2>
        </div>
        <div style="background:#fee;padding:20px;border-radius:8px;margin-bottom:30px;border-left:4px solid #d81b60">
          <div class="small" style="color:#d81b60;font-weight:bold">Palavras proibidas:</div>
          <div style="font-size:18px;margin-top:8px;font-weight:600">${card.proibida1}</div>
          <div style="font-size:18px;font-weight:600">${card.proibida2}</div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center">
          <button id="acertou" class="primary" style="padding:12px 24px;font-size:16px">Acertou ✓</button>
          <button id="saltou" class="tertiary" style="padding:12px 24px;font-size:16px">Saltar →</button>
        </div>
      </div>
    `;
    document.getElementById('acertou').addEventListener('click', ()=>{
      currentTabuIndex++;
      showTabuCard();
    });
    document.getElementById('saltou').addEventListener('click', ()=>{
      currentTabuIndex++;
      showTabuCard();
    });
  }

  async function renderTabuForm(id){
    const card = id? await DB.get('tabu', id):{};
    appEl.innerHTML = `
      <div class="card">
        <h3>${id? 'Editar Carta Tabu':'Nova Carta Tabu'}</h3>
        <label>Palavra <input id="tabPalavra" value="${card.palavra||''}" placeholder="ex: Gato"></label>
        <label>Palavra Proibida 1 <input id="tabProibida1" value="${card.proibida1||''}" placeholder="ex: Animal"></label>
        <label>Palavra Proibida 2 <input id="tabProibida2" value="${card.proibida2||''}" placeholder="ex: Bigodes"></label>
        <div class="action-row">
          <button id="saveTab" class="primary">Guardar</button>
          <button id="cancelTab" class="tertiary">Cancelar</button>
        </div>
      </div>
    `;
    document.getElementById('cancelTab').addEventListener('click', ()=> navigate('recursos'));
    document.getElementById('saveTab').addEventListener('click', async ()=>{
      const p = document.getElementById('tabPalavra').value.trim();
      const pr1 = document.getElementById('tabProibida1').value.trim();
      const pr2 = document.getElementById('tabProibida2').value.trim();
      if (!p || !pr1 || !pr2) { alert('Preencha todos os campos.'); return; }
      const obj = { id: card.id || 'tb-'+Date.now(), palavra: p, proibida1: pr1, proibida2: pr2 };
      await DB.add('tabu', obj);
      navigate('recursos');
    });
  }

  async function renderTabuList(){
    const tabuCards = await DB.getAll('tabu');
    appEl.innerHTML = `
      <div class="card">
        <h3>Cartas de Tabu</h3>
        <div id="tabuListDiv"></div>
      </div>
    `;
    const div = document.getElementById('tabuListDiv');
    if (!tabuCards.length) div.innerHTML = '<p class="small">Sem cartas.</p>';
    else div.innerHTML = tabuCards.map(c=>`
      <div class="card" style="background:#f9f9f9">
        <div class="row">
          <div>
            <strong style="font-size:18px">${c.palavra}</strong>
            <div class="small" style="margin-top:8px">🚫 ${c.proibida1}, ${c.proibida2}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="tertiary" data-id="${c.id}" data-action="edit">Editar</button>
            <button class="tertiary" data-id="${c.id}" data-action="delete">Apagar</button>
          </div>
        </div>
      </div>
    `).join('');
    div.querySelectorAll('button').forEach(b=>
      b.addEventListener('click', async ()=>{
        const id = b.dataset.id;
        if (b.dataset.action==='edit') renderTabuForm(id);
        if (b.dataset.action==='delete'){ if (!confirm('Apagar carta?')) return; await DB.delete('tabu', id); renderTabuList(); }
      })
    );
  }

  // initial navigate
  navigate('dashboard');

})();