// Native OpenTelemetry tracing for the reference runtime.
//
// Every workflow execution opens a root span; every step opens a child span.
// The span's trace ID is stamped onto both the audit record ("what we did")
// and the typed event ("what happened") — so a single trace ID joins the two
// ledgers that the spec deliberately keeps separate. `cac-host trace <id>`
// reads that join back out as one interleaved timeline.
//
// Exporters are opt-in so the default path stays silent and dependency-free
// at runtime:
//   - CAC_TRACE_CONSOLE=1            -> ConsoleSpanExporter (human debugging)
//   - OTEL_EXPORTER_OTLP_ENDPOINT=…  -> noted; install the OTLP exporter in a
//                                       fork and add it to spanProcessors.
// With no exporter the provider still issues real W3C trace/span IDs — the
// IDs are what the ledgers need, the export is optional plumbing.

import {
  context,
  trace,
  SpanStatusCode,
  type Span,
  type Tracer,
} from "@opentelemetry/api";
import {
  ConsoleSpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

const SERVICE_NAME = "cac-runtime-host";
const TRACER_NAME = "company-as-code/runtime";

let provider: NodeTracerProvider | undefined;

/**
 * Register the tracer provider exactly once per process. Safe to call from
 * anywhere — repeated calls are a no-op. Returns immediately if tracing has
 * already been initialised (including by a host that registered its own
 * provider).
 */
export function initTracing(): void {
  if (provider) return;

  const spanProcessors: SpanProcessor[] = [];
  if (truthy(process.env.CAC_TRACE_CONSOLE)) {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: "0.1.0",
    }),
    spanProcessors,
  });
  provider.register();
}

function truthy(v: string | undefined): boolean {
  return v === "1" || v === "true" || v === "yes";
}

/** The runtime's tracer. Call {@link initTracing} first. */
export function getTracer(): Tracer {
  initTracing();
  return trace.getTracer(TRACER_NAME);
}

export interface TraceContext {
  traceId: string;
  spanId: string;
}

/** Trace + span ID of the currently active span, if any. */
export function activeTraceContext(): TraceContext | undefined {
  const span = trace.getActiveSpan();
  if (!span) return undefined;
  const sc = span.spanContext();
  if (!sc.traceId || sc.traceId === "00000000000000000000000000000000") return undefined;
  return { traceId: sc.traceId, spanId: sc.spanId };
}

/**
 * Run `fn` inside a fresh span made active for its duration. The span's
 * trace/span context is passed to `fn` so callers can stamp it onto audit
 * rows and events. The span is ended automatically; thrown errors are
 * recorded on the span before re-throwing.
 */
export async function runInSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (tc: TraceContext) => Promise<T>,
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(name, { attributes });
  const ctx = trace.setSpan(context.active(), span);
  return context.with(ctx, async () => {
    const sc = span.spanContext();
    const tc: TraceContext = { traceId: sc.traceId, spanId: sc.spanId };
    try {
      const result = await fn(tc);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (err as Error).message,
      });
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
}

/** Mark the active span (if any) as failed with a message. */
export function markActiveSpanFailed(message: string): void {
  const span: Span | undefined = trace.getActiveSpan();
  if (span) span.setStatus({ code: SpanStatusCode.ERROR, message });
}

/** Flush + shut down the provider. Call before process exit when exporting. */
export async function shutdownTracing(): Promise<void> {
  if (provider) {
    await provider.shutdown().catch(() => {});
    provider = undefined;
  }
}
