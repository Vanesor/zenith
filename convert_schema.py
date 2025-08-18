# Script to convert our schema to proper camelCase fields
# This will modify the schema.prisma file directly

import os
import re

# Function to convert snake_case to camelCase
def snake_to_camel(text):
    return re.sub(r'_([a-z])', lambda m: m.group(1).upper(), text)

# Path to schema file
schema_path = os.path.join('prisma', 'schema.prisma')
backup_path = os.path.join('prisma', 'schema.prisma.backup')

# Create backup
with open(schema_path, 'r') as file:
    original_content = file.read()

with open(backup_path, 'w') as file:
    file.write(original_content)

print(f"Backup created at {backup_path}")

# Process the file line by line
output_lines = []
in_model = False
model_name = ""
skip_next_line = False

with open(schema_path, 'r') as file:
    lines = file.readlines()

line_index = 0
while line_index < len(lines):
    line = lines[line_index]
    
    # Detect model start
    if line.strip().startswith('model '):
        in_model = True
        model_name = line.strip().split()[1]
        output_lines.append(line)
        print(f"Processing model: {model_name}")
    
    # Detect model end
    elif line.strip() == '}' and in_model:
        in_model = False
        output_lines.append(line)
    
    # Process field inside model
    elif in_model:
        # Skip comment lines, indexes, etc.
        if line.strip().startswith('//') or line.strip().startswith('@') or line.strip().startswith('@@'):
            output_lines.append(line)
            continue
        
        # Check if it's a field definition line (has a type declaration)
        field_match = re.match(r'^\s+(\w+)(\s+)(\w+.*?)(\s*)$', line.strip())
        if field_match:
            field_name = field_match.group(1)
            spacing = field_match.group(2)
            field_type_and_attrs = field_match.group(3)
            end_spacing = field_match.group(4)
            
            # Skip ID fields
            if field_name == 'id':
                output_lines.append(line)
                continue
                
            # Convert snake_case to camelCase
            if '_' in field_name:
                camel_case_name = snake_to_camel(field_name)
                
                # Check if @map already exists
                if '@map(' not in field_type_and_attrs:
                    # Add @map attribute to preserve the original field name
                    new_line = f"  {camel_case_name}{spacing}{field_type_and_attrs} @map(\"{field_name}\"){end_spacing}\n"
                    output_lines.append(new_line)
                else:
                    # Keep existing @map attribute
                    output_lines.append(line)
            else:
                # For common fields like created_at and updated_at that might not follow snake_case pattern
                if field_name == 'created_at' and '@map(' not in field_type_and_attrs:
                    new_line = f"  createdAt{spacing}{field_type_and_attrs} @map(\"created_at\"){end_spacing}\n"
                    output_lines.append(new_line)
                elif field_name == 'updated_at' and '@map(' not in field_type_and_attrs:
                    new_line = f"  updatedAt{spacing}{field_type_and_attrs} @map(\"updated_at\"){end_spacing}\n"
                    output_lines.append(new_line)
                else:
                    output_lines.append(line)
        else:
            output_lines.append(line)
    
    # Lines outside model definitions
    else:
        output_lines.append(line)
    
    line_index += 1

# Write updated content back to file
with open(schema_path, 'w') as file:
    file.writelines(output_lines)

print("Schema conversion completed!")
print("Run 'npx prisma generate' to apply changes.")
