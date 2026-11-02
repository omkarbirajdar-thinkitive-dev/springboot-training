package com.example.Springboot_traning.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String fromEmail;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendWelcomeCredentials(String toEmail, String firstName, String username, String password, String role) {
        String roleLabel = (role != null && !role.isBlank()) ? role : "Employee";
        String subject = "Welcome to Workforce Platform - Your Login Credentials";

        String htmlContent = """
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #d8ece2; border-radius: 12px; background-color: #ffffff;">
                <div style="background-color: #173c35; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">People / Workforce Platform</h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #d2a274;">Enterprise Access Provisioning</p>
                </div>
                <div style="padding: 24px; color: #2d3748;">
                    <p style="font-size: 16px; margin-top: 0;">Hello <strong>%s</strong>,</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #4a5568;">
                        Your account has been provisioned on the <strong>Workforce Management Portal</strong> with <strong>%s</strong> privileges.
                        You can access your dashboard, submit leaves, log attendance, and review your payslips.
                    </p>
                    
                    <div style="background-color: #f4fbf7; border: 1px solid #c8e6d7; border-radius: 8px; padding: 18px; margin: 20px 0;">
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #173c35; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</h3>
                        <p style="margin: 6px 0; font-size: 14px;"><strong>Portal URL:</strong> <a href="http://localhost:5173/login" style="color: #1b7358; font-weight: 600;">http://localhost:5173/login</a></p>
                        <p style="margin: 6px 0; font-size: 14px;"><strong>Username:</strong> <code style="background-color: #e2f0e9; padding: 2px 6px; border-radius: 4px; font-size: 14px; color: #173c35;">%s</code></p>
                        <p style="margin: 6px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background-color: #e2f0e9; padding: 2px 6px; border-radius: 4px; font-size: 14px; color: #173c35;">%s</code></p>
                    </div>

                    <div style="text-align: center; margin: 28px 0;">
                        <a href="http://localhost:5173/login" style="background-color: #173c35; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">Sign In to Portal</a>
                    </div>

                    <p style="font-size: 12px; color: #718096; line-height: 1.5; margin-bottom: 0;">
                        🔒 For security purposes, please change your password after your first sign in. If you did not expect this invitation, please contact your organization administrator.
                    </p>
                </div>
                <div style="border-top: 1px solid #edf2f7; padding-top: 16px; margin-top: 16px; text-align: center; font-size: 11px; color: #a0aec0;">
                    Workforce Platform &middot; Automated Notification &middot; Do not reply to this email
                </div>
            </div>
            """.formatted(
                firstName != null ? firstName : "Team Member",
                roleLabel,
                username,
                password
            );

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    public void sendPasswordResetOtp(String toEmail, String code) {
        String subject = "Password Reset Verification Code - Workforce Platform";
        String htmlContent = """
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #d8ece2; border-radius: 12px; background-color: #ffffff;">
                <div style="background-color: #173c35; color: #ffffff; padding: 18px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="margin: 0; font-size: 20px;">Workforce Platform</h2>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #d2a274;">Security Verification</p>
                </div>
                <div style="padding: 24px; color: #2d3748;">
                    <p style="font-size: 14px; margin-top: 0;">Hello,</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #4a5568;">
                        A password reset was requested for your workforce account. Use the following 6-digit verification code to complete the process:
                    </p>
                    <div style="text-align: center; margin: 24px 0;">
                        <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #173c35; background-color: #f4fbf7; border: 2px dashed #173c35; padding: 12px 24px; border-radius: 8px;">
                            %s
                        </span>
                    </div>
                    <p style="font-size: 12px; color: #718096; line-height: 1.5;">
                        This code will expire in 15 minutes. If you did not initiate this request, you can safely ignore this email.
                    </p>
                </div>
            </div>
            """.formatted(code);

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        // Always log for observability
        System.out.println("====================================================================");
        System.out.println("[EMAIL SERVICE] Dispatching to: " + toEmail);
        System.out.println("[EMAIL SERVICE] Subject: " + subject);
        System.out.println("====================================================================");

        if (mailSender == null || mailHost == null || mailHost.isBlank()) {
            System.err.println("[WARN] JavaMailSender or spring.mail.host not configured. Email logged to console only.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromEmail != null && !fromEmail.isBlank())
                    ? fromEmail
                    : (mailUsername != null && !mailUsername.isBlank() ? mailUsername : "noreply@workforce.local");

            helper.setFrom(sender, "Workforce Platform");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("[EMAIL SERVICE] >>> Successfully transmitted email to " + toEmail + " via " + mailHost);

        } catch (Exception ex) {
            System.err.println("[ERROR] Failed to send email to " + toEmail + " via SMTP: " + ex.getMessage());
            ex.printStackTrace();
        }
    }
}
