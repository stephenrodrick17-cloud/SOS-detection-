"""
Alert Service for sending notifications via Twilio
"""

import logging
from typing import List, Dict, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class AlertService:
    """Service for sending alerts via SMS and other channels"""
    
    def __init__(self):
        """Initialize alert service"""
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
        self.client = None
        
        if self.twilio_account_sid and self.twilio_auth_token:
            try:
                from twilio.rest import Client
                self.client = Client(self.twilio_account_sid, self.twilio_auth_token)
                logger.info("Twilio client initialized")
            except Exception as e:
                logger.warning(f"Could not initialize Twilio: {str(e)}")
    
    def send_sms_alert(
        self,
        phone_numbers: List[str],
        message: str,
        image_url: Optional[str] = None,
        severity: str = "moderate"
    ) -> Dict[str, bool]:
        """
        Send SMS alert to phone numbers
        
        Args:
            phone_numbers: List of phone numbers to alert
            message: Alert message
            image_url: URL to damage image (if available)
            severity: Damage severity level
            
        Returns:
            Dictionary with success status for each number
        """
        results = {}
        
        # If Twilio not configured, simulate SMS sending
        if not self.client:
            logger.warning("Twilio not configured, simulating SMS alerts")
            for phone in phone_numbers:
                results[phone] = True
                logger.info(f"[SIMULATED SMS] To: {phone} | Message: {message[:50]}...")
            return results
        
        try:
            for phone_number in phone_numbers:
                try:
                    # Format message with severity indicator
                    severity_indicator = {
                        "minor": "[⚠️ MINOR]",
                        "moderate": "[⚠️⚠️ MODERATE]",
                        "severe": "[🚨 SEVERE]"
                    }.get(severity, "[ALERT]")
                    
                    full_message = f"{severity_indicator} {message}"
                    
                    # Send SMS via Twilio
                    message_obj = self.client.messages.create(
                        body=full_message,
                        from_=self.twilio_phone,
                        to=phone_number
                    )
                    
                    results[phone_number] = True
                    logger.info(f"SMS sent to {phone_number} (ID: {message_obj.sid})")
                except Exception as e:
                    results[phone_number] = False
                    logger.error(f"Failed to send SMS to {phone_number}: {str(e)}")
        except Exception as e:
            logger.error(f"Error sending SMS alerts: {str(e)}")
        
        return results
    
    def send_email_alert(
        self,
        email_addresses: List[str],
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> Dict[str, bool]:
        """
        Send email alert (stub for SendGrid integration)
        
        Args:
            email_addresses: List of email addresses
            subject: Email subject
            body: Email body (plain text)
            html_body: Email body (HTML)
            
        Returns:
            Dictionary with success status for each email
        """
        results = {}
        
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            sg_api_key = os.getenv("SENDGRID_API_KEY")
            if not sg_api_key:
                logger.warning("SendGrid API key not configured, simulating emails")
                for email in email_addresses:
                    results[email] = True
                logger.info(f"[SIMULATED EMAIL] Subject: {subject} | Recipients: {len(email_addresses)}")
                return results
            
            sg = SendGridAPIClient(sg_api_key)
            
            for email in email_addresses:
                try:
                    message = Mail(
                        from_email=os.getenv("SENDER_EMAIL", "alerts@infrastructure-damage.local"),
                        to_emails=email,
                        subject=subject,
                        plain_text_content=body,
                        html_content=html_body
                    )
                    
                    response = sg.send(message)
                    results[email] = (response.status_code in [200, 201, 202])
                    logger.info(f"Email sent to {email}")
                except Exception as e:
                    results[email] = False
                    logger.error(f"Failed to send email to {email}: {str(e)}")
        except ImportError:
            logger.warning("SendGrid not installed, simulating emails")
            for email in email_addresses:
                results[email] = True
                logger.info(f"[SIMULATED EMAIL] To: {email} | Subject: {subject}")
        except Exception as e:
            logger.error(f"Error sending email alerts: {str(e)}")
        
        return results
    
    def format_alert_message(
        self,
        damage_type: str,
        severity: str,
        location: str,
        cost: float,
        report_id: int
    ) -> str:
        """
        Format alert message
        
        Args:
            damage_type: Type of damage
            severity: Severity level
            location: Damage location
            cost: Estimated repair cost
            report_id: Report ID
            
        Returns:
            Formatted message string
        """
        severity_text = severity.upper()
        
        message = (
            f"Infrastructure Damage Alert (Report #{report_id})\\n"
            f"Type: {damage_type.upper()}\\n"
            f"Severity: {severity_text}\\n"
            f"Location: {location}\\n"
            f"Est. Cost: ${cost:,.2f}\\n"
            f"Please respond ASAP for quick repairs."
        )
        
        return message
    
    def create_alert_summary(
        self,
        report_id: int,
        damage_type: str,
        severity: str,
        location: str,
        cost: float,
        image_url: Optional[str] = None,
        additional_info: Optional[Dict] = None
    ) -> Dict:
        """
        Create comprehensive alert payload
        
        Args:
            report_id: Damage report ID
            damage_type: Type of damage
            severity: Severity level
            location: Location string
            cost: Estimated cost
            image_url: URL to damage image
            additional_info: Additional information
            
        Returns:
            Alert summary dictionary
        """
        return {
            "report_id": report_id,
            "timestamp": datetime.utcnow().isoformat(),
            "damage": {
                "type": damage_type,
                "severity": severity,
                "location": location,
                "estimated_cost": cost
            },
            "media": {
                "image_url": image_url
            },
            "additional_info": additional_info or {},
            "action_required": severity in ["moderate", "severe"]
        }
