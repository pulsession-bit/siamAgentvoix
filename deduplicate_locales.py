import os
import re

locales_dir = "/Users/raphael/Sites/Siam Visa Production v1/src/locales"

def get_matching_brace(content, start_index):
    count = 0
    for i in range(start_index, len(content)):
        if content[i] == '{':
            count += 1
        elif content[i] == '}':
            count -= 1
            if count == 0:
                return i
    return -1

for file_name in os.listdir(locales_dir):
    if not (file_name.endswith(".ts") and file_name != "index.ts"):
        continue
    
    file_path = os.path.join(locales_dir, file_name)
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = r'"services_page"\s*:\s*\{'
    matches = list(re.finditer(pattern, content))
    
    if len(matches) > 1:
        print(f"Deduplicating {file_name} ({len(matches)} occurrences)")
        
        # We want to remove the first occurrence.
        # It usually starts at matches[0].start()
        start_idx = matches[0].start()
        
        # Find the matching closing brace starting from the { after "services_page":
        brace_start = content.find('{', start_idx)
        end_idx = get_matching_brace(content, brace_start)
        
        if end_idx != -1:
            # We also want to remove a possible trailing comma and whitespace
            after_block = content[end_idx+1:]
            comma_match = re.match(r'^\s*,', after_block)
            if comma_match:
                end_idx += len(comma_match.group(0))
            
            # Optionally remove leading whitespace/newlines before the block
            # (but be careful not to break the previous property)
            
            new_content = content[:start_idx] + content[end_idx+1:]
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"  Removed first occurrence.")
        else:
            print(f"  Error: Could not find matching brace for first occurrence in {file_name}")

