# havix-category-grid

Widget customizado para a plataforma **Havix**, desenvolvido com o **Havix Widget Devkit**. Exibe até 3 categorias em cards com imagem full-size, overlay e efeito de zoom.

---

## O que é o Havix Widget Devkit

O Devkit é o padrão oficial para desenvolver widgets customizados para lojas Havix. Um widget é um componente Vue 3 autônomo que roda dentro do storefront da loja sem necessidade de acesso ao código-fonte da plataforma.

O fluxo completo é:

```
Desenvolve localmente → npm run build → faz upload do widget-bundle.zip → widget aparece no builder da loja
```

---

## Estrutura do projeto

```
havix-category-grid/
├── src/
│   ├── manifest.json        # Metadados e campos configuráveis do widget
│   ├── Render.vue           # Componente principal (o que aparece na loja)
│   ├── Preview.vue          # Miniatura exibida no builder do admin
│   ├── style.css            # Estilos globais do widget (mergeados no build)
│   │
│   ├── host/
│   │   ├── types.ts         # Interfaces TypeScript do contrato host ↔ widget
│   │   ├── index.ts         # Composables: useHavixApi(), useHavixCart(), etc.
│   │   └── mocks.ts         # Implementações mock para desenvolvimento local
│   │
│   └── devkit/
│       ├── App.vue          # Shell do devkit: barra de controles + preview
│       └── main.ts          # Entry point do servidor de desenvolvimento
│
├── build.mjs                # Script de build: compila IIFE + gera widget-bundle.zip
├── vite.config.ts           # Config do Vite (apenas para o servidor de dev)
├── index.html               # HTML do devkit (não vai para produção)
└── dist/                    # Output do build (gerado automaticamente)
    ├── render.js
    ├── preview.js
    ├── style.css
    ├── manifest.json
    └── widget-bundle.zip    ← arquivo para upload
```

---

## Começando

### Pré-requisitos

- Node.js 18+
- npm

### Instalar dependências

```bash
npm install
```

### Rodar o devkit (desenvolvimento)

```bash
npm run dev
```

Abre `http://localhost:5173` com o widget renderizado ao vivo. A barra no topo do devkit permite simular estados de autenticação, B2B e carrinho sem precisar de um backend real.

### Gerar o bundle para upload

```bash
npm run build
```

Gera `dist/widget-bundle.zip`. Faça upload desse arquivo em:

> **Admin Havix → Storefront → Widgets customizados → Upload**

---

## Como o widget funciona

### `manifest.json` — declaração do widget

Define os metadados e todos os campos configuráveis que aparecem no painel direito do builder:

```json
{
  "name": "category-grid-custom",
  "title": "Category Grid",
  "version": "1.1.1",
  "supportedPageTypes": ["HOME", "CONTENT"],
  "fields": [
    {
      "id": "content.count",
      "label": "Número de categorias",
      "type": "range",
      "defaultValue": 3,
      "section": "content",
      "min": 1,
      "max": 3
    }
  ]
}
```

Os valores configurados pelo lojista chegam no `Render.vue` via prop `configuration`. O campo `"id": "content.count"` resulta em `configuration.content.count`.

**Seções disponíveis:** `content`, `style`, `layout`  
**Tipos de campo:** `text`, `textarea`, `number`, `boolean`, `select`, `color`, `range`, `media`

### `Render.vue` — o componente real

É o que roda na loja. Recebe três props:

| Prop | Tipo | Descrição |
|---|---|---|
| `configuration` | `Object` | Valores configurados pelo lojista no builder |
| `page` | `Object` | Dados da página atual (`type`, `slug`, `title`) |
| `storefront` | `Object` | Dados gerais da loja (`storeName`, `primaryColor`, etc.) |

Para acessar dados da plataforma (produtos, categorias, carrinho, autenticação), use os composables do host:

```js
import { useHavixApi, useHavixCart, useHavixAuth } from './host/index'

const api  = useHavixApi()
const cart = useHavixCart()
const auth = useHavixAuth()

// Exemplo: buscar categorias em destaque
const categories = await api.category.list(true)

// Exemplo: adicionar ao carrinho
await cart.addItem(productId, 1, variantId)
```

### `Preview.vue` — miniatura no builder

Componente estático (sem chamadas de API) exibido como thumbnail no catálogo de widgets do builder. Deve ser uma representação visual simplificada do widget real.

---

## O contrato host ↔ widget (`window.__HAVIX_HOST__`)

O widget se comunica com a plataforma Havix através do objeto `window.__HAVIX_HOST__`, injetado pelo storefront antes de carregar o widget. O Devkit fornece implementações mock desse objeto para desenvolvimento local.

