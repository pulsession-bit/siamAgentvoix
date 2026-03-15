import os
import json
import re

locales_dir = "/Users/raphael/Sites/Siam Visa Production v1/src/locales"

translations = {
    "fr": { "nav_free_audit": "Audit Gratuit IA", "solutions_badge": "● NOS SOLUTIONS" },
    "en": { "nav_free_audit": "Free AI Audit", "solutions_badge": "● OUR SOLUTIONS" },
    "es": { "nav_free_audit": "Auditoría IA Gratuita", "solutions_badge": "● NUESTRAS SOLUCIONES" },
    "it": { "nav_free_audit": "Audit IA Gratuito", "solutions_badge": "● LE NOSTRE SOLUZIONI" },
    "de": { "nav_free_audit": "Kostenloses KI-Audit", "solutions_badge": "● UNSERE LÖSUNGEN" },
    "ru": { "nav_free_audit": "Бесплатный ИИ-Аудит", "solutions_badge": "● НАШИ РЕШЕНИЯ" },
    "th": { "nav_free_audit": "ตรวจสอบด้วย AI ฟรี", "solutions_badge": "● โซลูชันของเรา" },
    "zh": { "nav_free_audit": "免费 AI 审计", "solutions_badge": "● 我们的解决方案" },
    "ar": { "nav_free_audit": "تدقيق ذكاء اصطناعي مجاني", "solutions_badge": "● حلولنا" },
    "ja": { "nav_free_audit": "無料 AI 監査", "solutions_badge": "● 当社のソリューション" },
    "ko": { "nav_free_audit": "무료 AI 진단", "solutions_badge": "● 당사의 솔루션" }
}

for lang, data in translations.items():
    file_path = os.path.join(locales_dir, f"{lang}.ts")
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update nav section with free_audit
    if '"free_audit"' not in content:
        # find the end of the "nav": { block.
        # A simple string replace since we know "languages": "..." or similar is there
        # We will just replace `"languages":` with `"free_audit": "VALUE",\n    "languages":`
        content = re.sub(r'("languages"\s*:)', f'"free_audit": "{data["nav_free_audit"]}",\\n    \\1', content)

    # 2. Update services_page with solutions_badge
    if '"solutions_badge"' not in content:
        # We'll just insert it right after "services_page": {
        content = re.sub(r'("services_page"\s*:\s*\{)', f'\\1\\n    "solutions_badge": "{data["solutions_badge"]}",', content)
        
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {lang}.ts")

