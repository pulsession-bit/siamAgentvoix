
// knowledge/visaData.ts
// Deep-refresh (Feb 17, 2026) — RAG-first knowledge base
//
// Primary sources (official):
// - DTV (France/Paris): https://www.thaiembassy.fr/fr/visa-rdv/les-types-de-visa-et-les-documents-necessaires/dtv/
// - LTR (France/Paris): https://www.thaiembassy.fr/fr/visa-rdv/les-types-de-visa-et-les-documents-necessaires/visa-de-resident-de-longue-duree-ltr/
// - LTR (BOI official): https://ltr.boi.go.th/  and https://ltr.boi.go.th/page/visa-issuance-info.html
// - O-A (France/Paris): https://www.thaiembassy.fr/fr/visa-rdv/les-types-de-visa-et-les-documents-necessaires/visa-o-long-stay/
// - O-X (France/Paris): https://www.thaiembassy.fr/fr/visa-rdv/les-types-de-visa-et-les-documents-necessaires/visa-o-x-long-stay/
// - Thailand Privilege packages (official): https://www.thailandprivilege.co.th/home
// - Thailand Privilege (visa fee + TPC letter): https://www.thaiembassy.fr/fr/visa-rdv/les-types-de-visa-et-les-documents-necessaires/autres/
//
// Secondary / internal reference (marketing copy):
// - SiamVisaPro comparator (extracted Feb 2026):
//   https://www.siamvisapro.com/fr/comparateur-visa-thailande-2026
//
// Notes:
// - Visa requirements vary by consular jurisdiction. This file includes a "FR-PARIS" jurisdiction overlay
//   for applicants residing in France under the Royal Thai Embassy in Paris.
// - Do NOT auto-convert currencies for compliance decisions. Keep amounts as stated by sources.

export type VisaId =
  | 'DTV'
  | 'LTR'
  | 'THAILAND_PRIVILEGE'
  | 'RETIREMENT_OA'
  | 'RETIREMENT_OX'
  // Backward-compatible aliases:
  | 'ELITE'
  | 'RETIREMENT';

export type Jurisdiction = 'GLOBAL' | 'FR-PARIS';

export interface SourceRef {
  id: string; // stable key used inside entries
  url: string;
  publisher: string;
  extractedAt: string; // ISO date
  note?: string;
}

export type Currency = 'THB' | 'EUR' | 'USD';

export interface Money {
  amount: number;
  currency: Currency;
  qualifier?: 'min' | 'fixed' | 'range' | 'approx';
  note?: string;
}

export interface DurationRule {
  validityYears?: number;
  validityText?: string;
  entries?: 'single' | 'multiple';
  stayPerEntryDays?: number;
  extensionDays?: number;
  reportingRule?: string; // human text
  notes?: string[];
}

export interface Requirements {
  ageMin?: number;
  passportValidityMonthsMin?: number;
  bankBalance?: Array<{
    min: Money;
    lookbackMonths?: number;
    mustBeMaintainedEachMonth?: boolean;
    accountNotes?: string;
    notes?: string;
  }>;
  income?: Array<{
    minMonthly?: Money;
    minAnnual?: Money;
    notes?: string;
  }>;
  assets?: Array<{
    min: Money;
    notes?: string;
  }>;
  investmentInThailand?: Array<{
    min: Money;
    notes?: string;
  }>;
  insurance?: Array<{
    minCoverage?: Money;
    mustInclude?: string[];
    notes?: string;
  }>;
  documents?: string[]; // short checklist-style bullets
  eligibilityNotes?: string[]; // nuanced conditions not easily structured
}

export interface FeeModel {
  visaFee?: Money;
  processingFee?: Money;
  membershipFees?: Array<{
    tier: string;
    fee: Money;
    validityYears: number;
    pointsPerYear?: number;
    notes?: string[];
  }>;
  notes?: string[];
}

export interface VisaKnowledgeItem {
  id: VisaId;
  name: string;
  shortDescription: string;
  tags: string[];
  targetAudience: string[];
  duration: DurationRule;
  requirements: Requirements;
  fees: FeeModel;
  benefits: string[];
  restrictions: string[];
  sources: SourceRef[];
  jurisdictionOverlays?: Partial<Record<Jurisdiction, Partial<VisaKnowledgeItem>>>;
  aliases?: VisaId[];
}

