# Frontend - Study Pro Global

This folder contains the frontend web application for the Study Pro Global EdTech portal.

## Structure

```
Frontend/
├── index.html          # Main HTML file
├── css/                # Stylesheets
│   └── style.css      # Main stylesheet
├── js/                 # JavaScript files
│   └── script.js      # Main JavaScript file
└── images/             # Images and assets
```

## Features

- Responsive design (Desktop, Tablet, Mobile)
- EdTech University Application Portal UI
- Free tier and paid subscription tiers display
- Registration and Login forms
- University search interface
- Scholarship opportunities section
- Professional courses section
- Pricing comparison table

## Tech Stack

- HTML5
- CSS3 with custom properties
- Vanilla JavaScript
- Font Awesome 6.4 icons

## Running Locally

Simply open `index.html` in a web browser, or use a local server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx http-server -p 8080

# Using PHP
php -S localhost:8080
```

Then navigate to `http://localhost:8080`

## Deployment

This is a static website and can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

## API Integration

The frontend is designed to integrate with the Backend API (see `../API` folder) for:
- User authentication
- University data
- Application submissions
- Payment processing
- Subscription management
