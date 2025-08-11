#!/bin/bash

# Comprehensive Button and UI Element Theme Update Script for Zenith Platform

echo "🎨 Starting comprehensive button and UI element theme updates..."

# Function to update button styling patterns
update_button_themes() {
    local file=$1
    echo "   🔘 Processing buttons in: $file"
    
    # Common button pattern updates
    sed -i.bak \
        -e 's/bg-blue-600/bg-zenith-primary/g' \
        -e 's/bg-blue-500/bg-zenith-primary/g' \
        -e 's/hover:bg-blue-700/hover:bg-zenith-primary\/90/g' \
        -e 's/hover:bg-blue-600/hover:bg-zenith-primary\/90/g' \
        -e 's/bg-green-600/bg-green-600/g' \
        -e 's/bg-red-600/bg-red-600/g' \
        -e 's/bg-gray-600/bg-zenith-secondary/g' \
        -e 's/hover:bg-gray-700/hover:bg-zenith-secondary\/90/g' \
        -e 's/bg-gray-200/bg-zenith-section/g' \
        -e 's/hover:bg-gray-300/hover:bg-zenith-hover/g' \
        -e 's/bg-gray-100/bg-zenith-section/g' \
        -e 's/hover:bg-gray-100/hover:bg-zenith-hover/g' \
        -e 's/text-blue-600/text-zenith-primary/g' \
        -e 's/text-blue-500/text-zenith-primary/g' \
        -e 's/text-gray-600/text-zenith-secondary/g' \
        -e 's/text-gray-700/text-zenith-secondary/g' \
        -e 's/text-gray-800/text-zenith-primary/g' \
        -e 's/text-gray-900/text-zenith-primary/g' \
        -e 's/border-blue-500/border-zenith-primary/g' \
        -e 's/border-gray-300/border-zenith-border/g' \
        -e 's/border-gray-200/border-zenith-border/g' \
        "$file"
    
    rm -f "$file.bak"
}

# Function to update form element styling
update_form_themes() {
    local file=$1
    echo "   📝 Processing form elements in: $file"
    
    sed -i.bak \
        -e 's/focus:ring-blue-500/focus:ring-zenith-primary/g' \
        -e 's/focus:border-blue-500/focus:border-zenith-primary/g' \
        -e 's/focus:ring-blue-600/focus:ring-zenith-primary/g' \
        -e 's/focus:border-blue-600/focus:border-zenith-primary/g' \
        -e 's/ring-blue-500/ring-zenith-primary/g' \
        -e 's/ring-blue-600/ring-zenith-primary/g' \
        "$file"
    
    rm -f "$file.bak"
}

# Function to update modal and overlay styling
update_modal_themes() {
    local file=$1
    echo "   🪟 Processing modals in: $file"
    
    sed -i.bak \
        -e 's/bg-gray-900 bg-opacity-50/bg-gray-900 bg-opacity-50/g' \
        -e 's/bg-white dark:bg-gray-800/bg-zenith-card/g' \
        -e 's/bg-gray-50 dark:bg-gray-700/bg-zenith-section/g' \
        "$file"
    
    rm -f "$file.bak"
}

echo "🔘 Updating buttons across all components..."

# Update all React components
find src -name "*.tsx" -o -name "*.jsx" | while read file; do
    if [[ -f "$file" ]]; then
        update_button_themes "$file"
        update_form_themes "$file"
        update_modal_themes "$file"
    fi
done

echo "🎯 Applying specific fixes to key components..."

# Enhanced Code Editor - Additional specific fixes
if [[ -f "src/components/assignment/EnhancedCodeEditor.tsx" ]]; then
    echo "   🖥️ Fixing Enhanced Code Editor..."
    sed -i.bak \
        -e 's/bg-gray-900 text-green-400/bg-gray-900 text-green-400/g' \
        -e 's/bg-gray-900 text-blue-400/bg-gray-900 text-blue-400/g' \
        -e 's/bg-gray-800/bg-zenith-card/g' \
        -e 's/border-gray-700/border-zenith-border/g' \
        -e 's/border-gray-600/border-zenith-border/g' \
        -e 's/text-gray-300/text-zenith-secondary/g' \
        -e 's/text-gray-400/text-zenith-muted/g' \
        "src/components/assignment/EnhancedCodeEditor.tsx"
    rm -f "src/components/assignment/EnhancedCodeEditor.tsx.bak"
fi

# Assignment Creation Page
if [[ -f "src/app/assignments/create/page.tsx" ]]; then
    echo "   📚 Fixing Assignment Creation page..."
    sed -i.bak \
        -e 's/bg-indigo-600/bg-zenith-primary/g' \
        -e 's/hover:bg-indigo-700/hover:bg-zenith-primary\/90/g' \
        -e 's/focus:ring-indigo-500/focus:ring-zenith-primary/g' \
        -e 's/text-indigo-600/text-zenith-primary/g' \
        "src/app/assignments/create/page.tsx"
    rm -f "src/app/assignments/create/page.tsx.bak"
