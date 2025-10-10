# Mediconnect

A comprehensive healthcare management platform built with Next.js 14, TypeScript, and Tailwind CSS. This application provides a unified portal for patients, GPs, specialists, pharmacies, and diagnostics labs to manage healthcare services.

## Features

### Patient Portal
- **Login/Registration**: Secure authentication with role-based access
- **Dashboard**: AI-powered health assistant with tabbed navigation
- **Health Intake**: Comprehensive health assessment forms
- **Consultation Waiting Room**: Real-time consultation management
- **Prescription Management**: View and manage prescriptions with QR codes
- **Diagnostics**: Access lab results and test reports
- **Profile Management**: Update personal health information

### GP Portal
- **Dashboard**: Overview of patients, consultations, and referrals
- **Patient Management**: Access patient records and history
- **Consultation Scheduling**: Book specialist appointments
- **Prescription Management**: Issue and manage prescriptions
- **Referral System**: Refer patients to specialists and diagnostics

### Specialist Portal
- **Consultation Management**: View and manage specialist appointments
- **Video Consultations**: Integrated telehealth capabilities
- **Patient History**: Access comprehensive patient records
- **Notes and Documentation**: Add consultation notes and reports

### Pharmacy Portal
- **Prescription Verification**: QR code scanning for prescription validation
- **Inventory Management**: Track medication stock and orders
- **Patient Verification**: Confirm patient identity and prescription details

### Diagnostics Portal
- **Order Management**: Process and manage lab test orders
- **Result Entry**: Input and manage test results
- **Quality Control**: Maintain testing standards and documentation

## Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: React Hooks (useState, useEffect)
- **Authentication**: LocalStorage-based mock authentication
- **Data Storage**: JSON files for mock data
- **Build Tool**: Next.js built-in build system

## Project Structure

```
mediconnect/
 src/
    app/                    # Next.js App Router pages
       patient/           # Patient portal pages
       gp/                # GP portal pages
       specialist/        # Specialist portal pages
       pharmacy/          # Pharmacy portal pages
       diagnostics/       # Diagnostics portal pages
       page.tsx           # Root page (role selector)
    components/            # Reusable React components
       ComingSoon.tsx     # Feature placeholder component
       RoleLogin.tsx      # Authentication component
       TabNav.tsx         # Navigation tabs component
       PrescriptionCard.tsx # Prescription display component
    lib/                   # Utility libraries
       feature-flags.ts   # Feature flag constants
    data/                  # Mock data files
        users.json         # User accounts and roles
        prescriptions.json # Prescription data
        diagnostics.json   # Lab test data
        consultations.json # Consultation records
 public/                    # Static assets
 package.json               # Dependencies and scripts
 next.config.js            # Next.js configuration
 tailwind.config.js        # Tailwind CSS configuration
 postcss.config.js         # PostCSS configuration
 tsconfig.json             # TypeScript configuration
 next-env.d.ts             # Next.js TypeScript declarations
```

## Recent Updates

### UI Enhancements
- **Brand Identity**: Implemented consistent brand colors (#1f6feb primary, #1654b3 secondary) and Inter font family across the application.
- **Header & Footer**: Added global header with navigation and footer for better site structure.
- **Component Styling**: Updated all components (RoleLogin, PrescriptionCard, ComingSoon, TabNav, patient pages) to use brand tokens for improved visual consistency.
- **Responsive Design**: Maintained mobile-first approach with enhanced color schemes.

### Functional Improvements
- **Login Flow**: Enhanced role-based login with automatic redirection to appropriate dashboards after authentication.
- **Prescription Features**: Added QR code modal display and improved PDF download functionality (demo text file download).
- **User Persistence**: Implemented localStorage-based user session management for demo flows.

### Technical Changes
- Extended Tailwind config with custom brand color palette.
- Added Google Fonts import for Inter typography.
- Updated global CSS with brand utilities.
- Enhanced component interactivity with modal states and blob downloads.

## Getting Started

### Prerequisites
- Node.js 18.x or later (local installation available in `node-v20.11.0-win-x64/`)
- npm or yarn package manager

### Installation

1. **Navigate to the project directory**

2. **Install dependencies**:
   ```bash
   npm install
   ```
   Or if using local Node.js:
   ```bash
   .\node-v20.11.0-win-x64\npm.cmd install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Or:
   ```bash
   .\node-v20.11.0-win-x64\npm.cmd run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Usage

### Accessing Different Portals

1. **Visit the homepage** at `http://localhost:3000`
2. **Select your role** from the available options:
   - Patient
   - GP (General Practitioner)
   - Specialist
   - Pharmacy
   - Diagnostics Lab

3. **Login** using the provided credentials (see Test Accounts below)

### Test Accounts

The application includes mock user accounts for testing:

#### Patient Accounts
- **Username**: patient1 / **Password**: password123
- **Username**: patient2 / **Password**: password123

#### GP Accounts
- **Username**: gp1 / **Password**: password123
- **Username**: gp2 / **Password**: password123

#### Specialist Accounts
- **Username**: specialist1 / **Password**: password123

#### Pharmacy Accounts
- **Username**: pharmacy1 / **Password**: password123

#### Diagnostics Accounts
- **Username**: diagnostics1 / **Password**: password123

## Key Features Overview

### Mock Authentication
- Role-based login system using localStorage
- Automatic redirection based on user role
- Secure logout functionality

### Feature Flags
- Configurable feature toggles in `src/lib/feature-flags.ts`
- "Coming Soon" placeholders for disabled features
- Easy feature rollout management

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Optimized for desktop, tablet, and mobile devices
- Consistent UI/UX across all portals

### Mock Data
- Realistic healthcare data for testing
- JSON-based data storage for easy modification
- Sample patients, prescriptions, consultations, and diagnostics

## Development

### Adding New Features

1. **Create new pages** in the appropriate `src/app/[role]/` directory
2. **Add reusable components** to `src/components/`
3. **Update mock data** in `src/data/` as needed
4. **Modify feature flags** in `src/lib/feature-flags.ts`

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture

### Testing
- Manual testing with provided test accounts
- Browser developer tools for debugging
- Responsive design testing across devices

## API Integration

This application uses mock data for demonstration. In a production environment, replace the mock data calls with actual API endpoints:

- Authentication: Replace localStorage with JWT/session-based auth
- Data fetching: Replace JSON imports with REST API calls
- Real-time features: Implement WebSocket connections for live updates

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure build settings (Next.js auto-detects)
3. Deploy automatically on push

### Other Platforms
- **Netlify**: Static deployment with Next.js support
- **Docker**: Containerize the application for cloud deployment
- **AWS/GCP/Azure**: Deploy to cloud platforms with Node.js support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions:
- Check the documentation
- Review the code comments
- Test with provided accounts
- Check browser console for errors

## Future Enhancements

- Real API integration
- Database implementation
- User registration system
- Advanced authentication (OAuth, MFA)
- Video consultation integration
- Payment processing
- Mobile app development
- Advanced analytics and reporting
"# Grok" 
