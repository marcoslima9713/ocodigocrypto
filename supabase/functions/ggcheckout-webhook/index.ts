import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

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

// Get webhook secret
const webhookSecret = Deno.env.get("GGCHECKOUT_WEBHOOK_SECRET");

interface GGCheckoutWebhookPayload {
  event: string;
  transaction_id?: string;
  customer: {
    name: string;
    email: string;
  };
  product?: {
    id?: string;
    name?: string;
    type?: string;
  };
  payment?: {
    id?: string;
    method?: string;
    status?: string;
    amount?: number;
  };
  amount?: number;
  status?: string;
  webhook?: any;
  params?: any;
  createdAt?: any;
}

function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
  if (!webhookSecret) {
    console.error("Webhook secret not configured");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const messageData = encoder.encode(payload);

    // Import the secret key
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Generate HMAC signature
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, "0")).join("");
    
    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace("sha256=", "").toLowerCase();
    
    return expectedSignature === cleanSignature;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

async function createMember(customerData: any, productName: string, transactionId: string) {
  const password = generateRandomPassword();
  const passwordHash = await hashPassword(password);

  // Insert new member
  const { data: member, error } = await supabase
    .from("members")
    .insert({
      email: customerData.email,
      password_hash: passwordHash,
      full_name: customerData.name,
      product_name: productName,
      ggcheckout_transaction_id: transactionId,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create member: ${error.message}`);
  }

  return { member, plainPassword: password };
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
  
  const finalKey = await crypto.subtle.importKey('raw', new Uint8Array(signature), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const finalSignature = await crypto.subtle.sign('HMAC', finalKey, encoder.encode(stringToSign));
  
  return Array.from(new Uint8Array(finalSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendWelcomeEmail(memberData: any, password: string) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🚀 ACESSO LIBERADO</title>
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
                    🚀 ACESSO LIBERADO
                  </h1>
                  <p style="margin: 15px 0 0 0; font-size: 18px; color: #FF6A00; font-weight: 500;" class="mobile-text">
                    Bem-vindo ao seu conteúdo exclusivo
                  </p>
                </td>
              </tr>
              
              <!-- Greeting Block -->
              <tr>
                <td style="background-color: #121212; padding: 40px 30px 20px;" class="mobile-padding">
                  <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #FFFFFF; font-weight: 600;" class="mobile-text">
                    Olá, ${memberData.full_name} 👋
                  </h2>
                  <p style="margin: 0; font-size: 16px; color: #FFFFFF; line-height: 1.6;" class="mobile-text">
                    Obrigado por adquirir o acesso ao nosso conteúdo premium. Aqui estão suas credenciais de entrada:
                  </p>
                </td>
              </tr>
              
              <!-- Credentials Card -->
              <tr>
                <td style="background-color: #121212; padding: 0 30px 30px;" class="mobile-padding">
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1C1C1C; border-radius: 12px; border: 2px solid #FF6A00;">
                    <tr>
                      <td style="padding: 30px;" class="mobile-padding">
                        <h3 style="margin: 0 0 25px 0; font-size: 20px; color: #FF6A00; font-weight: 600; text-align: center;" class="mobile-text">
                          🔐 Suas Credenciais
                        </h3>
                        
                        <div style="margin-bottom: 20px;">
                          <p style="margin: 0 0 8px 0; font-size: 16px; color: #FFFFFF; font-weight: 600;">
                            📧 Login:
                          </p>
                          <div style="background-color: #121212; padding: 12px 16px; border-radius: 8px; border: 1px solid #333333;">
                            <span style="color: #FFFFFF; font-size: 16px; font-family: 'Courier New', Consolas, monospace; word-break: break-all;">${memberData.email}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p style="margin: 0 0 8px 0; font-size: 16px; color: #FFFFFF; font-weight: 600;">
                            🔐 Senha:
                          </p>
                          <div style="background-color: #121212; padding: 12px 16px; border-radius: 8px; border: 1px solid #333333;">
                            <span style="color: #FFFFFF; font-size: 16px; font-family: 'Courier New', Consolas, monospace; letter-spacing: 2px; word-break: break-all;">${password}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Access Button -->
              <tr>
                <td style="background-color: #121212; padding: 0 30px 40px; text-align: center;" class="mobile-padding">
                  <table role="presentation" style="margin: 0 auto;">
                    <tr>
                      <td style="border-radius: 8px; background-color: #FF6A00;">
                        <a href="https://preview--crypto-luxe-portal.lovable.app/login" 
                           style="display: inline-block; padding: 18px 32px; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;" 
                           class="mobile-button">
                          🔗 ACESSAR ÁREA EXCLUSIVA
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
                      ⚠️ Guarde seus dados com segurança. Para suporte, entre em contato conosco.
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
      ToAddresses: [memberData.email]
    },
    Message: {
      Subject: {
        Data: '🚀 ACESSO LIBERADO - Suas credenciais estão prontas!',
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: emailHtml,
          Charset: 'UTF-8'
        },
        Text: {
          Data: `Olá ${memberData.full_name}! Seu acesso premium foi liberado. Login: ${memberData.email} | Senha: ${password} | Acesse: https://preview--crypto-luxe-portal.lovable.app/login`,
          Charset: 'UTF-8'
        }
      }
    }
  };

  // Convert to form data format for SES API - Fixed format
  const formData = new URLSearchParams();
  formData.append('Action', 'SendEmail');
  formData.append('Version', '2010-12-01');
  formData.append('Source', emailData.Source);
  formData.append('Destination.ToAddresses.member.1', memberData.email);
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
  
  // Prepare headers for signature calculation (without Authorization)
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
  console.log("Email sent successfully via AWS SES:", result);
}

