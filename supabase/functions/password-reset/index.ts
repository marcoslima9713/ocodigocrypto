import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize AWS SES
const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
const awsRegion = Deno.env.get("AWS_REGION");

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetToken {
  email: string;
  token: string;
  expires_at: string;
}

// AWS SES signature generation
async function generateAwsSignature(method: string, url: string, headers: Record<string, string>, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Create canonical request
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
    .join('');
  
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';');
  
  const hashedPayload = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(payload))))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const urlObj = new URL(url);
  const queryString = urlObj.search ? urlObj.search.slice(1) : '';
  const canonicalRequest = `${method}\n${urlObj.pathname}\n${queryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
  
  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const timestamp = headers['X-Amz-Date'] || headers['x-amz-date'];
  
  if (!timestamp) {
    throw new Error('Missing X-Amz-Date header');
  }
  
  const credentialScope = `${timestamp.slice(0, 8)}/${awsRegion}/ses/aws4_request`;
  
  const hashedCanonicalRequest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest))))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
  
  // Calculate signature
  const dateKey = await crypto.subtle.importKey('raw', encoder.encode(`AWS4${awsSecretAccessKey}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const dateSignature = await crypto.subtle.sign('HMAC', dateKey, encoder.encode(timestamp.slice(0, 8)));
  
  const regionKey = await crypto.subtle.importKey('raw', new Uint8Array(dateSignature), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const regionSignature = await crypto.subtle.sign('HMAC', regionKey, encoder.encode(awsRegion));
  
  const serviceKey = await crypto.subtle.importKey('raw', new Uint8Array(regionSignature), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const serviceSignature = await crypto.subtle.sign('HMAC', serviceKey, encoder.encode('ses'));
  
  const signingKey = await crypto.subtle.importKey('raw', new Uint8Array(serviceSignature), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', signingKey, encoder.encode('aws4_request'));
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate secure token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Send password reset email via AWS SES
async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `https://preview--crypto-luxe-portal.lovable.app/reset-password?token=${resetToken}`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔐 Redefinir Senha</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        @media only screen and (max-width: 600px) {
          .mobile-hidden { display: none !important; }
          .mobile-center { text-align: center !important; }
          .mobile-full { width: 100% !important; }
          .mobile-padding { padding: 20px !important; }
          .mobile-text { font-size: 16px !important; }
          .mobile-button { padding: 15px 25px !important; font-size: 16px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #121212; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #FFFFFF; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #121212;">
        <tr>
          <td align="center" style="padding: 0;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #121212;">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #1C1C1C; padding: 40px 30px; text-align: center; border-bottom: 3px solid #FF6A00;" class="mobile-padding">
                  <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: 2px; text-transform: uppercase;" class="mobile-text">
                    🔐 Redefinir Senha
                  </h1>
                  <p style="margin: 15px 0 0 0; font-size: 18px; color: #FF6A00; font-weight: 500;" class="mobile-text">
                    Acesso seguro à sua conta
                  </p>
                </td>
              </tr>
              
              <!-- Greeting Block -->
              <tr>
                <td style="background-color: #121212; padding: 40px 30px 20px;" class="mobile-padding">
                  <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #FFFFFF; font-weight: 600;" class="mobile-text">
                    Olá!
                  </h2>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #CCCCCC; line-height: 1.6;" class="mobile-text">
                    Recebemos uma solicitação para redefinir a senha da sua conta. Se você não fez essa solicitação, pode ignorar este email com segurança.
                  </p>
                  <p style="margin: 0 0 30px 0; font-size: 16px; color: #CCCCCC; line-height: 1.6;" class="mobile-text">
                    Para redefinir sua senha, clique no botão abaixo:
                  </p>
                </td>
              </tr>
              
              <!-- Reset Button -->
              <tr>
                <td style="background-color: #121212; padding: 0 30px 40px; text-align: center;" class="mobile-padding">
                  <table role="presentation" style="margin: 0 auto;">
                    <tr>
                      <td style="border-radius: 8px; background-color: #FF6A00;">
                        <a href="${resetUrl}" 
                           style="display: inline-block; padding: 18px 32px; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;" 
                           class="mobile-button">
                          🔗 Redefinir Senha
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Security Notice -->
              <tr>
                <td style="background-color: #121212; padding: 0 30px 30px;" class="mobile-padding">
                  <div style="background-color: #1C1C1C; padding: 20px; border-radius: 8px; border-left: 4px solid #FF6A00;">
                    <p style="margin: 0; font-size: 14px; color: #CCCCCC; line-height: 1.5;" class="mobile-text">
                      ⚠️ Este link é válido por 1 hora. Por segurança, não compartilhe este email com ninguém.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #1C1C1C; padding: 30px; text-align: center; border-top: 1px solid #333333;" class="mobile-padding">
                  <p style="margin: 0; font-size: 12px; color: #888888; font-weight: 400;">
                    © 2025 Equipe . Todos os direitos reservados.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Prepare email data for SES
  const emailData = {
    Source: 'noreply@investidorcrypto.com',
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Subject: {
        Data: '🔐 Redefinir Senha - Acesso à sua conta',
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: emailHtml,
          Charset: 'UTF-8'
        },
        Text: {
          Data: `Olá! Para redefinir sua senha, acesse: ${resetUrl}. Este link é válido por 1 hora.`,
          Charset: 'UTF-8'
        }
      }
    }
  };

  // Convert to form data format for SES API
  const formData = new URLSearchParams();
  formData.append('Action', 'SendEmail');
  formData.append('Version', '2010-12-01');
  formData.append('Source', emailData.Source);
  formData.append('Destination.ToAddresses.member.1', email);
  formData.append('Message.Subject.Data', emailData.Message.Subject.Data);
  formData.append('Message.Subject.Charset', emailData.Message.Subject.Charset);
  formData.append('Message.Body.Html.Data', emailData.Message.Body.Html.Data);
  formData.append('Message.Body.Html.Charset', emailData.Message.Body.Html.Charset);
  formData.append('Message.Body.Text.Data', emailData.Message.Body.Text.Data);
  formData.append('Message.Body.Text.Charset', emailData.Message.Body.Text.Charset);

  const payload = formData.toString();
  const url = `https://email.${awsRegion}.amazonaws.com/`;
  
  // Create timestamp in correct AWS format
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  
  // Prepare headers for signature calculation
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Host': `email.${awsRegion}.amazonaws.com`,
    'X-Amz-Date': timestamp
  };
  
  // Generate signature
  const signature = await generateAwsSignature('POST', url, headers, payload);
  
  // Create authorization header
  const credentialScope = `${timestamp.slice(0, 8)}/${awsRegion}/ses/aws4_request`;
  const signedHeaders = Object.keys(headers).map(key => key.toLowerCase()).sort().join(';');
  
  // Add authorization header AFTER calculating signature
  headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${awsAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  // Send email using AWS SES
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: payload
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("AWS SES API error:", errorData);
    throw new Error(`Failed to send email via AWS SES: ${response.status} - ${errorData}`);
  }

  const result = await response.text();
  console.log("Password reset email sent successfully via AWS SES:", result);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json() as PasswordResetRequest;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('members')
      .select('email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Email não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate secure token
    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    return new Response(
      JSON.stringify({ 
        message: 'Email de redefinição de senha enviado com sucesso',
        success: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 