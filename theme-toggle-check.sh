#!/bin/bash

# Theme Toggle Standardization Script
# This script ensures consistent theme toggle usage across the Zenith application

echo "🎨 Zenith Theme Toggle Standardization Script"
echo "=============================================="

# Pages that should use FIXED-POSITION ThemeToggle (standalone pages without navigation)
STANDALONE_PAGES=(
  "src/app/page.tsx"                    # Landing page
  "src/app/login/page.tsx"              # Login page  
  "src/app/register/page.tsx"           # Register page
  "src/app/set-password/page.tsx"       # Set password page
)

# Pages that should use INLINE ThemeToggle (pages with navigation)
NAVIGATION_PAGES=(
  "src/app/dashboard/page.tsx"
  "src/app/clubs/page.tsx"
  "src/app/assignments/page.tsx"
  "src/app/calendar/page.tsx"
  "src/app/chat/page.tsx"
  "src/app/profile/page.tsx"
  "src/app/settings/page.tsx"
  "src/app/events/page.tsx"
  "src/app/members/page.tsx"
  "src/app/club-management/page.tsx"
)

echo "📋 Checking theme toggle usage..."

# Function to check if a file uses navigation layout
has_navigation() {
    local file="$1"
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        return 1
    fi
    
    # Check for navigation-related imports or components
    if grep -q "NavigationHeader\|TwoTierHeader\|LayoutWrapper" "$file"; then
        return 0
    else
        return 1
    fi
}

# Function to get current theme toggle import in a file
get_theme_toggle_import() {
    local file="$1"
    if [ -f "$file" ]; then
        grep "import.*ThemeToggle" "$file" 2>/dev/null || echo "NONE"
    else
        echo "FILE_NOT_FOUND"
    fi
}

# Function to check if theme toggle is rendered in component
has_theme_toggle_render() {
    local file="$1"
    if [ -f "$file" ]; then
        grep -q "<ThemeToggle" "$file"
        return $?
    else
        return 1
    fi
}

echo ""
echo "🔍 Analysis Results:"
echo "===================="

echo ""
echo "📄 STANDALONE PAGES (should use fixed-position ThemeToggle):"
for page in "${STANDALONE_PAGES[@]}"; do
    if [ -f "$page" ]; then
        import_line=$(get_theme_toggle_import "$page")
        has_render=$(has_theme_toggle_render "$page" && echo "✅ RENDERED" || echo "❌ NOT RENDERED")
        
        if [[ "$import_line" == *"components/ThemeToggle"* ]]; then
            echo "  ✅ $page - CORRECT (Fixed-position) - $has_render"
        elif [[ "$import_line" == *"components/ui/ThemeToggle"* ]]; then
            echo "  ⚠️  $page - WRONG (Using inline) - $has_render"
        elif [[ "$import_line" == "NONE" ]]; then
            echo "  ❌ $page - NO THEME TOGGLE - $has_render"
        else
            echo "  ❓ $page - UNKNOWN: $import_line - $has_render"
        fi
    else
        echo "  ❌ $page - FILE NOT FOUND"
    fi
done

echo ""
echo "🧭 NAVIGATION PAGES (should NOT have standalone theme toggle):"
for page in "${NAVIGATION_PAGES[@]}"; do
    if [ -f "$page" ]; then
        import_line=$(get_theme_toggle_import "$page")
        has_render=$(has_theme_toggle_render "$page" && echo "❌ WRONGLY RENDERED" || echo "✅ CORRECTLY NO RENDER")
        
        if [[ "$import_line" == "NONE" ]]; then
            echo "  ✅ $page - CORRECT (No standalone theme toggle) - $has_render"
        else
            echo "  ⚠️  $page - HAS THEME TOGGLE: $import_line - $has_render"
        fi
    else
        echo "  ❌ $page - FILE NOT FOUND"
    fi
done

echo ""
echo "🔧 NAVIGATION COMPONENTS (should use inline ThemeToggle):"
NAVIGATION_COMPONENTS=(
    "src/components/NavigationHeader.tsx"
    "src/components/TwoTierHeader.tsx"
    "src/components/Header.tsx"
    "src/components/Sidebar.tsx"
    "src/components/SideNav.tsx"
)

for component in "${NAVIGATION_COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        import_line=$(get_theme_toggle_import "$component")
        has_render=$(has_theme_toggle_render "$component" && echo "✅ RENDERED" || echo "❌ NOT RENDERED")
        
        if [[ "$import_line" == *"components/ui/ThemeToggle"* ]]; then
            echo "  ✅ $component - CORRECT (Inline) - $has_render"
        elif [[ "$import_line" == *"components/ThemeToggle"* ]]; then
            echo "  ⚠️  $component - WRONG (Using fixed-position) - $has_render"
        elif [[ "$import_line" == "NONE" ]]; then
            echo "  ❓ $component - NO THEME TOGGLE - $has_render"
        else
            echo "  ❓ $component - UNKNOWN: $import_line - $has_render"
        fi
    else
        echo "  ❌ $component - FILE NOT FOUND"
    fi
done

echo ""
echo "📊 SUMMARY:"
echo "==========="
echo "✅ = Correct configuration"
echo "⚠️  = Needs attention"  
echo "❌ = Missing or error"
echo "❓ = Unknown/unclear status"

echo ""
echo "🔧 RECOMMENDATIONS:"
echo "==================="
echo "1. Standalone pages (login, register, landing) should use: import { ThemeToggle } from '@/components/ThemeToggle'"
echo "2. Navigation components should use: import ThemeToggle from '@/components/ui/ThemeToggle'"
echo "3. Regular pages with navigation should NOT import ThemeToggle directly"
echo "4. Theme toggle should be integrated into the navigation system"

echo ""
echo "✨ Analysis complete!"
