# @escalasaas/tracking

Funnel, form-friction and experiment tracking shared by every EscalaSaaS landing page.

Extracted from `escalasaas-lp` so a correction lands once instead of once per
site. Sites that copy this code drift: a fix applied to three of ten leaves the
other seven reporting numbers that are no longer comparable.

## Uso

```ts
import { configureTracking, initPageEvents } from "@escalasaas/tracking";
import { getAssignments } from "./lib/experiments";

configureTracking({
  getAssignments,                       // opcional — sem testes A/B, omita
  releaseSha: __RELEASE_SHA__,          // opcional, habilita comparação por deploy
  eventsPath: "/api/events",            // padrão; precisa de proxy para a API
});

initPageEvents();
```

O **site não é configurável**. A API o deriva do `Origin` da requisição, que a
página não consegue forjar — com vários clientes no mesmo banco, essa é a
diferença entre um modelo de dados e uma vulnerabilidade.

## O que o site precisa prover

- Um proxy de `eventsPath` para `POST /api/v1/events` da commercial-api
- `getAssignments`, se houver testes A/B rodando

## Ordem dos campos do formulário

`FORM_FIELD_ORDER` precisa espelhar a ordem visual do formulário do site, e a
mesma ordem existe no lado da API (`sqlAbandonFrictionField`). Se as duas
divergirem, o campo de fricção é atribuído errado — e o relatório mente
exatamente onde ele deveria explicar.

## Por que `dist/` está versionado

O pacote é instalado por URL do Git, e nesse caminho o npm depende do script
`prepare` para compilar no momento da instalação. Ambientes que bloqueiam
scripts de ciclo de vida — o padrão em várias versões do npm e comum em CI —
instalam o pacote sem `dist`, e o build do site quebra com um erro que não diz
o que aconteceu.

Versionar a saída troca esse problema por outro menor: lembrar de rodar
`npm run build` antes de publicar uma tag.
