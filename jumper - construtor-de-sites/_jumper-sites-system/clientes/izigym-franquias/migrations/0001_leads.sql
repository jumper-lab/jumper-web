CREATE TABLE IF NOT EXISTS leads (
 id TEXT PRIMARY KEY,
 criado_em TEXT NOT NULL,
 nome TEXT NOT NULL,
 email TEXT NOT NULL,
 telefone TEXT NOT NULL,
 aceita_whatsapp INTEGER NOT NULL CHECK (aceita_whatsapp IN (0,1)),
 cidade TEXT NOT NULL,
 capital TEXT NOT NULL CHECK (capital IN ('Sim','Estou avaliando com sócios','Ainda estou estruturando o investimento')),
 utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
 pagina_origem TEXT NOT NULL,
 user_agent TEXT NOT NULL,
 payload_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS leads_criado_em ON leads(criado_em);
