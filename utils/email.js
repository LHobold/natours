const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const nodemailerSendgrid = require('nodemailer-sendgrid');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.from = `Lucas Hobold <${process.env.EMAIL_FROM}>`;

    this.url = url;
  }
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      // return nodemailer.createTransport({
      //   service: 'Sendgrid',
      //   auth: {
      //     user: process.env.SENDGRID_USERNAME,
      //     pass: process.env.SENDGRID_PASSORD,
      //   },
      // });
      return nodemailer.createTransport(
        nodemailerSendgrid({
          apiKey: process.env.SENDGRID_PASSWORD,
        })
      );
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // Render HTML template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    // Define mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text: htmlToText.convert(html),
    };

    // Create transporter and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours family!');
  }

  async resetPassword() {
    await this.send(
      'passwordReset',
      'Your reset password token (valid for only 10 minutes)'
    );
  }
};

// new Email (user,url).sendWelcome() , sendPasswordReset()