async function logWebhook(webhookType: string, payload: any, status: string, errorMessage?: string) {
  await supabase
    .from("webhook_logs")
    .insert({
      webhook_type: webhookType,
      payload,
      status,
      error_message: errorMessage,
    });
}

const handler = async (req: Request): Promise<Response> => {
  console.log(`[WEBHOOK] ${req.method} request received from ${req.headers.get('user-agent')}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[WEBHOOK] CORS preflight request handled");
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const payload = await req.text();
    
    // Validate payload is not empty
    if (!payload || payload.trim() === '') {
      console.error("Empty payload received");
      await logWebhook("ggcheckout", {}, "error", "Empty payload received");
      
      return new Response(JSON.stringify({ error: "Empty payload" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Get Bearer token from authorization header
    const authHeader = req.headers.get("authorization") || "";
    console.log("Received authorization header:", authHeader);
    console.log("Webhook secret configured:", !!webhookSecret);

    // Validate Bearer token
    const token = authHeader.replace("Bearer ", "").trim();
    if (token !== webhookSecret) {
      console.error("Invalid webhook secret token");
      console.error("Expected secret:", webhookSecret);
      console.error("Received token:", token);
      
      let payloadForLog = {};
      try {
        payloadForLog = JSON.parse(payload);
      } catch (e) {
        payloadForLog = { raw_payload: payload };
      }
      
      await logWebhook("ggcheckout", payloadForLog, "error", "Invalid secret token");
      
      return new Response("Unauthorized", { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    let webhookData: GGCheckoutWebhookPayload;
    try {
      webhookData = JSON.parse(payload);
    } catch (parseError) {
      console.error("Failed to parse JSON payload:", parseError);
      await logWebhook("ggcheckout", { raw_payload: payload }, "error", "Invalid JSON payload");
      
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate webhook data structure
    if (!webhookData || typeof webhookData !== 'object') {
      console.error("Invalid webhook data structure:", webhookData);
      await logWebhook("ggcheckout", webhookData || {}, "error", "Invalid webhook data structure");
      
      return new Response(JSON.stringify({ error: "Invalid webhook data structure" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate required customer data exists before processing
    if (!webhookData.customer?.email || !webhookData.customer?.name) {
      console.error("Missing required customer data:", { 
        customer: webhookData.customer,
        hasEmail: !!webhookData.customer?.email,
        hasName: !!webhookData.customer?.name
      });
      await logWebhook("ggcheckout", webhookData, "error", "Missing required customer data (email or name)");
      
      return new Response(JSON.stringify({ error: "Missing required customer data" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    console.log("Webhook data:", webhookData);

    // Log the webhook
    await logWebhook("ggcheckout", webhookData, "received");

    console.log("Event type:", webhookData.event);
    console.log("Payment status:", webhookData.payment?.status);
    console.log("Payment method:", webhookData.payment?.method);

    // Process payment approved events - support multiple event types
    const isApprovedEvent = webhookData.event === "pagamento_aprovado" || 
                           webhookData.event === "pix.paid" ||  // pix.paid is already an approved event
                           webhookData.status === "approved" ||
                           (webhookData.payment?.status === "approved" || webhookData.payment?.status === "paid");

    if (isApprovedEvent) {
      console.log("Processing approved payment for:", webhookData.customer.email);

      // Get transaction ID - can be from different fields
      const transactionId = webhookData.transaction_id || 
                           webhookData.payment?.id || 
                           webhookData.webhook?.id ||
                           `${webhookData.customer.email}_${Date.now()}`;

      console.log("Transaction ID:", transactionId);

      // Check if member already exists based on transaction ID first (prevent duplicates)
      const { data: existingMemberByTransaction } = await supabase
        .from("members")
        .select("*")
        .eq("ggcheckout_transaction_id", transactionId)
        .maybeSingle();

      if (existingMemberByTransaction) {
        console.log("Member already exists for transaction:", transactionId);
        await logWebhook("ggcheckout", webhookData, "skipped", "Transaction already processed");
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Transaction already processed" 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Also check if member already exists based on email (secondary check)
      const { data: existingMemberByEmail } = await supabase
        .from("members")
        .select("*")
        .eq("email", webhookData.customer.email)
        .maybeSingle();

      if (existingMemberByEmail) {
        console.log("Member already exists for email:", webhookData.customer.email);
        await logWebhook("ggcheckout", webhookData, "skipped", "Member already exists");
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Member already exists" 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Get product name from different possible fields
      const productName = webhookData.product?.name || 
                         `Product_${webhookData.product?.id}` ||
                         "Default Product";

      console.log("Product name:", productName);

      // Create new member
      const { member, plainPassword } = await createMember(
        webhookData.customer,
        productName,
        transactionId
      );

      console.log("Member created successfully:", member.email);

      // Send welcome email
      await sendWelcomeEmail(member, plainPassword);
      console.log("Welcome email sent to:", member.email);

      // Log success
      await logWebhook("ggcheckout", webhookData, "processed");

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Member created and email sent",
        member_id: member.id
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else {
      console.log("Event not processed:", webhookData.event);
      await logWebhook("ggcheckout", webhookData, "ignored", `Event ${webhookData.event} not processed`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Event ignored" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    
    // Try to log the error
    try {
      await logWebhook("ggcheckout", {}, "error", error.message);
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);