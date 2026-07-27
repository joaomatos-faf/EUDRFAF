# Preparador EUDR - FAF Coffees

Aplicativo local para transformar polígonos KML/GeoJSON em arquivos padronizados para o fluxo EUDR e comparar automaticamente a Série temporal de Cobertura por classe do MapBiomas.

## O que o aplicativo faz

- importa arquivos KML, GeoJSON ou JSON;
- calcula a área do polígono em hectares;
- oferece busca de município pela lista oficial do IBGE e preenche Estado e Região automaticamente;
- exige a escolha do Estado quando o nome do município existe em mais de uma unidade federativa;
- converte o KML em um Shapefile com os dados preenchidos antes da consulta;
- envia o ZIP do Shapefile e consulta a Cobertura por classe de 2020, 2021, 2022, 2023 e 2024;
- compara todas as classes ano a ano com a precisão de duas casas decimais exibida na tabela do MapBiomas;
- apresenta e registra no CSV o link da geometria na camada de Cobertura 2024 do MapBiomas;
- usa a Coleção 10.1, com resolução de 30 metros;
- gera GeoJSON, Shapefile e CSV para o processo EUDR;
- mantém a conferência do CAR e a interpretação do resultado como validações humanas obrigatórias.

## Executar no Windows

Baixe e execute `Preparador-EUDR-FAF-Setup-0.2.1.exe`. O instalador permite escolher a pasta e cria atalhos na Área de Trabalho e no menu Iniciar.

Depois da instalação, abra **Preparador EUDR FAF** pelo atalho. O aplicativo funciona em uma janela própria; não é necessário iniciar comandos nem abrir manualmente o navegador.

Não é necessário criar conta nem configurar senha do MapBiomas.

## Privacidade

Para calcular a série de cobertura na área exata, o servidor local gera uma cópia temporária do polígono em Shapefile, inclui os dados preenchidos e envia o ZIP por HTTPS ao endpoint público usado pela própria plataforma MapBiomas. O KML original permanece no computador. Não há credenciais armazenadas no projeto ou no computador.

## Desenvolvimento

Requisitos: Node.js 22 ou superior e pnpm.

```bash
pnpm install
pnpm run dev
```

Para criar novamente o instalador do Windows:

```bash
pnpm run desktop:dist
```

## Limites da automação

O resultado usa a Série temporal de Cobertura por classe da Coleção 10.1, disponível até 2024. O programa compara a tabela de 2020 até 2024 e sinaliza qualquer classe cujo valor apresentado mude entre anos consecutivos. O resultado não substitui análise documental ou jurídica.
