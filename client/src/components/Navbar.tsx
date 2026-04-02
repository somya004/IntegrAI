// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { 
  BuildingOfficeIcon, 
  BellIcon, 
  UserCircleIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  selectedTenant: string;
  onTenantChange: (tenant: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ selectedTenant, onTenantChange }) => {
  const { isDark } = useTheme();
  const tenants = ['Demo Corp', 'ABC Industries', 'XYZ Ltd', 'Test Organization'];

  return (
    <nav className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo with animation */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex-shrink-0">
              <motion.h1 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                ConfigAI
              </motion.h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Integration from Intent</p>
            </div>
          </motion.div>

          {/* Tenant Selector */}
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              <motion.select
                value={selectedTenant}
                onChange={(e) => onTenantChange(e.target.value)}
                className="input-field text-sm py-1.5 bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-white/20 dark:border-white/10"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                {tenants.map((tenant) => (
                  <option key={tenant} value={tenant}>
                    {tenant}
                  </option>
                ))}
              </motion.select>
            </div>

            {/* Notifications */}
            <motion.button
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <BellIcon className="h-5 w-5" />
              <motion.span 
                className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.button>

            {/* Settings */}
            <motion.button
              className="p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </motion.button>

            {/* User Profile */}
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-600/20 to-purple-600/20" />
              </motion.div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">admin@configai.com</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
