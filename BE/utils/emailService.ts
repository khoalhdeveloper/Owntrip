import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY!);


export const sendEmailTemplate = async (
  to: string,
  subject: string,
  templateName: string,
  variables: Record<string, string>
) => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error(`❌ Invalid email address: ${to}`);
      throw new Error(`Invalid email address: ${to}`);
    }

    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');


    for (const [key, value] of Object.entries(variables)) {
      htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }


    const result = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to,
      subject,
      html: htmlContent,
    });

    console.log(`📧 Email (${templateName}) sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send ${templateName} email:`, error.message);
    return false;
  }
};
