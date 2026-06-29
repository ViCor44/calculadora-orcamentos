// ===================================================
// 1. CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
// ===================================================
// ⚠️ ATENÇÃO: Substitui este URL pelo URL de exportação CSV da tua folha
// Para obter o URL correto: 
// 1. Abre a tua folha no Google Sheets
// 2. Vai a Ficheiro > Partilhar > Publicar na web
// 3. Escolhe "Folha inteira" e "Valores separados por vírgulas (.csv)"
// 4. Copia o link gerado
const LINK_GOOGLE_SHEETS = "https://docs.google.com/spreadsheets/d/18hBRKP0iEKiRgCRkICcTgWFCTougR_HcsXvcBkmD1ak/export?format=csv";

// Fallback: Dados de exemplo caso a folha não carregue
const DADOS_FALLBACK = [
    { id: 1, categoria: "Impressão", nome: "Cartaz A3", tipoCalculo: "quantidade", preco: 2.50, margem: 20 },
    { id: 2, categoria: "Impressão", nome: "Cartaz A2", tipoCalculo: "quantidade", preco: 4.00, margem: 20 },
    { id: 3, categoria: "Vinil", nome: "Vinil Monomérico Impresso", tipoCalculo: "area_com_extras", preco: 15.00, margem: 25, permiteExtras: true },
    { id: 4, categoria: "Vinil", nome: "Vinil Monomérico Laminado", tipoCalculo: "area", preco: 20.00, margem: 25 },
    { id: 5, categoria: "Fotografia", nome: "Sessão Fotográfica", tipoCalculo: "horas_fotografia", preco: 170.00, margem: 0 },
    { id: 6, categoria: "Design", nome: "Design Gráfico", tipoCalculo: "tempo_design", preco: 35.00, margem: 10 },
    { id: 7, categoria: "PVC", nome: "PVC 3mm", tipoCalculo: "pvc_tabela", preco: 17.50, margem: 15 },
    { id: 8, categoria: "PVC", nome: "PVC 5mm", tipoCalculo: "pvc_tabela", preco: 22.50, margem: 15 },
    { id: 9, categoria: "Cartões", nome: "Cartões Expressos", tipoCalculo: "quantidade_degrau", preco: 48, margem: 10 },
    { id: 10, categoria: "Cartões", nome: "Cartões Premium", tipoCalculo: "quantidade_degrau", preco: 120, margem: 10 }
];

let produtos = [];
let produtosBackup = [];
let usarFallback = false;

// Tabelas internas fixas para estruturas complexas
const opcoesPvc = {
    7: {"so_pvc": 17.50, "pvc_vinil": 27.50, "pvc_uv": 31.50},
    8: {"so_pvc": 22.50, "pvc_vinil": 32.50, "pvc_uv": 37.50}
};

const degrausCartoes = {
    9: {"100": 48, "250": 65, "500": 95, "1000": 115},
    10: {"250": 120, "500": 145, "1000": 195}
};

// ===================================================
// 2. CARREGAMENTO DE DADOS DO GOOGLE SHEETS
// ===================================================
async function carregarDadosOnline() {
    try {
        console.log("🔄 A carregar dados do Google Sheets...");
        
        // Tenta carregar do Google Sheets
        const resposta = await fetch(LINK_GOOGLE_SHEETS + "&cachebust=" + Date.now());
        
        if (!resposta.ok) {
            throw new Error(`HTTP error! status: ${resposta.status}`);
        }
        
        const textoCsv = await resposta.text();
        console.log("📄 CSV recebido:", textoCsv.substring(0, 200) + "...");
        
        // Verifica se o CSV tem conteúdo válido
        if (!textoCsv || textoCsv.trim() === "" || textoCsv.includes("<!DOCTYPE")) {
            throw new Error("CSV vazio ou inválido");
        }
        
        const dados = converterCsvParaJson(textoCsv);
        
        if (dados && dados.length > 0) {
            produtos = dados;
            produtosBackup = [...dados];
            usarFallback = false;
            console.log("✅ Dados carregados com sucesso! Total:", produtos.length, "itens");
            return produtos;
        } else {
            throw new Error("Nenhum dado válido encontrado no CSV");
        }
        
    } catch (erro) {
        console.error("❌ Erro ao carregar do Google Sheets:", erro.message);
        console.log("📦 A usar dados de fallback...");
        
        // Usa dados de fallback
        produtos = JSON.parse(JSON.stringify(DADOS_FALLBACK));
        produtosBackup = [...produtos];
        usarFallback = true;
        
        // Adiciona tabelas complexas aos items de fallback
        produtos.forEach(p => {
            if (p.tipoCalculo === 'pvc_tabela') {
                p.opcoes = opcoesPvc[p.id] || { so_pvc: p.preco, pvc_vinil: p.preco * 1.5, pvc_uv: p.preco * 1.8 };
            }
            if (p.tipoCalculo === 'quantidade_degrau') {
                p.degraus = degrausCartoes[p.id] || { "100": p.preco, "250": p.preco * 0.9, "500": p.preco * 0.8, "1000": p.preco * 0.7 };
            }
        });
        
        return produtos;
    }
}

