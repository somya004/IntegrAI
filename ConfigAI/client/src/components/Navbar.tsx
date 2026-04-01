import React from 'react';
import { 
  BuildingOfficeIcon, 
  BellIcon, 
  UserCircleIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

interface NavbarProps {
  selectedTenant: string;
  onTenantChange: (tenant: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ selectedTenant, onTenantChange }) => {
  const tenants = ['Demo Corp', 'ABC Industries', 'XYZ Ltd', 'Test Organization'];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary-600">
                ConfigAI
              </h1>
              <p className="text-xs text-gray-500">Integration from Intent</p>
            </div>
          </div>

          {/* Tenant Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              <select
                value={selectedTenant}
                onChange={(e) => onTenantChange(e.target.value)}
                className="input-field text-sm py-1.5"
              >
                {tenants.map((tenant) => (
                  <option key={tenant} value={tenant}>
                    {tenant}
                  </option>
                ))}
              </select>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Cog6ToothIcon className="h-5 w-5" />
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">Admin User</p>
                <p className="text-xs text-gray-500">admin@configai.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
