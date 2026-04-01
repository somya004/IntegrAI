# ConfigAI - AI-Powered Enterprise Integration Orchestration Platform

## 🎯 Overview

ConfigAI is a full-stack enterprise platform that converts requirement documents (BRD, API specs, SOW) into integration configurations automatically using AI simulation. The platform enables "Integration from Intent, Not Code" - upload requirements and get production-ready integrations.

## 🏗️ Architecture

### Frontend (React + TypeScript + Tailwind CSS)
- Modern, responsive dashboard UI
- Glassmorphism design with dark mode
- Smooth animations with Framer Motion
- Component-based architecture

### Backend (Node.js + Express)
- RESTful APIs for all features
- Rule-based AI simulation logic
- MongoDB integration
- Mock service simulation

### Database (MongoDB)
- Multi-tenant configuration storage
- Audit logging
- Adapter registry
- Version management

## 🚀 Features

### 1. Document Upload & AI Parsing
- Upload .txt files or paste text directly
- AI-powered service detection (KYC, GST, Payment, Fraud)
- Automatic endpoint identification
- Mandatory/Optional service classification

### 2. Integration Registry
- Service adapters with version management
- API endpoint catalog
- Dynamic version selection

### 3. Auto-Configuration Engine
- Smart field mapping with fuzzy matching
- Visual mapping interface
- Auto-mapped field highlighting

### 4. Configuration Generator
- Dynamic JSON config generation
- Downloadable configuration files
- Production-ready output

### 5. Simulation Lab
- Mock API testing
- Request/response visualization
- Success/failure simulation
- Performance metrics

### 6. Version Testing
- API version comparison
- Diff viewer for response changes
- Migration testing

### 7. Audit Logs
- Complete activity tracking
- Multi-tenant isolation
- Action history with timestamps

### 8. Analytics Dashboard
- ROI metrics
- Time saved calculations
- Error reduction tracking
- Performance analytics

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the project root:
```bash
cd e:/confg
```

2. Install backend dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy .env file and update if needed
cp .env .env.local
```

4. Start the backend server:
```bash
npm run server
```

The backend will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### Development Mode

To run both frontend and backend simultaneously:

```bash
npm run dev
```

## 📊 Usage Flow

1. **Upload Document**: Upload requirements document or paste text
2. **AI Parsing**: System automatically detects services and endpoints
3. **Configuration**: Review and customize field mappings
4. **Testing**: Run simulations to validate integrations
5. **Deployment**: Download production-ready configurations
6. **Monitoring**: Track performance and analytics

## 🎨 UI Features

- **Glassmorphism Design**: Modern glass-effect panels
- **Animated Gradients**: Dynamic background animations
- **Dark Mode**: Enterprise-friendly dark theme
- **Responsive Layout**: Works on all screen sizes
- **Smooth Transitions**: Framer Motion animations
- **Interactive Elements**: Hover effects and micro-interactions

## 🔧 API Endpoints

### Document Parsing
- `POST /api/parse/doc` - Parse requirement document

### Adapter Registry
- `GET /api/adapters` - Get available adapters

### Configuration
- `POST /api/config/generate` - Generate configuration
- `POST /api/config/save` - Save configuration
- `GET /api/config/tenant/:tenant` - Get tenant configs

### Simulation
- `POST /api/simulate/run` - Run API simulation

### Audit Logs
- `GET /api/logs/tenant/:tenant` - Get tenant logs
- `POST /api/logs` - Create log entry

## 🗄️ Database Schema

### Tenants Collection
```javascript
{
  name: String (required, unique),
  createdAt: Date,
  updatedAt: Date
}
```

### Configs Collection
```javascript
{
  tenant: String (required),
  service: String (required),
  version: String (required),
  mapping: Object (required),
  createdAt: Date,
  updatedAt: Date
}
```

### Adapters Collection
```javascript
{
  service: String (required),
  versions: [String] (required),
  endpoints: [String] (required),
  createdAt: Date
}
```

### Logs Collection
```javascript
{
  action: String (required),
  tenant: String (required),
  user: String (required),
  details: Object,
  timestamp: Date
}
```

## 🤖 AI Simulation Logic

The platform uses rule-based NLP for service detection:

### Service Detection Rules
- **KYC**: "kyc", "know your customer", "identity verification"
- **GST**: "gst", "goods and services tax", "tax verification"
- **Payment**: "payment", "transaction", "pay", "checkout"
- **Fraud**: "fraud", "risk", "security", "detection"

### Field Mapping Logic
- **name** → fullName, businessName, customerName, userName
- **dob** → dateOfBirth, birthDate, incorporationDate, billingDate
- **pan** → panNumber, panCard, pancard, permanentAccountNumber
- **email** → emailAddress, emailId, email, mailAddress
- **phone** → phoneNumber, mobileNumber, contactNumber, telephoneNumber

## 📈 Analytics Metrics

- **Time Saved**: Manual configuration hours avoided
- **Errors Reduced**: Potential issues prevented
- **Integrations Generated**: Production-ready configs created
- **Success Rate**: First-time deployment success percentage
- **ROI**: Cost savings and quality improvement metrics

## 🏢 Enterprise Features

- **Multi-Tenant Support**: Isolated configurations per organization
- **Version Management**: API version control and testing
- **Audit Trail**: Complete activity logging
- **Config Isolation**: Secure tenant data separation
- **Scalable Architecture**: Built for enterprise workloads

## 🎯 Demo Walkthrough

1. **Landing Page**: Click "Start Configuration"
2. **Document Upload**: Load sample document or paste requirements
3. **AI Analysis**: Watch AI parse and detect services
4. **Integration Builder**: Review auto-generated field mappings
5. **Simulation Lab**: Test integration with mock APIs
6. **Analytics**: View performance metrics and ROI

## 🔒 Security Considerations

- Multi-tenant data isolation
- Input validation and sanitization
- Secure API endpoints
- Audit logging for compliance
- Environment-based configuration

## 🚀 Future Enhancements

- Real AI/ML integration
- More service adapters
- Advanced diff visualization
- Real-time collaboration
- Export to multiple formats
- CI/CD integration

## 📞 Support

For issues and feature requests, please contact the ConfigAI development team.

---

**ConfigAI - Transforming Integration Development with AI** 🚀