function converterCsvParaJson(csv) {
    const linhas = csv.split("\n").filter(line => line.trim() !== "");
    if (linhas.length < 2) return [];
    
    const resultado = [];
    
    // Pula o cabeçalho (primeira linha)
    for (let i = 1; i < linhas.length; i++) {
        let linha = linhas[i].trim();
        if (!linha) continue;
        
        try {
            // Divide por vírgula, respeitando aspas
            const colunas = linha.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
            const limpar = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';
            
            if (colunas.length < 5) continue;
            
            let idItem = parseInt(limpar(colunas[0])) || 0;
            if (idItem === 0) continue;
            
            let tipoCalc = limpar(colunas[3]) || 'quantidade';
            
            let item = {
                "id": idItem,
                "categoria": limpar(colunas[1]) || "Geral",
                "nome": limpar(colunas[2]) || "Item " + idItem,
                "tipoCalculo": tipoCalc,
                "preco": parseFloat(limpar(colunas[4])) || 0,
                "margem": parseFloat(limpar(colunas[5])) || 0,
                "iva": 0,
                "permiteExtras": tipoCalc === "area_com_extras"
            };
            
            // Adiciona tabelas complexas
            if (tipoCalc === "pvc_tabela") {
                item.opcoes = opcoesPvc[idItem] || { 
                    so_pvc: item.preco, 
                    pvc_vinil: item.preco * 1.5, 
                    pvc_uv: item.preco * 1.8 
                };
            }
            if (tipoCalc === "quantidade_degrau") {
                item.degraus = degrausCartoes[idItem] || { 
                    "100": item.preco, 
                    "250": item.preco * 0.9, 
                    "500": item.preco * 0.8, 
                    "1000": item.preco * 0.7 
                };
            }
            
            resultado.push(item);
        } catch (e) {
            console.warn("⚠️ Erro ao processar linha:", linha, e);
        }
    }
    
    console.log("📊 Itens convertidos:", resultado.length);
    return resultado;
}

