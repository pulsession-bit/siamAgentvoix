import os
import re

locales_dir = "/Users/raphael/Sites/Siam Visa Production v1/src/locales"

for file_name in os.listdir(locales_dir):
    if not file_name.endswith(".ts"):
        continue
    
    file_path = os.path.join(locales_dir, file_name)
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # The error is that we inserted it as `},\n  "services_page": {`
    # BUT with an actual backslash n: `,\n  "services_page": {` text instead of a real newline
    # because of the way python escaped it in my previous shell script.
    
    # We want to replace the exact literal string `,\n  "services_page": {`
    # and we also have duplicate "services_page" keys in some files due to the double run!
    
    # First, let's look for duplicate "services_page" keys at the top level
    
    # But wait, looking at the grep, it looks like it's literally: `,\n  "services_page": {` in the file.
    
    # Let's fix the literal string issue
    content = content.replace(',\\n  "services_page": {', ',\n  "services_page": {')
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Fixed {file_name}")