/**
 * RAG-oriented: stable sources registry (avoid repeating URLs everywhere)
 */
export const SOURCES: Record<string, SourceRef> = {
  THAIEMB_FR_DTV: {
    id: 'THAIEMB_FR_DTV',
    url: 'https://www.thaiembassy.fr/fr/visa-rdv/les-types-de-visa-et-les-documents-necessaires/dtv/',
    publisher: 'Royal Thai Embassy in France (Paris)',
    extractedAt: '2026-02-17',
  },
  THAIEMB_FR_LTR: {
    id: 'THAIEMB_FR_LTR',
    url: 'https://www.thaiembassy.fr/fr/visa-rdv/les-types-de-visa-et-les-documents-necessaires/visa-de-resident-de-longue-duree-ltr/',
    publisher: 'Royal Thai Embassy in France (Paris)',
    extractedAt: '2026-02-17',
  },
  BOI_LTR_HOME: {
    id: 'BOI_LTR_HOME',
    url: 'https://ltr.boi.go.th/',
    publisher: 'Thailand BOI — LTR Visa (official)',
    extractedAt: '2026-02-17',
  },
  BOI_LTR_ISSUANCE: {
    id: 'BOI_LTR_ISSUANCE',
    url: 'https://ltr.boi.go.th/page/visa-issuance-info.html',
    publisher: 'Thailand BOI — LTR Visa (official)',
    extractedAt: '2026-02-17',
  },
  THAIEMB_FR_OA: {
    id: 'THAIEMB_FR_OA',
    url: 'https://www.thaiembassy.fr/fr/visa-rdv/les-types-de-visa-et-les-documents-necessaires/visa-o-long-stay/',
    publisher: 'Royal Thai Embassy in France (Paris)',
    extractedAt: '2026-02-17',
  },
  THAIEMB_FR_OX: {
    id: 'THAIEMB_FR_OX',
    url: 'https://www.thaiembassy.fr/fr/visa-rdv/les-types-de-visa-et-les-documents-necessaires/visa-o-x-long-stay/',
    publisher: 'Royal Thai Embassy in France (Paris)',
    extractedAt: '2026-02-17',
  },
  THAIEMB_FR_OTHER_PRIV: {
    id: 'THAIEMB_FR_OTHER_PRIV',
    url: 'https://www.thaiembassy.fr/fr/visa-rdv/les-types-de-visa-et-les-documents-necessaires/autres/',
    publisher: 'Royal Thai Embassy in France (Paris)',
    extractedAt: '2026-02-17',
    note: 'Contains Thailand Privilege Card requirements + “aucun frais de visa”.',
  },
  TPC_HOME: {
    id: 'TPC_HOME',
    url: 'https://www.thailandprivilege.co.th/home',
    publisher: 'Thailand Privilege (official)',
    extractedAt: '2026-02-17',
  },
  SVP_COMPARATOR_2026: {
    id: 'SVP_COMPARATOR_2026',
    url: 'https://www.siamvisapro.com/fr/comparateur-visa-thailande-2026',
    publisher: 'SiamVisaPro (internal reference)',
    extractedAt: '2026-02-17',
  },
};

