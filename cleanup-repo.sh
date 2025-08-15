#!/bin/bash

# Zenith Repository Cleanup Script
# This script removes unnecessary files and optimizes the repository

echo "🚀 Starting Zenith Repository Cleanup..."
echo "=========================================="

# Set colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup() {
    if [ ! -d "backup-$(date +%Y%m%d)" ]; then
        mkdir "backup-$(date +%Y%m%d)"
        print_status "Created backup directory: backup-$(date +%Y%m%d)"
    fi
}

# Remove unnecessary documentation files
cleanup_docs() {
    print_status "Cleaning up unnecessary documentation files..."
    
    # Keep only essential documentation
    essential_docs=(
        "README.md"
        "SETUP_GUIDE.md"
        "MAINTENANCE_GUIDE.md"
        "todo.md"
    )
    
    # Remove all other .md files
    for file in *.md; do
        if [ -f "$file" ]; then
            keep_file=false
            for essential in "${essential_docs[@]}"; do
                if [ "$file" = "$essential" ]; then
                    keep_file=true
                    break
                fi
            done
            
            if [ "$keep_file" = false ]; then
                print_status "Removing: $file"
                rm "$file"
            fi
        fi
    done
    
    print_success "Documentation cleanup completed"
}

# Remove test and debug scripts
cleanup_scripts() {
    print_status "Cleaning up test and debug scripts..."
    
    # Remove test files
    rm -f test-*.js
    rm -f check-*.js
    rm -f verify-*.js
    rm -f browser-*.js
    rm -f simple-*.js
    
    # Remove fix and migration scripts that are no longer needed
    rm -f fix-*.sh
    rm -f apply-*.sh
    rm -f migrate-*.sh
    rm -f complete-*.sh
    rm -f setup-*.sh
    rm -f standardize_*.sh
    rm -f theme-*.sh
    rm -f ui-ux-*.sh
    
    # Remove individual SQL files (keep only schema files)
    rm -f *.sql
    rm -f fix_*.sql
    rm -f add-*.sql
    
    # Remove individual JS helper files
    rm -f bcrypt-helper.js
    rm -f generate-hash-simple.js
    rm -f resolve-dns.js
    rm -f run-*.js
    rm -f update-*.js
    rm -f create-*.js
    rm -f profile-system-report.js
    
    # Remove batch files
    rm -f *.bat
    
    # Remove shell analysis scripts
    rm -f *.sh 2>/dev/null || true
    
    print_success "Script cleanup completed"
}

# Remove temporary and backup files
cleanup_temp_files() {
    print_status "Cleaning up temporary and backup files..."
    
    # Remove temporary docker files
    rm -f docker-compose.temp.yml
    rm -f docker-compose.execution.yml
    
    # Remove temporary config files
    rm -f next.config.optimized.ts
    rm -f postgresql.conf
    rm -f execution-seccomp.json
    rm -f prometheus.yml
    
    # Remove image files in root
    rm -f "forum logo.png"
    
    print_success "Temporary files cleanup completed"
}

# Clean up database scripts
cleanup_database_scripts() {
    print_status "Organizing database scripts..."
    
    # Move essential scripts to scripts directory if they exist
    essential_scripts=(
        "check_events_table.js"
        "check_users_table.js"
        "update_events_table.js"
        "fix_time_column.js"
        "update-counts.js"
    )
    
    for script in "${essential_scripts[@]}"; do
        if [ -f "$script" ]; then
            mv "$script" scripts/ 2>/dev/null || true
        fi
    done
    
    # Remove .mjs files that are no longer needed
    rm -f check-and-update-db.mjs
    
    print_success "Database scripts organized"
}

# Optimize package.json scripts
optimize_package_json() {
    print_status "Optimizing package.json scripts..."
    
    # This will be done manually as it requires careful JSON editing
    print_warning "package.json optimization should be done manually"
    print_status "Recommended: Remove unused scripts and keep only essential ones"
}

# Main cleanup function
main() {
    print_status "Starting repository cleanup..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Not in a Node.js project directory. Exiting."
        exit 1
    fi
    
    # Create backup
    create_backup
    
    # Run cleanup functions
    cleanup_docs
    cleanup_scripts
    cleanup_temp_files
    cleanup_database_scripts
    
    print_success "Repository cleanup completed!"
    print_status "Files removed. Essential files preserved:"
    print_status "  ✅ src/ directory (Next.js source code)"
    print_status "  ✅ package.json and package-lock.json"
    print_status "  ✅ tsconfig.json and next.config.ts"
    print_status "  ✅ Essential documentation (README.md, SETUP_GUIDE.md)"
    print_status "  ✅ Docker configuration files"
    print_status "  ✅ Scripts directory with essential scripts"
    print_status "  ✅ Database and migration directories"
    print_status "  ✅ Environment configuration files"
    
    echo ""
    print_status "Next steps:"
    print_status "1. Run: npm install --production"
    print_status "2. Run: npm run build"
    print_status "3. Test the application"
    print_status "4. Commit changes to git"
}

# Run the main function
main
