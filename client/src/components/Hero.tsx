import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownIcon, SparklesIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const Hero: React.FC = () => {
  const { isDark } = useTheme();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800">
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            background: [
              "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
              "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)",
              "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)"
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 dark:bg-white/10 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 0.5, 0],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Animated Badge */}
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/15 mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Premium Dashboard
            </span>
          </motion.div>

          {/* Main Heading with Gradient Text */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="relative inline-block">
              {/* Gradient Text Effect */}
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  ConfigAI
                </span>
                {/* Text Shadow/Glow */}
                <span className="absolute inset-0 blur-sm bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 opacity-30 blur-md">
                  ConfigAI
                </span>
              </span>
              
              {/* Animated Underline */}
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </span>
          </motion.h1>

          {/* Subtitle with animation */}
          <motion.p
            className="text-xl text-gray-300 dark:text-gray-400 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Transform your integration workflow with AI-powered configuration management
          </motion.p>

          {/* CTA Buttons Container */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Primary CTA Button */}
            <motion.button
              onClick={() => scrollToSection('features')}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-700 dark:via-purple-700 dark:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 dark:from-blue-500 dark:via-purple-500 dark:to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Button Content */}
              <div className="relative z-10 flex items-center justify-center">
                <span className="mr-2">Get Started</span>
                <ArrowDownIcon className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
              </div>
              
              {/* Sliding Background Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white dark:from-black dark:via-transparent dark:to-black"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </motion.button>

            {/* Secondary CTA Button */}
            <motion.button
              onClick={() => scrollToSection('demo')}
              className="group relative px-8 py-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/30 dark:border-white/15 text-gray-700 dark:text-gray-300 font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Button Content */}
              <div className="relative z-10 flex items-center justify-center">
                <Cog6ToothIcon className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                <span>View Demo</span>
              </div>
              
              {/* Sliding Background Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-gray-100 via-transparent to-gray-100 dark:from-gray-800 dark:via-transparent dark:to-gray-800"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </motion.button>
          </div>

          {/* Feature Pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mt-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            {[
              { name: 'AI-Powered', icon: '🤖', color: 'blue' },
              { name: 'Multi-Tenant', icon: '🏢', color: 'purple' },
              { name: 'Real-time', icon: '⚡', color: 'pink' },
              { name: 'Secure', icon: '🔒', color: 'green' }
            ].map((feature, index) => (
              <motion.div
                key={feature.name}
                className={`flex items-center px-4 py-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-${feature.color}-200 dark:border-${feature.color}-800`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.1, y: -2 }}
              >
                <span className="text-2xl mr-2">{feature.icon}</span>
                <span className={`text-sm font-medium text-${feature.color}-700 dark:text-${feature.color}-300`}>
                  {feature.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating Triangle */}
        <motion.div
          className="absolute top-20 right-10 w-0 h-0 border-l-[40px] border-l-transparent border-b-[80px] border-b-blue-400/20 dark:border-b-blue-600/20"
          animate={{
            rotate: [0, 360],
            y: [0, -20, 0],
            x: [0, 30, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            filter: 'blur(1px)',
            transform: 'translateX(50%)'
          }}
        />

        {/* Floating Circle */}
        <motion.div
          className="absolute bottom-20 left-10 w-20 h-20 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 dark:from-purple-600/20 dark:to-pink-600/20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            filter: 'blur(2px)'
          }}
        />

        {/* Floating Square */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-16 h-16 bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-600/20 dark:to-purple-600/20"
          animate={{
            rotate: [0, 90, 180, 270],
            y: [0, -30, 0],
            x: [0, 40, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            filter: 'blur(1px)'
          }}
        />
      </div>
    </section>
  );
};

export default Hero;
