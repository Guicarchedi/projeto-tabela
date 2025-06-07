// Função para formatar número como moeda
function formatarMoeda(valor) {
    if (isNaN(valor) || valor === "") return valor;
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const tableForm = document.getElementById('tableForm');
const columnsInput = document.getElementById('columns');
const tableSection = document.getElementById('tableSection');
const rowForm = document.getElementById('rowForm');
const inputsDiv = document.getElementById('inputs');
const tableContainer = document.getElementById('tableContainer');
const sumColumnSelect = document.getElementById('sumColumn');
const sumResult = document.getElementById('sumResult');

// Adiciona controles extras na interface
const sumSection = document.querySelector('.sum-section');
const saveBtn = document.createElement('button');
saveBtn.textContent = 'Salvar Tabela';
saveBtn.type = 'button';
saveBtn.style.marginLeft = 'auto';
const loadBtn = document.createElement('button');
loadBtn.textContent = 'Carregar Tabela';
loadBtn.type = 'button';
loadBtn.style.marginLeft = '8px';
sumSection.appendChild(saveBtn);
sumSection.appendChild(loadBtn);

let colunas = [];
let dados = [];

// Criação da tabela
tableForm.onsubmit = function(e) {
    e.preventDefault();
    colunas = columnsInput.value.split(',').map(c => c.trim()).filter(Boolean);
    if (colunas.length === 0) return;
    criarInputsLinha();
    criarTabela();
    popularSelectSoma();
    tableSection.style.display = '';
};

// Criação dos inputs para adicionar linha
function criarInputsLinha() {
    inputsDiv.innerHTML = '';
    colunas.forEach((col, idx) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = col;
        input.name = `col${idx}`;
        inputsDiv.appendChild(input);
    });
}

// Adiciona linha na tabela
rowForm.onsubmit = function(e) {
    e.preventDefault();
    const novaLinha = [];
    Array.from(inputsDiv.children).forEach(input => {
        let valor = input.value.trim();
        if (!isNaN(valor) && valor !== "") valor = Number(valor);
        novaLinha.push(valor);
        input.value = '';
    });
    dados.push(novaLinha);
    criarTabela();
    atualizarSoma();
};

