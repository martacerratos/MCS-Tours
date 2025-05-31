const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Marta Cerratos <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Si el entorno es de produccion, se usa BREVO
      return nodemailer.createTransport({
        host: process.env.BREVO_HOST,
        port: process.env.BREVO_PORT,
        auth: {
          user: process.env.BREVO_USERNAME,
          pass: process.env.BREVO_PASSWORD
        },
      });
    }

    // Sino, se usa mailtrap
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    // Renderizar HTML basado en pug
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // Definir opciones de correo
    const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText.convert(html)
      };

    await this.newTransport().sendMail(mailOptions);
  }
  
  async sendWelcome() {
    await this.send('welcome', '¡Bienvenido a la comunidad de MCS Tours!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Tu codigo de cambio de contraseña (válido por 10 minutos)'
    );
  }
};
