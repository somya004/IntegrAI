import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  whileHover?: any;
  whileTap?: any;
  initial?: any;
  animate?: any;
  glassmorphism?: boolean;
  gradient?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  delay = 0,
  whileHover = { scale: 1.03, y: -5 },
  whileTap = { scale: 0.98 },
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  glassmorphism = false,
  gradient = false
}) => {
  const getCardStyles = () => {
    let baseStyles = 'relative overflow-hidden rounded-2xl transition-all duration-300 ease-out';
    
    if (glassmorphism) {
      baseStyles += ' backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10';
    } else if (gradient) {
      baseStyles += ' bg-gradient-to-br from-blue-500/10 via-purple-500/20 to-pink-500/30 dark:from-blue-600/10 via-purple-600/20 to-pink-600/30 border border-blue-200/50 dark:border-blue-800/50';
    } else {
      baseStyles += ' bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg';
    }
    
    return baseStyles;
  };

  const getInnerStyles = () => {
    if (glassmorphism) {
      return 'p-6 relative z-10';
    }
    return 'p-6';
  };

  return (
    <motion.div
      className={`${getCardStyles()} ${className}`}
      delay={delay}
      whileHover={whileHover}
      whileTap={whileTap}
      initial={initial}
      animate={animate}
    >
      {/* Glassmorphism effect overlay */}
      {glassmorphism && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-black/20 to-transparent pointer-events-none" />
      )}
      
      {/* Gradient overlay */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/10 to-pink-500/5 opacity-30 dark:from-blue-600/5 via-purple-600/10 to-pink-600/5 pointer-events-none" />
      )}
      
      {/* 3D depth effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent dark:via-black/5 pointer-events-none" />
      
      {/* Content */}
      <div className={getInnerStyles()}>
        {children}
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 dark:from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none opacity-50" />
    </motion.div>
  );
};

export default AnimatedCard;
