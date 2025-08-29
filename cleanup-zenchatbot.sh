#!/bin/bash

# Script to remove ZenChatbot imports and component usage from all pages
# since we're now using it universally in the Providers component

# Files to update
FILES=(
    "/media/vane/Movies/Atharva/zenith/src/app/page.tsx"
    "/media/vane/Movies/Atharva/zenith/src/app/management/page.tsx"
    "/media/vane/Movies/Atharva/zenith/src/app/founding-team/page.tsx"
    "/media/vane/Movies/Atharva/zenith/src/app/events/page.tsx"
    "/media/vane/Movies/Atharva/zenith/src/app/dashboard/page.tsx"
    "/media/vane/Movies/Atharva/zenith/src/app/homeclub/[clubId]/page.tsx"
    "/media/vane/Movies/Atharva/zenith/src/app/calendar/page.tsx"
    "/media/vane/Movies/Atharva/zenith/src/app/clubs/page.tsx"
    "/media/vane/Movies/Atharva/zenith/src/app/clubs/[clubId]/page.tsx"
    "/media/vane/Movies/Atharva/zenith/src/app/clubs/[clubId]/posts/[postId]/page.tsx"
)

# Remove imports and component usage
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Remove import statement
        sed -i "/import ZenChatbot from/d" "$file"
        
        # Remove component usage
        sed -i "/<ZenChatbot \/>/d" "$file"
        
        echo "Updated $file"
    else
        echo "File not found: $file"
    fi
done

echo "ZenChatbot cleanup completed!"
