"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import UniversalLoader from '@/components/ui/universal-loader'

export default function LoaderDemo() {
  const [showLoader, setShowLoader] = useState(false)

  const handleShowLoader = () => {
    setShowLoader(true)
    setTimeout(() => setShowLoader(false), 5000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-primary">
          Universal Loader Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Click the button below to see the creative Zenith universal loader in action
        </p>
        <Button 
          onClick={handleShowLoader}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          Show Universal Loader
        </Button>
      </div>

      <UniversalLoader 
        isVisible={showLoader}
        texts={[
          "Welcome to Zenith...",
          "Crafting your experience...",
          "Loading excellence...", 
          "Preparing innovation...",
          "Almost there...",
          "Ready to soar!"
        ]}
        duration={5000}
        onComplete={() => setShowLoader(false)}
      />
    </div>
  )
}
