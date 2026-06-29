// ==========================================
// 1. TABELA DE PREÇOS OFICIAL DE FÁBRICA
// ==========================================
var listaProdutosPadrao = [
  { "id": 1, "categoria": "Fotografia", "nome": "Serviço de Fotografia (por Hora)", "tipoCalculo": "horas_fotografia", "preco": 170.00, "margem": 0, "iva": 0 },
  { "id": 2, "categoria": "Grande Formato", "nome": "Vinil Monomérico Impresso", "tipoCalculo": "area_com_extras", "preco": 30.00, "margem": 0, "iva": 0, "permiteExtras": true },
  { "id": 3, "categoria": "Grande Formato", "nome": "Vinil Polimérico Impresso", "tipoCalculo": "area_com_extras", "preco": 45.00, "margem": 0, "iva": 0, "permiteExtras": true },
  { "id": 4, "categoria": "Grande Formato", "nome": "Vinil Frost", "tipoCalculo": "area", "preco": 25.00, "margem": 0, "iva": 0 },
  { "id": 5, "categoria": "Grande Formato", "nome": "Lona", "tipoCalculo": "area", "preco": 55.00, "margem": 0, "iva": 0 },
  { "id": 6, "categoria": "Grande Formato", "nome": "Poster", "tipoCalculo": "area", "preco": 17.00, "margem": 0, "iva": 0 },
  { "id": 7, "categoria": "Grande Formato", "nome": "Vinil Monomérico para Corte", "tipoCalculo": "area", "preco": 30.00, "margem": 0, "iva": 0 },
  { "id": 8, "categoria": "Grande Formato", "nome": "Vinil Polimérico para Corte", "tipoCalculo": "area", "preco": 45.00, "margem": 0, "iva": 0 },
  { "id": 9, "categoria": "Design", "nome": "Design e Formatação", "tipoCalculo": "tempo_design", "preco": 0, "margem": 0, "iva": 0 },
  { "id": 10, "categoria": "Estampagem", "nome": "Estampagem Pequeno Frente", "tipoCalculo": "quantidade", "preco": 4.50, "margem": 0, "iva": 0 },
  { "id": 11, "categoria": "Estampagem", "nome": "Estampagem (até A6)", "tipoCalculo": "quantidade", "preco": 7.50, "margem": 0, "iva": 0 },
  { "id": 12, "categoria": "Estampagem", "nome": "Estampagem A4", "tipoCalculo": "quantidade", "preco": 15.00, "margem": 0, "iva": 0 }
];

