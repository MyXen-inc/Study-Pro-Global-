# Study Pro Global - EdTech University Application Portal

Welcome to Study Pro Global! A comprehensive EdTech platform for students worldwide seeking to study abroad. Our platform simplifies foreign university applications with AI-powered support, subscription-based services, and cryptocurrency payment integration.

**Value Proposition**: *"Your Partner in Global University Enrollment – Get Accepted and We Succeed Together"*

## 🚀 Monorepo Structure

This is a monorepo containing all components of the Study Pro Global platform:

```
Study-Pro-Global/
├── Frontend/           # Web application (HTML/CSS/JS)
├── Backend/            # Server application (Node.js/Python/PHP)
├── API/                # API documentation and specifications
├── Mobile/             # Mobile apps (React Native/Flutter)
├── README.md           # This file
└── LICENSE            # MIT License
```

### 📁 Folder Details

#### [Frontend/](./Frontend/)
The responsive web application built with HTML5, CSS3, and vanilla JavaScript.
- **Status**: ✅ Complete and Deployed
- **Features**: Registration, Login, Pricing Plans, University Search, Scholarships
- **Tech Stack**: HTML5, CSS3, Vanilla JavaScript, Font Awesome 6.4

#### [Backend/](./Backend/)
Server-side application handling business logic, database operations, and integrations.
- **Status**: 🔧 Ready for Implementation
- **Recommended Stack**: Node.js + Express or Python + Django
- **Features**: Authentication, User Management, Payment Processing, AI Chat Support

#### [API/](./API/)
Complete API documentation with endpoint specifications and examples.
- **Status**: ✅ Documented
- **Base URL**: `/api/v1`
- **Endpoints**: Auth, Users, Universities, Applications, Payments, Scholarships, Courses

#### [Mobile/](./Mobile/)
Native mobile applications for Android and iOS.
- **Status**: 🔧 Ready for Implementation
- **Recommended Stack**: React Native or Flutter
- **Features**: All web features + Push Notifications + Biometric Auth + Offline Support

## 🎯 Key Features

### Free Tier
- ✅ Free Registration & Profile Creation
- ✅ University Search (Limited Results)
- ✅ 3 Free University Applications
- ✅ Basic AI Chat Support (24/7)
- ✅ Scholarship Opportunity Viewing
- ✅ Free Newsletter Sign-up

### Paid Subscription Tiers (2-Year Validity)

#### 1. Country Focus Pack (Asia) - $25
- Asian Universities Access
- 5 University Applications
- Full Search Access
- AI Support 24/7
- Newsletter & Updates
- Scholarship Opportunities

#### 2. Country Focus Pack (Europe) - $50
- European Universities (excluding UK)
- 5 University Applications
- Full Search Access
- AI Support 24/7
- Newsletter & Updates
- Scholarship Opportunities

#### 3. Global Application Pack - $100 ⭐ Most Popular
- **Worldwide Universities** (UK, USA, Canada, Australia, Europe, Asia)
- **Unlimited Applications**
- Premium Support (AI + Human)
- **UK Bonus Package** (Dedicated guidance, exclusive info, enhanced interview prep)
- Auto Scholarship Matching
- Interview Support
- Language Test Discounts
- University Ambassador Access

## 💳 Payment Methods

- **🔥 $myxn Token** - Cryptocurrency payment from [myxenpay-dapp](https://github.com/bikkhoto/myxenpay-dapp)
- 💳 **Visa** - Credit/Debit Cards
- 💳 **Mastercard** - Credit/Debit Cards
- 💳 **American Express** - Credit/Debit Cards

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Responsive Design (Mobile-first)
- Font Awesome Icons
- No framework dependencies

### Backend (Recommended)
- **Option 1**: Node.js + Express + PostgreSQL
- **Option 2**: Python + Django + PostgreSQL
- JWT Authentication
- Redis for caching
- AWS S3 for file storage

### Mobile (Recommended)
- **Option 1**: React Native
- **Option 2**: Flutter
- Firebase Cloud Messaging
- Biometric Authentication

## 🚦 Getting Started

### Frontend (Web App)
```bash
cd Frontend
# Open index.html in browser or use a local server
python3 -m http.server 8080
```
Then navigate to `http://localhost:8080`

### Backend (To Be Implemented)
```bash
cd Backend
# Follow Backend/README.md for setup instructions
```

### Mobile (To Be Implemented)
```bash
cd Mobile
# Follow Mobile/README.md for setup instructions
```

## 📚 Documentation

- **Frontend**: See [Frontend/README.md](./Frontend/README.md)
- **Backend**: See [Backend/README.md](./Backend/README.md)
- **API**: See [API/README.md](./API/README.md)
- **Mobile**: See [Mobile/README.md](./Mobile/README.md)

## �� Environment Variables

Each component requires specific environment variables. Create `.env` files in respective folders:

### Backend
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
MYXN_TOKEN_API_KEY=...
BKASH_APP_KEY=...
SMTP_HOST=...
```

### Mobile
```env
API_BASE_URL=https://api.studyproglobal.com
MYXN_TOKEN_CONTRACT_ADDRESS=...
```

## 🎨 Branding

### Logo
Upload your logo file to `Frontend/images/` directory.
Supported formats: PNG, SVG, JPG

### Color Scheme
- Primary: #2563eb (Blue)
- Secondary: #10b981 (Green)
- Dark: #1e293b
- Light: #f8fafc

## 📱 Deployment

### Frontend
- **GitHub Pages**: Automatic deployment
- **Netlify**: Connect GitHub repo
- **Vercel**: One-click deployment
- **AWS S3 + CloudFront**: Production setup

### Backend
- **AWS**: EC2, ECS, Lambda
- **DigitalOcean**: Droplets
- **Heroku**: Easy deployment
- **Railway**: Modern hosting

### Mobile
- **iOS**: App Store via TestFlight
- **Android**: Google Play Console
- **Beta**: Firebase App Distribution

## 🧪 Testing

### Frontend
```bash
# Manual testing in browser
# Responsive design testing with DevTools
```

### Backend
```bash
npm test  # or pytest for Python
```

### Mobile
```bash
npm test  # React Native
flutter test  # Flutter
```

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact & Support

- **Website**: https://studyproglobal.com
- **Email**: info@studyproglobal.com
- **API Support**: api-support@studyproglobal.com
- **Mobile Support**: mobile-dev@studyproglobal.com

## 🗺️ Roadmap

### Phase 1: Frontend ✅ COMPLETE
- [x] Responsive web design
- [x] Pricing pages
- [x] Registration/Login UI
- [x] University search interface

### Phase 2: Backend 🔧 IN PROGRESS
- [ ] User authentication system
- [ ] Database setup
- [ ] Payment gateway integration
- [ ] AI chat support
- [ ] University database

### Phase 3: Mobile 📅 PLANNED
- [ ] React Native/Flutter setup
- [ ] Core features implementation
- [ ] Push notifications
- [ ] App store submission

### Phase 4: Integrations 📅 PLANNED
- [ ] $myxn token payment (crypto)
- [ ] Credit card integration (Visa/Mastercard/Amex)
- [ ] Email service (Mailchimp)
- [ ] AI chat service
- [ ] Analytics

## 🌟 Key Differentiators

- 🤖 **AI-Powered Support**: 24/7 instant assistance
- 🎓 **Commission-Driven Model**: Success aligned with student enrollment
- 🌍 **Global Reach**: Designed for students worldwide from any country
- 🌐 **100% Online Platform**: Accessible from anywhere
- 🔒 **Secure Payments**: Multiple payment options including crypto

---

**Built with ❤️ for Students Aspiring to Study Abroad**
