with open('/Users/raphael/Sites/test/copy-of-siam-visa-pro---audit-ai/constants.ts', 'r') as f:
    text = f.read()

text = text.replace("""Pour proposer un appel :
```json
{
  "action": "request_call",
  "payload": {
    "reason": "case_complexity",
    "visaType": "Nom du Visa",
    "userStage": "audit",
    "notes": "Résumé situation"
  }
}
```""", "")

with open('/Users/raphael/Sites/test/copy-of-siam-visa-pro---audit-ai/constants.ts', 'w') as f:
    f.write(text)
