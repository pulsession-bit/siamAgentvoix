import os
import re
import json

locales_dir = "/Users/raphael/Sites/Siam Visa Production v1/src/locales"

data = {
    "meta": {
        "title": "Thailand Visa Services & Pricing | Siam Visa Pro",
        "description": "Complete file preparation + embassy submission. Standard, Express 48h, and Premium packages. Complete expertise for your peace of mind."
    },
    "hero_title": "Our Services & Pricing",
    "hero_subtitle": "Complete file preparation + embassy submission",
    "hero_tagline": "We are not the embassy, we are your allies.",
    "hero_tagline_secondary": "Complete expertise for your peace of mind in Thailand.",
    "custom_support_title": "Need tailor-made support?",
    "custom_support_desc": "Our experts are available to analyze your specific file and propose the best expatriation strategy.",
    "custom_support_btn": "Talk to an expert",
    "tier_standard": "Standard",
    "tier_standard_desc": "Complete file + embassy submission",
    "tier_standard_price": "390 €",
    "tier_express": "Express 48h",
    "tier_express_desc": "Complete file + urgent embassy submission",
    "tier_express_price": "590 €",
    "tier_premium": "Premium",
    "tier_premium_desc": "Complete file + embassy submission + enhanced follow-up",
    "tier_premium_price": "890 €",
    "btn_start": "Start your application",
    "recommended": "Recommended",
    "insurance_title": "Need travel insurance?",
    "insurance_desc": "Health insurance covering 100,000 USD may be required (depending on the visa).",
    "insurance_link": "See our insurance partners",
    "pack_feat1": "Eligibility check + personalized checklist",
    "pack_feat2": "Form preparation/completion",
    "pack_feat3": "Document review & compliance (passport, photos, financial proof...)",
    "pack_feat4": "Final file assembly ('embassy-ready' version)",
    "pack_feat5": "Embassy/consulate submission + tracking until passport return",
    "admin_fees_title": "Administrative fees",
    "admin_fees_subtitle": "Paid directly to the embassy/consulate",
    "admin_fees_visa": "Visa fees (varies by visa type + submission country): from 35 € up to several hundred €",
    "admin_fees_center": "Possible visa center / service provider / courier fees: depends on the office",
    "options_title": "Additional options",
    "option_traduction": "Certified translations",
    "option_traduction_price": "39–89 € / document",
    "option_legalisation": "Legalization / apostille",
    "option_legalisation_price": "49–129 € / document (excluding official fees)",
    "option_assurance": "Compliant travel insurance (referral)",
    "option_assurance_price": "0 € (you pay the insurer directly)",
    "option_rdv": "Time slot / appointment / submission trip",
    "option_rdv_price": "49–149 €",
    "option_suivi": "Post-submission tracking & follow-ups",
    "option_suivi_price": "Included in Premium, otherwise 49 €",
    "included_title": "What is included in each pack",
    "conditions_title": "Conditions",
    "condition1": "Embassy fees are always extra (and non-refundable).",
    "condition2": "If the embassy requires the applicant's presence: 'assisted' submission (we accompany you) instead of 'represented' submission."
}

file_path = os.path.join(locales_dir, "en.ts")

if os.path.exists(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()
    
    services_page_content = ',\\n  "services_page": ' + json.dumps(data, indent=4, ensure_ascii=False)
    
    if '"services_page"' in content:
         import re
         content = re.sub(r'(?m)^\s*"services_page"\s*:\s*\{[\s\S]*?(?<=\w)\},\s*$', '', content, flags=re.MULTILINE)
         content = re.sub(r'(?m)^\s*"services_page"\s*:\s*\{[\s\S]*?(?<=\w)\}\s*$', '', content, flags=re.MULTILINE)

    last_brace_index = content.rfind('}')
    if last_brace_index != -1:
        content = content[:last_brace_index] + services_page_content + '\n' + content[last_brace_index:]
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)
        print(f"Patched {file_path}")
