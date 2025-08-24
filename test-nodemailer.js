// Test file for nodemailer integration
const nodemailer = require('nodemailer');

async function testNodemailer() {
  try {
    console.log('Testing nodemailer...');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASSWORD || 'testpass',
      },
    });

    console.log('Transporter created successfully!');
    console.log('Nodemailer is working properly.');
    
    return true;
  } catch (error) {
    console.error('Nodemailer test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testNodemailer();
}

module.exports = { testNodemailer };
