import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Info, AlertCircle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
}: ConfirmationModalProps) {
  const getTypeConfig = () => {
    switch (type) {
      case "danger":
        return {
          icon: AlertTriangle,
          iconColor: "text-red-500",
          bgGradient: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          buttonGradient: "from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700",
          accentColor: "text-red-600 dark:text-red-400",
          glowColor: "shadow-red-500/20",
        };
      case "warning":
        return {
          icon: AlertCircle,
          iconColor: "text-yellow-500",
          bgGradient: "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          buttonGradient: "from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700",
          accentColor: "text-yellow-600 dark:text-yellow-400",
          glowColor: "shadow-yellow-500/20",
        };
      case "info":
        return {
          icon: Info,
          iconColor: "text-blue-500",
          bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          buttonGradient: "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
          accentColor: "text-blue-600 dark:text-blue-400",
          glowColor: "shadow-blue-500/20",
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: "text-red-500",
          bgGradient: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          buttonGradient: "from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700",
          accentColor: "text-red-600 dark:text-red-400",
          glowColor: "shadow-red-500/20",
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-black/50 via-gray-900/30 to-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modern Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className={`bg-gradient-to-br from-white/95 via-white/90 to-gray-50/90 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl ${config.glowColor} overflow-hidden`}>
              
              {/* Header */}
              <div className="relative px-8 py-6">
                <div className="flex items-start space-x-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", damping: 15 }}
                    className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} rounded-2xl flex items-center justify-center`}
                  >
                    <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <motion.h3
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl font-bold text-gray-900 dark:text-primary mb-2"
                    >
                      {title}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-600 dark:text-gray-300 leading-relaxed"
                    >
                      {message}
                    </motion.p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    disabled={isLoading}
                    className="p-2 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </motion.button>
                </div>
              </div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-end space-x-4 px-8 py-6 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`px-6 py-3 text-sm font-medium text-primary bg-gradient-to-r ${config.buttonGradient} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <motion.div 
                      className="flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Processing...
                    </motion.div>
                  ) : (
                    confirmText
                  )}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
