def get_base_html(title: str, content_html: str, user_email: str = None) -> str:
    logo_url = "https://res.cloudinary.com/dq6vf9rhv/image/upload/v1786615493/UniGPU_Logo_Dark_Transparent-01_yler0d.png"
    
    user_section = ""
    if user_email:
        initial = user_email[0].upper()
        user_section = f"""
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
            <tr>
                <td width="48" valign="middle">
                    <div style="width: 40px; height: 40px; background-color: #007aff; color: #ffffff; border-radius: 50%; text-align: center; line-height: 40px; font-weight: bold; font-size: 18px; font-family: 'Manrope', -apple-system, sans-serif;">
                        {initial}
                    </div>
                </td>
                <td valign="middle" style="padding-left: 12px;">
                    <div style="font-size: 14px; font-weight: 600; color: #111827; font-family: 'Manrope', -apple-system, sans-serif;">UniGPU Account</div>
                    <div style="font-size: 12px; color: #6b7280; font-family: 'Manrope', -apple-system, sans-serif;">{user_email}</div>
                </td>
                <td align="right" valign="middle">
                    <a href="https://unigpu.com/login" style="display: inline-block; padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 4px; color: #374151; font-weight: 600; font-size: 12px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Manrope', -apple-system, sans-serif;">Sign In</a>
                </td>
            </tr>
        </table>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); text-align: left;">
                    <tr>
                        <td>
                            <div style="margin-bottom: 32px;">
                                <img src="{logo_url}" alt="UniGPU" style="width: 48px; height: auto; vertical-align: middle; display: inline-block;">
                                <span style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0F0F0F; font-weight:700; font-size:24px; vertical-align: middle; margin-left:8px;">UniGPU</span>
                            </div>
                            
                            {content_html}
                            {user_section}
                            
                            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                            
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <div style="margin-bottom: 16px;">
                                            <img src="{logo_url}" alt="UniGPU" style="width: 32px; height: auto; vertical-align: middle; display: inline-block;">
                                            <span style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#374151; font-weight:600; font-size:18px; vertical-align: middle; margin-left:8px;">UniGPU India</span>
                                        </div>
                                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 16px;">
                                            <a href="https://unigpu.com/about" style="color: #6b7280; text-decoration: underline; margin-right: 12px;">About Us</a>
                                            <a href="https://unigpu.com/legal" style="color: #6b7280; text-decoration: underline; margin-right: 12px;">Policies</a>
                                            <a href="https://unigpu.com/support" style="color: #6b7280; text-decoration: underline; margin-right: 12px;">Support</a>
                                            <a href="https://www.linkedin.com/company/unigpu" style="color: #6b7280; text-decoration: underline;">LinkedIn</a>
                                        </div>
                                        <div style="font-size: 12px; color: #9ca3af; line-height: 18px;">
                                            &copy; { {2026} } UniGPU Platform.<br>
                                            All rights reserved.
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""


def get_password_reset_html(reset_url: str, user_email: str = None) -> str:
    content = f"""
    <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">Reset your password</h1>
    <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0;">
        You told us you forgot your password. If you really did, click here to choose a new one:
    </p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
        <tr>
            <td align="left">
                <a href="{reset_url}" style="display: inline-block; background-color: #06060c; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 16px 32px; border-radius: 6px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; width: 100%; box-sizing: border-box;">Reset Password</a>
            </td>
        </tr>
    </table>
    
    <p style="font-size: 14px; line-height: 22px; color: #374151; margin: 0 0 16px 0;">
        If you didn't mean to reset your password, then you can just ignore this email; your password will not change.
    </p>
    <p style="font-size: 14px; line-height: 22px; color: #374151; margin: 0 0 32px 0;">
        If you have any questions, we're happy to help. Please reach out to us at <a href="mailto:support@unigpu.com" style="color: #2563eb; text-decoration: underline;">support@unigpu.com</a>.
    </p>
    
    <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">"Choose a new password" button not working?</div>
    <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Just copy and paste this link in your browser:</div>
    <a href="{reset_url}" style="font-size: 13px; color: #2563eb; word-break: break-all; text-decoration: underline;">{reset_url}</a>
    """
    
    return get_base_html("Reset your UniGPU password", content, user_email).replace("{ {2026} }", "2026")


def get_email_verification_html(verify_url: str, user_email: str = None) -> str:
    content = f"""
    <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">Verify your email</h1>
    <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0;">
        Welcome to UniGPU! We're excited to have you on board. Please verify your email address to activate your account and get started.
    </p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
        <tr>
            <td align="left">
                <a href="{verify_url}" style="display: inline-block; background-color: #06060c; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 16px 32px; border-radius: 6px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; width: 100%; box-sizing: border-box;">Verify Email Address</a>
            </td>
        </tr>
    </table>
    
    <p style="font-size: 14px; line-height: 22px; color: #374151; margin: 0 0 16px 0;">
        If you didn't create an account with UniGPU, you can safely ignore this email.
    </p>
    <p style="font-size: 14px; line-height: 22px; color: #374151; margin: 0 0 32px 0;">
        If you have any questions, we're happy to help. Please reach out to us at <a href="mailto:support@unigpu.com" style="color: #2563eb; text-decoration: underline;">support@unigpu.com</a>.
    </p>
    
    <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">"Verify Email Address" button not working?</div>
    <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Just copy and paste this link in your browser:</div>
    <a href="{verify_url}" style="font-size: 13px; color: #2563eb; word-break: break-all; text-decoration: underline;">{verify_url}</a>
    """
    
    return get_base_html("Verify your UniGPU email", content, user_email).replace("{ {2026} }", "2026")
