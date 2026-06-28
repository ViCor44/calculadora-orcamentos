let produtos = [];

function carregarConfiguracoes() {
    produtos = JSON.parse(localStorage.getItem('config_vinil')) || [];
    const select = document.getElementById('cmbProduto');
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
            o.textContent = `${qtd} unidades = ${prod.degraus[qtd]}€`;
            sCartoes.appendChild(o);
        });
    }
}

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
        
        // --- NOVA VALIDAÇÃO DE LARGURA MÁXIMA DA BOBINE (127 cm) ---
        // Se a largura E a altura forem maiores que 1.27m, significa que o trabalho não cabe na bobine sem emendas
        if (larg > 1.27 && alt > 1.27) {
            alert(`⚠️ Atenção: A largura e a altura (${larg}m x ${alt}m) excedem o limite da bobine de vinil (1.27m).\n\nO trabalho terá de ser impresso em painéis (emendas). O cálculo de m² avançará com esta premissa.`);
        }

        let area = larg * alt;
        precoBaseComercial = area * prod.preco;
        descricaoBase = `${area.toFixed(2)} m² x ${prod.preco.toFixed(2)}€`;

        if (prod.permiteExtras) {
            if(document.getElementById('chkAplicar').checked) {
                precoBaseComercial += (area * prod.preco) * 0.60;
            }
            if(document.getElementById('chkCorte').checked) precoBaseComercial += (area * 10);
            if(document.getElementById('chkPelicula').checked) precoBaseComercial += (area * 8);
            if(document.getElementById('chkLaminacao').checked) precoBaseComercial += (area * 15);
        }
    } 
    else if (prod.tipoCalculo === 'quantidade') {
        let qtd = parseInt(document.getElementById('quantidade').value) || 0;
        if(qtd <= 0) return alert('A quantidade deve ser igual ou superior a 1.');
        precoBaseComercial = qtd * prod.preco;
        descricaoBase = `${qtd} un. x ${prod.preco.toFixed(2)}€`;
    } 
    else if (prod.tipoCalculo === 'horas_fotografia') {
        let horas = parseInt(document.getElementById('horasFotografia').value) || 0;
        if(horas <= 0) return alert('Insira um número válido de horas.');
        
        let valorHora = 170;
        if(horas >= 6) valorHora = 120;
        else if(horas >= 3) valorHora = 135;
        
        precoBaseComercial = horas * valorHora;
        descricaoBase = `${horas} horas (escalão: ${valorHora}€/h)`;
    } 
    else if (prod.tipoCalculo === 'tempo_design') {
        precoBaseComercial = parseFloat(document.getElementById('tempoDesign').value);
        descricaoBase = "Preço por bloco de tempo";
    } 
    else if (prod.tipoCalculo === 'pvc_tabela') {
        let acab = document.getElementById('tipoAcabamentoPvc').value;
        let precoM2Pvc = prod.opcoes[acab];
        if(precoM2Pvc === 0) return alert('Este acabamento não está disponível para esta espessura.');
        
        let larg = parseFloat(document.getElementById('pvcLargura').value) || 0;
        let alt = parseFloat(document.getElementById('pvcAltura').value) || 0;
        if(larg <= 0 || alt <= 0) return alert('Insira medidas válidas para a placa.');
        
        let area = larg * alt;
        precoBaseComercial = area * precoM2Pvc;
        descricaoBase = `PVC ${area.toFixed(2)} m² x ${precoM2Pvc.toFixed(2)}€/m²`;
    } 
    else if (prod.tipoCalculo === 'quantidade_degrau') {
        precoBaseComercial = parseFloat(document.getElementById('cmbQuantidadeCartoes').value);
        descricaoBase = "Lote de cartões fechado";
    }

    let subtotal = precoBaseComercial * (1 + (prod.margem / 100));
    let total = subtotal;

    const formatar = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

    document.getElementById('resDetalhe').textContent = descricaoBase;
    document.getElementById('resSubtotal').textContent = formatar(subtotal);
    document.getElementById('resIva').textContent = "0,00 € (Art.º 53º)"; 
    document.getElementById('resTotal').textContent = formatar(total);    
    document.getElementById('resNomeProduto').textContent = prod.nome;
    
    document.getElementById('blocoResultado').style.display = 'block';
}

window.onload = carregarConfiguracoes;

// ==========================================
// FUNÇÕES DO BACKEND (GESTOR DE PREÇOS)
// ==========================================
function obterDadosBackend() {
    return JSON.parse(localStorage.getItem('config_vinil')) || [];
}

function atualizarListaBackend() {
    const lista = document.getElementById('listaProdutos');
    if (!lista) return; // Proteção para não quebrar no frontend

    const produtosBackend = obterDadosBackend();
    lista.innerHTML = '';
    
    produtosBackend.forEach((p, index) => {
        let precoExibicao = p.preco ? `${p.preco.toFixed(2)}€` : 'Tabela complexa';
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

    if (!nome || !category) return alert('Por favor, preencha o nome e a categoria do produto.');

    const listaProds = obterDadosBackend();
    
    if (indexEdicao === -1) {
        let novo = { id: Date.now(), categoria: category, nome, tipoCalculo: "quantidade", preco, margem, iva: 0 };
        listaProds.push(novo);
    } else {
        listaProds[indexEdicao].nome = nome;
        listaProds[indexEdicao].categoria = category;
        listaProds[indexEdicao].preco = preco;
        listaProds[indexEdicao].margem = margem;
        listaProds[indexEdicao].iva = 0;
    }
    
    localStorage.setItem('config_vinil', JSON.stringify(listaProds));
    resetarFormulario();
    atualizarListaBackend();
}

function prepararEdicao(index) {
    const listaProds = obterDadosBackend();
    const p = listaProds[index];

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
    if (confirm("Tem a certeza que deseja eliminar este item do catálogo permanente?")) {
        const listaProds = obterDadosBackend();
        listaProds.splice(index, 1);
        localStorage.setItem('config_vinil', JSON.stringify(listaProds));
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
        atualizarListaBackend();
        alert("Catálogo importado e sincronizado com sucesso!");
    };
    leitor.readAsText(input.files);
}

function imprimirOrcamento() {
    // Altera temporariamente o título da aba do browser para que o PDF saia com o nome correto
    const tituloOriginal = document.title;
    document.title = "Orcamento_Comercial";
    
    // Dispara a janela de impressão nativa do sistema (onde pode escolher "Guardar como PDF")
    window.print();
    
    // Restaura o título original após a impressão fechar
    document.title = tituloOriginal;
}

// INICIALIZAÇÃO AUTOMÁTICA INTELIGENTE CONSOANTE A PÁGINA ABERTA
window.onload = function() {
    if (document.getElementById('cmbProduto')) {
        carregarConfiguracoes(); // Roda se for o Frontend
    }
    if (document.getElementById('listaProdutos')) {
        atualizarListaBackend(); // Roda se for o Backend
    }
};
