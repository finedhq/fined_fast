# Business logic for bulk newsletter dispatches
import asyncio
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import aiosmtplib

from app.config import settings

NEWSLETTER_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f4f4f4;">

  <!-- Wrapper -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f4f4">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; margin: 20px 0;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 20px 0; background-color: #007bff; color: #ffffff;">
              <h1 style="margin: 0;">Your Brand Newsletter</h1>
              <p style="margin: 0;">{month_year} Edition</p>
            </td>
          </tr>

          <!-- Featured Article -->
          <tr>
            <td style="padding: 20px;">
              <h2>{title}</h2>
              <p style="text-align: justify; max-height: 48px; overflow: hidden" >
                {content}
              </p>
              <a href="https://fined-web.vercel.app/articles" style="display:inline-block; background:#007bff; color:#ffffff; padding:10px 20px; text-decoration:none; border-radius:5px;">Read More</a>
            </td>
          </tr>

          <!-- Topics -->
          <tr>
            <td style="padding: 20px; background-color:#f9f9f9;">
              <h3>🔥 Trending Topics</h3>
              <ul>
                <li>Budgeting Tips for July</li>
                <li>New Features in Our App</li>
                <li>Customer Success Story</li>
              </ul>
              <a href="#" style="display:inline-block; margin-top:10px; color:#007bff;">Explore All →</a>
            </td>
          </tr>

          <!-- Event -->
          <tr>
            <td style="padding: 20px;">
              <h3>📅 Upcoming Event</h3>
              <p>
                <strong>Webinar:</strong> Personal Finance 101<br/>
                <strong>Date:</strong> July 10th, 2025<br/>
              </p>
              <a href="#" style="display:inline-block; background:#28a745; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px;">Register Now</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; font-size: 12px; color: #777777; text-align: center;">
              <p>You’re receiving this email because you subscribed to FinEd.</p>
              <p>© {year} FinEd. All Rights Reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>"""

class EmailService:
    async def send_email(self, to_email: str, title: str, content: str):
        """Send a single templated HTML email asynchronously"""
        now = datetime.now()
        month_name = now.strftime("%B")  # e.g., "May"
        month_year = now.strftime("%B %Y")
        year = now.year

        # Format HTML template
        html_content = NEWSLETTER_TEMPLATE.format(
            month_year=month_year,
            title=title,
            content=content,
            year=year
        )

        message = MIMEMultipart("alternative")
        message["From"] = f'"FinEd" <{settings.SMTP_USER}>'
        message["To"] = to_email
        message["Subject"] = f"Your {month_name} Newsletter is Here! 🎉"

        # Attach text and html versions
        part1 = MIMEText(f"Your {month_name} Newsletter is Here! 🎉", "plain")
        part2 = MIMEText(html_content, "html")
        message.attach(part1)
        message.attach(part2)

        # Connect and send via TLS
        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=587,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=False,
            start_tls=True
        )

    async def send_bulk_newsletter(self, emails: list[str], title: str, content: str):
        """Send bulk emails concurrently using a semaphore to manage API load (Latency Win 3)"""
        semaphore = asyncio.Semaphore(5)  # Max 5 concurrent connections to be polite to Gmail

        async def send_with_limit(email: str):
            async with semaphore:
                try:
                    await self.send_email(email, title, content)
                    print(f"[SUCCESS] Newsletter email sent to: {email}")
                except Exception as e:
                    print(f"[ERROR] Failed to send email to {email}: {e}")

        # Send all concurrently (non-blocking)
        await asyncio.gather(*[send_with_limit(e) for e in emails])

email_service = EmailService()
