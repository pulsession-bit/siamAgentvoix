
// services/ingressAdapter.ts
// Uses browser-native crypto.subtle for SHA-256 event ID hashing

export type IngressEventType =
    | "AUDIT_COMPLETED"
    | "APPOINTMENT_BOOKED"
    | "CALL_REQUESTED"
    | "CHAT_SUMMARIZED";

export type IngressSource = "WEB_CHAT" | "CALENDLY" | "MANUAL";

export interface Identity {
    uid?: string;
    email?: string; // lowercase
    phone?: string; // E.164
}

export interface IngressEvent<T = any> {
    schema_version: "ingress_event_v1";
    event_id: string;       // deterministic hash(source+source_id)
    type: IngressEventType; // business
    source: IngressSource;  // technical
    source_id: string;      // stable per source event (session_id, calendly invitee uri, etc.)
    site_id: string;

    occurred_at: string;    // when it happened
    ingested_at: string;    // when received

    identity: Identity;
    payload: T;
    summary?: any;
}

// Proper SHA-256 hash using browser-native crypto.subtle API
// Returns first 16 hex chars for a compact but collision-resistant ID
async function sha256(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 16); // 16 hex chars = 64 bits — sufficient for event IDs
}

async function makeEventId(source: IngressSource, source_id: string) {
    const hash = await sha256(`${source}:${source_id}`);
    return `${source.toLowerCase()}_${hash}`;
}

function lcEmail(v?: string) {
    return v ? v.trim().toLowerCase() : undefined;
}

/* ---------- Audit ---------- */

export interface LegacyAuditSession {
    email: string;
    lead_id: string;
    visa_type?: string;
    audit_score?: number;
    audit_status?: string;
    ai_data?: { audit_result?: any; summary?: any };
    session_id?: string;     // MUST be present (or use firestore docId)
    updated_at?: string;     // occurred_at candidate
}

export interface AuditPayload {
    visa_type: string;
    audit_status: "VALID" | "INVALID" | "PENDING";
    confidence_score: number;
    issues: string[];
    missing_docs: string[];
    ready_for_payment: boolean;
}

export const auditSessionToIngress = async (
    session: LegacyAuditSession,
    opts?: { site_id?: string; source_id?: string; occurred_at?: string }
): Promise<IngressEvent<AuditPayload>> => {
    const result = session.ai_data?.audit_result;

    const source: IngressSource = "WEB_CHAT";
    const source_id = opts?.source_id || session.session_id;

    if (!source_id) {
        throw new Error("auditSessionToIngress: missing session_id/source_id");
    }

    const occurred_at = opts?.occurred_at || session.updated_at || new Date().toISOString();
    const ingested_at = new Date().toISOString();

    const payload: AuditPayload = {
        visa_type: session.visa_type || result?.visa_type || "UNKNOWN",
        audit_status: (session.audit_status as any) || result?.audit_status || "PENDING",
        confidence_score: session.audit_score || result?.confidence_score || result?.visa_score || 0,
        issues: result?.issues || [],
        missing_docs: result?.missing_docs || [],
        ready_for_payment: !!(result?.ready_for_payment),
    };

    return {
        schema_version: "ingress_event_v1",
        event_id: await makeEventId(source, source_id),
        type: "AUDIT_COMPLETED",
        source,
        source_id,
        site_id: opts?.site_id ?? "siamvisapro",
        occurred_at,
        ingested_at,
        identity: { email: lcEmail(session.email) },
        payload,
        summary: session.ai_data?.summary,
    };
};

/* ---------- Calendly ---------- */

export interface CalendlyWebhook {
    event: string; // invitee.created
    payload: {
        uri: string;    // invitee uri (stable id)
        email: string;
        name: string;
        status: "active" | "canceled";
        scheduled_event: {
            uri: string;
            start_time: string;
            end_time: string;
            location: { type: string; location?: string; join_url?: string };
        };
    };
}

export interface AppointmentPayload {
    provider: "CALENDLY";
    invitee_uri: string;
    scheduled_event_uri: string;
    start_time: string;
    end_time: string;
    location: string;
    invitee_email: string;
    invitee_name?: string;
    status?: string;
}

export const appointmentToIngress = async (
    webhook: CalendlyWebhook,
    opts?: { site_id?: string }
): Promise<IngressEvent<AppointmentPayload>> => {
    const source: IngressSource = "CALENDLY";
    const source_id = webhook.payload.uri; // stable
    const occurred_at = webhook.payload.scheduled_event.start_time; // closest “event time”
    const ingested_at = new Date().toISOString();

    const loc =
        webhook.payload.scheduled_event.location.join_url ||
        webhook.payload.scheduled_event.location.location ||
        webhook.payload.scheduled_event.location.type;

    return {
        schema_version: "ingress_event_v1",
        event_id: await makeEventId(source, source_id),
        type: "APPOINTMENT_BOOKED",
        source,
        source_id,
        site_id: opts?.site_id ?? "siamvisapro",
        occurred_at,
        ingested_at,
        identity: { email: lcEmail(webhook.payload.email) },
        payload: {
            provider: "CALENDLY",
            invitee_uri: webhook.payload.uri,
            scheduled_event_uri: webhook.payload.scheduled_event.uri,
            start_time: webhook.payload.scheduled_event.start_time,
            end_time: webhook.payload.scheduled_event.end_time,
            location: loc,
            invitee_email: lcEmail(webhook.payload.email)!,
            invitee_name: webhook.payload.name,
            status: webhook.payload.status,
        },
    };
};

/* ---------- Unified ---------- */

export function toIngressEvent(input: LegacyAuditSession): Promise<IngressEvent<AuditPayload>>;
export function toIngressEvent(input: CalendlyWebhook): Promise<IngressEvent<AppointmentPayload>>;
export async function toIngressEvent(input: any): Promise<IngressEvent<any>> {
    // Simple heuristic: Calendly payloads have an "event" string field like "invitee.created"
    if (input?.event && input?.payload?.scheduled_event?.start_time && input?.payload?.uri) {
        return appointmentToIngress(input as CalendlyWebhook);
    }
    return auditSessionToIngress(input as LegacyAuditSession);
}

// ============================================================================
// JSON EXAMPLES (For Reference)
// ============================================================================

export const EXAMPLE_AUDIT_SESSION_JSON = JSON.stringify({
    "email": "test@example.com",
    "lead_id": "test@example.com",
    "visa_type": "DTV",
    "audit_score": 85,
    "audit_status": "VALID",
    "ai_data": {
        "audit_result": {
            "visa_type": "DTV",
            "audit_status": "VALID",
            "confidence_score": 85,
            "issues": [],
            "missing_docs": [],
            "ready_for_payment": true
        }
    },
    "session_id": "sess_12345",
    "updated_at": "2024-02-07T12:00:00Z"
}, null, 2);

export const EXAMPLE_APPOINTMENT_JSON = JSON.stringify({
    "event": "invitee.created",
    "payload": {
        "uri": "https://api.calendly.com/scheduled_events/EVT123/invitees/INV456",
        "email": "test@example.com",
        "name": "Jean Test",
        "status": "active",
        "event": "https://api.calendly.com/scheduled_events/EVT123",
        "scheduled_event": {
            "uri": "https://api.calendly.com/scheduled_events/EVT123",
            "start_time": "2024-02-10T14:00:00Z",
            "end_time": "2024-02-10T14:30:00Z",
            "location": {
                "type": "google_conference",
                "join_url": "https://meet.google.com/abc-defg-hij"
            }
        }
    }
}, null, 2);
