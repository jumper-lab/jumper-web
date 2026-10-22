ALTER TABLE leads ADD COLUMN sults_enviado_em TEXT;
ALTER TABLE leads ADD COLUMN sults_tentativas INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN sults_ultimo_erro TEXT;
