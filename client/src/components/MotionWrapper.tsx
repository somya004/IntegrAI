// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MotionWrapperProps {
  children: React.ReactNode;
  className?: string;
  variants?: any;
  initial?: any;
  animate?: any;
  exit?: any;
  whileInView?: boolean;
  viewport?: any;
  onScrollStart?: () => void;
  onScrollComplete?: () => void;
}

const MotionWrapper: React.FC<MotionWrapperProps> = ({
  children,
  className = '',
  variants,
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  exit = { opacity: 0, y: -20 },
  whileInView = false,
  viewport = { once: false, amount: 0.3 },
  onScrollStart,
  onScrollComplete
}) => {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      whileInView={whileInView}
      viewport={viewport}
      onScrollStart={onScrollStart}
      onScrollComplete={onScrollComplete}
      transition={{
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1.0],
        staggerChildren: 0.1
      }}
    >
      {children}
    </motion.div>
  );
};

// Page transition variant
export const pageTransition = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Fade in animation for modals
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

// Slide up animation for panels
export const slideUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 }
};

// Scale animation for cards
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export default MotionWrapper;
