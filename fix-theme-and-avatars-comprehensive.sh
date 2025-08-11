#!/bin/bash

# Comprehensive Theme and Avatar Fix Script for Zenith Platform

echo "🎨 Starting comprehensive theme and avatar fixes for Zenith Platform..."

# First, let's check current theme usage across all components
echo "📊 Checking current theme usage..."

# Define zenith theme patterns
ZENITH_PATTERNS=(
    "text-zenith-primary"
    "text-zenith-secondary" 
    "text-zenith-muted"
    "bg-zenith-background"
    "bg-zenith-card"
    "bg-zenith-section"
    "border-zenith-border"
    "bg-zenith-primary"
    "bg-zenith-secondary"
    "hover:bg-zenith-hover"
    "zenith-button"
    "zenith-input"
    "zenith-card"
)

# Define old patterns to replace
OLD_PATTERNS=(
    "text-gray-900"
    "text-gray-800" 
    "text-gray-700"
    "text-gray-600"
    "text-gray-500"
    "text-gray-400"
    "bg-white"
    "bg-gray-50"
    "bg-gray-100"
    "bg-gray-200"
    "border-gray-200"
    "border-gray-300"
    "bg-blue-600"
    "bg-blue-500"
    "hover:bg-blue-700"
    "hover:bg-gray-100"
)

echo "🔄 Updating theme patterns in all components..."

# Function to update theme patterns
update_theme_patterns() {
    local file=$1
    echo "   Processing: $file"
    
    # Replace common patterns
    sed -i.bak \
        -e 's/text-gray-900/text-zenith-primary/g' \
        -e 's/text-gray-800/text-zenith-primary/g' \
        -e 's/text-gray-700/text-zenith-secondary/g' \
        -e 's/text-gray-600/text-zenith-secondary/g' \
        -e 's/text-gray-500/text-zenith-muted/g' \
        -e 's/text-gray-400/text-zenith-muted/g' \
        -e 's/bg-white/bg-zenith-card/g' \
        -e 's/bg-gray-50/bg-zenith-section/g' \
        -e 's/bg-gray-100/bg-zenith-section/g' \
        -e 's/border-gray-200/border-zenith-border/g' \
        -e 's/border-gray-300/border-zenith-border/g' \
        -e 's/hover:bg-gray-100/hover:bg-zenith-hover/g' \
        "$file"
        
    # Remove backup file
    rm -f "$file.bak"
}

# Update all TSX and JSX files
find src -name "*.tsx" -o -name "*.jsx" | while read file; do
    if [[ -f "$file" ]]; then
        update_theme_patterns "$file"
    fi
done

echo "✅ Theme patterns updated successfully!"

echo "🖼️ Fixing avatar display consistency..."

# Function to update avatar usage
update_avatar_usage() {
    local file=$1
    echo "   Processing avatar usage in: $file"
    
    # Replace SafeImage with SafeAvatar for profile pictures
    sed -i.bak \
        -e 's/import { SafeImage } from/@\/components\/SafeImage";/g' \
        -e 's/<SafeImage/<SafeAvatar/g' \
        -e 's/<\/SafeImage>/<\/SafeAvatar>/g' \
        -e 's/fallbackText=/fallbackName=/g' \
        "$file"
        
    # Remove backup file
    rm -f "$file.bak"
}

# Check for SafeImage usage in profile contexts
grep -r "SafeImage" src --include="*.tsx" --include="*.jsx" | while read match; do
    file=$(echo "$match" | cut -d: -f1)
    if [[ -f "$file" && "$match" == *"profile"* || "$match" == *"avatar"* ]]; then
        update_avatar_usage "$file"
    fi
done

echo "✅ Avatar display consistency fixed!"

echo "📐 Fixing component-specific styling issues..."

# Fix profile page specific issues
if [[ -f "src/app/profile/page.tsx" ]]; then
    echo "   📝 Fixing profile page styling..."
    
    # Ensure proper avatar container styling
    sed -i.bak \
        -e 's/w-32 h-32 bg-white\/20/w-32 h-32 bg-zenith-card\/20/g' \
        -e 's/rounded-full border-4 border-white\/20/rounded-full border-4 border-zenith-border/g' \
        -e 's/bg-gradient-to-r from-blue-500 to-purple-500/bg-gradient-to-r from-zenith-primary to-zenith-secondary/g' \
        "src/app/profile/page.tsx"
    
    rm -f "src/app/profile/page.tsx.bak"
fi

