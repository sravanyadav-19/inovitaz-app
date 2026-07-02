/**
 * Environment Variable Validation
 * Ensures all required variables are present before server starts
 */

const validateEnv = () => {
  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
  ];

  const productionRequired = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'FRONTEND_URL',
  ];

  const missing = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Check base required variables
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check production-only required variables
  if (isProduction) {
    for (const key of productionRequired) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    console.error('❌ FATAL: Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease check your .env file or environment configuration.');
    process.exit(1);
  }

  // Warn about optional variables in development
  if (!isProduction) {
    const warnings = [];
    
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      warnings.push('Razorpay keys not configured - using mock payment mode');
    }
    
    if (!process.env.FRONTEND_URL) {
      warnings.push('FRONTEND_URL not set - CORS may not work correctly');
    }

    warnings.forEach(w => console.warn(`⚠️  WARNING: ${w}`));
  }

  console.log('✅ Environment variables validated');
};

module.exports = { validateEnv };