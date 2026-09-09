# Diretrizes e Regras de Segurança · EUDR FAF

## 🚨 REGRA ABSOLUTA DE SEGURANÇA (PRIORIDADE MÁXIMA)
- **NUNCA, EM HIPÓTESE ALGUMA, DEIXE OU COLOQUE SENHAS, CREDENCIAIS OU SEGREDO NO CÓDIGO-FONTE OU EM COMMITS DO GIT.**
- Todas as credenciais de usuários, tokens de API e segredos de autenticação DEVEM ser gerenciados EXCLUSIVAMENTE via:
  1. Arquivo local `.env.local` (estritamente ignorado pelo `.gitignore`).
  2. Cloudflare Secrets e Cloudflare KV (`USERS_KV`) em produção.
- Jamais inclua senhas (mesmo de teste), valores sensíveis ou menções a senhas reais em mensagens de commit (`git commit`), comentários de código ou arquivos versionados.
- O arquivo `app/lib/defaultUsers.ts` deve permanecer permanentemente livre de credenciais ou senhas hardcoded.
