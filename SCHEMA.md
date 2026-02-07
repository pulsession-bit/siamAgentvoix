# Schéma de Données CRM V2 (Canonique & Event-Driven)

Ce document définit la structure cible pour unifier le système autour des concepts de **Leads** (Identité), **Cases** (Dossiers/Intentions) et **Events** (Flux immuable).

## 1. Vue d'Ensemble Architecture (Event Sourcing Lite)
Le système ingère des événements (`audit_completed`, `call_requested`, `chat_summary`) qui mettent à jour l'état d'un dossier (`case`).

**Flux de Données :**
1. Front-End envoie un Payload (ex: `CallPayload`).
2. Backend (ou Service) normalise l'identité (`email`).
3. Backend ingère l'événement (`ingest_event`).
4. Backend résout le dossier (`resolve_case`) : création ou mise à jour.
5. Backend projette l'état final (`case.status`, `case.last_event_at`).

---

## 2. Collection `leads` (Master Identity)
Identité unique de l'utilisateur (Prospect/Client).
**Clé (Document ID)** : `email` (minuscule).

| Champ | Type | Description |
| :--- | :--- | :--- |
| `email` | String | Clé Primaire |
| `phone` | String | E.164 (ex: +33...) |
| `name` | String | Nom complet normalisé |
| `source` | String | Origine première (ex: "AUDIT_IA") |
| `created_at` | ISO Date | Première interaction |
| `updated_at` | ISO Date | Dernière mise à jour |

---

## 3. Collection `cases` (Dossiers / Intentions)
Un dossier représente une "Affaire" ou une "Intention" client (ex: Visa DTV 2024).
**Clé (Document ID)** : `case_id` (UUID ou Hash déterministe).

| Champ | Type | Description |
| :--- | :--- | :--- |
| `case_id` | String | Identifiant unique (UUID) |
| `lead_id` | String | Référence à `leads/{email}` |
| `intent` | String | Type de projet (ex: "DTV", "RETIREMENT") |
| `status` | String | Statut CRM (ex: "NEW", "AUDIT_DONE", "CALL_SCHEDULED") |
| `owner_uid` | String | UID Agent/Admin assigné |
| `site_id` | String | Origine (ex: "siam-visa-pro") |
| `confidence_score` | Number | Dernier score calculé (0-100) |
| `last_event_at` | ISO Date | Date dernier événement |
| `next_action_at` | ISO Date | Date prochaine action prévue |
| `created_at` | ISO Date | Date création dossier |

**Règle de Résolution (Merge vs New)** :
- Même `lead_id` + Même `intent` + Même `site_id` + Fenêtre < 30 jours => **Même Case**.
- Sinon => **Nouveau Case**.

---

## 4. Sub-Collection `cases/{case_id}/events` (Journal Immuable)
Historique complet des interactions.
**Clé (Document ID)** : `event_id` (Idempotent Hash `sha256(source + source_id)`).

### Structure Commune
| Champ | Type | Description |
| :--- | :--- | :--- |
| `event_id` | String | Hash unique de l'événement |
| `type` | String | Enum Type (voir ci-dessous) |
| `timestamp` | ISO Date | Date réelle de l'événement |
| `source` | String | "WEB_CHAT", "CALENDLY", "MANUAL" |
| `source_id` | String | ID externe (session_id, call_id) |
| `payload` | Map | Données brutes de l'événement |
| `summary` | Map | Synthèse textuelle (optionnel) |

### Types d'Événements & Payloads

#### A. `AUDIT_COMPLETED` (Source: Chat IA)
Déclenché quand l'IA termine une analyse documentaire.
**Données (Payload)** :
```typescript
interface AuditPayload {
  visa_type: string; // "DTV"
  audit_status: "VALID" | "INVALID" | "PENDING";
  confidence_score: number; // 85
  issues: string[]; // ["Missing Bank Statement"]
  missing_docs: string[]; // ["Proof of Address"]
  ready_for_payment: boolean;
}
```

#### B. `CALL_REQUESTED` (Source: Click-to-Call / Modal)
Déclenché quand l'utilisateur demande un appel expert.
**Données (Payload)** :
```typescript
interface CallPayload {
  reason: string;      // "case_complexity", "user_request"
  visa_type: string;   // "DTV"
  user_stage: string;  // "documents_review"
  notes: string;       // "Client needs clarification on tax residence"
  transcript?: string; // (Optionnel) Résumé de l'appel Live
}
```

#### C. `CHAT_SUMMARIZED` (Source: Fin de Session)
Déclenché quand l'IA génère la synthèse finale.
**Données (Payload)** :
```typescript
interface SummaryPayload {
  executive_summary: string;
  strengths: string[];
  weaknesses: string[];
  action_plan: { step: string; timing: string }[];
  visa_score: number;
}
```

#### D. `APPOINTMENT_BOOKED` (Source: Calendly/Booking) - *Futur*
Déclenché quand un RDV est pris.
**Données (Payload)** :
```typescript
interface AppointmentPayload {
  provider: "CALENDLY";
  event_uri: string;
  start_time: string;
  end_time: string;
  location: string; // "Google Meet"
}
```

---

## 5. Stratégie de Migration

1. **Dual Write** (Temporaire) :
   - Continuer d'écrire dans `audit_sessions` (legacy).
   - Écrire en parallèle dans `cases/{case_id}/events` via la logique d'ingestion.

2. **Backfill** :
   - Script Cloud Function pour parcourir `audit_sessions`.
   - Pour chaque session, déduire un `Event: AUDIT_COMPLETED` ou `CHAT_SUMMARIZED`.
   - Créer/Mettre à jour le `Case` associé.

3. **Switch View** :
   - Le dashboard Admin CRM lit uniquement `cases` et `events`.
