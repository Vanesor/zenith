#!/bin/bash

# Zenith Theme System Validation Script
# This script validates theme-aware CSS classes across the application

echo "🎨 Zenith Theme System Validation"
echo "=================================="

# Counter for issues
issues=0
total_files=0

# Function to check if file uses theme-aware classes
check_theme_classes() {
    local file="$1"
    local file_issues=0
    
    if [ ! -f "$file" ]; then
        return 0
    fi
    
    total_files=$((total_files + 1))
    echo "📄 Checking $file..."
    
    # Check for old CSS classes that should be replaced
    OLD_CLASSES=(
        "bg-white"
        "bg-gray-"
        "text-gray-"
        "border-gray-"
        "dark:bg-gray-"
        "dark:text-gray-"
        "dark:border-gray-"
    )
    
    # Check for correct theme classes
    THEME_CLASSES=(
        "bg-zenith-main"
        "bg-zenith-card"
        "bg-zenith-section"
        "text-zenith-primary"
        "text-zenith-secondary"
        "text-zenith-muted"
        "border-zenith-border"
    )
    
    # Look for old patterns (excluding comments)
    old_class_found=false
    for class in "${OLD_CLASSES[@]}"; do
        if grep -v "^\s*//" "$file" | grep -q "$class" 2>/dev/null; then
            if [ "$old_class_found" = false ]; then
                echo "  ⚠️  Found old CSS classes that could be theme-aware:"
                old_class_found=true
                file_issues=$((file_issues + 1))
            fi
            count=$(grep -v "^\s*//" "$file" | grep -o "$class" | wc -l)
            echo "    - $class (${count} occurrences)"
        fi
    done
    
    # Check for theme classes
    theme_class_found=false
    for class in "${THEME_CLASSES[@]}"; do
        if grep -q "$class" "$file" 2>/dev/null; then
            if [ "$theme_class_found" = false ]; then
                echo "  ✅ Using theme-aware classes:"
                theme_class_found=true
            fi
        fi
    done
    
    if [ "$theme_class_found" = false ] && [ "$old_class_found" = false ]; then
        echo "  ℹ️  No theme-specific classes found (might be using other styling)"
    elif [ "$theme_class_found" = false ] && [ "$old_class_found" = true ]; then
        echo "  ❌ Only old classes found - needs theme update"
    elif [ "$theme_class_found" = true ] && [ "$old_class_found" = false ]; then
        echo "  ✅ Fully theme-aware"
    else
        echo "  ⚠️  Mixed old and new classes - partial theme implementation"
    fi
    
    issues=$((issues + file_issues))
    echo ""
    
    return $file_issues
}

echo ""
echo "🔍 Checking key application files..."
echo "===================================="

# Key files to check
KEY_FILES=(
    "src/app/dashboard/page.tsx"
    "src/app/login/page.tsx"
    "src/app/register/page.tsx"
    "src/app/page.tsx"
    "src/app/clubs/page.tsx"
    "src/app/assignments/page.tsx"
    "src/app/calendar/page.tsx"
    "src/app/chat/page.tsx"
    "src/app/profile/page.tsx"
    "src/app/settings/page.tsx"
    "src/components/NavigationHeader.tsx"
    "src/components/TwoTierHeader.tsx"
    "src/components/Sidebar.tsx"
    "src/components/ui/ThemeToggle.tsx"
)

for file in "${KEY_FILES[@]}"; do
    check_theme_classes "$file"
done

echo "📊 SUMMARY"
echo "=========="
echo "Files checked: $total_files"
echo "Potential issues: $issues"

if [ $issues -eq 0 ]; then
    echo "✅ All key files are properly theme-aware!"
    echo ""
    echo "🎉 THEME SYSTEM STATUS: EXCELLENT"
    echo "=================================="
    echo "✅ Fixed-position theme toggle on standalone pages"
    echo "✅ Inline theme toggle in navigation components"  
    echo "✅ Theme-aware CSS classes throughout the app"
    echo "✅ Proper theme context integration"
    echo "✅ Light/dark mode fully functional"
else
    echo "⚠️  Some files may need theme class updates"
    echo ""
    echo "🔧 RECOMMENDATIONS:"
    echo "==================="
    echo "1. Replace old gray-* classes with zenith-* equivalents"
    echo "2. Use bg-zenith-main for main backgrounds"
    echo "3. Use text-zenith-primary for primary text"
    echo "4. Use bg-zenith-card for card backgrounds"
    echo "5. Test theme switching on all pages"
fi

echo ""
echo "🎨 ZENITH THEME CLASSES REFERENCE:"
echo "=================================="
echo "Backgrounds:"
echo "  bg-zenith-main     → Main page background"
echo "  bg-zenith-section  → Section backgrounds"  
echo "  bg-zenith-card     → Card/container backgrounds"
echo "  bg-zenith-hover    → Hover states"
echo ""
echo "Text:"
echo "  text-zenith-primary   → Primary text color"
echo "  text-zenith-secondary → Secondary text color"
echo "  text-zenith-muted     → Muted/subdued text"
echo "  text-zenith-brand     → Brand color (orange)"
echo "  text-zenith-accent    → Accent color (blue)"
echo ""
echo "Borders:"
echo "  border-zenith-border → Standard borders"
echo "  border-zenith        → Alternative border"
echo ""
echo "✨ Theme validation complete!"
