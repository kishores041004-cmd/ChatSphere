package com.example.websocketdemo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendSupportNotification(String senderUsername, String senderPhone, String messageContent) {
        String toEmail = "kishore.s041004@gmail.com";
        String subject = "ChatSphere Support: New Message from " + senderUsername;
        String body = "Hello Kishore,\n\n"
                    + "You have received a new customer support message on ChatSphere:\n\n"
                    + "User: " + senderUsername + "\n"
                    + "Phone: " + senderPhone + "\n"
                    + "Message: " + messageContent + "\n\n"
                    + "Reply to them directly inside ChatSphere: http://localhost:8080/#private-" + senderUsername + "\n\n"
                    + "Best regards,\nChatSphere Support System";

        System.out.println("====== [SUPPORT EMAIL NOTIFICATION MOCK] ======");
        System.out.println("To: " + toEmail);
        System.out.println("Subject: " + subject);
        System.out.println("Content:\n" + body);
        System.out.println("===============================================");

        if (mailSender != null) {
            try {
                SimpleMailMessage mailMessage = new SimpleMailMessage();
                mailMessage.setTo(toEmail);
                mailMessage.setSubject(subject);
                mailMessage.setText(body);
                mailSender.send(mailMessage);
                System.out.println("Support email sent successfully via JavaMailSender.");
            } catch (Exception e) {
                System.err.println("Failed to send support email via JavaMailSender: " + e.getMessage());
            }
        } else {
            System.out.println("JavaMailSender not configured. Email logged to console.");
        }
    }
}