export const VISA_DATA: Record<string, VisaKnowledgeItem> = {
  DTV: {
    id: 'DTV',
    name: 'Destination Thailand Visa (DTV)',
    shortDescription:
      'Visa multi-entrées pour séjours longs (180j) destiné aux personnes en “workcation” et aux activités “soft power”.',
    tags: ['workcation', 'remote-work', 'soft-power', 'multi-entry', '5-years'],
    targetAudience: [
      'Digital nomads / travailleurs à distance',
      'Freelances (portfolio + preuves)',
      'Participants à activités “Thai soft power” (muay thai, cuisine, sport, séminaires, expositions, soins médicaux, etc.)',
      'Conjoint + enfants < 20 ans (personnes à charge)',
    ],
    duration: {
      validityYears: 5,
      entries: 'multiple',
      stayPerEntryDays: 180,
      extensionDays: 180,
      notes: [
        'Le e-visa DTV ne se “transfère” pas sur un nouveau passeport (selon l’Ambassade).',
        'Procédure ~4 semaines (variable si dossier incomplet).',
      ],
    },
    requirements: {
      passportValidityMonthsMin: 6,
      bankBalance: [
        {
          min: { amount: 15000, currency: 'EUR', qualifier: 'min' },
          lookbackMonths: 3,
          mustBeMaintainedEachMonth: true,
          accountNotes: 'Solde créditeur non bloqué.',
          notes:
            "Le libellé Ambassade mentionne “15 000 euros/par mois… au cours des 3 derniers mois” — interprété ici comme un solde ≥ 15 000€ sur chacun des relevés mensuels des 3 derniers mois.",
        },
      ],
      documents: [
        'Passeport (page état civil) + photo identité',
        'Justificatif de domicile (France) < 3 mois (+ titre de séjour si non-européen)',
        'Relevés bancaires officiels (3 derniers mois)',
        'Preuves selon motif: Workcation OU Soft power OU lien familial (dépendants)',
      ],
      eligibilityNotes: [
        'Workcation: contrat/attestation employeur + registre de commerce + dernière fiche de paie, OU portfolio pro (freelance/remote).',
        'Auto-entrepreneur: lettre FR+EN expliquant activité + source revenus + URL profil plateforme + SIRENE INSEE + facture <3 mois + preuve virement.',
        'Soft power: invitation/acceptation + ID signataire + registre/licence + preuve paiement (ou engagement hôpital + preuve paiement).',
      ],
    },
    fees: {
      visaFee: { amount: 350, currency: 'EUR', qualifier: 'fixed', note: 'Tarif Ambassade Paris (e-Visa).' },
    },
    benefits: [
      'Séjours longs (180j) renouvelables 1 fois sur place (extension).',
      'Multi-entrées sur 5 ans.',
      'Dépendants possibles (conjoint + enfants < 20 ans) via DTV lié.',
    ],
    restrictions: [
      'Pas de travail pour une entité thaïlandaise sans dispositif “work permit” approprié (hors scope DTV).',
    ],
    sources: [SOURCES.THAIEMB_FR_DTV, SOURCES.SVP_COMPARATOR_2026],
    jurisdictionOverlays: {
      // GLOBAL kept minimal: jurisdiction differences are frequent; prefer local embassy rules.
      GLOBAL: {
        fees: {
          notes: [
            'Les frais DTV varient selon la juridiction consulaire (devise locale). Se référer à l’ambassade/consulat compétent.',
          ],
        },
      },
      'FR-PARIS': {
        // already aligned with FR-Paris page; kept for explicitness
      },
    },
  },

  LTR: {
    id: 'LTR',
    name: 'Long Term Resident Visa (LTR)',
    shortDescription:
      'Programme 10 ans (renouvelable) pour profils “high-potential” (wealthy, pensioner, work-from-TH, highly-skilled) avec privilèges fiscaux/immigration.',
    tags: ['10-years', 'boi', 'digital-work-permit', 'fast-track', 'high-income'],
    targetAudience: [
      'Wealthy Global Citizens',
      'Wealthy Pensioners',
      'Work-from-Thailand Professionals',
      'Highly-skilled Professionals',
      'Conjoint + enfants < 20 ans (max 4 dépendants au total)',
    ],
    duration: {
      validityYears: 10,
      entries: 'multiple',
      reportingRule: 'Déclaration 90 jours étendue à 1 an (programme LTR).',
      notes: ['Issuance après endorsement BOI, puis e-Visa / Immigration (selon localisation).'],
    },
    requirements: {
      // High-level criteria (details remain category-specific; keep RAG-friendly summary).
      income: [
        {
          minAnnual: { amount: 80000, currency: 'USD', qualifier: 'min' },
          notes: 'Seuil récurrent dans plusieurs catégories (selon BOI/Ambassade).',
        },
      ],
      assets: [
        {
          min: { amount: 1000000, currency: 'USD', qualifier: 'min' },
          notes: 'Wealthy Global Citizen (actifs).',
        },
      ],
      investmentInThailand: [
        {
          min: { amount: 500000, currency: 'USD', qualifier: 'min' },
          notes: 'Wealthy Global Citizen (investissement en Thaïlande).',
        },
      ],
      documents: [
        'Passeport + photo + justificatif domicile',
        'Lettre de qualification BOI (endorsement) < 60 jours',
        'Dossier catégorie (revenus, employeur, expérience, assurances, etc.) selon BOI',
      ],
      eligibilityNotes: [
        'Process: 1) Qualification endorsement via BOI (LTR system) 2) Issuance via e-Visa/embassy ou immigration en Thaïlande dans les 60 jours.',
        'Work-from-Thailand (BOI): employeur étranger “well-established” (conditions de revenus combinés, ancienneté, etc.).',
      ],
    },
    fees: {
      visaFee: { amount: 1750, currency: 'EUR', qualifier: 'fixed', note: 'Tarif Ambassade Paris (e-Visa).' },
      processingFee: {
        amount: 50000,
        currency: 'THB',
        qualifier: 'fixed',
        note: 'Processing fee indiquée par BOI pour issuance en Thaïlande (TIESC).',
      },
      notes: ['Permis de travail numérique: frais indiqués par l’Ambassade = 3 000 THB/an (si applicable).'],
    },
    benefits: [
      'Visa 10 ans (renouvelable).',
      'Fast Track aéroports internationaux.',
      'Rapport 90 jours → 1 an + exemption de re-entry permit (programme LTR).',
      'Autorisation de travail via “digital work permit” (si applicable).',
      'Taux d’impôt personnel 17% pour Highly-skilled Professionals (programme).',
    ],
    restrictions: [
      'Critères financiers et documentaires stricts (catégories).',
      'Maintien des conditions pendant toute la durée du visa (programme).',
    ],
    sources: [SOURCES.THAIEMB_FR_LTR, SOURCES.BOI_LTR_HOME, SOURCES.BOI_LTR_ISSUANCE],
    jurisdictionOverlays: {
      GLOBAL: {
        fees: {
          notes: [
            'Les frais e-Visa/embassy varient selon juridiction; la processing fee BOI (50k THB) s’applique typiquement à l’issuance en Thaïlande.',
          ],
        },
      },
      'FR-PARIS': {},
    },
  },

  THAILAND_PRIVILEGE: {
    id: 'THAILAND_PRIVILEGE',
    name: 'Thailand Privilege (ex-Thailand Elite)',
    shortDescription:
      "Programme d’adhésion donnant accès à un visa long séjour (PE/SE) + services VIP; l’adhésion est payante, mais l’Ambassade indique “aucun frais de visa”.",
    tags: ['membership', 'vip', 'long-stay', 'pe', 'se'],
    targetAudience: ['Investisseurs', 'Familles', 'Personnes recherchant un parcours administratif simplifié'],
    duration: {
      validityText: 'Selon package: 5 / 10 / 15 / 20 ans (Reserve = invitation).',
      entries: 'multiple',
      notes: ['Visa lié au programme (PE/SE) — conditions et privilèges selon package.'],
    },
    requirements: {
      passportValidityMonthsMin: 6,
      documents: [
        'Passeport (page état civil) + photo',
        'Justificatif domicile (France) < 3 mois (+ titre de séjour si non-européen)',
        'Lettre de certification Thailand Privilege (TPC) — valable 90 jours (Ambassade)',
      ],
      eligibilityNotes: ['Le cœur du programme est l’adhésion payante (membership fee) + background check (process TPC).'],
    },
    fees: {
      membershipFees: [
        { tier: 'Bronze', fee: { amount: 650000, currency: 'THB', qualifier: 'fixed' }, validityYears: 5, pointsPerYear: 0 },
        { tier: 'Gold', fee: { amount: 900000, currency: 'THB', qualifier: 'fixed' }, validityYears: 5, pointsPerYear: 20 },
        { tier: 'Platinum', fee: { amount: 1500000, currency: 'THB', qualifier: 'fixed' }, validityYears: 10, pointsPerYear: 35 },
        { tier: 'Diamond', fee: { amount: 2500000, currency: 'THB', qualifier: 'fixed' }, validityYears: 15, pointsPerYear: 55 },
        { tier: 'Reserve (invitation)', fee: { amount: 5000000, currency: 'THB', qualifier: 'fixed' }, validityYears: 20, pointsPerYear: 120 },
      ],
      notes: ['Ambassade Paris: “Aucun frais de visa” (mais adhésion TPC payante).'],
    },
    benefits: ['Services VIP (aéroport, liaisons, etc.) selon package', 'Assistance (ex: ouverture compte bancaire) selon privilèges'],
    restrictions: [
      "Le droit au travail n’est pas automatique; dépend du cadre légal (hors scope du programme).",
      'Conditions et privilèges varient selon package et peuvent évoluer.',
    ],
    sources: [SOURCES.TPC_HOME, SOURCES.THAIEMB_FR_OTHER_PRIV],
    jurisdictionOverlays: {
      GLOBAL: {
        requirements: {
          eligibilityNotes: [
            'Les modalités “issuance”/documentation peuvent varier selon pays (e-Visa disponible ou non). Se référer au consulat compétent.',
          ],
        },
      },
      'FR-PARIS': {},
    },
    aliases: ['ELITE'],
  },

  RETIREMENT_OA: {
    id: 'RETIREMENT_OA',
    name: 'Visa Retraite — Non-Immigrant O-A (Long stay 1 year)',
    shortDescription: 'Visa retraite > 50 ans, 1 an multi-entrées, sans droit au travail.',
    tags: ['retirement', 'oa', '1-year', 'multi-entry'],
    targetAudience: ['Retraités (50 ans+) souhaitant un long séjour'],
    duration: {
      validityText: '1 an, multiples entrées (selon Ambassade Paris).',
      entries: 'multiple',
      reportingRule: 'Si séjour > 3 mois, présentation à l’immigration; (rappel Ambassade).',
      notes: ['Prolongation possible auprès de l’immigration en Thaïlande (selon Ambassade).'],
    },
    requirements: {
      ageMin: 50,
      passportValidityMonthsMin: 18,
      income: [
        { minMonthly: { amount: 2000, currency: 'EUR', qualifier: 'min' }, notes: 'Attestation retraite / bulletin de paie.' },
      ],
      bankBalance: [
        {
          min: { amount: 24000, currency: 'EUR', qualifier: 'min' },
          lookbackMonths: 3,
          mustBeMaintainedEachMonth: true,
          accountNotes: 'Compte non-bloqué.',
        },
      ],
      insurance: [
        {
          minCoverage: { amount: 100000, currency: 'USD', qualifier: 'min', note: 'ou 3 000 000 THB (équivalent indiqué).' },
          mustInclude: ['Traitement COVID-19'],
          notes: 'Valable 1 an à compter de la date d’arrivée en Thaïlande.',
        },
      ],
      documents: [
        'Passeport (validité ≥ 18 mois) + photo',
        'Justificatif de domicile (France) < 3 mois (+ titre de séjour si non-européen)',
        'Preuve revenus: ≥ 2 000 €/mois OU relevés bancaires: solde ≥ 24 000 € (3 derniers mois)',
        'Certificat médical (< 3 mois) — bonne santé / pas de maladie contagieuse',
        'Assurance + “Foreign Insurance Certificate” complété et tamponné',
        'Casier judiciaire vierge (pays d’origine + pays de résidence si applicable)',
      ],
    },
    fees: {
      visaFee: { amount: 175, currency: 'EUR', qualifier: 'fixed', note: 'Tarif Ambassade Paris (e-Visa).' },
    },
    benefits: ['Long séjour 1 an', 'Multi-entrées (selon Ambassade Paris)'],
    restrictions: ['Interdiction de travailler (selon Ambassade).'],
    sources: [SOURCES.THAIEMB_FR_OA],
    jurisdictionOverlays: {
      GLOBAL: {
        fees: { notes: ['Les frais et formulaires assurance peuvent varier selon juridiction consulaire.'] },
      },
      'FR-PARIS': {},
    },
    aliases: ['RETIREMENT'],
  },

  RETIREMENT_OX: {
    id: 'RETIREMENT_OX',
    name: 'Visa Retraite — Non-Immigrant O-X (Long stay 5+5 years)',
    shortDescription: 'Visa 10 ans max (5+5) pour ressortissants de pays listés, 50+, avec exigences financières élevées.',
    tags: ['retirement', 'ox', '10-years', '5+5', 'multi-entry'],
    targetAudience: ['Ressortissants des 14 pays éligibles (incl. France), âgés de 50+'],
    duration: {
      validityText: 'Maximum 10 ans (5 ans + prolongation 5 ans).',
      entries: 'multiple',
      reportingRule: 'Notification adresse tous les 90 jours + reporting annuel (rappel Ambassade).',
    },
    requirements: {
      ageMin: 50,
      passportValidityMonthsMin: 18,
      bankBalance: [
        {
          min: { amount: 3000000, currency: 'THB', qualifier: 'min' },
          lookbackMonths: 12,
          mustBeMaintainedEachMonth: true,
          accountNotes: 'Fixed deposit account en banque thaïlandaise, provisionné depuis au moins 1 an.',
          notes: 'Option A (selon Ambassade).',
        },
        {
          min: { amount: 1800000, currency: 'THB', qualifier: 'min' },
          lookbackMonths: 12,
          mustBeMaintainedEachMonth: true,
          accountNotes: 'Fixed deposit account en banque thaïlandaise, provisionné depuis au moins 1 an.',
          notes: 'Option B (avec revenus annuels) selon Ambassade.',
        },
      ],
      income: [{ minAnnual: { amount: 1200000, currency: 'THB', qualifier: 'min' }, notes: 'Requis si option B (1.8M THB).' }],
      insurance: [
        {
          minCoverage: { amount: 400000, currency: 'THB', qualifier: 'min', note: 'Hospitalisation (inpatient).' },
          notes: 'Outpatient: > 40 000 THB; assurance reconnue (BOI/OCI/longstay.tgia.org selon page Ambassade).',
        },
      ],
      documents: [
        'Passeport (validité ≥ 18 mois) + photo',
        'Justificatif de domicile (France) < 3 mois (+ titre de séjour si non-européen)',
        'Preuve financière (fixed deposit) selon option A/B + preuve revenus si option B',
        'Certificat médical (< 3 mois) (maladies listées dans la page Ambassade)',
        'Assurance + formulaires/attestations requis',
        'Casier judiciaire vierge (pays d’origine + pays de résidence si applicable)',
        'CV',
      ],
      eligibilityNotes: [
        'Éligible uniquement pour une liste de 14 pays (incluant France, Allemagne, UK, USA, etc.) selon page Ambassade.',
        'Des contraintes de maintien de soldes et des contrôles existent (notamment à 1 an / 2 ans) selon page Ambassade.',
      ],
    },
    fees: {
      visaFee: { amount: 350, currency: 'EUR', qualifier: 'fixed', note: 'Tarif Ambassade Paris (e-Visa).' },
      notes: ['La page mentionne aussi 10 000 THB (ou équivalent) comme référence “hors Thaïlande”; le tarif France affiché est 350 € (source Ambassade).'],
    },
    benefits: [
      'Séjour long jusqu’à 10 ans (5+5).',
      'Avantages listés par l’Ambassade (ex: certaines activités bénévoles, etc.)',
    ],
    restrictions: [
      'Exigences financières élevées (dépôts importants en Thaïlande).',
      'Travail sans permis interdit; statut peut être retiré si conditions non maintenues (page Ambassade).',
    ],
    sources: [SOURCES.THAIEMB_FR_OX],
    jurisdictionOverlays: {
      GLOBAL: {
        fees: { notes: ['Vérifier le montant exact des frais dans votre juridiction; l’équivalent local peut varier.'] },
      },
      'FR-PARIS': {},
    },
  },

  // --- Backward-compatible aliases (do not use for new logic) ---
  ELITE: {
    // Alias to THAILAND_PRIVILEGE
    ...(null as unknown as VisaKnowledgeItem),
    id: 'ELITE',
    name: 'Thailand Privilege (alias ELITE)',
    shortDescription: 'Alias technique — utiliser THAILAND_PRIVILEGE.',
    tags: ['alias'],
    targetAudience: [],
    duration: {},
    requirements: {},
    fees: {},
    benefits: [],
    restrictions: [],
    sources: [SOURCES.TPC_HOME],
  },
  RETIREMENT: {
    // Alias to RETIREMENT_OA
    ...(null as unknown as VisaKnowledgeItem),
    id: 'RETIREMENT',
    name: 'Visa Retraite (alias RETIREMENT)',
    shortDescription: 'Alias technique — utiliser RETIREMENT_OA ou RETIREMENT_OX.',
    tags: ['alias'],
    targetAudience: [],
    duration: {},
    requirements: {},
    fees: {},
    benefits: [],
    restrictions: [],
    sources: [SOURCES.THAIEMB_FR_OA],
  },
};

