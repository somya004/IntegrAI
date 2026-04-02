import React from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 ease-out group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {/* Animated background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 dark:from-blue-600 via-purple-600 to-pink-600" />
      
      {/* Icon container with animation */}
      <motion.div
        className="relative z-10"
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 blur-sm opacity-75 dark:from-yellow-300 to-orange-300" />
          
          {/* Icon */}
          <div className="relative z-10 text-gray-700 dark:text-gray-300">
            <SunIcon className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-0 rotate-180' : 'opacity-100'}`} />
            <MoonIcon className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </div>
      </motion.div>
      
      {/* Orbiting particles */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[0, 120, 240].map((angle, index) => (
          <div
            key={index}
            className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(12px)`,
              opacity: isDark ? 0.3 : 0.1
            }}
          />
        ))}
      </motion.div>
      
      {/* Hover ring effect */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-blue-400 dark:border-blue-600"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0, 0.5, 0],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.button>
  );
};

export default ThemeToggle;
