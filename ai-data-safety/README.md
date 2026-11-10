# Data sanitization tools for zero-data-retention LLMs

Zero-data-retention (ZDR) terms cover what a model provider keeps after the call. They do not cover the prompt itself. Once text leaves your network, it can still appear in a gateway, a log, a support ticket, or a misconfigured integration. POPIA, GDPR, and similar laws still apply to that disclosure. Sanitize first, then call the model.

None of these tools is a guarantee. Automated detectors miss things. Use them as one layer, and keep human review for high-risk data such as health, legal, or financial records.

Figures below were checked on 10 November 2026.

## The five tools

### 1. Presidio

[Presidio](https://github.com/data-privacy-stack/presidio) is the default open-source toolkit for this job. It started at Microsoft and now lives under the community-governed [Data Privacy Stack](https://github.com/data-privacy-stack/presidio) organization; `microsoft/presidio` redirects there. The analyzer finds PII and PHI in text (names, phone numbers, payment cards, national IDs, and similar). The anonymizer then replaces, redacts, masks, hashes, or encrypts those spans. Encryption is reversible with `DeanonymizeEngine` and the same key, which is how you restore values after the model replies. There is also an image redactor (including DICOM) and a structured-data module. You can add custom recognizers, and you can plug in other NLP backends, including GLiNER and Transformers.

- **Best for:** The main detect-and-anonymize pipeline, including reversible encryption and deployment as a library, REST API, Docker image, or Spark job.
- **License:** MIT
- **Language:** Python
- **Latest release:** 2.2.366 (27 October 2026)
- **Docs:** [presidio.dataprivacystack.org](https://presidio.dataprivacystack.org)
- **Link:** [github.com/data-privacy-stack/presidio](https://github.com/data-privacy-stack/presidio)

### 2. OpenAI Privacy Filter

[OpenAI Privacy Filter](https://github.com/openai/privacy-filter) is a local, Apache-2.0 token-classification model plus a CLI (`opf`) for detection and masking. It labels eight categories in one forward pass: person, email, phone, address, date, URL, account number, and secret. You can run it on a laptop or on-prem, including against a file or a pipe, and you can fine-tune it. It does not provide reversible pseudonymization. Treat it as a strong detector and masker, then hold any mapping of original values yourself if you need to restore them. The repository has no GitHub releases, and the last push as of this check was 22 April 2026, so confirm it still fits your environment before you standardize on it.

- **Best for:** Local, high-throughput redaction of long English text, including a dedicated `secret` class.
- **License:** Apache 2.0 (code and model)
- **Language:** Python
- **Latest release:** no GitHub releases; repo last pushed 22 April 2026
- **Model:** [huggingface.co/openai/privacy-filter](https://huggingface.co/openai/privacy-filter)
- **Link:** [github.com/openai/privacy-filter](https://github.com/openai/privacy-filter)

### 3. GLiNER

[GLiNER](https://github.com/urchade/GLiNER) is a lightweight named-entity model that takes the label list at inference time. You can ask it for `passport number`, `IBAN`, or a domain-specific type without retraining. PII-tuned checkpoints such as [`urchade/gliner_multi_pii-v1`](https://huggingface.co/urchade/gliner_multi_pii-v1) (Apache 2.0) cover a wide set of personal and health identifiers. GLiNER detects; it does not anonymize. Use it on its own and then replace the spans, or register it as a Presidio recognizer and let Presidio handle redaction and encryption. It ships as a Python library, with optional ONNX, OpenVINO, and a serving API.

- **Best for:** Custom or multilingual entity types, and as a Presidio detection backend.
- **License:** Apache 2.0 (library). Check the license on any checkpoint you load; the multilingual PII model above is Apache 2.0.
- **Language:** Python
- **Latest release:** v0.2.30 (2 November 2026)
- **Docs:** [urchade.github.io/GLiNER](https://urchade.github.io/GLiNER)
- **Link:** [github.com/urchade/GLiNER](https://github.com/urchade/GLiNER)

### 4. Gitleaks

[Gitleaks](https://github.com/gitleaks/gitleaks) finds secrets (API keys, tokens, passwords) in git history, directories, files, or stdin. That last mode matters for LLM traffic: you can pipe a prompt or a ticket body through it before the call. It reports and can block. It is not a PII anonymizer, and it should not be used to round-trip credentials back into a response. Strip or block secrets; do not pseudonymize them and restore them later. The project is MIT licensed, ships as a Go CLI and Docker image, and can run as a pre-commit hook or GitHub Action. The README currently states that Gitleaks is feature complete, with future releases limited to security patches.

- **Best for:** Catching credentials in code, files, and prompt text before they reach a model.
- **License:** MIT
- **Language:** Go
- **Latest release:** v8.30.1 (21 March 2026); the repo was still receiving commits as of 28 October 2026
- **Link:** [github.com/gitleaks/gitleaks](https://github.com/gitleaks/gitleaks)

### 5. DataProfiler

[DataProfiler](https://github.com/capitalone/DataProfiler), from Capital One, profiles CSV, JSON, Avro, Parquet, text, and DataFrames. Its labeler identifies sensitive entities such as people, emails, phone numbers, payment cards, SSNs, bank account numbers, IP addresses, and keys or hashes, at column or cell level for tables and at character level for unstructured text. It tells you what is in a dataset. It does not redact or pseudonymize. Use it to decide what must be stripped, then run those columns or fields through Presidio (or another anonymizer) before the file or table goes to an LLM.

- **Best for:** Finding PII and NPI in tabular and file datasets before you send them to a model.
- **License:** Apache 2.0
- **Language:** Python
- **Latest release:** 0.14.0 (10 September 2026)
- **Docs:** [capitalone.github.io/DataProfiler](https://capitalone.github.io/DataProfiler/)
- **Link:** [github.com/capitalone/DataProfiler](https://github.com/capitalone/DataProfiler)

## Comparison

| Tool | Best for | What it detects | Reversible pseudonymization | Deploy as |
| --- | --- | --- | --- | --- |
| Presidio | End-to-end text, image, and structured de-identification | Built-in PII/PHI recognizers, plus custom and external models | Yes, with the `encrypt` / `decrypt` operators | Python library, REST API, Docker, Spark |
| OpenAI Privacy Filter | Local masking of long text | Person, email, phone, address, date, URL, account number, secret | No | Python library and `opf` CLI; runs on-prem |
| GLiNER | Custom and multilingual entity detection | Any label you pass in; PII checkpoints cover personal and health IDs | No (detect only) | Python library, optional model server |
| Gitleaks | Secrets in code and prompt text | API keys, tokens, passwords, and similar credentials | No; block or strip, do not restore | Go CLI, Docker, pre-commit, stdin |
| DataProfiler | Sensitive-data discovery in datasets | PII/NPI labels in tables and unstructured files | No (profile and label only) | Python library |

## Recommended pattern

1. **Detect.** Run Gitleaks on the payload first and drop or refuse anything with credentials. Then detect PII with Presidio. Add GLiNER or OpenAI Privacy Filter if you need custom labels, longer documents, or a second detector.
2. **Redact or pseudonymize.** For values the model does not need, redact or replace them (`<PERSON>`, `<PHONE_NUMBER>`). For values it must reason about and that you need back, encrypt or substitute a stable placeholder and keep the mapping on your side. Do not send the mapping to the provider.
3. **Call the LLM** under a ZDR agreement, with the sanitized prompt only.
4. **Re-identify.** If you used Presidio encryption, run `DeanonymizeEngine` with the same key on the model output. If you used placeholders, apply your local map. Never restore secrets.

This stays on your infrastructure. ZDR then only has to cover a prompt that should no longer contain live personal data or credentials.

## Presidio example

Install the packages and a spaCy model, then detect and anonymize:

```sh
pip install presidio-analyzer presidio-anonymizer
python -m spacy download en_core_web_lg
```

```python
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine, DeanonymizeEngine
from presidio_anonymizer.entities import OperatorConfig

text = "My phone number is 212-555-5555"
analyzer = AnalyzerEngine()
results = analyzer.analyze(text=text, language="en")

# One-way replacement, suitable when the model does not need the original value back
redacted = AnonymizerEngine().anonymize(text=text, analyzer_results=results)
print(redacted.text)

# Reversible encryption, for detect -> call the LLM -> restore
key = "YOUR_16_BYTE_KEY!"  # AES key, kept only on your side
encrypted = AnonymizerEngine().anonymize(
    text=text,
    analyzer_results=results,
    operators={"DEFAULT": OperatorConfig("encrypt", {"key": key})},
)
# ... send encrypted.text to the LLM, then restore on the response ...
restored = DeanonymizeEngine().deanonymize(
    text=encrypted.text,
    entities=encrypted.items,
    operators={"DEFAULT": OperatorConfig("decrypt", {"key": key})},
)
print(restored.text)
```

See the official [text quickstart](https://presidio.dataprivacystack.org/getting_started/getting_started_text/) and [anonymizer operators](https://presidio.dataprivacystack.org/anonymizer/) for Docker, the REST API, and the other operators (replace, redact, mask, hash).

## Also considered

- **[LLM Guard](https://github.com/protectai/llm-guard)** (MIT, Python) had input/output scanners including Anonymize, Secrets, and Deanonymize with a vault, which maps closely to the pattern above. The repository is archived and no longer maintained. Latest tag: v0.3.16. Do not start a new project on it.
- **[Guardrails AI](https://github.com/guardrails-ai/guardrails)** (Apache 2.0, Python, latest release v0.11.0) and **[NVIDIA NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails)** are LLM input/output frameworks. They can wrap a sanitizer such as Presidio, but they are broader guardrail products rather than sanitization libraries.
- **[detect-secrets](https://github.com/Yelp/detect-secrets)** (Apache 2.0, Python) is a reasonable library-shaped alternative to Gitleaks. Its latest GitHub release is v1.5.0 (May 2024).
- **[scrubadub](https://github.com/LeapBeyond/scrubadub)** (Apache 2.0, Python) is a simple text scrubber. The last push was 1 September 2023.
- **[pii-codex](https://github.com/EdyVision/pii-codex)** (BSD-3-Clause) scores and categorizes PII risk and is built on Presidio. It is a research aid, not a sanitizer.
- Private AI and similar hosted APIs are not open source, so they are out of scope here.
