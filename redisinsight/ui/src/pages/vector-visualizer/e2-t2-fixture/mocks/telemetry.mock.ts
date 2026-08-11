export * from '../../../../telemetry'

export const sendEventTelemetry = () => undefined
export const TelemetryEvent = new Proxy<Record<string, string>>(
  {},
  { get: (_target, property) => String(property) },
)
