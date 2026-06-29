// ===================================================
// 1. LIGAÇÃO À BASE DE DADOS ONLINE (GOOGLE SHEETS)
// ===================================================
const LINK_GOOGLE_SHEETS = "https://docs.google.com/spreadsheets/d/18hBRKP0iEKiRgCRkICcTgWFCTougR_HcsXvcBkmD1ak/edit?usp=sharing";

let produtos = [];

// Tabelas internas fixas para estruturas complexas
const opcoesPvc = {
    26: {"so_pvc": 17.50, "pvc_vinil": 27.50, "pvc_uv": 31.50}, // 3mm
    27: {"so_pvc": 22.50, "pvc_vinil": 32.50, "pvc_uv": 37.50}, // 5mm
    28: {"so_pvc": 35.00, "pvc_vinil": 45.00, "pvc_uv": 0}       // 10mm
};

const degrausCartoes = {
    29: {"100": 48, "250": 65, "500": 95, "1000": 115},          // Expressos
    30: {"250": 120, "500": 145, "1000": 195}                    // Premium
};

async function carregarDadosOnline() {
    const select = document.getElementById('cmbProduto');
    if (!select) return;

    try {
        // Força o descarregamento de dados frescos limpando a cache do browser
        const resposta = await fetch(LINK_GOOGLE_SHEETS + "&cachebust=" + Date.now());
        const textoCsv = await resposta.text();

        produtos = converterCsvParaJson(textoCsv);
        desenharMenuDropdown(select);
    } catch (erro) {
        console.error("Erro na sincronização:", erro);
    }
}

function converterCsvParaJson(csv) {
    const linhas = csv.split("\n");
    const resultado = [];

    for (let i = 1; i < linhas.length; i++) {
        let linha = linhas[i].trim();
        if (!linha) continue;

        // Divide o texto por vírgulas considerando possíveis aspas
        const colunas = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (colunas.length < 5) continue;

        let idItem = parseInt(colunas[0]);
        let tipoCalc = colunas[3].trim();

        let item = {
            "id": idItem,
            "categoria": colunas[1].replace(/"/g, "").trim(),
            "nome": colunas[2].replace(/"/g, "").trim(),
            "tipoCalculo": tipoCalc,
            "preco": parseFloat(colunas[4]) || 0,
            "margem": parseFloat(colunas[5]) || 0,
            "iva": 0,
            "permiteExtras": tipoCalc === "area_com_extras"
        };

        // Injeta as sub-tabelas nas lógicas complexas
        if (tipoCalc === "pvc_tabela") item.opcoes = opcoesPvc[idItem];
        if (tipoCalc === "quantidade_degrau") item.degraus = degrausCartoes[idItem];

        resultado.push(item);
    }
    return resultado;
}
// ===================================================
// 2. CONSTRUÇÃO VISUAL DINÂMICA DO FORMULÁRIO
// ===================================================
function desenharMenuDropdown(select) {
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
// ===================================================
// 3. FÓRMULAS DE CÁLCULO FINANCEIRO E IMPRESSÃO
// ===================================================
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

// Gatilhos de Inicialização Inteligente (Nuvem)
window.onload = carDadosOnline;
window.addEventListener('pageshow', carDadosOnline);
window.addEventListener('focus', carDadosOnline);

function carDadosOnline() {
    if (document.getElementById('cmbProduto')) carregarDadosOnline();
}
// ===================================================
// 4. ADAPTAÇÃO DO PAINEL DE ADMINISTRAÇÃO (NUVEM)
// ===================================================
async function carregarDadosOnlineBackend() {
    const lista = document.getElementById('listaProdutos');
    if (!lista) return;

    try {
        if (produtos.length === 0) {
            const resposta = await fetch(LINK_GOOGLE_SHEETS + "&cachebust=" + Date.now());
            const textoCsv = await resposta.text();
            produtos = converterCsvParaJson(textoCsv);
        }

        atualizarListaBackendNuvem(lista);
    } catch (erro) {
        console.error("Erro ao carregar lista no backend:", erro);
    }
}

function atualizarListaBackendNuvem(lista) {
    // 1. LIMPEZA SEGURA: Remove qualquer aviso azul antigo antes de desenhar
    const avisoAntigo = document.getElementById('avisoSincronizacao');
    if (avisoAntigo) avisoAntigo.remove();

    lista.innerHTML = '';

    // 2. CRIAÇÃO DO AVISO: Cria o aviso azul com um ID fixo para nunca duplicar
    const alerta = document.createElement('div');
    alerta.id = 'avisoSincronizacao';
    alerta.style.cssText = "background: #ebf8ff; color: #2b6cb0; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 13px; font-weight: 600; text-align: center; border: 1px solid #bee3f8;";
    alerta.innerHTML = "💡 Os preços estão sincronizados com o Google Sheets. Altere os valores diretamente na sua folha de cálculo online para atualizar todos os telemóveis.";
    lista.parentNode.insertBefore(alerta, lista);

    produtos.forEach((p) => {
        let precoExibicao = p.preco ? p.preco.toFixed(2) + "€" : 'Tabela complexa';
        if(p.tipoCalculo === 'pvc_tabela') precoExibicao = "Preço por m² (Múltiplo)";
        if(p.tipoCalculo === 'quantidade_degrau') precoExibicao = "Escalonado por pacotes";

        lista.innerHTML += `
            <li>
                <div class="item-info">
                    <span class="badge">${p.categoria}</span><br>
                    <strong>${p.nome}</strong><br>
                    <small style="color: #718096;">Valor Online: ${precoExibicao} | Isento (Art.º 53º)</small>
                </div>
                <div class="acoes">
                    <button class="btn-editar" onclick="abrirGoogleSheets()" style="background: #cbd5e0; color: #2d3748;">Ver no Google</button>
                </div>
            </li>`;
    });
}

function abrirGoogleSheets() {
    // COLA O TEU LINK DE EDIÇÃO DIRETAMENTE ENTRE AS ASPAS:
    window.open("https://docs.google.com/spreadsheets/d/18hBRKP0iEKiRgCRkICcTgWFCTougR_HcsXvcBkmD1ak/edit?usp=sharing", "_blank");
}

// Inicialização e gatilhos corrigidos sem repetições infinitas
function carDadosOnline() {
    if (document.getElementById('cmbProduto')) carregarDadosOnline();
    if (document.getElementById('listaProdutos')) carregarDadosOnlineBackend();
}
