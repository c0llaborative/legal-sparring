"""
Legal Sparring · Gateway de anonimización (Presidio + NER en español).
Detecta PII (nombres, ubicaciones, emails, teléfonos, cédula, NIT) y la reemplaza
por tokens reversibles [TIPO_n] ANTES de que el texto salga hacia cualquier LLM.

POST /redact { "text": "...", "language": "es" } -> { "redacted": "...", "map": {token: original} }
El mapa permite re-hidratar localmente en la UI; el LLM nunca ve el dato real.
"""
from fastapi import FastAPI
from pydantic import BaseModel
from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer, RecognizerRegistry
from presidio_analyzer.nlp_engine import NlpEngineProvider

# --- Motor NLP en español (spaCy) ---
nlp_engine = NlpEngineProvider(nlp_configuration={
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "es", "model_name": "es_core_news_md"}],
}).create_engine()

registry = RecognizerRegistry()
registry.load_predefined_recognizers(languages=["es"], nlp_engine=nlp_engine)

# --- Recognizers colombianos ---
cedula = PatternRecognizer(
    supported_entity="CO_CEDULA", supported_language="es",
    patterns=[
        Pattern("cedula_puntos", r"\b\d{1,3}(?:[.\s]\d{3}){2,3}\b", 0.55),
        Pattern("cedula_simple", r"\b\d{7,10}\b", 0.30),
    ],
    context=["cédula", "cedula", "c.c", "cc", "identificación", "identificado"],
)
nit = PatternRecognizer(
    supported_entity="CO_NIT", supported_language="es",
    patterns=[Pattern("nit", r"\b\d{9}-?\d\b", 0.6)],
    context=["nit", "tributaria", "rut"],
)
registry.add_recognizer(cedula)
registry.add_recognizer(nit)

analyzer = AnalyzerEngine(nlp_engine=nlp_engine, registry=registry, supported_languages=["es"])

ENTITIES = ["PERSON", "LOCATION", "EMAIL_ADDRESS", "PHONE_NUMBER", "CO_CEDULA",
            "CO_NIT", "IBAN_CODE", "CREDIT_CARD", "ORGANIZATION"]

app = FastAPI(title="Legal Sparring · Presidio gateway")


class Req(BaseModel):
    text: str
    language: str = "es"


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/redact")
def redact(req: Req):
    spans = analyzer.analyze(text=req.text, language=req.language or "es", entities=ENTITIES)
    spans = sorted(spans, key=lambda r: (r.start, -(r.score or 0)))
    mapping, seen, counters, out = {}, {}, {}, []
    last = 0
    for r in spans:
        if r.start < last:          # solapamiento → conserva el primero
            continue
        original = req.text[r.start:r.end]
        key = (r.entity_type, original)
        token = seen.get(key)
        if token is None:
            counters[r.entity_type] = counters.get(r.entity_type, 0) + 1
            token = f"[{r.entity_type}_{counters[r.entity_type]}]"
            seen[key] = token
            mapping[token] = original
        out.append(req.text[last:r.start])
        out.append(token)
        last = r.end
    out.append(req.text[last:])
    return {"redacted": "".join(out), "map": mapping, "entidades": sorted(set(c[0] for c in seen))}
