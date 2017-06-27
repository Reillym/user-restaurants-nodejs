const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options); // renders pug file into html
  const inlineHtml = juice(html); // inlines html
  return inlineHtml;
};

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  // filters the html out
  const text = htmlToText.fromString(html);
  const mailOptions = {
    html,
    text,
    from: 'Mike Reilly <noreply@michaeltreilly.com>',
    to: options.user.email,
    subject: options.subject
  };
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};