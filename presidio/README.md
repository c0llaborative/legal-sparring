# Gateway de anonimización (Presidio + NER español)

Microservicio que detecta y reemplaza PII (nombres, ubicaciones, emails, teléfonos,
**cédula y NIT colombianos**) por tokens reversibles `[TIPO_n]` **antes** de que el
expediente salga hacia el LLM. La app (Next.js) lo usa como gateway: si está corriendo
(`PRESIDIO_URL`), lo prefiere; si no, cae al redactor regex local (`lib/redaction.ts`).

## Correr con Docker (recomendado)
```bash
cd presidio
docker build -t legal-sparring-presidio .
docker run -p 8088:8088 legal-sparring-presidio
```

## Correr local (sin Docker)
```bash
cd presidio
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download es_core_news_md
uvicorn app:app --port 8088
```

## Conectar la app
En el `.env.local` de la raíz:
```
PRESIDIO_URL=http://localhost:8088
```
Reinicia `npm run dev`. A partir de ahí, `analizarExpediente` y el grafo anonimizan vía Presidio.

## Probar
```bash
curl -s -X POST http://localhost:8088/redact -H "Content-Type: application/json" \
  -d '{"text":"Juan Pérez, c.c. 79.123.456, vive en Bogotá. correo: jp@mail.com"}'
# -> {"redacted":"[PERSON_1], c.c. [CO_CEDULA_1], vive en [LOCATION_1]. correo: [EMAIL_ADDRESS_1]", "map":{...}}
```

## Contrato
`POST /redact { text, language="es" } → { redacted, map, entidades }`. El `map` (token→original)
queda del lado del cliente para re-hidratar; el LLM solo ve los tokens.