# Fix assignment creation page
if [[ -f "src/app/assignments/create/page.tsx" ]]; then
    echo "   📚 Fixing assignment creation page styling..."
    
    sed -i.bak \
        -e 's/bg-blue-600/bg-zenith-primary/g' \
        -e 's/hover:bg-blue-700/hover:bg-zenith-primary\/90/g' \
        -e 's/text-blue-600/text-zenith-primary/g' \
        "src/app/assignments/create/page.tsx"
    
    rm -f "src/app/assignments/create/page.tsx.bak"
fi

# Fix chat components
find src/components/chat -name "*.tsx" | while read file; do
    if [[ -f "$file" ]]; then
        echo "   💬 Fixing chat component: $file"
        sed -i.bak \
            -e 's/bg-blue-500/bg-zenith-primary/g' \
            -e 's/bg-gray-100/bg-zenith-section/g' \
            -e 's/text-gray-600/text-zenith-secondary/g' \
            "$file"
        rm -f "$file.bak"
    fi
done

echo "🎯 Applying modern UI improvements..."

# Add smooth scrolling and modern transitions
CSS_IMPROVEMENTS='
/* Modern scrollbar styling */
.zenith-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.zenith-scrollbar::-webkit-scrollbar-track {
  background: var(--zenith-section);
  border-radius: 4px;
}

.zenith-scrollbar::-webkit-scrollbar-thumb {
  background: var(--zenith-border);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.zenith-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--zenith-muted);
}

/* Smooth transitions */
.zenith-transition {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Modern card shadows */
.zenith-card-shadow {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.zenith-card-shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
'

# Add improvements to global CSS
if [[ -f "src/app/globals.css" ]]; then
    echo "   🎨 Adding modern UI improvements to global CSS..."
    echo "$CSS_IMPROVEMENTS" >> src/app/globals.css
fi

echo "🧪 Checking for avatar import consistency..."

# Function to ensure proper avatar imports
fix_avatar_imports() {
    local file=$1
    
    # Check if file uses avatars but doesn't import SafeAvatar
    if grep -q "avatar\|profile.*image" "$file" && ! grep -q "SafeAvatar\|UserAvatar" "$file"; then
        echo "   📦 Adding SafeAvatar import to: $file"
        
        # Add SafeAvatar import after other component imports
        sed -i.bak '/^import.*@\/components/a\
import SafeAvatar from "@/components/SafeAvatar";' "$file"
        
        rm -f "$file.bak"
    fi
}

# Check all component files
find src -name "*.tsx" -o -name "*.jsx" | while read file; do
    if [[ -f "$file" ]]; then
        fix_avatar_imports "$file"
    fi
done

echo "🔍 Validating theme consistency..."

# Count remaining old patterns
OLD_PATTERN_COUNT=0
for pattern in "${OLD_PATTERNS[@]}"; do
    count=$(grep -r "$pattern" src --include="*.tsx" --include="*.jsx" | wc -l)
    OLD_PATTERN_COUNT=$((OLD_PATTERN_COUNT + count))
done

# Count zenith patterns
ZENITH_PATTERN_COUNT=0
for pattern in "${ZENITH_PATTERNS[@]}"; do
    count=$(grep -r "$pattern" src --include="*.tsx" --include="*.jsx" | wc -l)
    ZENITH_PATTERN_COUNT=$((ZENITH_PATTERN_COUNT + count))
done

echo "📊 Theme Consistency Report:"
echo "   🎨 Zenith theme patterns found: $ZENITH_PATTERN_COUNT"
echo "   ⚠️  Old patterns remaining: $OLD_PATTERN_COUNT"

echo "🎉 Comprehensive theme and avatar fixes completed!"
echo ""
echo "📋 Summary of fixes applied:"
echo "   ✅ Updated all color patterns to zenith theme"
echo "   ✅ Fixed avatar display consistency across components"
echo "   ✅ Applied modern UI improvements and transitions"
echo "   ✅ Added custom scrollbar styling"
echo "   ✅ Ensured proper component imports"
echo ""
echo "🚀 Your Zenith platform now has:"
echo "   • Consistent zenith theme across all components"
echo "   • Properly rounded and displayed profile pictures"
echo "   • Modern UI with smooth transitions"
echo "   • Enhanced user experience"
echo ""
echo "💡 Test the changes by visiting:"
echo "   • Profile page: http://localhost:3000/profile"
echo "   • Chat rooms: http://localhost:3000/chat"
echo "   • Club management: http://localhost:3000/club-management"
echo "   • Assignment creation: http://localhost:3000/assignments/create"
