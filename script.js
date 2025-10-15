// chave para identificar os dados salvos pela aplicação no servidor
const STORAGE_KEY = "prompts_storage"

//state = estrutura (objeto) usada pra guardar o estado atual da aplicação — ou seja, as informações que o código precisa lembrar e manipular enquanto o usuário interage com a página
const state = {
  prompts: [],
  selectedId: null,
}

// objeto que armazena referências para partes específicas do HTML
const elements = {
  promptTitle: document.getElementById("prompt-title"),
  promptContent: document.getElementById("prompt-content"),
  titleWrapper: document.getElementById("title-wrapper"),
  contentWrapper: document.getElementById("content-wrapper"),
  btnOpen: document.getElementById("btn-open"),
  btnCollapse: document.getElementById("btn-collapse"),
  sidebar: document.querySelector(".sidebar"),
  btnSave: document.getElementById("btn-save"),
  list: document.getElementById("prompt-list"),
  search: document.getElementById("search-input"),
  btnNew: document.getElementById("btn-new"),
  btnCopy: document.getElementById("btn-copy"),
}

// atualiza o estado do wrapper editável, conforme o conteúdo do elemento
function updateEditableWrapperState(element, wrapper) {
  const hasText = element.textContent.trim().length > 0
  //textContent: retorna o texto contido em um elemento HTML, excluindo quaisquer tags HTML; é uma propriedade nativa do DOM (Document Object Model) — ou seja, ela vem do próprio navegador
  wrapper.classList.toggle("is-empty", !hasText)
  //se hasText for true, remove a classe is-empty; se for false, adiciona a classe is-empty
}

function openSidebar() {
  elements.sidebar.classList.add("open")
  elements.sidebar.classList.remove("collapsed")
  //elements.sidebar.style.display = "flex"
  //elements.btnOpen.style.display = "none"
}

function closeSidebar() {
  elements.sidebar.classList.remove("open")
  elements.sidebar.classList.add("collapsed")
  //elements.sidebar.style.display = "none"
  //elements.btnOpen.style.display = "block"
}

//garantir que os placeholders (“Título do Prompt...”, “Conteúdo do Prompt...”) apareçam ou sumam no momento certo
function updateAllEditableStates() {
  updateEditableWrapperState(elements.promptTitle, elements.titleWrapper)
  updateEditableWrapperState(elements.promptContent, elements.contentWrapper)
}

// adiciona os event listeners (ouvintes de input) para os elementos editáveis
function attachAllEditableHandlers() {
  elements.promptTitle.addEventListener("input", function () {
    updateEditableWrapperState(elements.promptTitle, elements.titleWrapper)
  })

  elements.promptContent.addEventListener("input", function () {
    updateEditableWrapperState(elements.promptContent, elements.contentWrapper)
  })
}

function save() {
  const title = elements.promptTitle.textContent.trim()
  const content = elements.promptContent.innerHTML.trim()
  const hasContent = elements.promptContent.textContent.trim()
  //definição da function save: pega o título e o conteúdo do prompt, verifica se eles não estão vazios e, se tudo estiver ok, salva ou atualiza o prompt no state

  if (!title || !hasContent) {
    alert("Título e conteúdo não podem estar vazios.")
    return
  }

  if (state.selectedId) {
    const existingPrompt = state.prompts.find((p) => p.id === state.selectedId)
    //se já existe um prompt selecionado, atualiza o título e o conteúdo
    if (existingPrompt) {
      existingPrompt.title = title || "Sem título"
      existingPrompt.content = content || "Sem conteúdo"
    }
  } else {
    const newPrompt = {
      id: Date.now().toString(36),
      //gerar um id único baseado no timestamp atual, convertido para base 36 (números e letras)
      title,
      //se o título estiver vazio, atribuir "Sem título"
      content,
      //se o conteúdo estiver vazio, atribuir "Sem conteúdo"
    }

    state.prompts.unshift(newPrompt)
    //adiciona o novo prompt no início da lista de prompts
    state.selectedId = newPrompt.id
  }

  renderList(elements.search.value)
  //verificar
  persist()
  alert("Prompt salvo com sucesso!")
  //antes o alert estava dentro do if, o que fazia com que ele não aparecesse ao atualizar um prompt existente
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prompts))
    //state.prompts é convertido para uma string JSON e salvo no localStorage com a chave definida em STORAGE_KEY
    //erro: antes estava só state, o que não é possível salvar diretamente no localStorage
  } catch (error) {
    console.log("Erro ao salvar no localStorage", error)
  }
}

