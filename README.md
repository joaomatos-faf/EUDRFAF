# Plataforma EUDR · FAF Coffees (Fazenda Ambiental Fortaleza)

Sistema de preparação, validação temporal de desmatamento zero e empacotamento de polígonos geoespaciais em conformidade com o **Regulamento Europeu de Desmatamento (UE 2023/1115)**.

---

## 🌐 Roteamento Oficial de Subdomínios (Cloudflare Workers)

| Domínio / Subdomínio | Finalidade | Descrição |
|---|---|---|
| **`https://fafeu.online`** | **Portal Gateway / Landing Page** | Hub de entrada com os gateways de navegação e seletor de idioma. |
| **`https://app.fafeu.online`** | **Preparador EUDR** | Mapeamento de talhões, validação MapBiomas / GFW e exportação de pacotes. |
| **`https://portal.fafeu.online`** | **Portal do Cliente & Importador** | Download de dossiês e polígonos certificados para desembaraço na UE. |
| **`https://contratos.fafeu.online`** | **Gestão de Contratos e Lotes** | Vínculo de contratos com talhões certificados e rastreabilidade. |
| **`https://dashboard.fafeu.online`** | **Dashboard Executivo EUDR** | Métricas consolidadas, mapas e estatísticas de auditoria em tempo real. |
| **`https://cloud.fafeu.online`** | **FAF Cloud Storage Explorer** | Repositório e gerenciamento de arquivos no Cloudflare R2. |

---

## 🏛️ Arquitetura Técnica

* **Framework & Runtime**: [Vinext](https://github.com/cloudflare/vinext) (Vite + Next.js App Router para Cloudflare Workers SSR).
* **Armazenamento de Dados**:
  * **Cloudflare KV (`USERS_KV`)**: Gerenciamento de credenciais com hashes PBKDF2 (100.000 iterações + salt único) e cache de geometrias do MapBiomas.
  * **Cloudflare R2 (`faf-eudr-storage`)**: Repositório de objetos imutável para arquivos `.geojson`, `.zip` e `.xlsx`.
* **Segurança & Autenticação**:
  * Sessão criptografada via cookies `HttpOnly` com assinatura **HMAC-SHA256**.
  * Chave secreta de sessão gerenciada via `SESSION_SECRET` no Cloudflare Secrets Vault.
  * Zero senhas em texto puro no código ou no bundle do cliente.
* **Internacionalização**: Suporte nativo a Português (`pt-BR`) e Inglês (`en`).
* **Auditoria Contínua**: Registro de logs de auditoria de todas as operações de cadastro, exportação e acesso.

---

## 🚀 Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Rodar a suíte de testes automatizados
npm test

# 3. Executar o servidor de desenvolvimento
npm run dev

# 4. Gerar build de produção
npm run build

# 5. Publicar no Cloudflare Workers
npx wrangler deploy
```

---

## 🧪 Testes Automatizados

A suíte de testes (`tests/*.test.mjs`) valida:
* Assinatura e verificação de tokens HMAC de sessão.
* Geração de hashes seguros com PBKDF2 (100.000 iterações).
* Validação e simplificação de polígonos geoespaciais (Douglas-Peucker).
* Conversão de coordenadas UTM para WGS84 (EPSG:4326).
* Geração do Shapefile em 5 partes (.shp, .shx, .dbf, .prj, .cpg) e planilha XLSX.
* Integridade dos dicionários bilíngues e cache de geometria do MapBiomas.

---

## 📄 Licença e Conformidade

Desenvolvido para **Fazenda Ambiental Fortaleza (FAF Coffees)** sob conformidade com o **Regulamento (UE) 2023/1115** da União Europeia.