### Bridges disponíveis

#### `useHavixApi()` — dados do catálogo e plataforma

```ts
const api = useHavixApi()

// Catálogo
api.catalog.list({ page, size, sort })
api.catalog.byCategory(categoryId, { page, size })
api.catalog.search({ q, categoryIds, priceMin, priceMax, inStock, sort, page, size })
api.catalog.detail(slug)

// Categorias
api.category.list(featuredOnly?)

// Avaliações
api.reviews.recent({ size, minRating })
api.reviews.byProduct(productId, { page, size })
api.reviews.submit(productId, { rating, title, description })

// Dados do cliente
api.customer.listOrders({ page, size })
api.customer.getOrderItems(orderId)
api.customer.listAddresses()
api.customer.updateProfile({ firstname, lastname, phone })

// B2B
api.b2b.listQuotes({ page, size })
api.b2b.getCreditSummary()
api.b2b.listInvoices()
```

#### `useHavixCart()` — carrinho de compras

```ts
const cart = useHavixCart()

cart.cart          // HavixCart | null
cart.count         // número de itens
cart.total         // total em centavos
cart.isEmpty       // boolean

await cart.fetch()
await cart.addItem(productId, quantity, variantId?)
await cart.updateItem(entryId, quantity)
await cart.removeItem(entryId)
await cart.applyDiscount(code)
await cart.removeDiscount(code)
```

#### `useHavixAuth()` — autenticação

```ts
const auth = useHavixAuth()

auth.isLoggedIn    // boolean
auth.customer      // HavixCustomer | null
auth.fullName      // string

await auth.login(email, password)
auth.logout()
await auth.register({ firstname, lastname, email, password })
```

#### `useHavixB2b()` — contexto B2B

```ts
const b2b = useHavixB2b()

b2b.isB2b          // boolean
b2b.companyName    // string
b2b.canPlaceOrders // boolean
b2b.credit         // HavixB2bCredit | null
```

#### `useHavixToast()` — notificações

```ts
const toast = useHavixToast()

toast.show('Produto adicionado!', 'success')
toast.show('Erro ao processar.', 'error')
toast.show('Atenção.', 'info')
```

---

## Como o build funciona

O `build.mjs` executa quatro etapas:

1. **Valida o `manifest.json`** — verifica `name` e `fields`
2. **Compila `Render.vue` → `render.js`** — bundle IIFE com Vue como external. Registra o componente em `window.__HAVIX_WIDGETS__["nome-do-widget"].render`
3. **Compila `Preview.vue` → `preview.js`** — mesmo processo, registra em `.preview`
4. **Mescla CSS** — `src/style.css` + estilos extraídos dos `<style>` blocks dos SFCs → `dist/style.css`
5. **Gera `widget-bundle.zip`** — empacota `manifest.json`, `render.js`, `preview.js` e `style.css`

> **Por que IIFE com Vue external?**  
> O storefront já carrega Vue. Para evitar conflito de instâncias (dois Vue na mesma página), o widget declara Vue como dependência externa e usa o `window.Vue` exposto pela plataforma.

---

## Devkit — barra de controles

O `devkit/App.vue` expõe controles para simular diferentes estados durante o desenvolvimento:

| Controle | O que faz |
|---|---|
| **Logado** | Simula um cliente autenticado (`useHavixAuth().isLoggedIn = true`) |
| **B2B** | Ativa contexto B2B com empresa e crédito mock (requer estar logado) |
| **+ Item no carrinho** | Adiciona um produto fictício ao carrinho mock |
| **Limpar carrinho** | Reseta o carrinho |

Para testar diferentes configurações do widget, edite o objeto `configuration` dentro de `devkit/App.vue`:

```js
const configuration = ref({
  content: { count: 3, featuredOnly: true, buttonText: 'Compre agora' },
  style:   { gap: 4 },
})
```

---

## Criando um novo widget com este devkit

Este repositório pode ser usado como template. Para criar um novo widget:

1. Clone ou copie esta estrutura
2. Edite `src/manifest.json` com o nome e campos do novo widget
3. Implemente `src/Render.vue` com a lógica do widget
4. Opcionalmente implemente `src/Preview.vue` para a miniatura
5. Adicione estilos em `src/style.css`
6. Ajuste `configuration` em `devkit/App.vue` para testar
7. Rode `npm run build` e faça upload do `dist/widget-bundle.zip`

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Gera o bundle de produção em `dist/` |
| `npm run preview` | Preview do servidor Vite (não é o devkit) |
