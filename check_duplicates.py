import os
import re
import json

locales_dir = "/Users/raphael/Sites/Siam Visa Production v1/src/locales"

def check_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # This is a bit naive but should work for top-level keys
    # assuming they are like "key": { or "key": "value"
    pattern = r'^\s*"([^"]+)"\s*:'
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
            print(f"{file_name} has duplicate keys: {dupes}")
        else:
            print(f"{file_name} is clean.")

