# Regra Permanente de Segurança

NUNCA, EM HIPÓTESE ALGUMA, DEIXE OU COLOQUE SENHAS, CREDENCIAIS OU SEGREDO NO CÓDIGO-FONTE OU EM COMMITS DO GIT.
Todas as credenciais de usuários e segredos devem ser gerenciados exclusivamente via `.env.local` ou Cloudflare KV / Secrets.

# Regra Permanente de Processos
NUNCA, EM HIPÓTESE ALGUMA, DEIXE PROCESSOS OU TAREFAS RODANDO EM SEGUNDO PLANO AO CONCLUIR.
Todas as ações e comandos devem ser executados e finalizados 100% antes de terminar o atendimento.
