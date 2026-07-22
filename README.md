# Preparador EUDR - FAF Coffees

Aplicativo para transformar polígonos KML/GeoJSON em arquivos padronizados para o fluxo EUDR.

## O que o aplicativo faz

- importa arquivos KML, GeoJSON ou JSON;
- calcula a área do polígono em hectares;
- gera GeoJSON com `name`, `area` e `productioncountry: BR`;
- gera um pacote Shapefile com `.shp`, `.shx`, `.dbf`, `.prj` e `.cpg`;
- gera um CSV com as colunas A a N da base de produtores;
- mantém as conferências do CAR e do MapBiomas como validações humanas obrigatórias;
- processa os arquivos localmente no navegador.

## Executar localmente

Requisitos: Node.js 22 ou superior e pnpm.

```bash
pnpm install
pnpm run dev
```

Acesse `http://localhost:3000`.

## Validar a versão de produção

```bash
pnpm run build
```

## Privacidade

Os KMLs e os dados preenchidos não são enviados ao servidor. O processamento e a geração dos arquivos acontecem no navegador.

As pastas `work/` e `outputs/` são ignoradas pelo Git e não fazem parte do repositório.

## Limites da automação

A consulta do CAR no Registro Rural e a decisão sobre desmatamento no MapBiomas continuam dependendo de conferência humana.
