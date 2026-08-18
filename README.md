# Tutores — Frontend

Dashboard administrativo + widget de embed do MVP da **Plataforma de Tutores Personalizados**
(desafio técnico DOT Digital Group). React + TypeScript + Vite. Ver o repositório irmão
`../backend` para a API.

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
- `http://localhost:5173/embed-demo.html` — página estática simulando o site de um integrador
  com o widget incorporado via iframe (edite os parâmetros `tutorId`/`token` no arquivo
  `public/embed-demo.html` com valores reais de um tutor criado no backend).

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
npm run lint
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

## Fluxo embed ponta a ponta (visão do frontend)

1. Admin acessa `/admin/tutors`, informa a `ADMIN_API_KEY` uma vez.
2. Cria um tutor em `/admin/tutors/new` (instruções + fontes de conhecimento).
3. Abre `/admin/tutors/{id}/embed`, copia o `<iframe>` pronto.
4. Cola o snippet em `public/embed-demo.html` (ou em qualquer site real) no lugar de
   `SEU_TUTOR_ID`/`SEU_EMBED_TOKEN`.
5. Abre `embed-demo.html` no navegador — o iframe carrega `/widget`, que conversa com
   `POST /api/public/chat` do backend usando apenas o `tutorId` e o `token` da URL.

## Limitações conhecidas do MVP

- Sem streaming da resposta do tutor (a UI mostra "Digitando..." até a resposta completa chegar).
- `ADMIN_API_KEY` fica em `localStorage` do navegador — aceitável para demo, não para produção
  multiusuário.
- Sem paginação na listagem de tutores (assume-se um volume pequeno, compatível com o escopo do MVP).

## Próximos passos para produção (não implementados)

- Autenticação real de admin (login + sessão) em vez de colar uma API key manualmente.
- Streaming da resposta do tutor (Server-Sent Events) para reduzir a latência percebida.
- Testes E2E (Playwright/Cypress) cobrindo o fluxo completo dentro de um iframe real.
- Internacionalização, caso a plataforma passe a atender integradores fora do Brasil.
