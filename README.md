# PT Tutor — V1 (local PWA)

Breve:
- PWA estática, interface em Português Europeu (PT‑PT).
- Armazena dados localmente via IndexedDB.
- Inclui export/import JSON para backup.
- Funciona offline depois do primeiro carregamento (service worker).

Como usar:
1. Coloque todos os ficheiros numa pasta.
2. Para testar localmente (recomendado), inicie um servidor simples:
   - Python: `python -m http.server 8000`
   - Node: `npx serve .`
   Abra http://localhost:8000 no browser.
3. Para instalar no telemóvel: abra a página no browser e escolha "Add to Home screen" / "Adicionar ao ecrã principal".

Importante:
- Os dados ficam no seu dispositivo. Faça export regularmente para backup.
- Para restaurar: use o botão "Importar JSON" na barra lateral e escolha um ficheiro de backup.

Alterações:
- Se quiser que eu gere um zip com estes ficheiros ou que os coloque num repositório GitHub, diga-me o owner/repo.