// Cria modal para salvar tabela
function criarModalSalvar() {
    let modal = document.getElementById('modalSalvar');
    if (modal) {
        modal.style.display = 'flex';
        return;
    }
    modal = document.createElement('div');
    modal.id = 'modalSalvar';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Salvar Tabela</h2>
            <input type="text" id="nomeTabela" placeholder="Nome da tabela" autofocus>
            <div class="modal-actions">
                <button id="btnSalvarTabela">Salvar</button>
                <button id="btnCancelarSalvar">Cancelar</button>
            </div>
        </div>
    `;
    modal.className = 'modal-bg';
    document.body.appendChild(modal);
    document.getElementById('btnSalvarTabela').onclick = function() {
        const nome = document.getElementById('nomeTabela').value.trim();
        if (!nome) {
            alert('Digite um nome para a tabela!');
            return;
        }
        const tabela = { colunas, dados };
        localStorage.setItem('tabela_' + nome, JSON.stringify(tabela));
        fecharModalSalvar();
        mostrarMensagem(`Sua tabela ${nome} foi salva com sucesso`);
    };
    document.getElementById('btnCancelarSalvar').onclick = fecharModalSalvar;
    modal.onclick = function(e) { if (e.target === modal) fecharModalSalvar(); };
}
function fecharModalSalvar() {
    const modal = document.getElementById('modalSalvar');
    if (modal) modal.style.display = 'none';
}

// Substitui o prompt por modal ao salvar
document.querySelector('.sum-section button').onclick = function() {
    criarModalSalvar();
};

// Modal para carregar tabela salva
function criarModalCarregar() {
    let modal = document.getElementById('modalCarregar');
    if (modal) {
        modal.style.display = 'flex';
        return;
    }
    const chaves = Object.keys(localStorage).filter(k => k.startsWith('tabela_'));
    if (chaves.length === 0) {
        mostrarMensagem('Nenhuma tabela salva!');
        return;
    }
    const nomes = chaves.map(k => k.replace('tabela_', ''));
    modal = document.createElement('div');
    modal.id = 'modalCarregar';
    modal.className = 'modal-bg';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Carregar Tabela</h2>
            <div class="lista-tabelas">
                ${nomes.map(nome => `<button class="btn-tabela-salva" data-nome="${nome}">${nome}</button>`).join('')}
            </div>
            <div class="modal-actions">
                <button id="btnCancelarCarregar">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.querySelectorAll('.btn-tabela-salva').forEach(btn => {
        btn.onclick = function() {
            const nome = this.getAttribute('data-nome');
            const tabela = JSON.parse(localStorage.getItem('tabela_' + nome));
            if (!tabela) return mostrarMensagem('Tabela não encontrada!');
            colunas = tabela.colunas;
            dados = tabela.dados;
            criarInputsLinha();
            criarTabela();
            popularSelectSoma();
            tableSection.style.display = '';
            atualizarSoma();
            fecharModalCarregar();
            mostrarMensagem(`Tabela '${nome}' carregada com sucesso!`);
        };
    });
    document.getElementById('btnCancelarCarregar').onclick = fecharModalCarregar;
    modal.onclick = function(e) { if (e.target === modal) fecharModalCarregar(); };
}
function fecharModalCarregar() {
    const modal = document.getElementById('modalCarregar');
    if (modal) modal.style.display = 'none';
}

// Corrige o botão de carregar tabela para sempre chamar o modal correto
loadBtn.onclick = function() {
    criarModalCarregar();
};

// Cria tabela HTML
function criarTabela() {
    let html = '<table><thead><tr>';
    colunas.forEach(col => html += `<th>${col}</th>`);
    html += '<th>Ações</th></tr></thead><tbody>';
    dados.forEach((linha, i) => {
        html += '<tr>';
        linha.forEach((valor, j) => {
            html += `<td ondblclick="editarCelula(${i},${j})">${typeof valor === 'number' ? formatarMoeda(valor) : valor}</td>`;
        });
        html += `<td><button class="edit-btn" onclick="editarLinha(${i})">Editar</button><button class="delete-btn" onclick="excluirLinha(${i})">Excluir</button></td>`;
        html += '</tr>';
    });
    html += '</tbody></table>';
    tableContainer.innerHTML = html;
}

// Popular select de soma (agora múltiplo)
function popularSelectSoma() {
    sumColumnSelect.innerHTML = '';
    colunas.forEach((col, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = col;
        sumColumnSelect.appendChild(opt);
    });
    sumColumnSelect.multiple = true;
    sumColumnSelect.size = 1;
}

// Atualiza soma para múltiplas colunas e mostra total geral
sumColumnSelect.onchange = atualizarSoma;
function atualizarSoma() {
    const idxs = Array.from(sumColumnSelect.selectedOptions).map(opt => Number(opt.value));
    if (idxs.length === 0 || colunas.length === 0) {
        sumResult.textContent = '';
        return;
    }
    let somas = idxs.map(idx => {
        let soma = 0;
        dados.forEach(linha => {
            const valor = linha[idx];
            if (typeof valor === 'number') soma += valor;
        });
        return soma;
    });
    // Mostra soma individual e total geral
    let texto = idxs.map((idx, i) => `${colunas[idx]}: ${formatarMoeda(somas[i])}`).join(' | ');
    if (somas.length > 1) {
        const total = somas.reduce((a, b) => a + b, 0);
        texto += ` | Total Geral: ${formatarMoeda(total)}`;
    }
    sumResult.textContent = texto;
}

// Editar linha
window.editarLinha = function(idx) {
    const valores = dados[idx];
    Array.from(inputsDiv.children).forEach((input, i) => {
        input.value = valores[i];
    });
    // Remove a linha antiga para re-adicionar ao salvar
    dados.splice(idx, 1);
    criarTabela();
    atualizarSoma();
};

// Excluir linha
window.excluirLinha = function(idx) {
    if (confirm('Excluir esta linha?')) {
        dados.splice(idx, 1);
        criarTabela();
        atualizarSoma();
    }
};

// Editar célula ao dar duplo clique
window.editarCelula = function(i, j) {
    const novo = prompt('Novo valor:', dados[i][j]);
    if (novo !== null) {
        let valor = novo.trim();
        if (!isNaN(valor) && valor !== "") valor = Number(valor);
        dados[i][j] = valor;
        criarTabela();
        atualizarSoma();
    }
};

// Função para mostrar mensagem de sucesso
function mostrarMensagem(msg) {
    let div = document.getElementById('mensagemSucesso');
    if (!div) {
        div = document.createElement('div');
        div.id = 'mensagemSucesso';
        div.className = 'mensagem-sucesso';
        document.body.appendChild(div);
    }
    div.textContent = msg;
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 3500);
}