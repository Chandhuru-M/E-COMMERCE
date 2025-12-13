const MerchantRequest = require("../models/merchantRequestModel");
const Merchant = require("../models/merchantModel");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

// Submit merchant request (public route)
exports.submitRequest = async (req, res) => {
  try {
    const { ownerName, storeName, email, phone, licenseNumber } = req.body;

    // Check if email already exists
    const existingRequest = await MerchantRequest.findOne({ email });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Request with this email already exists' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const request = await MerchantRequest.create({
      ownerName,
      storeName,
      email,
      phone,
      licenseNumber,
      status: 'pending'
    });

    res.status(201).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all pending requests (admin only)
exports.getRequests = async (req, res) => {
  try {
    const data = await MerchantRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve merchant request (admin only)
exports.approveRequest = async (req, res) => {
  try {
    const request = await MerchantRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    // Generate temporary password
    const password = Math.random().toString(36).slice(-8);

    // Create user account
    const user = await User.create({
      name: request.ownerName,
      email: request.email,
      password,
      role: "merchant_admin"
    });

    // Create merchant record
    const merchant = await Merchant.create({
      storeName: request.storeName,
      email: request.email,
      userId: user._id,
      status: "ACTIVE"
    });

    // Update request status
    request.status = "approved";
    request.merchantId = merchant._id;
    await request.save();

    // Send email to merchant with credentials
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to HIcart!</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Dear <strong>${request.ownerName}</strong>,</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Congratulations! Your merchant request for <strong style="color: #667eea;">${request.storeName}</strong> has been approved.</p>
          
          <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #333; font-size: 18px;">🔐 Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #555; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; color: #333;">${request.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555; font-weight: bold;">Password:</td>
                <td style="padding: 8px 0;"><code style="background: #fff; padding: 8px 15px; border-radius: 5px; font-size: 16px; font-weight: bold; color: #667eea; border: 2px dashed #667eea;">${password}</code></td>
              </tr>
            </table>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${frontendUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">Login to Dashboard</a>
            </div>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⚠️ Security Notice:</strong> Please change your password immediately after first login for security purposes.</p>
          </div>
          
          <h3 style="color: #333; font-size: 18px; margin-top: 30px;">✨ What you can do now:</h3>
          <ul style="color: #555; line-height: 1.8; font-size: 15px;">
            <li>📊 Access your personalized <strong>Merchant Dashboard</strong></li>
            <li>🛒 Use the <strong>POS System</strong> for in-store sales</li>
            <li>📦 Manage your <strong>product inventory</strong></li>
            <li>📈 View detailed <strong>sales analytics</strong></li>
            <li>🎯 Process customer orders efficiently</li>
            <li>👥 Track customer loyalty points</li>
          </ul>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center;">
            <p style="color: #888; font-size: 14px; margin: 5px 0;">Need help? Contact our support team</p>
            <p style="color: #888; font-size: 14px; margin: 5px 0;">📧 support@hicart.com | 📞 1-800-HICART</p>
          </div>
          
          <p style="margin-top: 30px; color: #555; font-size: 15px;">Best regards,<br><strong style="color: #667eea;">${process.env.SMTP_FROM_NAME} Team</strong></p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© 2025 HIcart. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: request.email,
        subject: '🎉 Merchant Account Approved - Access Your Dashboard',
        html: emailHtml
      });
      console.log(`Approval email sent to ${request.email}`);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      success: true, 
      message: 'Merchant approved and credentials sent via email',
      password, 
      email: request.email,
      merchantId: merchant._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject merchant request (admin only)
exports.rejectRequest = async (req, res) => {
  try {
    const request = await MerchantRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = "rejected";
    await request.save();

    res.json({ success: true, message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