function load() {
  try {
    const storage = localStorage.getItem(STORAGE_KEY)
    state.prompts = storage ? JSON.parse(storage) : []
    state.selectedId = null
  } catch (error) {
    console.log("Erro ao carregar do localStorage", error)
  }
}

function createPromptItem(prompt) {
  const tmp = document.createElement("div")
  tmp.innerHTML = prompt.content
  return `
  <li class="prompt-item" data-id="${prompt.id}" data-action="select">
    <div class="prompt-item-content">
      <span class="prompt-item-title">${prompt.title}</span>
        <span class="prompt-item-description">${tmp.textContent}</span>
    </div>
    
    <button class="btn-icon" title="Remover" data-action="remove">
      <img src="assets/remove.svg" alt="Remover" class="icon icon-trash" />
    </button>
  </li>
  `
}

function renderList(filterText = "") {
  const filteredPrompts = state.prompts
    .filter((prompt) =>
      prompt.title.toLowerCase().includes(filterText.toLowerCase().trim())
    )
    .map((p) => createPromptItem(p))
    .join("")

  elements.list.innerHTML = filteredPrompts
}
//antes: chamava prompList (que não existe) em vez de elements.list
//isso gerava o erro: Uncaught TypeError: Cannot set properties of null (setting 'innerHTML') e consequentemente qualquer função depois disso não rodava — incluindo updateAllEditableStates() e os event listeners ligados a edição e validação dos prompts, pois o erro interrompia a execução do script.
// os wrappers (titleWrapper e contentWrapper) que dependem de o DOM estar carregado corretamente e de as referências (elements.promptTitle, elements.promptContent, etc.) existirem.
// o erro que parecia “sobre o título e conteúdo vazios” na verdade era um efeito em cascata causado por um erro anterior no carregamento dos elementos.

function newPrompt() {
  state.selectedId = null
  elements.promptTitle.textContent = ""
  elements.promptContent.textContent = ""
  updateAllEditableStates()
  elements.promptTitle.focus()
  // limpa os campos de título e conteúdo, reseta o selectedId para null (indicando que nenhum prompt está selecionado) e foca o cursor no campo de título para facilitar a digitação do novo prompt
}

function copySelected() {
  try {
    const content = elements.promptContent

    if (!navigator.clipboard) {
      console.error("API de clipboard não suportada")
      return
    }

    navigator.clipboard.writeText(content.innerText)
    alert("Conteúdo copiado para a área de transferência!")
  } catch (error) {
    console.log("Erro ao copiar para a área de transferência:", error)
  }
}

//eventos
elements.btnSave.addEventListener("click", save)
elements.btnNew.addEventListener("click", newPrompt)
elements.btnCopy.addEventListener("click", copySelected)

elements.search.addEventListener("input", function (event) {
  renderList(event.target.value)
})
//filtrar a lista de prompts conforme o texto digitado no campo de busca

elements.list.addEventListener("click", function (event) {
  const removeBtn = event.target.closest("[data-action='remove']")
  const item = event.target.closest("[data-id]")

  if (!item) return

  const id = item.getAttribute("data-id")
  state.selectedId = id

  if (removeBtn) {
    //remover prompt
    state.prompts = state.prompts.filter((p) => p.id !== id)
    renderList(elements.search.value)
    persist()
    return
    //se o botão de remover foi clicado, filtra a lista de prompts para excluir o prompt com o id correspondente, atualiza a lista exibida e salva as mudanças no localStorage
  }

  if (event.target.closest("[data-action='select']")) {
    //selecionar prompt
    const prompt = state.prompts.find((p) => p.id === id)
    //erro antes: fechamento de {} estava antes do if (prompt), o que fazia com que o código dentro do if nunca fosse executado
    // a variável prompt é criada dentro do bloco if (event.target.closest(...)),
    // mas o uso dela estava fora desse bloco.
    if (prompt) {
      elements.promptTitle.textContent = prompt.title
      elements.promptContent.innerHTML = prompt.content
      updateAllEditableStates()
    }
  }
})

function init() {
  console.log("Init chamado!")
  console.log(elements)

  load()
  renderList("")
  attachAllEditableHandlers()
  updateAllEditableStates()

  //estado inicial da sidebar: aberta(desktop) e fechada(mobile)
  elements.sidebar.classList.remove("open")
  elements.sidebar.classList.remove("collapsed")

  elements.btnOpen.addEventListener("click", openSidebar)
  elements.btnCollapse.addEventListener("click", closeSidebar)
}

init()
console.log("Script finalizou!")
