import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

const CreateIntegration: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();

  // Conditional UI based on shared state
  if (state.parsedData) {
    // Show integration UI directly using shared parsed data
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Create Integration</h1>
              <p className="text-gray-600 mt-2">
                Using previously uploaded requirement document
              </p>
            </div>

            {/* User Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-2" />
                <p className="text-blue-700">
                  Using previously uploaded requirement document
                </p>
              </div>
            </div>

            {/* Continue to Integration Setup */}
            <div className="text-center">
              <button
                onClick={() => navigate('/create-integration')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue to Integration Setup
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Original upload UI when no parsed data exists
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Integration</h1>
            <p className="text-gray-600 mt-2">
              Upload your requirements document to get started
            </p>
          </div>

          {/* Upload New Document Button */}
          <div className="text-center">
            <button
              onClick={() => navigate('/requirement-parser')}
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              Upload New Document
              <ArrowRightIcon className="ml-2 w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateIntegration;
