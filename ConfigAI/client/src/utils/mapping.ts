import { Service, FieldMapping } from '../types/config';

export const generateFieldMappings = (services: Service[]): Record<string, string> => {
  const mockClientSchema = {
    name: '',
    dob: '',
    pan: '',
    email: '',
    phone: ''
  };

  const mockApiSchemas: Record<string, Record<string, string>> = {
    'KYC': {
      fullName: '',
      dateOfBirth: '',
      panNumber: '',
      emailAddress: '',
      phoneNumber: ''
    },
    'GST': {
      businessName: '',
      incorporationDate: '',
      panCard: '',
      emailId: '',
      mobileNumber: ''
    },
    'Payment': {
      customerName: '',
      billingDate: '',
      pancard: '',
      email: '',
      contactNumber: ''
    },
    'Fraud': {
      userName: '',
      birthDate: '',
      permanentAccountNumber: '',
      mailAddress: '',
      telephoneNumber: ''
    }
  };

  const mappings: Record<string, string> = {};
  
  services.forEach(service => {
    const apiSchema = mockApiSchemas[service.name] || {};
    
    Object.keys(mockClientSchema).forEach(clientField => {
      let matchedField = '';
      
      if (clientField === 'name') {
        if (apiSchema.fullName) matchedField = 'fullName';
        else if (apiSchema.businessName) matchedField = 'businessName';
        else if (apiSchema.customerName) matchedField = 'customerName';
        else if (apiSchema.userName) matchedField = 'userName';
      } else if (clientField === 'dob') {
        if (apiSchema.dateOfBirth) matchedField = 'dateOfBirth';
        else if (apiSchema.birthDate) matchedField = 'birthDate';
        else if (apiSchema.incorporationDate) matchedField = 'incorporationDate';
        else if (apiSchema.billingDate) matchedField = 'billingDate';
      } else if (clientField === 'pan') {
        if (apiSchema.panNumber) matchedField = 'panNumber';
        else if (apiSchema.panCard) matchedField = 'panCard';
        else if (apiSchema.pancard) matchedField = 'pancard';
        else if (apiSchema.permanentAccountNumber) matchedField = 'permanentAccountNumber';
      } else if (clientField === 'email') {
        if (apiSchema.emailAddress) matchedField = 'emailAddress';
        else if (apiSchema.emailId) matchedField = 'emailId';
        else if (apiSchema.email) matchedField = 'email';
        else if (apiSchema.mailAddress) matchedField = 'mailAddress';
      } else if (clientField === 'phone') {
        if (apiSchema.phoneNumber) matchedField = 'phoneNumber';
        else if (apiSchema.mobileNumber) matchedField = 'mobileNumber';
        else if (apiSchema.contactNumber) matchedField = 'contactNumber';
        else if (apiSchema.telephoneNumber) matchedField = 'telephoneNumber';
      }
      
      if (matchedField) {
        mappings[`${service.name}_${clientField}`] = matchedField;
      }
    });
  });
  
  return mappings;
};

export const calculateMappingConfidence = (clientField: string, apiField: string): number => {
  const clientLower = clientField.toLowerCase();
  const apiLower = apiField.toLowerCase();
  
  // Exact match
  if (clientLower === apiLower) return 100;
  
  // Partial matches
  if (clientLower.includes(apiLower) || apiLower.includes(clientLower)) return 80;
  
  // Similar words
  const similarities: Record<string, string[]> = {
    'name': ['fullname', 'businessname', 'customername', 'username'],
    'dob': ['dateofbirth', 'birthdate', 'incorporationdate', 'billingdate'],
    'pan': ['pannumber', 'pancard', 'pancard', 'permanentaccountnumber'],
    'email': ['emailaddress', 'emailid', 'mailaddress'],
    'phone': ['phonenumber', 'mobilenumber', 'contactnumber', 'telephonenumber']
  };
  
  for (const [base, variants] of Object.entries(similarities)) {
    if (clientLower === base && variants.some(v => v === apiLower)) {
      return 90;
    }
    if (apiLower === base && variants.some(v => v === clientLower)) {
      return 90;
    }
  }
  
  return 0;
};

export const getAvailableVersions = (serviceName: string): string[] => {
  const versions: Record<string, string[]> = {
    'KYC': ['v1', 'v2'],
    'GST': ['v1'],
    'Payment': ['v1', 'v2', 'v3'],
    'Fraud': ['v1', 'v2']
  };
  
  return versions[serviceName] || ['v1'];
};