function deepMerge<T>(base: T, overlay?: Partial<T>): T {
  if (!overlay) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const [k, v] of Object.entries(overlay)) {
    if (v === undefined) continue;
    const bv = (out as any)[k];
    if (Array.isArray(bv) && Array.isArray(v)) (out as any)[k] = v;
    else if (typeof bv === 'object' && bv && typeof v === 'object' && !Array.isArray(v)) (out as any)[k] = deepMerge(bv, v as any);
    else (out as any)[k] = v;
  }
  return out;
}

export function resolveVisa(visaId: string, jurisdiction: Jurisdiction = 'GLOBAL'): VisaKnowledgeItem | null {
  const item = VISA_DATA[visaId];
  if (!item) return null;

  // Aliases redirect
  if (visaId === 'ELITE') return resolveVisa('THAILAND_PRIVILEGE', jurisdiction);
  if (visaId === 'RETIREMENT') return resolveVisa('RETIREMENT_OA', jurisdiction);

  const overlay = item.jurisdictionOverlays?.[jurisdiction];
  return overlay ? deepMerge(item, overlay) : item;
}

export function buildRagText(v: VisaKnowledgeItem, jurisdiction: Jurisdiction): string {
  const lines: string[] = [];
  lines.push(`# ${v.name}`);
  lines.push(`Juridiction: ${jurisdiction}`);
  lines.push(`Résumé: ${v.shortDescription}`);
  if (v.duration.validityYears || v.duration.validityText) {
    lines.push(`## Durée / Entrées`);
    if (v.duration.validityYears) lines.push(`- Validité: ${v.duration.validityYears} ans`);
    if (v.duration.validityText) lines.push(`- Validité: ${v.duration.validityText}`);
    if (v.duration.entries) lines.push(`- Entrées: ${v.duration.entries}`);
    if (v.duration.stayPerEntryDays) lines.push(`- Séjour par entrée: ${v.duration.stayPerEntryDays} jours`);
    if (v.duration.extensionDays) lines.push(`- Extension: +${v.duration.extensionDays} jours (si applicable)`);
    if (v.duration.reportingRule) lines.push(`- Reporting: ${v.duration.reportingRule}`);
    if (v.duration.notes?.length) v.duration.notes.forEach(n => lines.push(`- Note: ${n}`));
  }

  lines.push(`## Public cible`);
  v.targetAudience.forEach(a => lines.push(`- ${a}`));

  lines.push(`## Exigences (high-signal)`);
  if (v.requirements.ageMin) lines.push(`- Âge minimum: ${v.requirements.ageMin}+`);
  if (v.requirements.passportValidityMonthsMin) lines.push(`- Passeport: validité ≥ ${v.requirements.passportValidityMonthsMin} mois`);
  v.requirements.bankBalance?.forEach(b => {
    const eachMonth = b.mustBeMaintainedEachMonth ? ' (à maintenir sur chaque relevé)' : '';
    const lb = b.lookbackMonths ? ` sur ${b.lookbackMonths} mois` : '';
    lines.push(`- Banque: solde ≥ ${b.min.amount} ${b.min.currency}${lb}${eachMonth}. ${b.accountNotes ?? ''} ${b.notes ?? ''}`.trim());
  });
  v.requirements.income?.forEach(i => {
    if (i.minMonthly) lines.push(`- Revenu: ≥ ${i.minMonthly.amount} ${i.minMonthly.currency} / mois. ${i.notes ?? ''}`.trim());
    if (i.minAnnual) lines.push(`- Revenu: ≥ ${i.minAnnual.amount} ${i.minAnnual.currency} / an. ${i.notes ?? ''}`.trim());
  });
  v.requirements.assets?.forEach(a => lines.push(`- Actifs: ≥ ${a.min.amount} ${a.min.currency}. ${a.notes ?? ''}`.trim()));
  v.requirements.investmentInThailand?.forEach(inv =>
    lines.push(`- Investissement TH: ≥ ${inv.min.amount} ${inv.min.currency}. ${inv.notes ?? ''}`.trim()),
  );
  v.requirements.insurance?.forEach(ins => {
    const incl = ins.mustInclude?.length ? ` Inclut: ${ins.mustInclude.join(', ')}.` : '';
    lines.push(`- Assurance: couverture ≥ ${ins.minCoverage?.amount} ${ins.minCoverage?.currency}.${incl} ${ins.notes ?? ''}`.trim());
  });

  if (v.requirements.documents?.length) {
    lines.push(`## Documents (checklist)`);
    v.requirements.documents.forEach(d => lines.push(`- ${d}`));
  }
  if (v.requirements.eligibilityNotes?.length) {
    lines.push(`## Notes d’éligibilité`);
    v.requirements.eligibilityNotes.forEach(n => lines.push(`- ${n}`));
  }

  lines.push(`## Frais`);
  if (v.fees.visaFee) lines.push(`- Visa fee: ${v.fees.visaFee.amount} ${v.fees.visaFee.currency} (${v.fees.visaFee.note ?? ''})`.trim());
  if (v.fees.processingFee)
    lines.push(`- Processing fee: ${v.fees.processingFee.amount} ${v.fees.processingFee.currency} (${v.fees.processingFee.note ?? ''})`.trim());
  if (v.fees.membershipFees?.length) {
    lines.push(`- Membership fees:`);
    v.fees.membershipFees.forEach(m => {
      lines.push(
        `  - ${m.tier}: ${m.fee.amount} ${m.fee.currency} / ${m.validityYears} ans${m.pointsPerYear !== undefined ? ` (${m.pointsPerYear} points/an)` : ''
        }`,
      );
    });
  }
  v.fees.notes?.forEach(n => lines.push(`- Note: ${n}`));

  if (v.benefits.length) {
    lines.push(`## Avantages`);
    v.benefits.forEach(b => lines.push(`- ${b}`));
  }
  if (v.restrictions.length) {
    lines.push(`## Restrictions`);
    v.restrictions.forEach(r => lines.push(`- ${r}`));
  }

  lines.push(`## Sources`);
  v.sources.forEach(s => lines.push(`- ${s.publisher} (${s.extractedAt}) — ${s.url}`));
  return lines.join('\n');
}

