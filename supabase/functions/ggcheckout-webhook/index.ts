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
      <title>Bem-vindo à Área Premium! ✨</title>
    </head>
    <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #2c2c2c; max-width: 650px; margin: 0 auto; padding: 0; background: #1a1a1a;">
      <!-- Header with Premium Golden Design -->
      <div style="background: linear-gradient(135deg, #c9a961 0%, #f4e79d 50%, #c9a961 100%); color: #1a1a1a; padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="50" cy="50" r="0.5" fill="%23ffffff" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); opacity: 0.3;"></div>
        <div style="position: relative; z-index: 1;">
          <h1 style="margin: 0; font-size: 36px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: 1px;">✨ BEM-VINDO AO PREMIUM</h1>
          <p style="margin: 15px 0 0 0; font-size: 20px; opacity: 0.9; font-style: italic;">Seu acesso exclusivo foi liberado!</p>
        </div>
      </div>
      
      <!-- Main Content -->
      <div style="background: linear-gradient(135deg, #2c2c2c 0%, #3d3d3d 100%); padding: 40px 30px; color: #f5f5f5;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #f4e79d; font-size: 24px; margin: 0 0 10px 0; font-weight: normal;">Olá, <span style="color: #c9a961; font-weight: bold;">${memberData.full_name}</span></h2>
          <p style="font-size: 16px; margin: 0; opacity: 0.9;">
            Obrigado por adquirir o <strong style="color: #f4e79d;">${memberData.product_name}</strong>
          </p>
        </div>
        
        <!-- Access Credentials Card -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%); padding: 30px; border-radius: 15px; border: 2px solid #c9a961; margin: 30px 0; box-shadow: 0 8px 25px rgba(201, 169, 97, 0.2);">
          <h3 style="margin-top: 0; color: #f4e79d; font-size: 20px; text-align: center; margin-bottom: 25px;">🔑 Seus Dados de Acesso Premium</h3>
          
          <div style="background: rgba(201, 169, 97, 0.1); padding: 20px; border-radius: 10px; border-left: 4px solid #c9a961;">
            <p style="margin: 0 0 15px 0; font-size: 16px;">
              <span style="color: #f4e79d; font-weight: bold;">📧 Login:</span><br>
              <span style="color: #ffffff; font-size: 18px; font-family: monospace; background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 6px; display: inline-block; margin-top: 5px;">${memberData.email}</span>
            </p>
            <p style="margin: 0; font-size: 16px;">
              <span style="color: #f4e79d; font-weight: bold;">🔐 Senha:</span><br>
              <span style="color: #ffffff; font-size: 18px; font-family: monospace; background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 6px; display: inline-block; margin-top: 5px; letter-spacing: 1px;">${password}</span>
            </p>
          </div>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="https://preview--crypto-luxe-portal.lovable.app/login" 
             style="background: linear-gradient(135deg, #c9a961 0%, #f4e79d 50%, #c9a961 100%); 
                    color: #1a1a1a; 
                    padding: 18px 40px; 
                    text-decoration: none; 
                    border-radius: 50px; 
                    font-weight: bold; 
                    display: inline-block; 
                    font-size: 18px; 
                    text-transform: uppercase; 
                    letter-spacing: 1px;
                    box-shadow: 0 8px 25px rgba(201, 169, 97, 0.3);
                    transition: all 0.3s ease;">
            ✨ ACESSAR ÁREA PREMIUM
          </a>
        </div>
        
        <!-- Divider -->
        <div style="border-top: 1px solid #c9a961; margin: 40px 0; opacity: 0.5;"></div>
        
        <!-- Security Notice -->
        <div style="background: rgba(201, 169, 97, 0.05); padding: 25px; border-radius: 10px; border: 1px solid rgba(201, 169, 97, 0.2); text-align: center;">
          <p style="color: #f4e79d; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">
            🛡️ IMPORTANTE - ACESSO SEGURO
          </p>
          <p style="color: #f5f5f5; font-size: 14px; margin: 0; opacity: 0.9;">
            Guarde seus dados de acesso em local seguro. Este é seu passaporte para o conteúdo premium.<br>
            <span style="color: #c9a961;">Em caso de dúvidas, nossa equipe está pronta para ajudar.</span>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(201, 169, 97, 0.3);">
          <p style="color: #c9a961; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">
            Aproveite sua jornada premium! 🚀
          </p>
          <p style="color: #f5f5f5; font-size: 14px; margin: 0; opacity: 0.8;">
            <strong style="color: #f4e79d;">Equipe Premium</strong>
          </p>
        </div>
      </div>
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
        Data: 'Seu acesso foi liberado! 🎉',
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

  // Convert to form data format for SES API
  const formData = new URLSearchParams();
  formData.append('Action', 'SendEmail');
  formData.append('Version', '2010-12-01');
  formData.append('Source', emailData.Source);
  formData.append('Destination.ToAddresses.member.1', memberData.email);
  formData.append('Message.Subject.Data', emailData.Message.Subject.Data);
  formData.append('Message.Subject.Charset', 'UTF-8');
  formData.append('Message.Body.Html.Data', emailData.Message.Body.Html.Data);
  formData.append('Message.Body.Html.Charset', 'UTF-8');
  formData.append('Message.Body.Text.Data', emailData.Message.Body.Text.Data);
  formData.append('Message.Body.Text.Charset', 'UTF-8');

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