// ===================================================
// 3. FUNÇÕES DO FRONTEND (Calculadora)
// ===================================================
function desenharMenuDropdown(select) {
    if (!select) return;
    select.innerHTML = '<option value="">-- Selecione uma Opção --</option>';
    
    if (!produtos || produtos.length === 0) {
        select.innerHTML = '<option value="">⚠️ Nenhum produto disponível</option>';
        return;
    }
    
    let categorias = [...new Set(produtos.map(p => p.categoria))];

    categorias.forEach(cat => {
        let optGroup = document.createElement('optgroup');
        optGroup.label = cat;
        produtos.filter(p => p.categoria === cat).forEach(p => {
            let opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.nome + (usarFallback ? " (offline)" : "");
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
        if (prod.degraus) {
            Object.keys(prod.degraus).forEach(qtd => {
                let o = document.createElement('option');
                o.value = prod.degraus[qtd];
                o.textContent = qtd + " unidades = " + prod.degraus[qtd] + "€";
                sCartoes.appendChild(o);
            });
        }
    }
}

function calcularPrecoFinal() {
    const idSelecionado = document.getElementById('cmbProduto').value;
    if(!idSelecionado) return alert('Por favor, selecione um produto ou serviço.');

    const prod = produtos.find(p => p.id == idSelecionado);
    if(!prod) return alert('Produto não encontrado.');

    let precoBaseComercial = 0;
    let descricaoBase = "";

    try {
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
            
            let valorHora = prod.preco;
            
            // Aplicar escalões de desconto
            if(horas >= 6) {
                valorHora = prod.preco * 0.70;
            } else if(horas >= 3) {
                valorHora = prod.preco * 0.80;
            }
            
            precoBaseComercial = horas * valorHora;
            descricaoBase = horas + " horas (valor/hora: " + valorHora.toFixed(2) + "€ | base: " + prod.preco.toFixed(2) + "€)";
        } 
        else if (prod.tipoCalculo === 'tempo_design') {
            precoBaseComercial = parseFloat(document.getElementById('tempoDesign').value);
            descricaoBase = "Preço por bloco de tempo";
        } 
        else if (prod.tipoCalculo === 'pvc_tabela') {
            let acab = document.getElementById('tipoAcabamentoPvc').value;
            let precoM2Pvc = prod.opcoes ? prod.opcoes[acab] : prod.preco;
            if(!precoM2Pvc || precoM2Pvc === 0) return alert('Acabamento indisponível.');
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

        document.getElementById('resNomeProduto').textContent = prod.nome + (usarFallback ? " (offline)" : "");
        document.getElementById('resDetalhe').textContent = descricaoBase;
        document.getElementById('resSubtotal').textContent = formatar(subtotal);
        document.getElementById('resIva').textContent = "0,00 € (Art.º 53º)"; 
        document.getElementById('resTotal').textContent = formatar(subtotal);
        document.getElementById('blocoResultado').style.display = 'block';
    } catch (error) {
        alert('Erro ao calcular: ' + error.message);
    }
}

function imprimirOrcamento() {
    const tituloOriginal = document.title;
    document.title = "Orcamento_Comercial";
    window.print();
    document.title = tituloOriginal;
}

// ===================================================
// 4. FUNÇÕES DO BACKEND (Administração)
// ===================================================
function atualizarListaBackend(lista) {
    if (!lista) return;
    
    const avisoAntigo = document.getElementById('avisoSincronizacao');
    if (avisoAntigo) avisoAntigo.remove();

    lista.innerHTML = '';

    // Cria o aviso de sincronização
    const alerta = document.createElement('div');
    alerta.id = 'avisoSincronizacao';
    alerta.style.cssText = "background: #ebf8ff; color: #2b6cb0; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 13px; font-weight: 600; text-align: center; border: 1px solid #bee3f8;";
    
    if (usarFallback) {
        alerta.innerHTML = "⚠️ <strong>Modo Offline:</strong> A usar dados de exemplo. Verifica o URL do Google Sheets ou a tua ligação à internet.";
        alerta.style.background = "#fefcbf";
        alerta.style.color = "#975a16";
        alerta.style.borderColor = "#f6e05e";
    } else {
        alerta.innerHTML = "💡 Os preços estão sincronizados com o Google Sheets. Altere os valores diretamente na sua folha de cálculo online para atualizar todos os telemóveis.";
    }
    lista.parentNode.insertBefore(alerta, lista);

    if (!produtos || produtos.length === 0) {
        lista.innerHTML = '<li style="text-align: center; color: #718096; padding: 20px;">Nenhum item no catálogo. Adicione um novo item acima.</li>';
        return;
    }

    produtos.forEach((p) => {
        let precoExibicao = p.preco ? p.preco.toFixed(2) + "€" : 'Tabela complexa';
        if(p.tipoCalculo === 'pvc_tabela') precoExibicao = "Preço por m² (Múltiplo)";
        if(p.tipoCalculo === 'quantidade_degrau') precoExibicao = "Escalonado por pacotes";
        if(p.tipoCalculo === 'horas_fotografia') {
            precoExibicao = p.preco.toFixed(2) + "€/hora (base)";
        }

        const tipoLabels = {
            'quantidade': '💰 Unitário',
            'area': '📐 Área',
            'area_com_extras': '📐 Área+Extras',
            'horas_fotografia': '📷 Horas',
            'tempo_design': '🎨 Design',
            'pvc_tabela': '📋 PVC',
            'quantidade_degrau': '📊 Escalonado'
        };

        lista.innerHTML += `
            <li>
                <div class="item-info">
                    <div>
                        <span class="badge">${p.categoria}</span>
                        <span class="badge-tipo">${tipoLabels[p.tipoCalculo] || p.tipoCalculo}</span>
                        <span style="font-size: 10px; color: #a0aec0;">ID: ${p.id}</span>
                        ${usarFallback ? '<span style="font-size: 10px; color: #975a16;">⚠️ offline</span>' : ''}
                    </div>
                    <strong>${p.nome}</strong><br>
                    <small style="color: #718096;">Valor: ${precoExibicao} | Margem: ${p.margem}% | Isento (Art.º 53º)</small>
                </div>
                <div class="acoes">
                    <button class="btn-acao btn-editar" onclick="abrirEdicao(${p.id})">✏️ Editar</button>
                    <button class="btn-acao btn-duplicar" onclick="duplicarItem(${p.id})">📋 Duplicar</button>
                    <button class="btn-acao btn-apagar" onclick="apagarItem(${p.id})">🗑️ Apagar</button>
                </div>
            </li>`;
    });
}

function abrirGoogleSheets() {
    window.open("https://docs.google.com/spreadsheets/d/18hBRKP0iEKiRgCRkICcTgWFCTougR_HcsXvcBkmD1ak/edit?usp=sharing", "_blank");
}

// ===================================================
// 5. BACKUP E IMPORTAÇÃO
// ===================================================
function exportarJSON() {
    if (!produtos || produtos.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }
    
    const dados = JSON.stringify(produtos, null, 2);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_produtos_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importarJSON(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            if (Array.isArray(dados) && dados.length > 0) {
                produtos = dados;
                produtosBackup = [...dados];
                usarFallback = false;
                
                const lista = document.getElementById('listaProdutos');
                if (lista) atualizarListaBackend(lista);
                
                const select = document.getElementById('cmbProduto');
                if (select) desenharMenuDropdown(select);
                
                alert('✅ Dados importados com sucesso!');
            } else {
                alert('❌ Ficheiro inválido ou vazio.');
            }
        } catch (error) {
            alert('❌ Erro ao importar: ' + error.message);
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// ===================================================
// 6. FUNÇÕES CRUD
// ===================================================
function adicionarItem() {
    const categoria = document.getElementById('novoCategoria').value.trim();
    const nome = document.getElementById('novoNome').value.trim();
    const tipo = document.getElementById('novoTipo').value;
    const preco = parseFloat(document.getElementById('novoPreco').value);
    const margem = parseFloat(document.getElementById('novaMargem').value) || 0;

    if (!categoria) return alert('Por favor, insira uma categoria.');
    if (!nome) return alert('Por favor, insira um nome para o produto.');
    if (isNaN(preco) || preco < 0) return alert('Por favor, insira um preço válido.');

    const maxId = produtos.reduce((max, p) => Math.max(max, p.id), 0);
    const novoId = maxId + 1;

    const novoItem = {
        id: novoId,
        categoria: categoria,
        nome: nome,
        tipoCalculo: tipo,
        preco: preco,
        margem: margem,
        iva: 0,
        permiteExtras: tipo === 'area_com_extras'
    };

    if (tipo === 'pvc_tabela') {
        novoItem.opcoes = { so_pvc: preco, pvc_vinil: preco * 1.5, pvc_uv: preco * 1.8 };
    }
    if (tipo === 'quantidade_degrau') {
        novoItem.degraus = { "100": preco, "250": preco * 0.9, "500": preco * 0.8, "1000": preco * 0.7 };
    }

    produtos.push(novoItem);
    produtosBackup = [...produtos];
    usarFallback = true;

    const lista = document.getElementById('listaProdutos');
    if (lista) atualizarListaBackend(lista);

    const select = document.getElementById('cmbProduto');
    if (select) desenharMenuDropdown(select);

    document.getElementById('novoCategoria').value = '';
    document.getElementById('novoNome').value = '';
    document.getElementById('novoPreco').value = '';
    document.getElementById('novaMargem').value = '0';

    alert(`✅ Item "${nome}" adicionado com sucesso! (ID: ${novoId})`);
}

function abrirEdicao(id) {
    const item = produtos.find(p => p.id === id);
    if (!item) return alert('Item não encontrado.');

    document.getElementById('editId').value = id;
    document.getElementById('editCategoria').value = item.categoria;
    document.getElementById('editNome').value = item.nome;
    document.getElementById('editTipo').value = item.tipoCalculo;
    document.getElementById('editPreco').value = item.preco;
    document.getElementById('editMargem').value = item.margem;

    document.getElementById('modalEdicao').classList.add('active');
}

function salvarEdicao() {
    const id = parseInt(document.getElementById('editId').value);
    const item = produtos.find(p => p.id === id);
    if (!item) return alert('Item não encontrado.');

    const categoria = document.getElementById('editCategoria').value.trim();
    const nome = document.getElementById('editNome').value.trim();
    const tipo = document.getElementById('editTipo').value;
    const preco = parseFloat(document.getElementById('editPreco').value);
    const margem = parseFloat(document.getElementById('editMargem').value) || 0;

    if (!categoria) return alert('Por favor, insira uma categoria.');
    if (!nome) return alert('Por favor, insira um nome para o produto.');
    if (isNaN(preco) || preco < 0) return alert('Por favor, insira um preço válido.');

    item.categoria = categoria;
    item.nome = nome;
    item.tipoCalculo = tipo;
    item.preco = preco;
    item.margem = margem;
    item.permiteExtras = tipo === 'area_com_extras';

    if (tipo === 'pvc_tabela') {
        item.opcoes = { so_pvc: preco, pvc_vinil: preco * 1.5, pvc_uv: preco * 1.8 };
    } else if (tipo === 'quantidade_degrau') {
        item.degraus = { "100": preco, "250": preco * 0.9, "500": preco * 0.8, "1000": preco * 0.7 };
    } else {
        delete item.opcoes;
        delete item.degraus;
    }

    produtosBackup = [...produtos];

    const lista = document.getElementById('listaProdutos');
    if (lista) atualizarListaBackend(lista);

    const select = document.getElementById('cmbProduto');
    if (select) desenharMenuDropdown(select);

    fecharModal();
    alert(`✅ Item "${nome}" atualizado com sucesso!`);
}

function apagarItem(id) {
    const item = produtos.find(p => p.id === id);
    if (!item) return alert('Item não encontrado.');

    if (!confirm(`Tem certeza que deseja apagar "${item.nome}"?`)) return;

    produtos = produtos.filter(p => p.id !== id);
    produtosBackup = [...produtos];

    const lista = document.getElementById('listaProdutos');
    if (lista) atualizarListaBackend(lista);

    const select = document.getElementById('cmbProduto');
    if (select) desenharMenuDropdown(select);

    alert(`🗑️ Item "${item.nome}" apagado com sucesso!`);
}

function duplicarItem(id) {
    const item = produtos.find(p => p.id === id);
    if (!item) return alert('Item não encontrado.');

    const maxId = produtos.reduce((max, p) => Math.max(max, p.id), 0);
    const novoId = maxId + 1;

    const novoItem = JSON.parse(JSON.stringify(item));
    novoItem.id = novoId;
    novoItem.nome = item.nome + ' (cópia)';

    produtos.push(novoItem);
    produtosBackup = [...produtos];

    const lista = document.getElementById('listaProdutos');
    if (lista) atualizarListaBackend(lista);

    const select = document.getElementById('cmbProduto');
    if (select) desenharMenuDropdown(select);

    alert(`📋 Item "${item.nome}" duplicado com sucesso!`);
}

function fecharModal() {
    document.getElementById('modalEdicao').classList.remove('active');
}

async function sincronizarGoogleSheets() {
    if (!confirm('Isso irá recarregar os dados do Google Sheets. As alterações locais serão perdidas. Continuar?')) return;
    
    await carregarDadosOnline();
    
    const lista = document.getElementById('listaProdutos');
    if (lista) atualizarListaBackend(lista);

    const select = document.getElementById('cmbProduto');
    if (select) desenharMenuDropdown(select);

    alert('✅ Dados sincronizados com o Google Sheets!');
}

// ===================================================
// 7. INICIALIZAÇÃO
// ===================================================
async function inicializar() {
    console.log("🚀 Inicializando aplicação...");
    await carregarDadosOnline();
    
    const select = document.getElementById('cmbProduto');
    if (select) desenharMenuDropdown(select);
    
    const lista = document.getElementById('listaProdutos');
    if (lista) atualizarListaBackend(lista);
    
    console.log("✅ Inicialização concluída. Produtos:", produtos.length);
}

document.addEventListener('DOMContentLoaded', inicializar);

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        console.log("🔄 Página reativada, recarregando...");
        inicializar();
    }
});
