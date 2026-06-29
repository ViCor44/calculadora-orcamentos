// ===================================================
// 1. BASE DE DADOS ONLINE (GOOGLE SHEETS) E SCRIPT
// ===================================================
const LINK_GOOGLE_SHEETS = "https://docs.google.com/spreadsheets/d/18hBRKP0iEKiRgCRkICcTgWFCTougR_HcsXvcBkmD1ak/edit?usp=sharing";

let produtos = [];

const opcoesPvc = {
    26: {"so_pvc": 17.50, "pvc_vinil": 27.50, "pvc_uv": 31.50},
    27: {"so_pvc": 22.50, "pvc_vinil": 32.50, "pvc_uv": 37.50},
    28: {"so_pvc": 35.00, "pvc_vinil": 45.00, "pvc_uv": 0}
};

const degrausCartoes = {
    29: {"100": 48, "250": 65, "500": 95, "1000": 115},
    30: {"250": 120, "500": 145, "1000": 195}
};

async function carregarDadosDoGoogleSheets(tipoEcra) {
    try {
        const resposta = await fetch(LINK_GOOGLE_SHEETS + "&cachebust=" + Date.now());
        const textoCsv = await resposta.text();
        produtos = converterCsvParaJson(textoCsv);
        
        if (tipoEcra === "front") {
            const select = document.getElementById('cmbProduto');
            if (select) desMenuDropdown(select);
        } else if (tipoEcra === "back") {
            const lista = document.getElementById('listaProdutos');
            if (lista) atualizarListaBackendNuvemCorrigida(lista);
        }
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
        
        const separador = linha.includes(";") ? ";" : ",";
        const colunas = linha.split(separador);
        if (colunas.length < 5) continue;

        let idItem = parseInt(colunas[0]);
        let tipoCalc = colunas[3].replace(/"/g, "").trim();
        let precoLimpo = colunas[4].replace(/"/g, "").replace(",", ".").trim();
        let margemLimpa = colunas[5].replace(/"/g, "").replace(",", ".").trim();

        let item = {
            "id": idItem,
            "categoria": colunas[1].replace(/"/g, "").trim(),
            "nome": colunas[2].replace(/"/g, "").trim(),
            "tipoCalculo": tipoCalc,
            "preco": parseFloat(precoLimpo) || 0,
            "margem": parseFloat(margemLimpa) || 0,
            "iva": 0,
            "permiteExtras": tipoCalc === "area_com_extras"
        };

        if (tipoCalc === "pvc_tabela") item.opcoes = opcoesPvc[idItem];
        if (tipoCalc === "quantidade_degrau") item.degraus = degrausCartoes[idItem];

        resultado.push(item);
    }
    return resultado;
}

function desMenuDropdown(select) {
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
// 2. FÓRMULAS DE CÁLCULO FINANCEIRO E BACKEND
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
    else if (prod.tipoCalculo === 'tempo_design') {
        precoBaseComercial = parseFloat(document.getElementById('tempoDesign').value);
        descricaoBase = "Preço por bloco de tempo";
    } 
        else if (prod.tipoCalculo === 'horas_fotografia') {
        let horas = parseInt(document.getElementById('horasFotografia').value) || 0;
        if(horas <= 0) return alert('Insira um número válido de horas.');
        
        // CORREÇÃO: Vai buscar o preço base diretamente à folha (ex: 175€)
        let valorHora = prod.preco; 
        
        // Aplica os descontos de balcão com base no valor da folha
        if(horas >= 6) {
            valorHora = parseFloat((prod.preco * 0.7058).toFixed(2)); // Proporção para os 120€
        } else if(horas >= 3) {
            valorHora = parseFloat((prod.preco * 0.7941).toFixed(2)); // Proporção para os 135€
        }
        
        precoBaseComercial = horas * valorHora;
        descricaoBase = horas + " horas (escalão: " + valorHora + "€/h)";
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

function atualizarListaBackendNuvemCorrigida(lista) {
    const avisoAntigo = document.getElementById('avisoSincronizacaoUnico');
    if (avisoAntigo) avisoAntigo.remove();

    lista.innerHTML = '';
    
    const alerta = document.createElement('div');
    alerta.id = 'avisoSincronizacaoUnico';
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
                    <button class="btn-editar" onclick="abrirMinhaFolhaPrivada()" style="background: #cbd5e0; color: #2d3748;">Ver no Google</button>
                </div>
            </li>`;
    });
}

function abrirMinhaFolhaPrivada() {
    // ABRE A SUA FOLHA DE EDIÇÃO CORRETA
    window.open("https://docs.google.com/spreadsheets/d/18hBRKP0iEKiRgCRkICcTgWFCTougR_HcsXvcBkmD1ak/edit?usp=sharing", "_blank");
}

// Gatilhos globais inteligentes unificados para ambas as páginas
function dispararCargaDeDados() {
    if (document.getElementById('cmbProduto')) carregarDadosDoGoogleSheets("front");
    if (document.getElementById('listaProdutos')) carregarDadosDoGoogleSheets("back");
}

window.onload = dispararCargaDeDados;
window.addEventListener('pageshow', dispararCargaDeDados);
window.addEventListener('focus', dispararCargaDeDados);
