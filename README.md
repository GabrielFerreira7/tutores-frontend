# Tutores — Frontend

Dashboard administrativo + widget de embed do MVP da **Plataforma de Tutores Personalizados**
(desafio técnico DOT Digital Group). React + TypeScript + Vite. Ver o repositório irmão
[`tutores-backend`](https://github.com/GabrielFerreira7/tutores-backend) para a API.

Documentação adicional: [plano de implementação](docs/IMPLEMENTATION_PLAN.md) (diagramas de
arquitetura, decisões e trade-offs discutidos antes de implementar) e
[roteiro de testes manuais](docs/TESTING.md) (cobre os dois repositórios juntos).

> **Aviso de processo**: este código foi construído com o auxílio de um agente de codificação
> (Claude Code) sob supervisão humana, conforme exigido pelo enunciado do desafio — não foi
> escrito manualmente arquivo a arquivo sem esse fluxo assistido.

## Como rodar localmente

```bash
npm install
cp .env.example .env   # ajuste VITE_API_BASE_URL se o backend não estiver em localhost:8000

npm run dev
```

A aplicação sobe em `http://localhost:5173`:

- `http://localhost:5173/admin/tutors` — dashboard administrativo (pede a `ADMIN_API_KEY`
  configurada no backend na primeira visita, armazenada apenas no `localStorage` do navegador).
- `http://localhost:5173/widget?tutorId=...&token=...` — página isolada do widget, pensada para
  ser carregada dentro de um `<iframe>`.
- `http://localhost:5173/embed-demo.html` (ou `/embed-demo`, sem extensão — ambos funcionam)
  — página simulando o site de um integrador. Cole a "URL direta" copiada da tela Embed do
  dashboard admin no formulário da página e clique em "Carregar": o iframe é montado na hora,
  sem precisar editar o arquivo. O estado fica refletido na querystring da própria página
  (`?tutorId=...&token=...`), então também funciona como link direto/bookmarkável.

### Docker

```bash
docker compose up --build
```

O `VITE_API_BASE_URL` é embutido no bundle **em tempo de build** (limitação do Vite — variáveis
`VITE_*` não são lidas em runtime pelo container). Para apontar para um backend diferente do
padrão, exporte a variável antes do build: `VITE_API_BASE_URL=https://api.exemplo.com docker compose up --build`.

### Testes e lint

```bash
npm run test
npm run lint    # ESLint
npm run format  # Prettier
```

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `VITE_API_BASE_URL` | URL base do backend (default `http://localhost:8000`) |

## Decisões de arquitetura

| Decisão | Escolha | Por quê |
|---|---|---|
| Um único repositório frontend com duas áreas | `/admin/*` (dashboard) e `/widget` (embed) como rotas independentes no mesmo app React | Evita duplicar tooling/build para duas SPAs quando o PRD só exige um "frontend"; as rotas não compartilham estado entre si |
| Autenticação admin no cliente | Chave colada pelo usuário, guardada em `localStorage`, enviada em `X-Admin-Api-Key` a cada chamada | Sem backend de sessão/login no escopo do MVP; a chave nunca é exposta na página do widget público |
| Sessão de conversa do widget | `session_id` retornado pelo backend, persistido em `localStorage` por tutor | Permite que o usuário recarregue o iframe e continue a mesma conversa (RF de continuidade de sessão) |
| Estilo | CSS simples, sem design system/UI kit | O widget precisa carregar leve dentro de um iframe; dashboard tem escopo pequeno o suficiente para não justificar uma biblioteca de componentes |
| Tipografia dos headings | Peso/tamanho/tracking sobre o próprio `system-ui`, sem carregar fonte externa | Primeira tentativa usou `Space Grotesk` via Google Fonts; um scanner de anti-padrões de design (`impeccable`, ver nota abaixo) sinalizou que ela já é comum o suficiente em UI gerada por IA pra deixar de ser distintiva. A própria referência da ferramenta também nota que telas "Operate" (dashboards administrativos, não páginas de marketing) são bem atendidas por stacks de sistema — resultado: zero requisição de rede extra, zero dependência, mesmo contraste visual |

## Fluxo embed ponta a ponta (visão do frontend)

1. Admin acessa `/admin/tutors`, informa a `ADMIN_API_KEY` uma vez.
2. Cria um tutor em `/admin/tutors/new` (instruções + fontes de conhecimento).
3. Abre `/admin/tutors/{id}/embed`: copia o `<iframe>` pronto para colar num site real, ou
   clica na "URL direta" (link clicável) para abrir o chat direto numa aba, fora do iframe.
4. Para simular o site do integrador sem sair do ambiente local: abre `/embed-demo.html`,
   cola a mesma "URL direta" no formulário da página e clica em "Carregar" — nenhuma edição
   de arquivo necessária.
5. O iframe/aba carrega `/widget`, que conversa com `POST /api/public/chat` do backend
   usando apenas o `tutorId` e o `token` da URL — a admin API key nunca chega até aqui.

## Limitações conhecidas do MVP

- Sem streaming da resposta do tutor (a UI mostra "Digitando..." até a resposta completa chegar).
- `ADMIN_API_KEY` fica em `localStorage` do navegador — aceitável para demo, não para produção
  multiusuário.
- Sem paginação na listagem de tutores (assume-se um volume pequeno, compatível com o escopo do MVP).

## Próximos passos para produção (não implementados)

Lista de evolução, conforme pedido pelo PRD (seção 8b) — nada abaixo está implementado
neste MVP. Ver também a lista equivalente no README do backend (deploy da API, evolução do
agente/RAG opcional).

### Deploy e infraestrutura

- **Hospedagem**: hoje só há `Dockerfile`/`compose.yaml` (build + `serve`) para rodar local;
  em produção, um serviço de hospedagem estática com CDN (Vercel, Netlify, Cloudflare Pages,
  ou S3+CloudFront) tende a ser mais barato e simples que manter o container `serve` no ar,
  já que o resultado do build é só HTML/JS/CSS estático.
- **Domínio**: seguindo o esquema sugerido no README do backend, algo como
  `app.tutores.<dominio>` para o dashboard admin e `embed.tutores.<dominio>` para o widget —
  ou os dois no mesmo domínio, já que hoje são só rotas (`/admin/*` e `/widget`) do mesmo
  build. Separar em domínios diferentes só faria sentido se o widget precisasse de uma
  política de CSP/cache distinta da do dashboard.
- **`VITE_API_BASE_URL` por ambiente**: como essa variável é embutida em tempo de build (não
  lida em runtime pelo container — ver seção Docker acima), produção precisa de um build
  próprio apontando para a URL real da API, tipicamente feito pelo pipeline de CI/CD, não
  manualmente.
- **CI/CD**: pipeline rodando `npm run lint` + `npm run test` + `npm run build` em cada PR, e
  deploy automático ao mergear na `main`. Hoje essa verificação é manual, feita antes de cada
  push.
- **Cache/CDN do widget**: o HTML/JS são estáticos e cacheáveis agressivamente (o conteúdo
  dinâmico vem só das chamadas à API em runtime); vale configurar headers de cache longos com
  *cache-busting* por hash de build (o Vite já gera nomes de arquivo com hash, então isso é
  quase gratuito de configurar no CDN).

### Produto e qualidade

- **Autenticação real de admin** (login + sessão) em vez de colar uma API key manualmente —
  hoje é aceitável por ser um único papel administrativo no escopo do MVP.
- **Streaming da resposta do tutor** (Server-Sent Events) para reduzir a latência percebida no
  widget, acompanhando a mesma evolução do backend.
- **Testes E2E** (Playwright/Cypress) cobrindo o fluxo completo dentro de um iframe real,
  complementando os testes de componente atuais.
- **Paginação/busca** na listagem de tutores, caso o volume cresça além do que o MVP assume.
- **Internacionalização**, caso a plataforma passe a atender integradores fora do Brasil.

## Diagrama de arquitetura

Ver [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) para os diagramas completos
(Mermaid: componentes, sequência de conversa, sequência de setup de embed, modelo de dados).
Resumo em ASCII (frontend, backend, agente, persistência, embed):

```
Integrador (site) --iframe--> Widget (frontend, esta app) --HTTP--> Backend API
                                       |                                |
                              Admin (esta app, /admin/*)                |
                                       |                                |
                                 X-Admin-Api-Key                   embed_token
                                       |                                |
                                       +----------> Admin API ----------+
                                                          |
                                                    Agente (Pydantic AI)
                                                          |
                                                    Tool: fetch_source
                                                          |
                                              SQLite (Tutor, Source,
                                              ChatSession, ChatMessage)
```
