package com.example.spotifyapi.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    
    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    /**
     * Validate an email address format
     * @param email the email to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidEmail(String email) {
        if (email == null) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email).matches();
    }
    
    /**
     * Send a simple text email
     * @param to recipient email address
     * @param subject email subject
     * @param text email body
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            if (!isValidEmail(to)) {
                throw new IllegalArgumentException("Invalid email address format: " + to);
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setFrom("admin@spotify-clone.com");
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (Exception e) {
            // Log the error but don't throw it to prevent API call failures
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }
    
    /**
     * Send an API key via email
     * @param to recipient email address
     * @param apiKey the API key to send
     * @param expirationMinutes minutes until key expiration
     */
    public void sendApiKey(String to, String apiKey, int expirationMinutes) {
        // For testing, just print the API key to console
        System.out.println("API KEY GENERATED: " + apiKey);
        System.out.println("FOR USER: " + to);
        System.out.println("VALID FOR: " + expirationMinutes + " minutes");
        
        // Also attempt to send email if the address is valid
        if (isValidEmail(to)) {
            String subject = "Your Spotify Clone API Key";
            String text = String.format(
                "Hello,\n\n" +
                "Here is your API key for the Spotify Clone application:\n\n" +
                "%s\n\n" +
                "This key will expire in %d minutes.\n\n" +
                "Thank you for using Spotify Clone!",
                apiKey, expirationMinutes
            );
            
            try {
                sendSimpleEmail(to, subject, text);
            } catch (Exception e) {
                System.err.println("Could not send API key email: " + e.getMessage());
            }
        }
    }
}