export function getKnowledgeContext(visaId?: string, opts?: { jurisdiction?: Jurisdiction; format?: 'json' | 'md' }) {
  const jurisdiction = opts?.jurisdiction ?? 'GLOBAL';
  const format = opts?.format ?? 'json';

  if (visaId) {
    const v = resolveVisa(visaId, jurisdiction);
    if (!v) return format === 'md' ? `Visa inconnu: ${visaId}` : JSON.stringify({ error: 'unknown_visa', visaId }, null, 2);
    return format === 'md' ? buildRagText(v, jurisdiction) : JSON.stringify(v, null, 2);
  }

  const all = Object.keys(VISA_DATA)
    .filter(k => !['ELITE', 'RETIREMENT'].includes(k)) // hide pure aliases by default
    .map(k => resolveVisa(k, jurisdiction))
    .filter(Boolean) as VisaKnowledgeItem[];

  return format === 'md'
    ? all.map(v => buildRagText(v, jurisdiction)).join('\n\n---\n\n')
    : JSON.stringify(all, null, 2);
}

/**
 * Optional helper for embeddings / RAG indexing.
 * Produces stable chunks with metadata.
 */
export interface RagChunk {
  id: string;
  title: string;
  text: string;
  metadata: Record<string, string | number | boolean>;
}

