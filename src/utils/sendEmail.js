const nodemailer = require('nodemailer');
const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');


/*
mailObj = {
    address: string,
    subject: string,
    payload: string,
    template: string,
}
*/
const sendEmail = async (mailObj) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.MAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            }
        });

        const source = await fs.readFileSync(path.join(process.cwd(), 'src', 'email_templates', mailObj.template), 'utf8');
        const options = () => ({
            from: process.env.FROM_EMAIL,
            to: mailObj.address,
            subject: mailObj.subject,
            html: Handlebars.compile(source)(mailObj.payload)
        });


        return transporter.sendMail(options(), (error, info) => {
            // console.log('send mail info ->', info);
            if (error) {
                // throw error;
                return error;
            }
            return true;
        });

    } catch (err) {
        return err;
    }
}



module.exports = sendEmail;