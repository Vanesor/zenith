import { Variants } from 'framer-motion'

// Page transition animations
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3, ease: "easeIn" }
  }
}

// Card animations
export const cardVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      duration: 0.4, 
      ease: "easeOut",
      staggerChildren: 0.1
    }
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2 }
  }
}

// Button animations
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
}

// Input focus animations
export const inputVariants: Variants = {
  initial: { borderColor: "rgba(229, 231, 235, 1)" },
  focus: { 
    borderColor: "rgba(59, 130, 246, 1)",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    transition: { duration: 0.2 }
  }
}

// Logo animations
export const logoVariants: Variants = {
  initial: { scale: 0.8, opacity: 0, rotate: -10 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    rotate: 0,
    transition: { 
      duration: 0.8, 
      ease: "easeOut",
      type: "spring",
      bounce: 0.3
    }
  },
  hover: {
    scale: 1.05,
    rotate: 2,
    transition: { duration: 0.3 }
  }
}

// Floating animation for background elements
export const floatingVariants: Variants = {
  animate: {
    y: [-10, 10, -10],
    x: [-5, 5, -5],
    rotate: [0, 2, -2, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Pulse animation for active elements
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Stagger container for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

// Stagger item for list items
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
}

// Slide in from different directions
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -50 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

export const slideInUp: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

// Loading spinner animation
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
}

// Success animation
export const successVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      duration: 0.5, 
      ease: "easeOut",
      type: "spring",
      bounce: 0.4
    }
  }
}

// Error shake animation
export const shakeVariants: Variants = {
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  }
}

// Theme toggle animation
export const themeToggleVariants: Variants = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { 
      duration: 0.4, 
      ease: "easeInOut",
      type: "spring",
      bounce: 0.3
    }
  },
  exit: { 
    scale: 0, 
    rotate: 180, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

// Modal animations
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      duration: 0.3, 
      ease: "easeOut",
      type: "spring",
      bounce: 0.2
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: 20,
    transition: { duration: 0.2, ease: "easeIn" }
  }
}

// Backdrop animation
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

// Tab animation
export const tabVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  }
}

// Progress bar animation
export const progressVariants: Variants = {
  initial: { width: "0%" },
  animate: { 
    width: "100%",
    transition: { duration: 1, ease: "easeInOut" }
  }
}

// Notification slide animation
export const notificationVariants: Variants = {
  initial: { opacity: 0, x: 300, scale: 0.9 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: "easeOut",
      type: "spring"
    }
  },
  exit: { 
    opacity: 0, 
    x: 300, 
    scale: 0.9,
    transition: { duration: 0.3, ease: "easeIn" }
  }
}
