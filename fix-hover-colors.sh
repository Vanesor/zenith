#!/bin/bash
# Fix hover colors to align with zenith theme

echo "🎨 Fixing hover colors throughout the application..."

# Fix hover colors that don't use zenith theme
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:bg-blue-50/hover:bg-zenith-hover/g'
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:bg-blue-100/hover:bg-zenith-hover/g'
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:bg-gray-50/hover:bg-zenith-hover/g'
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:bg-gray-100/hover:bg-zenith-hover/g'

# Fix text hover colors
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:text-blue-700/hover:text-zenith-primary\/90/g'
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:text-blue-800/hover:text-zenith-primary\/90/g'
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:text-gray-700/hover:text-zenith-secondary/g'
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:text-gray-600/hover:text-zenith-secondary/g'

# Fix border hover colors
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:border-blue-300/hover:border-zenith-primary/g'
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:border-gray-300/hover:border-zenith-border/g'

# Fix button specific hovers
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:bg-indigo-700/hover:bg-zenith-primary\/90/g'
find src -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/hover:bg-purple-700/hover:bg-zenith-secondary\/90/g'

echo "✅ Hover colors updated to use zenith theme!"

# Count remaining non-zenith hover patterns
echo "📊 Remaining non-zenith hover patterns:"
grep -r "hover:bg-\(blue\|gray\|indigo\|purple\)-" src --include="*.tsx" --include="*.jsx" | grep -v zenith | wc -l
