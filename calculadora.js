/* Calculadora Comercial Multisserviços
   Funciona em GitHub Pages: lê Google Sheets publicado como CSV e usa fallback/localStorage se falhar.
*/

const SHEET_ID = '18hBRKP0iEKiRgCRkICcTgWFCTougR_HcsXvcBkmD1ak';
const SHEET_GID = '0';
const URL_CSV_GOOGLE_SHEETS = `https://docs.google.com/spreadsheets/d/e/2PACX-PLACEHOLDER/pub?output=csv`;
const URL_CSV_EXPORT = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
const URL_EDIT_GOOGLE_SHEETS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing`;
const STORAGE_KEY = 'catalogo_calculadora_multisservicos_v2';

const DADOS_FALLBACK = [
  { id: 1, categoria: 'Impressão', nome: 'Cartaz A3', tipoCalculo: 'quantidade', preco: 2.50, margem: 20 },
  { id: 2, categoria: 'Impressão', nome: 'Cartaz A2', tipoCalculo: 'quantidade', preco: 4.00, margem: 20 },
  { id: 3, categoria: 'Vinil', nome: 'Vinil Monomérico Impresso', tipoCalculo: 'area_com_extras', preco: 15.00, margem: 25, permiteExtras: true },
  { id: 4, categoria: 'Vinil', nome: 'Vinil Monomérico Laminado', tipoCalculo: 'area', preco: 20.00, margem: 25 },
  { id: 5, categoria: 'Fotografia', nome: 'Sessão Fotográfica', tipoCalculo: 'horas_fotografia', preco: 170.00, margem: 0 },
  { id: 6, categoria: 'Design', nome: 'Design Gráfico', tipoCalculo: 'tempo_design', preco: 35.00, margem: 10 },
  { id: 7, categoria: 'PVC', nome: 'PVC 3mm', tipoCalculo: 'pvc_tabela', preco: 17.50, margem: 15, opcoes: { so_pvc: 17.50, pvc_vinil: 27.50, pvc_uv: 31.50 } },
  { id: 8, categoria: 'PVC', nome: 'PVC 5mm', tipoCalculo: 'pvc_tabela', preco: 22.50, margem: 15, opcoes: { so_pvc: 22.50, pvc_vinil: 32.50, pvc_uv: 37.50 } },
  { id: 9, categoria: 'Cartões', nome: 'Cartões Expressos', tipoCalculo: 'quantidade_degrau', preco: 48, margem: 10, degraus: { 100: 48, 250: 65, 500: 95, 1000: 115 } },
  { id: 10, categoria: 'Cartões', nome: 'Cartões Premium', tipoCalculo: 'quantidade_degrau', preco: 120, margem: 10, degraus: { 250: 120, 500: 145, 1000: 195 } }
];

let produtos = [];
let origemDados = 'fallback';

function $(id) { return document.getElementById(id); }
function existe(id) { return Boolean($(id)); }
function numero(valor, padrao = 0) {
  if (valor === null || valor === undefined) return padrao;
  const limpo = String(valor).replace(/€/g, '').replace(/%/g, '').replace(/\s/g, '').replace(',', '.');
  const n = Number.parseFloat(limpo);
  return Number.isFinite(n) ? n : padrao;
}
function dinheiro(v) { return Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }); }
function clonar(obj) { return JSON.parse(JSON.stringify(obj)); }

function mostrarEstado(texto, erro = false) {
  const el = $('estadoApp');
  if (!el) return;
  el.textContent = texto;
  el.style.display = 'block';
  el.classList.toggle('erro', erro);
}

function parseCSV(texto) {
  const linhas = [];
  let linha = [], campo = '', dentroAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i], prox = texto[i + 1];
    if (c === '"') {
      if (dentroAspas && prox === '"') { campo += '"'; i++; }
      else dentroAspas = !dentroAspas;
    } else if (c === ',' && !dentroAspas) {
      linha.push(campo); campo = '';
    } else if ((c === '\n' || c === '\r') && !dentroAspas) {
      if (c === '\r' && prox === '\n') i++;
      linha.push(campo);
      if (linha.some(x => String(x).trim() !== '')) linhas.push(linha);
      linha = []; campo = '';
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some(x => String(x).trim() !== '')) linhas.push(linha);
  return linhas;
}

function normalizarCabecalho(v) {
  return String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
}
function campoPorNomes(obj, nomes, padrao = '') {
  for (const nome of nomes) {
    const chave = Object.keys(obj).find(k => normalizarCabecalho(k) === normalizarCabecalho(nome));
    if (chave && obj[chave] !== undefined && obj[chave] !== '') return obj[chave];
  }
  return padrao;
}
function parseJSONCampo(valor, padrao) {
  if (!valor) return padrao;
  try { return JSON.parse(valor); } catch { return padrao; }
}

function csvParaProdutos(csv) {
  if (!csv || csv.includes('<!DOCTYPE')) throw new Error('A resposta não é CSV. A folha pode não estar pública.');
  const matriz = parseCSV(csv).filter(l => l.length > 0);
  if (matriz.length < 2) throw new Error('CSV sem linhas suficientes.');
  const headers = matriz[0].map(h => String(h).trim());
  const dados = [];

  for (let i = 1; i < matriz.length; i++) {
    const obj = {};
    headers.forEach((h, idx) => { obj[h || `coluna_${idx}`] = (matriz[i][idx] || '').trim(); });

    const id = Number.parseInt(campoPorNomes(obj, ['id', 'codigo', 'código'], String(i)), 10);
    const categoria = campoPorNomes(obj, ['categoria', 'cat'], 'Geral');
    const nome = campoPorNomes(obj, ['nome', 'produto', 'servico', 'serviço', 'produto/servico', 'produto serviço'], 'Item ' + id);
    const tipoCalculo = campoPorNomes(obj, ['tipoCalculo', 'tipo_calculo', 'tipo', 'calculo', 'cálculo'], 'quantidade');
    const preco = numero(campoPorNomes(obj, ['preco', 'preço', 'precoBase', 'preçoBase', 'valor'], '0'));
    const margem = numero(campoPorNomes(obj, ['margem', 'margem%'], '0'));
    const permiteExtrasRaw = campoPorNomes(obj, ['permiteExtras', 'extras'], '');
    const opcoesRaw = campoPorNomes(obj, ['opcoes', 'opções', 'pvc', 'tabelaPvc'], '');
    const degrausRaw = campoPorNomes(obj, ['degraus', 'escaloes', 'escalões', 'quantidades'], '');

    if (!id || !nome) continue;
    const item = { id, categoria, nome, tipoCalculo, preco, margem, iva: 0, permiteExtras: tipoCalculo === 'area_com_extras' || /^(sim|true|1)$/i.test(permiteExtrasRaw) };
    if (tipoCalculo === 'pvc_tabela') item.opcoes = parseJSONCampo(opcoesRaw, criarOpcoesPvc(preco));
    if (tipoCalculo === 'quantidade_degrau') item.degraus = parseJSONCampo(degrausRaw, criarDegraus(preco));
    dados.push(item);
  }
  if (!dados.length) throw new Error('Não foram encontrados produtos válidos no CSV.');
  return dados;
}

function criarOpcoesPvc(preco) { return { so_pvc: preco, pvc_vinil: +(preco * 1.5).toFixed(2), pvc_uv: +(preco * 1.8).toFixed(2) }; }
function criarDegraus(preco) { return { 100: preco, 250: +(preco * 1.35).toFixed(2), 500: +(preco * 1.9).toFixed(2), 1000: +(preco * 2.5).toFixed(2) }; }
function prepararItem(item) {
  const p = { ...item, id: Number.parseInt(item.id, 10), preco: numero(item.preco), margem: numero(item.margem), permiteExtras: Boolean(item.permiteExtras) || item.tipoCalculo === 'area_com_extras' };
  if (p.tipoCalculo === 'pvc_tabela' && !p.opcoes) p.opcoes = criarOpcoesPvc(p.preco);
  if (p.tipoCalculo === 'quantidade_degrau' && !p.degraus) p.degraus = criarDegraus(p.preco);
  return p;
}

async function carregarDadosOnline() {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      produtos = JSON.parse(local).map(prepararItem);
      origemDados = 'local';
      mostrarEstado('A usar catálogo local/importado guardado neste navegador.');
      return produtos;
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }

  try {
    const url = URL_CSV_EXPORT + '&cachebust=' + Date.now();
    const resposta = await fetch(url, { cache: 'no-store' });
    if (!resposta.ok) throw new Error(`Google Sheets respondeu ${resposta.status}`);
    const csv = await resposta.text();
    produtos = csvParaProdutos(csv).map(prepararItem);
    origemDados = 'google';
    mostrarEstado(`Dados carregados do Google Sheets: ${produtos.length} itens.`);
    return produtos;
  } catch (erro) {
    produtos = clonar(DADOS_FALLBACK).map(prepararItem);
    origemDados = 'fallback';
    mostrarEstado('Não consegui ler o Google Sheets. A usar dados de exemplo. Publique a folha como CSV ou confirme permissões.', true);
    console.warn('Falha ao carregar Google Sheets:', erro);
    return produtos;
  }
}

function guardarLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(produtos));
  origemDados = 'local';
  mostrarEstado('Alterações guardadas localmente neste navegador. Exporte JSON para backup.');
}
function limparLocalERecarregar() { localStorage.removeItem(STORAGE_KEY); return carregarDadosOnline(); }

function desenharMenuDropdown(select) {
  if (!select) return;
  select.innerHTML = '<option value="">-- Selecione uma Opção --</option>';
  if (!produtos.length) { select.innerHTML = '<option value="">Nenhum produto disponível</option>'; return; }
  [...new Set(produtos.map(p => p.categoria || 'Geral'))].forEach(cat => {
    const optGroup = document.createElement('optgroup');
    optGroup.label = cat;
    produtos.filter(p => (p.categoria || 'Geral') === cat).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nome + (origemDados === 'fallback' ? ' (exemplo)' : '');
      optGroup.appendChild(opt);
    });
    select.appendChild(optGroup);
  });
}

function esconderDinamicos() {
  document.querySelectorAll('.dinamico').forEach(p => p.style.display = 'none');
  if (existe('extrasVinil')) $('extrasVinil').style.display = 'none';
  if (existe('blocoResultado')) $('blocoResultado').style.display = 'none';
}
function ajustarFormulario() {
  esconderDinamicos();
  const prod = produtos.find(p => p.id == ($('cmbProduto')?.value || ''));
  if (!prod) return;
  if (prod.tipoCalculo === 'area' || prod.tipoCalculo === 'area_com_extras') {
    $('painelArea').style.display = 'block';
    if (prod.permiteExtras) $('extrasVinil').style.display = 'block';
  } else if (prod.tipoCalculo === 'quantidade') $('painelQuantidade').style.display = 'block';
  else if (prod.tipoCalculo === 'horas_fotografia') $('painelHoras').style.display = 'block';
  else if (prod.tipoCalculo === 'tempo_design') $('painelDesign').style.display = 'block';
  else if (prod.tipoCalculo === 'pvc_tabela') $('painelPvc').style.display = 'block';
  else if (prod.tipoCalculo === 'quantidade_degrau') {
    $('painelCartoes').style.display = 'block';
    const s = $('cmbQuantidadeCartoes');
    s.innerHTML = '';
    Object.entries(prod.degraus || criarDegraus(prod.preco)).forEach(([qtd, valor]) => {
      const o = document.createElement('option');
      o.value = valor;
      o.textContent = `${qtd} unidades = ${dinheiro(valor)}`;
      s.appendChild(o);
    });
  }
}

function calcularPrecoFinal() {
  const prod = produtos.find(p => p.id == ($('cmbProduto')?.value || ''));
  if (!prod) return alert('Por favor, selecione um produto ou serviço.');
  let base = 0, detalhe = '';

  if (prod.tipoCalculo === 'area' || prod.tipoCalculo === 'area_com_extras') {
    const larg = numero($('largura').value), alt = numero($('altura').value);
    if (larg <= 0 || alt <= 0) return alert('Insira medidas válidas.');
    if (larg > 1.27 && alt > 1.27) alert('⚠️ Atenção: largura e altura excedem 1,27 m. O trabalho terá emendas.');
    const area = larg * alt;
    base = area * prod.preco;
    detalhe = `${area.toFixed(2)} m² × ${dinheiro(prod.preco)}`;
    if (prod.permiteExtras) {
      if ($('chkAplicar').checked) base += area * prod.preco * 0.60;
      if ($('chkCorte').checked) base += area * 10;
      if ($('chkPelicula').checked) base += area * 8;
      if ($('chkLaminacao').checked) base += area * 15;
    }
  } else if (prod.tipoCalculo === 'quantidade') {
    const qtd = Number.parseInt($('quantidade').value, 10) || 0;
    if (qtd <= 0) return alert('A quantidade deve ser igual ou superior a 1.');
    base = qtd * prod.preco;
    detalhe = `${qtd} un. × ${dinheiro(prod.preco)}`;
  } else if (prod.tipoCalculo === 'horas_fotografia') {
    const horas = Number.parseInt($('horasFotografia').value, 10) || 0;
    if (horas <= 0) return alert('Insira um número válido de horas.');
    let valorHora = prod.preco;
    if (horas >= 6) valorHora = prod.preco * 0.70;
    else if (horas >= 3) valorHora = prod.preco * 0.80;
    base = horas * valorHora;
    detalhe = `${horas} hora(s) × ${dinheiro(valorHora)}`;
  } else if (prod.tipoCalculo === 'tempo_design') {
    base = numero($('tempoDesign').value);
    detalhe = $('tempoDesign').selectedOptions[0]?.textContent || 'Bloco de design';
  } else if (prod.tipoCalculo === 'pvc_tabela') {
    const acab = $('tipoAcabamentoPvc').value;
    const precoM2 = numero((prod.opcoes || {})[acab], prod.preco);
    const larg = numero($('pvcLargura').value), alt = numero($('pvcAltura').value);
    if (larg <= 0 || alt <= 0) return alert('Insira medidas válidas.');
    const area = larg * alt;
    base = area * precoM2;
    detalhe = `PVC ${area.toFixed(2)} m² × ${dinheiro(precoM2)}/m²`;
  } else if (prod.tipoCalculo === 'quantidade_degrau') {
    base = numero($('cmbQuantidadeCartoes').value);
    detalhe = $('cmbQuantidadeCartoes').selectedOptions[0]?.textContent || 'Lote fechado';
  } else {
    return alert('Tipo de cálculo desconhecido: ' + prod.tipoCalculo);
  }

  const subtotal = base * (1 + numero(prod.margem) / 100);
  $('resNomeProduto').textContent = prod.nome;
  $('resDetalhe').textContent = detalhe;
  $('resSubtotal').textContent = dinheiro(subtotal);
  $('resIva').textContent = '0,00 € (Art.º 53º)';
  $('resTotal').textContent = dinheiro(subtotal);
  $('blocoResultado').style.display = 'block';
}

function imprimirOrcamento() {
  const titulo = document.title;
  document.title = 'Orcamento_Comercial';
  window.print();
  document.title = titulo;
}

function tipoLabel(tipo) {
  return ({ quantidade:'💰 Unitário', area:'📐 Área', area_com_extras:'📐 Área+Extras', horas_fotografia:'📷 Horas', tempo_design:'🎨 Design', pvc_tabela:'📋 PVC', quantidade_degrau:'📊 Escalonado' })[tipo] || tipo;
}
function atualizarListaBackend(lista) {
  if (!lista) return;
  lista.innerHTML = '';
  if (!produtos.length) { lista.innerHTML = '<li>Nenhum item no catálogo.</li>'; return; }
  produtos.forEach(p => {
    let preco = dinheiro(p.preco);
    if (p.tipoCalculo === 'pvc_tabela') preco = 'Preço por m² / tabela PVC';
    if (p.tipoCalculo === 'quantidade_degrau') preco = 'Escalonado por pacotes';
    const li = document.createElement('li');
    li.innerHTML = `<div class="item-info"><div><span class="badge">${p.categoria}</span><span class="badge-tipo">${tipoLabel(p.tipoCalculo)}</span><span style="font-size:10px;color:#a0aec0">ID: ${p.id}</span></div><strong>${p.nome}</strong><br><small style="color:#718096">Valor: ${preco} | Margem: ${p.margem}% | Isento (Art.º 53º)</small></div><div class="acoes"><button class="btn-acao btn-editar" onclick="abrirEdicao(${p.id})">✏️ Editar</button><button class="btn-acao btn-duplicar" onclick="duplicarItem(${p.id})">📋 Duplicar</button><button class="btn-acao btn-apagar" onclick="apagarItem(${p.id})">🗑️ Apagar</button></div>`;
    lista.appendChild(li);
  });
}
function abrirGoogleSheets() { window.open(URL_EDIT_GOOGLE_SHEETS, '_blank'); }
function exportarJSON() {
  const blob = new Blob([JSON.stringify(produtos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backup_produtos_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}
function importarJSON(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!Array.isArray(dados)) throw new Error('O ficheiro não contém uma lista.');
      produtos = dados.map(prepararItem);
      guardarLocal();
      atualizarListaBackend($('listaProdutos'));
      desenharMenuDropdown($('cmbProduto'));
      alert('✅ Dados importados com sucesso.');
    } catch (err) { alert('❌ Erro ao importar: ' + err.message); }
  };
  reader.readAsText(file);
  input.value = '';
}
function adicionarItem() {
  const categoria = $('novoCategoria').value.trim(), nome = $('novoNome').value.trim(), tipo = $('novoTipo').value;
  const preco = numero($('novoPreco').value, NaN), margem = numero($('novaMargem').value);
  if (!categoria || !nome || !Number.isFinite(preco) || preco < 0) return alert('Preencha categoria, nome e preço válido.');
  const id = produtos.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
  const item = prepararItem({ id, categoria, nome, tipoCalculo: tipo, preco, margem, permiteExtras: tipo === 'area_com_extras' });
  produtos.push(item); guardarLocal(); atualizarListaBackend($('listaProdutos')); desenharMenuDropdown($('cmbProduto'));
  ['novoCategoria','novoNome','novoPreco'].forEach(idEl => $(idEl).value = ''); $('novaMargem').value = '0';
  alert(`✅ Item "${nome}" adicionado localmente.`);
}
function abrirEdicao(id) {
  const item = produtos.find(p => p.id === id); if (!item) return alert('Item não encontrado.');
  $('editId').value = item.id; $('editCategoria').value = item.categoria; $('editNome').value = item.nome; $('editTipo').value = item.tipoCalculo; $('editPreco').value = item.preco; $('editMargem').value = item.margem;
  $('modalEdicao').classList.add('active');
}
function salvarEdicao() {
  const id = Number.parseInt($('editId').value, 10), item = produtos.find(p => p.id === id); if (!item) return alert('Item não encontrado.');
  const categoria = $('editCategoria').value.trim(), nome = $('editNome').value.trim(), tipo = $('editTipo').value;
  const preco = numero($('editPreco').value, NaN), margem = numero($('editMargem').value);
  if (!categoria || !nome || !Number.isFinite(preco) || preco < 0) return alert('Preencha categoria, nome e preço válido.');
  Object.assign(item, prepararItem({ id, categoria, nome, tipoCalculo: tipo, preco, margem, permiteExtras: tipo === 'area_com_extras' }));
  guardarLocal(); atualizarListaBackend($('listaProdutos')); desenharMenuDropdown($('cmbProduto')); fecharModal(); alert('✅ Item atualizado localmente.');
}
function apagarItem(id) {
  const item = produtos.find(p => p.id === id); if (!item) return alert('Item não encontrado.');
  if (!confirm(`Apagar "${item.nome}" do catálogo local?`)) return;
  produtos = produtos.filter(p => p.id !== id); guardarLocal(); atualizarListaBackend($('listaProdutos')); desenharMenuDropdown($('cmbProduto'));
}
function duplicarItem(id) {
  const item = produtos.find(p => p.id === id); if (!item) return alert('Item não encontrado.');
  const novo = clonar(item); novo.id = produtos.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1; novo.nome += ' (cópia)';
  produtos.push(novo); guardarLocal(); atualizarListaBackend($('listaProdutos')); desenharMenuDropdown($('cmbProduto'));
}
function fecharModal() { if (existe('modalEdicao')) $('modalEdicao').classList.remove('active'); }
async function sincronizarGoogleSheets() {
  if (!confirm('Isto apaga alterações locais deste navegador e recarrega o Google Sheets. Continuar?')) return;
  await limparLocalERecarregar(); atualizarListaBackend($('listaProdutos')); desenharMenuDropdown($('cmbProduto')); alert('✅ Sincronização concluída.');
}

async function inicializar() {
  await carregarDadosOnline();
  desenharMenuDropdown($('cmbProduto'));
  atualizarListaBackend($('listaProdutos'));
}
document.addEventListener('DOMContentLoaded', inicializar);
