### Bulk Email Sender - UI Version

A modern, user-friendly interface for sending bulk emails built with Next.js and React. This project enhances the original bulk-email-sender with a comprehensive UI that makes email campaign management intuitive and efficient.





## 🚀 Features

- **Modern UI**: Clean, responsive interface built with shadcn/ui components
- **Email Campaign Management**: Easy setup and monitoring of email campaigns
- **CSV Preview**: View and search recipient data before sending
- **Template Preview**: Live preview of HTML email templates with personalization
- **Environment Configs**: Upload and manage different email configurations
- **Test Emails**: Send test emails to verify setup before launching campaigns
- **Real-time Logs**: Monitor email sending progress with live updates
- **Advanced Settings**: Control sending speed, batch size, and personalization options


## 🛠️ Technologies

- Next.js 15
- React
- TypeScript
- shadcn/ui components
- Tailwind CSS
- Nodemailer for email sending
- PapaParse for CSV parsing


## 📦 Installation

```shellscript
# Clone the repository
git clone https://github.com/YOUR-USERNAME/bulk-email-sender.git
cd bulk-email-sender

# Install dependencies (with legacy peer deps to avoid conflicts)
npm install --legacy-peer-deps

# Install additional required packages if needed
npm install nodemailer papaparse @radix-ui/react-scroll-area @radix-ui/react-progress
npm install --save-dev @types/nodemailer @types/papaparse

# Start development server
npm run dev
```

## 🎯 Usage

1. **Environment Configuration**:

1. Upload environment files (.env) for different email configurations
2. Each environment can have different sender details and SMTP credentials



2. **Email Setup**:

1. Configure sender name, email, and SMTP credentials
2. Set email subject and other basic details



3. **Recipient Management**:

1. Upload CSV file with recipient data
2. Preview and search through recipient data before sending



4. **Email Content**:

1. Upload HTML template for email content
2. Optional text version for email clients that don't support HTML
3. Add attachments as needed



5. **Campaign Settings**:

1. Configure delay between emails
2. Set batch size and maximum emails per day
3. Enable/disable personalization



6. **Testing**:

1. Send test emails to verify configuration
2. Preview how personalized emails will look



7. **Monitoring**:

1. View real-time logs during campaign execution
2. Track successful and failed emails
3. Export logs for record-keeping





## 📝 About This Project

This project is based on [IainMosima/bulk-email-sender](https://github.com/IainMosima/bulk-email-sender) with enhanced UI/UX. The original script and core functionality were created by IainMosima - this version focuses on creating a modern, user-friendly interface around the original functionality.

## ⚠️ Important Notes

- This tool is designed for legitimate email campaigns only
- Respect email sending limits of your provider (Gmail limits: ~500/day)
- Always ensure you have permission to email recipients
- Test thoroughly before sending to large lists


## 🙏 Credits

- Original script and functionality: [IainMosima/bulk-email-sender](https://github.com/IainMosima/bulk-email-sender)
- UI/UX enhancements: [Your Name/Username]


## 📄 License

MIT License

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/YOUR-USERNAME/bulk-email-sender/issues).

## 📧 Contact

If you have any questions or feedback, please open an issue on GitHub.

---

**Note**: This tool is intended for legitimate email campaigns only. Please use responsibly and in accordance with anti-spam laws and regulations.