var listaProdutosPadrao2 = [
  { "id": 13, "categoria": "Fotocópias & Encadernação", "nome": "Fotocópia A4 P&B (1 lado)", "tipoCalculo": "quantidade", "preco": 0.24, "margem": 0, "iva": 0 },
  { "id": 14, "categoria": "Fotocópias & Encadernação", "nome": "Fotocópia A4 P&B (2 lados)", "tipoCalculo": "quantidade", "preco": 0.38, "margem": 0, "iva": 0 },
  { "id": 15, "categoria": "Fotocópias & Encadernação", "nome": "Fotocópia A3 P&B (1 lado)", "tipoCalculo": "quantidade", "preco": 0.28, "margem": 0, "iva": 0 },
  { "id": 16, "categoria": "Fotocópias & Encadernação", "nome": "Fotocópia A3 P&B (2 lados)", "tipoCalculo": "quantidade", "preco": 0.54, "margem": 0, "iva": 0 },
  { "id": 17, "categoria": "Fotocópias & Encadernação", "nome": "Fotocópia A4 Cores (1 lado)", "tipoCalculo": "quantidade", "preco": 0.65, "margem": 0, "iva": 0 },
  { "id": 18, "categoria": "Fotocópias & Encadernação", "nome": "Fotocópia A4 Cores (2 lados)", "tipoCalculo": "quantidade", "preco": 1.20, "margem": 0, "iva": 0 },
  { "id": 19, "categoria": "Fotocópias & Encadernação", "nome": "Fotocópia A3 Cores (1 lado)", "tipoCalculo": "quantidade", "preco": 1.90, "margem": 0, "iva": 0 },
  { "id": 20, "categoria": "Fotocópias & Encadernação", "nome": "Fotocópia A3 Cores (2 lados)", "tipoCalculo": "quantidade", "preco": 3.70, "margem": 0, "iva": 0 },
  { "id": 21, "categoria": "Fotocópias & Encadernação", "nome": "Encadernar A4", "tipoCalculo": "quantidade", "preco": 5.00, "margem": 0, "iva": 0 },
  { "id": 22, "categoria": "Álbuns", "nome": "Álbum 15x10cm (12 pág.)", "tipoCalculo": "quantidade", "preco": 120.00, "margem": 0, "iva": 0 },
  { "id": 23, "categoria": "Álbuns", "nome": "Álbum 20x30cm Panorâmico (20 pág.)", "tipoCalculo": "quantidade", "preco": 180.00, "margem": 0, "iva": 0 },
  { "id": 24, "categoria": "Álbuns", "nome": "Álbum 23x30cm (40 pág.)", "tipoCalculo": "quantidade", "preco": 250.00, "margem": 0, "iva": 0 },
  { "id": 25, "categoria": "Álbuns", "nome": "Álbum Quadrado 30x30cm (20 pág.)", "tipoCalculo": "quantidade", "preco": 280.00, "margem": 0, "iva": 0 },
  { "id": 26, "categoria": "Placas PVC", "nome": "Placa PVC 3mm", "tipoCalculo": "pvc_tabela", "opcoes": {"so_pvc": 17.50, "pvc_vinil": 27.50, "pvc_uv": 31.50}, "margem": 0, "iva": 0 },
  { "id": 27, "categoria": "Placas PVC", "nome": "Placa PVC 5mm", "tipoCalculo": "pvc_tabela", "opcoes": {"so_pvc": 22.50, "pvc_vinil": 32.50, "pvc_uv": 37.50}, "margem": 0, "iva": 0 },
  { "id": 28, "categoria": "Placas PVC", "nome": "Placa PVC 10mm", "tipoCalculo": "pvc_tabela", "opcoes": {"so_pvc": 35.00, "pvc_vinil": 45.00, "pvc_uv": 0}, "margem": 0, "iva": 0 },
  { "id": 29, "categoria": "Cartões de Visita", "nome": "Cartões Expressos (24h - 2 lados)", "tipoCalculo": "quantidade_degrau", "degraus": {"100": 48, "250": 65, "500": 95, "1000": 115}, "margem": 0, "iva": 0 },
  { "id": 30, "categoria": "Cartões de Visita", "nome": "Cartões Premium (10 dias - Laminação + Canto Redondo)", "tipoCalculo": "quantidade_degrau", "degraus": {"250": 120, "500": 145, "1000": 195}, "margem": 0, "iva": 0 }
];

var listaCompletaPadrao = listaProdutosPadrao.concat(listaProdutosPadrao2);
var produtos = [];

function sincronizarMemoria() {
    let memoria = localStorage.getItem('config_vinil');
    if (!memoria || memoria === "[]" || JSON.parse(memoria).length < 5) {
        localStorage.setItem('config_vinil', JSON.stringify(listaCompletaPadrao));
    }
    produtos = JSON.parse(localStorage.getItem('config_vinil'));
}
// ==========================================
// 2. LOGICA DO FRONTEND - INICIALIZAÇÃO
// ==========================================
function carregarConfiguracoes() {
    sincronizarMemoria();
    const select = document.getElementById('cmbProduto');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Selecione uma Opção --</option>';
    let categorias = [...new Set(produtos.map(p => p.categoria))];
    
    categorias.forEach(cat => {
        let optGroup = document.createElement('optgroup');
        optGroup.label = cat;
        produtos.filter(p => p.categoria === cat).forEach(p => {
            let opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.nome;
            optGroup.appendChild(opt);
        });
        select.appendChild(optGroup);
    });
}

