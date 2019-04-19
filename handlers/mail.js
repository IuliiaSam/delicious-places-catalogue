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

// TEMP - sending a test email. Go to start.js and require it there in order to send the email instantly
// transport.sendMail({
//     from: 'Developer <email@email.com>',
//     to: 'jukraine@gmail.com',
//     subject: 'Just testing',
//     html: 'Hey there',
//     text: 'I am learning to send **emails**'
// });


const generateHTML = (filename, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
    const inlined = juice(html);
    return inlined;
}

exports.send = async (options) => {
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html);

    const mailOptions = {
        from: `Developer <developer@cool.com`,
        to: options.user.email,
        subject: options.subject,
        html: html,
        text: text
    };
    const sendMail = promisify(transport.sendMail, transport);
    return sendMail(mailOptions)
}