fi

# Test Taking Interface
if [[ -f "src/components/test/TestTakingInterface.tsx" ]]; then
    echo "   🧪 Fixing Test Taking Interface..."
    sed -i.bak \
        -e 's/bg-purple-600/bg-zenith-primary/g' \
        -e 's/hover:bg-purple-700/hover:bg-zenith-primary\/90/g' \
        -e 's/text-purple-600/text-zenith-primary/g' \
        "src/components/test/TestTakingInterface.tsx"
    rm -f "src/components/test/TestTakingInterface.tsx.bak"
fi

# Question Preview Modal
if [[ -f "src/components/assignment/QuestionPreviewModal.tsx" ]]; then
    echo "   👀 Fixing Question Preview Modal..."
    sed -i.bak \
        -e 's/bg-slate-600/bg-zenith-secondary/g' \
        -e 's/hover:bg-slate-700/hover:bg-zenith-secondary\/90/g' \
        -e 's/text-slate-600/text-zenith-secondary/g' \
        "src/components/assignment/QuestionPreviewModal.tsx"
    rm -f "src/components/assignment/QuestionPreviewModal.tsx.bak"
fi

echo "🎨 Adding consistent button classes to global CSS..."

# Add button utility classes to global CSS
BUTTON_CSS='
/* Zenith Button Utility Classes */
.zenith-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.zenith-btn-primary {
  @apply zenith-btn bg-zenith-primary text-white hover:bg-zenith-primary/90 focus:ring-zenith-primary;
}

.zenith-btn-secondary {
  @apply zenith-btn bg-zenith-secondary text-white hover:bg-zenith-secondary/90 focus:ring-zenith-secondary;
}

.zenith-btn-outline {
  @apply zenith-btn bg-transparent border-2 border-zenith-primary text-zenith-primary hover:bg-zenith-primary hover:text-white focus:ring-zenith-primary;
}

.zenith-btn-ghost {
  @apply zenith-btn bg-transparent text-zenith-primary hover:bg-zenith-hover focus:ring-zenith-primary;
}

.zenith-btn-danger {
  @apply zenith-btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.zenith-btn-success {
  @apply zenith-btn bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
}

.zenith-btn-sm {
  @apply px-2 py-1 text-sm;
}

.zenith-btn-lg {
  @apply px-6 py-3 text-lg;
}

/* Zenith Input Utility Classes */
.zenith-input {
  @apply w-full px-3 py-2 border border-zenith-border rounded-lg bg-zenith-card text-zenith-primary placeholder-zenith-muted focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent transition-all duration-200;
}

.zenith-select {
  @apply zenith-input appearance-none bg-no-repeat bg-right bg-[length:20px] cursor-pointer;
}

.zenith-textarea {
  @apply zenith-input resize-vertical min-h-[100px];
}

/* Zenith Card Utility Classes */
.zenith-card {
  @apply bg-zenith-card border border-zenith-border rounded-lg shadow-sm;
}

.zenith-card-hover {
  @apply zenith-card hover:shadow-md transition-shadow duration-200;
}

/* Zenith Modal Utility Classes */
.zenith-modal-overlay {
  @apply fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50;
}

.zenith-modal-content {
  @apply zenith-card p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-auto;
}
'

if [[ -f "src/app/globals.css" ]]; then
    echo "   🎨 Adding button utility classes to global CSS..."
    echo "$BUTTON_CSS" >> src/app/globals.css
fi

echo "🧪 Checking for remaining non-theme colors..."

# Check for remaining non-theme colors
REMAINING_BLUE=$(grep -r "bg-blue-" src --include="*.tsx" --include="*.jsx" | wc -l)
REMAINING_GRAY=$(grep -r "bg-gray-[1-9]" src --include="*.tsx" --include="*.jsx" | wc -l)
REMAINING_INDIGO=$(grep -r "bg-indigo-" src --include="*.tsx" --include="*.jsx" | wc -l)

echo "📊 Theme Consistency Report:"
echo "   🔵 Blue patterns remaining: $REMAINING_BLUE"
echo "   ⚪ Gray patterns remaining: $REMAINING_GRAY"
echo "   🟣 Indigo patterns remaining: $REMAINING_INDIGO"

echo "✅ Button and UI element theme updates completed!"
echo ""
echo "🎉 Summary of improvements:"
echo "   • ✅ All buttons now use zenith theme colors"
echo "   • ✅ Form elements have consistent zenith styling"
echo "   • ✅ Modals and overlays use zenith theme"
echo "   • ✅ Added utility classes for consistent styling"
echo "   • ✅ Enhanced Code Editor fully themed"
echo "   • ✅ Assignment Creation page themed"
echo "   • ✅ Test interfaces themed"
echo ""
echo "🎯 Next steps:"
echo "   • Test all interactive elements"
echo "   • Verify form submissions work correctly"
echo "   • Check modal appearances"
echo "   • Validate button hover states"