export function getRagChunks(visaId?: string, opts?: { jurisdiction?: Jurisdiction; maxChars?: number }): RagChunk[] {
  const jurisdiction = opts?.jurisdiction ?? 'GLOBAL';
  const maxChars = Math.max(600, opts?.maxChars ?? 1200);

  const ids = visaId
    ? [visaId]
    : Object.keys(VISA_DATA).filter(k => !['ELITE', 'RETIREMENT'].includes(k));

  const chunks: RagChunk[] = [];
  for (const id of ids) {
    const v = resolveVisa(id, jurisdiction);
    if (!v) continue;
    const full = buildRagText(v, jurisdiction);

    // naive chunking by paragraphs; stable enough for small corpora
    const parts = full.split('\n## ').map((p, idx) => (idx === 0 ? p : '## ' + p));
    let buf = '';
    let partIndex = 0;

    const flush = () => {
      const text = buf.trim();
      if (!text) return;
      chunks.push({
        id: `${v.id}:${jurisdiction}:${partIndex}`,
        title: `${v.name} — ${jurisdiction}`,
        text,
        metadata: {
          visaId: v.id,
          jurisdiction,
          extractedAt: Math.max(...v.sources.map(s => Date.parse(s.extractedAt))),
        },
      });
      partIndex += 1;
      buf = '';
    };

    for (const p of parts) {
      if ((buf + '\n\n' + p).length > maxChars) flush();
      buf += (buf ? '\n\n' : '') + p;
    }
    flush();
  }
  return chunks;
}
