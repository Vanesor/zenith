#!/bin/bash

# Zenith UI/UX Improvements Test Script
# Tests theme consistency, image handling, and UI improvements

echo "🎨 Zenith UI/UX Improvements Test"
echo "================================="

# Function to check if server is running
check_server() {
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Development server is running on port 3000"
        return 0
    elif curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo "✅ Development server is running on port 3001"
        return 0
    else
        echo "❌ Development server is not running"
        echo "Please start the server with: npm run dev"
        return 1
    fi
}

# Function to test theme toggle functionality
test_theme_toggle() {
    echo ""
    echo "🔄 Testing Theme Toggle Functionality..."
    
    # Check if theme toggle components exist
    if [ -f "src/components/ui/ThemeToggle.tsx" ]; then
        echo "  ✅ Inline ThemeToggle component exists"
    else
        echo "  ❌ Inline ThemeToggle component missing"
    fi
    
    if [ -f "src/components/ThemeToggle.tsx" ]; then
        echo "  ✅ Fixed-position ThemeToggle component exists"
    else
        echo "  ❌ Fixed-position ThemeToggle component missing"
    fi
    
    if [ -f "src/contexts/ThemeContext.tsx" ]; then
        echo "  ✅ ThemeContext exists"
    else
        echo "  ❌ ThemeContext missing"
    fi
}

# Function to test UI improvements
test_ui_improvements() {
    echo ""
    echo "🎨 Testing UI Improvements..."
    
    # Check CSS improvements
    if grep -q "scrollbar-thin" "src/app/globals.css"; then
        echo "  ✅ Custom scrollbar styles added"
    else
        echo "  ⚠️  Custom scrollbar styles not found"
    fi
    
    if grep -q "modal-backdrop" "src/app/globals.css"; then
        echo "  ✅ Modal backdrop blur effects added"
    else
        echo "  ⚠️  Modal backdrop effects not found"
    fi
    
    if grep -q "focus-ring" "src/app/globals.css"; then
        echo "  ✅ Enhanced focus states added"
    else
        echo "  ⚠️  Enhanced focus states not found"
    fi
    
    # Check SafeImage component
    if [ -f "src/components/SafeImage.tsx" ]; then
        echo "  ✅ SafeImage component created for better image handling"
    else
        echo "  ❌ SafeImage component missing"
    fi
    
    # Check image utilities
    if [ -f "src/lib/imageUtils.ts" ]; then
        echo "  ✅ Image utilities created"
    else
        echo "  ❌ Image utilities missing"
    fi
}

# Function to test page-specific improvements
test_page_improvements() {
    echo ""
    echo "📄 Testing Page-Specific Improvements..."
    
    # Profile page
    if grep -q "SafeImage" "src/app/profile/page.tsx"; then
        echo "  ✅ Profile page updated with SafeImage"
    else
        echo "  ⚠️  Profile page not using SafeImage"
    fi
    
    if grep -q "bg-zenith-main" "src/app/profile/page.tsx"; then
        echo "  ✅ Profile page uses theme-aware classes"
    else
        echo "  ⚠️  Profile page not fully theme-aware"
    fi
    
    # Club management page
    if grep -q "bg-zenith-main" "src/app/club-management/page.tsx"; then
        echo "  ✅ Club management page updated with theme classes"
    else
        echo "  ⚠️  Club management page not theme-aware"
    fi
    
    # Chat page
    if grep -q "scrollbar-thin" "src/app/chat/page.tsx"; then
        echo "  ✅ Chat page includes improved scrolling"
    else
        echo "  ⚠️  Chat page scrolling not improved"
    fi
    
    if grep -q "bg-zenith-card" "src/app/chat/page.tsx"; then
        echo "  ✅ Chat page uses theme-aware classes"
    else
        echo "  ⚠️  Chat page not theme-aware"
    fi
    
    # Assignment creation page
    if grep -q "bg-zenith-main" "src/app/assignments/create/page.tsx"; then
        echo "  ✅ Assignment creation page updated"
    else
        echo "  ⚠️  Assignment creation page not theme-aware"
    fi
}

# Function to test modal improvements
test_modal_improvements() {
    echo ""
    echo "🔲 Testing Modal Improvements..."
    
    if grep -q "modal-backdrop" "src/components/ConfirmationModal.tsx"; then
        echo "  ✅ ConfirmationModal uses backdrop blur"
    else
        echo "  ⚠️  ConfirmationModal not updated with backdrop blur"
    fi
    
    if grep -q "bg-zenith-card" "src/components/ConfirmationModal.tsx"; then
        echo "  ✅ ConfirmationModal uses theme-aware classes"
    else
        echo "  ⚠️  ConfirmationModal not theme-aware"
    fi
}

# Function to provide testing instructions
provide_testing_instructions() {
    echo ""
    echo "🧪 Manual Testing Instructions:"
    echo "==============================="
    echo ""
    echo "1. Theme Toggle Testing:"
    echo "   - Visit http://localhost:3000 (landing page)"
    echo "   - Click theme toggle in top-right corner"
    echo "   - Verify smooth transition between light/dark themes"
    echo "   - Visit http://localhost:3000/login"
    echo "   - Verify theme toggle works and position is correct"
    echo "   - Visit http://localhost:3000/dashboard (after login)"
    echo "   - Verify theme toggle is integrated in navigation"
    echo ""
    echo "2. Image Handling Testing:"
    echo "   - Visit profile page: http://localhost:3000/profile"
    echo "   - Verify avatar displays properly or shows fallback"
    echo "   - Test image upload functionality"
    echo ""
    echo "3. Chat UI Testing:"
    echo "   - Visit chat page: http://localhost:3000/chat"
    echo "   - Verify smooth scrolling in chat rooms"
    echo "   - Test theme consistency in chat interface"
    echo ""
    echo "4. Modal Testing:"
    echo "   - Try deleting items from club management"
    echo "   - Verify confirmation modal has backdrop blur"
    echo "   - Test modal responsiveness and theme consistency"
    echo ""
    echo "5. Assignment Creation Testing:"
    echo "   - Visit assignment creation: http://localhost:3000/assignments/create"
    echo "   - Verify theme consistency throughout the form"
    echo "   - Test UI responsiveness and modern styling"
}

# Main execution
echo "🚀 Starting UI/UX improvements test..."

# Check if server is running
if ! check_server; then
    exit 1
fi

# Run tests
test_theme_toggle
test_ui_improvements
test_page_improvements
test_modal_improvements

echo ""
echo "📊 TEST SUMMARY:"
echo "==============="
echo "✅ = Working correctly"
echo "⚠️  = Needs attention or partially implemented"
echo "❌ = Missing or not working"

provide_testing_instructions

echo ""
echo "🎉 UI/UX Improvements Test Complete!"
echo ""
echo "💡 Next Steps:"
echo "1. Run manual tests using the instructions above"
echo "2. Report any issues found during testing"
echo "3. Fine-tune styling based on user feedback"
echo "4. Test on different screen sizes and browsers"
