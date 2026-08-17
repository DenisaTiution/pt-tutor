(async function() {
  await DB.init();
  const app = document.getElementById('app');

  async function render(view) {
    if (view === 'home') renderHome();
    else if (view === 'play') renderPlay();
    else if (view === 'create') renderCreate();
    else if (view === 'manage') renderManage();
  }

  async function renderHome() {
    const cards = await DB.getAll();
    app.innerHTML = `
      <div class="card">
        <h2>Bem-vindo ao Tabu!</h2>
        <p style="color: #666; margin-bottom: 20px;">Um jogo divertido para expandir vocabulário em Português.</p>
        
        <div class="stats">
          <div class="stat-box">
            <div class="stat-number">${cards.length}</div>
            <div class="stat-label">Cartas Criadas</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${cards.length > 0 ? '✓' : '○'}</div>
            <div class="stat-label">Pronto para Jogar</div>
          </div>
        </div>

        <div class="home-buttons">
          <button id="playBtn" class="btn-primary" ${cards.length === 0 ? 'disabled' : ''}>▶ Jogar Tabu</button>
          <button id="createBtn" class="btn-secondary">+ Nova Carta</button>
          <button id="manageBtn" class="btn-secondary">📋 Gerir Cartas (${cards.length})</button>
          <button id="loadBtn" class="btn-tertiary">⬇ Carregar Dados de Exemplo</button>
        </div>
      </div>
    `;

    document.getElementById('playBtn').addEventListener('click', () => {
      if (cards.length > 0) render('play');
    });
    document.getElementById('createBtn').addEventListener('click', () => render('create'));
    document.getElementById('manageBtn').addEventListener('click', () => render('manage'));
    document.getElementById('loadBtn').addEventListener('click', loadSampleCards);
  }

  async function loadSampleCards() {
    if (!confirm('Isto substituirá todas as suas cartas. Continuar?')) return;
    for (const card of SAMPLE_CARDS) {
      await DB.add(card);
    }
    alert('Cartas de exemplo carregadas!');
    render('home');
  }

  let currentCardIndex = 0;
  let gameCards = [];

  async function renderPlay() {
    gameCards = await DB.getAll();
    if (gameCards.length === 0) {
      app.innerHTML = `
        <div class="card" style="text-align: center;">
          <h3>Sem cartas disponíveis</h3>
          <p style="color: #666; margin: 16px 0;">Crie algumas cartas ou carregue as de exemplo.</p>
          <button id="backBtn" class="btn-primary">← Voltar</button>
        </div>
      `;
      document.getElementById('backBtn').addEventListener('click', () => render('home'));
      return;
    }
    currentCardIndex = 0;
    showCard();
  }

  function showCard() {
    if (currentCardIndex >= gameCards.length) {
      app.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <h2 style="color: #4caf50; margin-bottom: 16px;">🎉 Fim do Jogo!</h2>
          <p style="color: #666; font-size: 18px; margin-bottom: 24px;">Viu ${gameCards.length} cartas.</p>
          <button id="homeBtn" class="btn-primary">← Voltar ao Início</button>
        </div>
      `;
      document.getElementById('homeBtn').addEventListener('click', () => render('home'));
      return;
    }

    const card = gameCards[currentCardIndex];
    app.innerHTML = `
      <div class="game-card">
        <div class="progress">Carta ${currentCardIndex + 1} / ${gameCards.length}</div>
        <div class="word">${card.palavra}</div>
      </div>

      <div class="forbidden-box">
        <div class="label">🚫 Palavras Proibidas</div>
        <div class="word">${card.proibida1}</div>
        <div class="word">${card.proibida2}</div>
      </div>

      <div class="action-row">
        <button id="correctBtn" class="btn-success">✓ Acertou</button>
        <button id="skipBtn" class="btn-tertiary">→ Saltar</button>
      </div>
    `;

    document.getElementById('correctBtn').addEventListener('click', () => {
      currentCardIndex++;
      showCard();
    });
    document.getElementById('skipBtn').addEventListener('click', () => {
      currentCardIndex++;
      showCard();
    });
  }

  async function renderCreate() {
    app.innerHTML = `
      <button id="backBtn" class="back-btn">← Voltar</button>
      <div class="card">
        <h2>Nova Carta de Tabu</h2>
        <div class="form-group">
          <label>Palavra</label>
          <input id="palavra" type="text" placeholder="ex: Gato" />
        </div>
        <div class="form-group">
          <label>Palavra Proibida 1</label>
          <input id="proibida1" type="text" placeholder="ex: Animal" />
        </div>
        <div class="form-group">
          <label>Palavra Proibida 2</label>
          <input id="proibida2" type="text" placeholder="ex: Bigodes" />
        </div>
        <div class="action-row">
          <button id="saveBtn" class="btn-primary">Guardar Carta</button>
        </div>
      </div>
    `;

    document.getElementById('backBtn').addEventListener('click', () => render('home'));
    document.getElementById('saveBtn').addEventListener('click', async () => {
      const palavra = document.getElementById('palavra').value.trim();
      const proibida1 = document.getElementById('proibida1').value.trim();
      const proibida2 = document.getElementById('proibida2').value.trim();

      if (!palavra || !proibida1 || !proibida2) {
        alert('Preencha todos os campos');
        return;
      }

      await DB.add({ palavra, proibida1, proibida2 });
      alert('Carta guardada!');
      render('home');
    });
  }

  async function renderManage() {
    const cards = await DB.getAll();
    app.innerHTML = `
      <button id="backBtn" class="back-btn">← Voltar</button>
      <div class="card">
        <h2>Minhas Cartas (${cards.length})</h2>
        <div id="cardsList"></div>
      </div>
    `;

    document.getElementById('backBtn').addEventListener('click', () => render('home'));

    const cardsList = document.getElementById('cardsList');
    if (cards.length === 0) {
      cardsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Sem cartas criadas</p>';
      return;
    }

    cardsList.innerHTML = cards.map((card, idx) => `
      <div class="card-item">
        <div class="word-title">${card.palavra}</div>
        <div class="forbidden">🚫 ${card.proibida1} • ${card.proibida2}</div>
        <div class="actions">
          <button class="btn-tertiary btn-small" onclick="editCard('${card.id}')">Editar</button>
          <button class="btn-danger btn-small" onclick="deleteCard('${card.id}')">Apagar</button>
        </div>
      </div>
    `).join('');
  }

  window.editCard = async (id) => {
    const card = await DB.get(id);
    app.innerHTML = `
      <button id="backBtn" class="back-btn">← Voltar</button>
      <div class="card">
        <h2>Editar Carta</h2>
        <div class="form-group">
          <label>Palavra</label>
          <input id="palavra" type="text" value="${card.palavra}" />
        </div>
        <div class="form-group">
          <label>Palavra Proibida 1</label>
          <input id="proibida1" type="text" value="${card.proibida1}" />
        </div>
        <div class="form-group">
          <label>Palavra Proibida 2</label>
          <input id="proibida2" type="text" value="${card.proibida2}" />
        </div>
        <div class="action-row">
          <button id="saveBtn" class="btn-primary">Guardar Alterações</button>
        </div>
      </div>
    `;

    document.getElementById('backBtn').addEventListener('click', () => render('manage'));
    document.getElementById('saveBtn').addEventListener('click', async () => {
      const palavra = document.getElementById('palavra').value.trim();
      const proibida1 = document.getElementById('proibida1').value.trim();
      const proibida2 = document.getElementById('proibida2').value.trim();

      if (!palavra || !proibida1 || !proibida2) {
        alert('Preencha todos os campos');
        return;
      }

      await DB.add({ id, palavra, proibida1, proibida2 });
      alert('Carta atualizada!');
      render('manage');
    });
  };

  window.deleteCard = async (id) => {
    if (!confirm('Apagar esta carta?')) return;
    await DB.delete(id);
    render('manage');
  };

  render('home');
})();