function ajustarFormulario() {
    document.querySelectorAll('.dinamico').forEach(p => p.style.display = 'none');
    document.getElementById('extrasVinil').style.display = 'none';
    document.getElementById('blocoResultado').style.display = 'none';

    const idSelecionado = document.getElementById('cmbProduto').value;
    if(!idSelecionado) return;

    const prod = produtos.find(p => p.id == idSelecionado);
    if(!prod) return;
    
    if (prod.tipoCalculo === 'area' || prod.tipoCalculo === 'area_com_extras') {
        document.getElementById('painelArea').style.display = 'block';
        if(prod.permiteExtras) document.getElementById('extrasVinil').style.display = 'block';
    } else if (prod.tipoCalculo === 'quantidade') {
        document.getElementById('painelQuantidade').style.display = 'block';
    } else if (prod.tipoCalculo === 'horas_fotografia') {
        document.getElementById('painelHoras').style.display = 'block';
    } else if (prod.tipoCalculo === 'tempo_design') {
        document.getElementById('painelDesign').style.display = 'block';
    } else if (prod.tipoCalculo === 'pvc_tabela') {
        document.getElementById('painelPvc').style.display = 'block';
    } else if (prod.tipoCalculo === 'quantidade_degrau') {
        document.getElementById('painelCartoes').style.display = 'block';
        const sCartoes = document.getElementById('cmbQuantidadeCartoes');
        sCartoes.innerHTML = '';
        Object.keys(prod.degraus).forEach(qtd => {
            let o = document.createElement('option');
            o.value = prod.degraus[qtd];
            o.textContent = qtd + " unidades = " + prod.degraus[qtd] + "€";
            sCartoes.appendChild(o);
        });
    }
}
// ==========================================
// 3. LOGICA DO FRONTEND - CÁLCULOS
// ==========================================
function calcularPrecoFinal() {
    const idSelecionado = document.getElementById('cmbProduto').value;
    if(!idSelecionado) return alert('Por favor, selecione um produto ou serviço.');

    const prod = produtos.find(p => p.id == idSelecionado);
    let precoBaseComercial = 0;
    let descricaoBase = "";

    if (prod.tipoCalculo === 'area' || prod.tipoCalculo === 'area_com_extras') {
        let larg = parseFloat(document.getElementById('largura').value) || 0;
        let alt = parseFloat(document.getElementById('altura').value) || 0;
        if(larg <= 0 || alt <= 0) return alert('Insira medidas de largura e altura válidas.');
        
        if (larg > 1.27 && alt > 1.27) {
            alert("⚠️ Atenção: A largura e a altura excedem o limite da bobine (1.27m).\n\nO trabalho terá emendas.");
        }
        let area = larg * alt;
        precoBaseComercial = area * prod.preco;
        descricaoBase = area.toFixed(2) + " m² x " + prod.preco.toFixed(2) + "€";

        if (prod.permiteExtras) {
            if(document.getElementById('chkAplicar').checked) precoBaseComercial += (area * prod.preco) * 0.60;
            if(document.getElementById('chkCorte').checked) precoBaseComercial += (area * 10);
            if(document.getElementById('chkPelicula').checked) precoBaseComercial += (area * 8);
            if(document.getElementById('chkLaminacao').checked) precoBaseComercial += (area * 15);
        }
    } 
    else if (prod.tipoCalculo === 'quantidade') {
        let qtd = parseInt(document.getElementById('quantidade').value) || 0;
        if(qtd <= 0) return alert('A quantidade deve ser igual ou superior a 1.');
        precoBaseComercial = qtd * prod.preco;
        descricaoBase = qtd + " un. x " + prod.preco.toFixed(2) + "€";
    } 
    else if (prod.tipoCalculo === 'horas_fotografia') {
        let horas = parseInt(document.getElementById('horasFotografia').value) || 0;
        if(horas <= 0) return alert('Insira um número válido de horas.');
        let valorHora = 170;
        if(horas >= 6) valorHora = 120;
        else if(horas >= 3) valorHora = 135;
        precoBaseComercial = horas * valorHora;
        descricaoBase = horas + " horas (escalão: " + valorHora + "€/h)";
    } 
    else if (prod.tipoCalculo === 'tempo_design') {
        precoBaseComercial = parseFloat(document.getElementById('tempoDesign').value);
        descricaoBase = "Preço por bloco de tempo";
    } 
    else if (prod.tipoCalculo === 'pvc_tabela') {
        let acab = document.getElementById('tipoAcabamentoPvc').value;
        let precoM2Pvc = prod.opcoes[acab];
        if(precoM2Pvc === 0) return alert('Acabamento indisponível.');
        let larg = parseFloat(document.getElementById('pvcLargura').value) || 0;
        let alt = parseFloat(document.getElementById('pvcAltura').value) || 0;
        if(larg <= 0 || alt <= 0) return alert('Insira medidas válidas.');
        let area = larg * alt;
        precoBaseComercial = area * precoM2Pvc;
        descricaoBase = "PVC " + area.toFixed(2) + " m² x " + precoM2Pvc.toFixed(2) + "€/m²";
    } 
    else if (prod.tipoCalculo === 'quantidade_degrau') {
        precoBaseComercial = parseFloat(document.getElementById('cmbQuantidadeCartoes').value);
        descricaoBase = "Lote de cartões fechado";
    }

    let subtotal = precoBaseComercial * (1 + (prod.margem / 100));
    const formatar = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

    document.getElementById('resNomeProduto').textContent = prod.nome;
    document.getElementById('resDetalhe').textContent = descricaoBase;
    document.getElementById('resSubtotal').textContent = formatar(subtotal);
    document.getElementById('resIva').textContent = "0,00 € (Art.º 53º)"; 
    document.getElementById('resTotal').textContent = formatar(subtotal);
    document.getElementById('blocoResultado').style.display = 'block';
}

