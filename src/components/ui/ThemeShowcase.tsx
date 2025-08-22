'use client';

import { useTheme } from 'next-themes';

export default function ThemeShowcase() {
  const { theme } = useTheme();

  return (
    <div className="p-6 space-y-6">
      <div className="bg-card border border-zenith rounded-lg p-6">
        <h2 className="text-xl font-bold text-primary mb-4">
          Current Theme: {theme}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Background Colors */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zenith-secondary">Backgrounds</h3>
            <div className="bg-zenith-main p-3 rounded border border-zenith">
              <span className="text-primary text-sm">Main Background</span>
            </div>
            <div className="bg-zenith-section p-3 rounded border border-zenith">
              <span className="text-primary text-sm">Section Background</span>
            </div>
            <div className="bg-card p-3 rounded border border-zenith">
              <span className="text-primary text-sm">Card Background</span>
            </div>
          </div>

          {/* Text Colors */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zenith-secondary">Text Colors</h3>
            <div className="bg-card p-3 rounded border border-zenith space-y-2">
              <p className="text-primary text-sm">Primary Text</p>
              <p className="text-zenith-secondary text-sm">Secondary Text</p>
              <p className="text-zenith-muted text-sm">Muted Text</p>
            </div>
          </div>

          {/* Accent Colors */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zenith-secondary">Accent Colors</h3>
            <div className="space-y-2">
              <button className="bg-zenith-brand text-primary px-4 py-2 rounded text-sm w-full">
                Brand Orange
              </button>
              <button className="bg-zenith-accent hover:bg-zenith-accent text-primary px-4 py-2 rounded text-sm w-full transition-colors">
                Primary Blue
              </button>
              <div className="flex space-x-2">
                <div className="bg-green-600 text-primary px-3 py-1 rounded text-xs">Success</div>
                <div className="bg-purple-600 text-primary px-3 py-1 rounded text-xs">Events</div>
                <div className="bg-pink-600 text-primary px-3 py-1 rounded text-xs">Secondary</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-zenith-section rounded-lg border border-zenith">
          <h4 className="font-semibold text-primary mb-2">Theme Information</h4>
          <div className="text-zenith-secondary text-sm space-y-1">
            <p>• Dark theme is set as the default</p>
            <p>• Custom light theme with clean, modern colors</p>
            <p>• Smooth transitions between themes</p>
            <p>• CSS custom properties for easy customization</p>
          </div>
        </div>
      </div>
    </div>
  );
}
