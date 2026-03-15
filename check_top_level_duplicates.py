import os
import re

locales_dir = "/Users/raphael/Sites/Siam Visa Production v1/src/locales"

def check_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Look for keys at level 1 (inside the main export const object)
    # These keys are usually indented by 2 or 4 spaces depending on formatting.
    # In ar.ts it looked like 2 spaces.
    pattern = r'^  "([^"]+)"\s*:'
    keys = []
    for line in content.split('\n'):
        match = re.search(pattern, line)
        if match:
            keys.append(match.group(1))
    
    seen = {}
    dupes = []
    for k in keys:
        if k in seen:
            dupes.append(k)
        seen[k] = True
    return dupes

for file_name in os.listdir(locales_dir):
    if file_name.endswith(".ts") and file_name != "index.ts":
        dupes = check_file(os.path.join(locales_dir, file_name))
        if dupes:
            print(f"{file_name} has duplicate TOP LEVEL keys: {dupes}")
        else:
            print(f"{file_name} top level is clean.")

