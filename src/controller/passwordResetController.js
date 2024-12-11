const usuarioModel = require('../model/usuarioModal');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const md5 = require('md5');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'reppsi.psicologia@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Store verification codes temporarily (in production, use a database)
const verificationCodes = new Map();

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await usuarioModel.buscarUsuarioPorEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email não cadastrado'
      });
    }

    // Generate verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    
    // Store the code with expiration (15 minutes)
    verificationCodes.set(email, {
      code: verificationCode,
      expiry: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    // Send email
    const mailOptions = {
      from: '"REPPSI" <reppsi.psicologia@gmail.com>',
      to: email,
      subject: 'Código de Recuperação de Senha - REPPSI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2B6CB0;">Recuperação de Senha</h2>
          <p>Olá,</p>
          <p>Seu código de verificação é:</p>
          <h1 style="color: #2B6CB0; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
          <p>Este código expira em 15 minutos.</p>
          <p style="color: #718096; font-size: 12px;">Se você não solicitou esta recuperação de senha, ignore este email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Código de verificação enviado para seu email'
    });

  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação'
    });
  }
};

exports.verifyCodeAndResetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Check if verification code exists and is valid
    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificação não encontrado'
      });
    }

    // Check if code has expired
    if (Date.now() > storedData.expiry) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Código de verificação expirado'
      });
    }

    // Verify code
    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificação inválido'
      });
    }

    // Update password
    const hashedPassword = md5(newPassword);
    await usuarioModel.atualizarSenha(email, hashedPassword);

    // Clear verification code
    verificationCodes.delete(email);

    res.status(200).json({
      success: true,
      message: 'Senha atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação'
    });
  }
}; 