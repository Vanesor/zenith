# Club Logo System Guide

## 📁 File Structure
```
public/uploads/club-logos/
├── ascend.svg          # Coding Club Logo
├── aster.svg           # Soft Skills Club Logo  
├── achievers.svg       # Academic Club Logo
├── altogether.svg      # Wellness Club Logo
└── [club-id].svg       # Add new club logos here
```

## 🎨 How to Add/Change Club Logos

### Step 1: Create SVG Logo
- Design your SVG logo (recommended size: 64x64px viewBox)
- Use `currentColor` for fill to inherit text color
- Save as `[club-id].svg` (e.g., `ascend.svg`)

### Step 2: Save to Directory
Place your SVG file in: `public/uploads/club-logos/[club-id].svg`

### Step 3: Component Usage
The `ClubLogo` component automatically:
- ✅ Looks for SVG file first (`/uploads/club-logos/{clubId}.svg`)
- ✅ Falls back to Lucide icon if SVG not found
- ✅ Handles errors gracefully
- ✅ Supports multiple sizes (sm, md, lg, xl)

## 🔧 SVG Guidelines

### Best Practices:
1. **Use currentColor**: Allows dynamic theming
2. **Keep it simple**: Clean, recognizable designs work best
3. **Scalable**: Test at different sizes (24px to 64px)
4. **Consistent style**: Match the overall app design

### Example SVG Structure:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor">
  <!-- Your logo content here -->
  <!-- Use currentColor for theme-aware colors -->
  <!-- Use opacity for depth/layering -->
</svg>
```

## 🎯 Current Implementation

### Pages Updated:
- ✅ Landing Page (`/`)
- ✅ Clubs Listing (`/clubs`)
- ✅ Dashboard (`/dashboard`)  
- ✅ Individual Club Pages (`/clubs/[clubId]`)

### How it Works:
1. Component checks if SVG exists at `/uploads/club-logos/{clubId}.svg`
2. If found, displays SVG logo
3. If not found, shows fallback Lucide icon
4. Logos appear before club names in all contexts

## 🚀 Current Club Logos

| Club ID | Name | Logo File | Status |
|---------|------|-----------|--------|
| `ascend` | Ascend | `ascend.svg` | ✅ Created |
| `aster` | Aster | `aster.svg` | ✅ Created |
| `achievers` | Achievers | `achievers.svg` | ✅ Created |
| `altogether` | All Together | `altogether.svg` | ✅ Created |

## 🎨 Customizing Your Logo

Replace any of the provided SVG files with your custom design:

1. **Keep the same filename** (e.g., `ascend.svg`)
2. **Use the same directory** (`public/uploads/club-logos/`)
3. **Test responsiveness** across all pages
4. **Consider theme compatibility** (light/dark modes)

## 🔄 Adding New Clubs

For new clubs:
1. Create club in database with unique `id`
2. Add SVG file as `{club-id}.svg`
3. Logo will automatically appear across all pages

The system is fully automated - no code changes needed for new logos!