function imprimirOrcamento() {
    const tituloOriginal = document.title;
    document.title = "Orcamento_Comercial";
    window.print();
    document.title = tituloOriginal;
}
// ==========================================
// 4. LOGICA DO BACKEND - ADMINISTRAÇÃO
// ==========================================
function atualizarListaBackend() {
    const lista = document.getElementById('listaProdutos');
    if (!lista) return;
    sincronizarMemoria();
    lista.innerHTML = '';
    
    produtos.forEach((p, index) => {
        let precoExibicao = p.preco ? p.preco.toFixed(2) + "€" : 'Tabela complexa';
        if(p.tipoCalculo === 'pvc_tabela') precoExibicao = "Preço por m² (Múltiplo)";
        if(p.tipoCalculo === 'quantidade_degrau') precoExibicao = "Escalonado por pacotes";

        lista.innerHTML += `
            <li>
                <div class="item-info">
                    <span class="badge">${p.categoria}</span><br>
                    <strong>${p.nome}</strong><br>
                    <small style="color: #718096;">Valor Base: ${precoExibicao} | Margem: +${p.margem}%</small>
                </div>
                <div class="acoes">
                    <button class="btn-editar" onclick="prepararEdicao(${index})">Editar</button>
                    <button class="btn-apagar" onclick="apagarProduto(${index})">X</button>
                </div>
            </li>`;
    });
}

function salvarProduto() {
    const nome = document.getElementById('nome').value;
    const category = document.getElementById('categoria').value;
    const preco = parseFloat(document.getElementById('preco').value) || 0;
    const margem = parseFloat(document.getElementById('margem').value) || 0;
    const indexEdicao = parseInt(document.getElementById('indexEdicao').value);

    if (!nome || !category) return alert('Por favor, preencha o nome e a categoria.');

    if (indexEdicao === -1) {
        let novo = { id: Date.now(), categoria: category, nome: nome, tipoCalculo: "quantidade", preco: preco, margem: margem, iva: 0 };
        produtos.push(novo);
    } else {
        produtos[indexEdicao].nome = nome;
        produtos[indexEdicao].categoria = category;
        produtos[indexEdicao].preco = preco;
        produtos[indexEdicao].margem = margem;
    }
    localStorage.setItem('config_vinil', JSON.stringify(produtos));
    resetarFormulario();
    atualizarListaBackend();
}

function prepararEdicao(index) {
    const p = produtos[index];
    document.getElementById('nome').value = p.nome;
    document.getElementById('categoria').value = p.categoria;
    document.getElementById('preco').value = p.preco || 0;
    document.getElementById('margem').value = p.margem;
    document.getElementById('indexEdicao').value = index;
    document.getElementById('tituloForm').textContent = "A Editar Material";
    document.getElementById('btnGravar').textContent = "Confirmar e Atualizar Item";
    document.getElementById('btnGravar').style.background = "linear-gradient(135deg, #d69e2e 0%, #b7791f 100%)";
    document.getElementById('btnGravar').style.color = "white";
}

function resetarFormulario() {
    document.getElementById('nome').value = '';
    document.getElementById('categoria').value = '';
    document.getElementById('preco').value = '';
    document.getElementById('margem').value = '0';
    document.getElementById('indexEdicao').value = '-1';
    document.getElementById('tituloForm').textContent = "Gestão de Tabelas e Preços";
    document.getElementById('btnGravar').textContent = "Gravar Alterações";
    document.getElementById('btnGravar').style.background = "linear-gradient(135deg, #28a745 0%, #218838 100%)";
}

function apagarProduto(index) {
    if (confirm("Deseja eliminar este item?")) {
        produtos.splice(index, 1);
        localStorage.setItem('config_vinil', JSON.stringify(produtos));
        resetarFormulario();
        atualizarListaBackend();
    }
}

function exportarJSON() {
    const dados = localStorage.getItem('config_vinil');
    const blob = new Blob([dados], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "config_vinil.json";
    a.click();
}

function importarJSON(input) {
    const leitor = new FileReader();
    leitor.onload = function(e) {
        localStorage.setItem('config_vinil', e.target.result);
        sincronizarMemoria();
        atualizarListaBackend();
        alert("Catálogo atualizado com sucesso!");
    };
    leitor.readAsText(input.files[0]);
}

// INICIALIZAÇÃO ATUALIZADA: Deteta sempre que a página fica visível no ecrã
function inicializarPorPagina() {
    sincronizarMemoria();
    if (document.getElementById('cmbProduto')) carregarConfiguracoes();
    if (document.getElementById('listaProdutos')) atualizarListaBackend();
}

// Roda ao carregar a página pela primeira vez
window.onload = inicializarPorPagina;

// NOVO: Força a atualização automática quando volta para trás através do link
window.onpageshow = function(event) {
    inicializarPorPagina();
};
