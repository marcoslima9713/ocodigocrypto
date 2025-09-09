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

// Função para criar/renovar assinatura semanal
async function createOrRenewWeeklySubscription(
  customerData: any, 
  productName: string, 
  transactionId: string,
  amount?: number,
  paymentMethod?: string
) {
  console.log(`🔄 Processando assinatura semanal para: ${customerData.email}`);
  
  // Verificar se usuário já existe
  const { data: existingMember, error: memberError } = await supabase
    .from("members")
    .select("*")
    .eq("email", customerData.email)
    .maybeSingle();

  let member;
  let isNewUser = false;

  if (existingMember) {
    console.log("👤 Usuário existente encontrado, renovando assinatura");
    
    // Renovar assinatura semanal
    const { data: subscriptionResult, error: subscriptionError } = await supabase
      .rpc('create_weekly_subscription', {
        _member_id: existingMember.id,
        _transaction_id: transactionId,
        _amount: amount,
        _payment_method: paymentMethod
      });

    if (subscriptionError) {
      console.error("Erro ao renovar assinatura:", subscriptionError);
      throw new Error(`Failed to renew subscription: ${subscriptionError.message}`);
    }

    // Atualizar dados do membro
    const { data: updatedMember, error: updateError } = await supabase
      .from("members")
      .update({
        product_name: productName,
        ggcheckout_transaction_id: transactionId,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingMember.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update member: ${updateError.message}`);
    }

    member = updatedMember;
    console.log("✅ Assinatura renovada com sucesso");
    
  } else {
    console.log("🆕 Criando novo usuário com assinatura semanal");
    
    // Verificar se usuário existe na autenticação
    const { data: authUserList, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error listing auth users:", authError);
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }

    const existingAuthUser = authUserList.users.find(user => user.email === customerData.email);
    
    let authUser;
    let plainPassword = null;

    if (existingAuthUser) {
      console.log("🔐 Usuário já existe na autenticação");
      authUser = existingAuthUser;
    } else {
      console.log("🔐 Criando novo usuário na autenticação");
      const password = generateRandomPassword();
      plainPassword = password;
      
      const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        email: customerData.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: customerData.name,
          product_name: productName,
          ggcheckout_transaction_id: transactionId
        }
      });

      if (createAuthError) {
        console.error("Error creating auth user:", createAuthError);
        throw new Error(`Failed to create auth user: ${createAuthError.message}`);
      }

      authUser = newAuthUser.user;
    }

    // Criar novo membro com assinatura semanal
    const passwordHash = await hashPassword(plainPassword || "temp_password");
    
    const { data: newMember, error: createMemberError } = await supabase
      .from("members")
      .insert({
        email: customerData.email,
        password_hash: passwordHash,
        full_name: customerData.name,
        product_name: productName,
        ggcheckout_transaction_id: transactionId,
        is_active: true,
        auth_user_id: authUser?.id,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        subscription_status: 'active',
        subscription_type: 'weekly',
        last_payment_date: new Date().toISOString(),
        payment_count: 1
      })
      .select()
      .single();

    if (createMemberError) {
      console.error("Error creating member:", createMemberError);
      throw new Error(`Failed to create member: ${createMemberError.message}`);
    }

    // Registrar pagamento
    const { error: paymentError } = await supabase
      .from("subscription_payments")
      .insert({
        member_id: newMember.id,
        transaction_id: transactionId,
        amount: amount,
        payment_method: paymentMethod,
        subscription_start_date: newMember.subscription_start_date,
        subscription_end_date: newMember.subscription_end_date,
        status: 'completed'
      });

    if (paymentError) {
      console.error("Error recording payment:", paymentError);
    }

    // Atribuir role de membro
    if (authUser?.id) {
      const { error: roleErr } = await supabase
        .from('user_roles')
        .upsert({ user_id: authUser.id, role: 'member' }, { onConflict: 'user_id' });
      
      if (roleErr) {
        console.error('Failed to assign member role:', roleErr);
      }
    }

    member = newMember;
    isNewUser = true;
    console.log("✅ Novo usuário criado com assinatura semanal");
  }

  return { member, plainPassword, isNewUser };
}

// Função para enviar email de renovação
async function sendRenewalEmail(memberData: any, isNewUser: boolean) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isNewUser ? '🚀 ACESSO LIBERADO' : '🔄 ASSINATURA RENOVADA'}</title>
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
    <body style="margin: 0; padding: 0; background-color: #121212; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #FFFFFF;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #121212;">
        <tr>
          <td align="center" style="padding: 0;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #121212;">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #1C1C1C; padding: 40px 30px; text-align: center; border-bottom: 3px solid #FF6A00;" class="mobile-padding">
                  <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: 2px; text-transform: uppercase;" class="mobile-text">
                    ${isNewUser ? '🚀 ACESSO LIBERADO' : '🔄 ASSINATURA RENOVADA'}
                  </h1>
                  <p style="margin: 15px 0 0 0; font-size: 18px; color: #FF6A00; font-weight: 500;" class="mobile-text">
                    ${isNewUser ? 'Bem-vindo ao seu conteúdo exclusivo' : 'Sua assinatura foi renovada com sucesso'}
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="background-color: #121212; padding: 40px 30px 20px;" class="mobile-padding">
                  <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #FFFFFF; font-weight: 600;" class="mobile-text">
                    Olá, ${memberData.full_name} 👋
                  </h2>
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #FFFFFF; line-height: 1.6;" class="mobile-text">
                    ${isNewUser 
                      ? 'Obrigado por adquirir o acesso ao nosso conteúdo premium. Sua assinatura semanal está ativa!'
                      : 'Sua assinatura semanal foi renovada com sucesso. Você tem mais 7 dias de acesso completo!'
                    }
                  </p>
                </td>
              </tr>
              
              <!-- Subscription Info -->
              <tr>
                <td style="background-color: #121212; padding: 0 30px 30px;" class="mobile-padding">
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1C1C1C; border-radius: 12px; border: 2px solid #FF6A00;">
                    <tr>
                      <td style="padding: 30px;" class="mobile-padding">
                        <h3 style="margin: 0 0 25px 0; font-size: 20px; color: #FF6A00; font-weight: 600; text-align: center;" class="mobile-text">
                          📅 Informações da Assinatura
                        </h3>
                        
                        <div style="margin-bottom: 20px;">
                          <p style="margin: 0 0 8px 0; font-size: 16px; color: #FFFFFF; font-weight: 600;">
                            📧 Email:
                          </p>
                          <div style="background-color: #121212; padding: 12px 16px; border-radius: 8px; border: 1px solid #333333;">
                            <span style="color: #FFFFFF; font-size: 16px; font-family: 'Courier New', Consolas, monospace; word-break: break-all;">${memberData.email}</span>
                          </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                          <p style="margin: 0 0 8px 0; font-size: 16px; color: #FFFFFF; font-weight: 600;">
                            ⏰ Válido até:
                          </p>
                          <div style="background-color: #121212; padding: 12px 16px; border-radius: 8px; border: 1px solid #333333;">
                            <span style="color: #FFFFFF; font-size: 16px; font-family: 'Courier New', Consolas, monospace;">${new Date(memberData.subscription_end_date).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <div style="background-color: #FF6A00; padding: 15px; border-radius: 8px; text-align: center;">
                          <p style="margin: 0; color: #FFFFFF; font-weight: 600; font-size: 14px;">
                            ⚠️ IMPORTANTE: Sua assinatura expira em 7 dias. Para continuar o acesso, você precisará renovar o pagamento.
                          </p>
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
                        <a href="https://hidden-market-revelation.vercel.app/login" 
                           style="display: inline-block; padding: 18px 32px; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;" 
                           class="mobile-button">
                          🔗 ACESSAR ÁREA EXCLUSIVA
                        </a>
                      </td>
                    </tr>
                  </table>
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

  // Enviar email via AWS SES (código simplificado)
  console.log(`📧 Enviando email de ${isNewUser ? 'boas-vindas' : 'renovação'} para: ${memberData.email}`);
  // Aqui você implementaria o envio real via AWS SES
}

async function logWebhook(webhookType: string, payload: any, status: string, errorMessage?: string) {
  try {
    await supabase.from("webhook_logs").insert({
      webhook_type: webhookType,
      payload,
      status,
      error_message: errorMessage
    });
  } catch (error) {
    console.error("Failed to log webhook:", error);
  }
}

const handler = async (req: Request) => {
  console.log(`[WEBHOOK WEEKLY] ${req.method} request received from ${req.headers.get('user-agent')}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[WEBHOOK WEEKLY] CORS preflight request handled");
    return new Response(null, {
      headers: corsHeaders
    });
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
      await logWebhook("ggcheckout-weekly", {}, "error", "Empty payload received");
      return new Response(JSON.stringify({
        error: "Empty payload"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
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
      let payloadForLog = {};
      try {
        payloadForLog = JSON.parse(payload);
      } catch (e) {
        payloadForLog = { raw_payload: payload };
      }
      await logWebhook("ggcheckout-weekly", payloadForLog, "error", "Invalid secret token");
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
      await logWebhook("ggcheckout-weekly", { raw_payload: payload }, "error", "Invalid JSON payload");
      return new Response(JSON.stringify({
        error: "Invalid JSON payload"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Validate webhook data structure
    if (!webhookData || typeof webhookData !== 'object') {
      console.error("Invalid webhook data structure:", webhookData);
      await logWebhook("ggcheckout-weekly", webhookData || {}, "error", "Invalid webhook data structure");
      return new Response(JSON.stringify({
        error: "Invalid webhook data structure"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Validate required customer data exists before processing
    if (!webhookData.customer?.email || !webhookData.customer?.name) {
      console.error("Missing required customer data:", {
        customer: webhookData.customer,
        hasEmail: !!webhookData.customer?.email,
        hasName: !!webhookData.customer?.name
      });
      await logWebhook("ggcheckout-weekly", webhookData, "error", "Missing required customer data (email or name)");
      return new Response(JSON.stringify({
        error: "Missing required customer data"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    console.log("Webhook data:", webhookData);
    await logWebhook("ggcheckout-weekly", webhookData, "received");

    // Process payment approved events - support multiple event types
    const isApprovedEvent = webhookData.event === "pagamento_aprovado" || 
                           webhookData.event === "pix.paid" || 
                           webhookData.status === "approved" || 
                           webhookData.payment?.status === "approved" || 
                           webhookData.payment?.status === "paid";

    if (isApprovedEvent) {
      console.log("Processing approved payment for:", webhookData.customer.email);
      
      // Get transaction ID - can be from different fields
      const transactionId = webhookData.transaction_id || 
                           webhookData.payment?.id || 
                           webhookData.webhook?.id || 
                           `${webhookData.customer.email}_${Date.now()}`;
      
      console.log("Transaction ID:", transactionId);

      // Get product name from different possible fields
      const productName = webhookData.product?.name || 
                         `Product_${webhookData.product?.id}` || 
                         "Assinatura Semanal Premium";

      // Get amount and payment method
      const amount = webhookData.amount || webhookData.payment?.amount;
      const paymentMethod = webhookData.payment?.method || "unknown";

      // Create or renew weekly subscription
      const { member, plainPassword, isNewUser } = await createOrRenewWeeklySubscription(
        webhookData.customer,
        productName,
        transactionId,
        amount,
        paymentMethod
      );

      console.log(`✅ ${isNewUser ? 'New user created' : 'Subscription renewed'} successfully:`, member.email);

      // Send email notification
      await sendRenewalEmail(member, isNewUser);
      console.log(`📧 Email sent to: ${member.email}`);

      // Log success
      await logWebhook("ggcheckout-weekly", webhookData, "processed");

      return new Response(JSON.stringify({
        success: true,
        message: isNewUser ? "New user created with weekly subscription" : "Weekly subscription renewed",
        member_id: member.id,
        subscription_end: member.subscription_end_date,
        is_new_user: isNewUser
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });

    } else {
      console.log("Event not processed:", webhookData.event);
      await logWebhook("ggcheckout-weekly", webhookData, "ignored", `Event ${webhookData.event} not processed`);
      return new Response(JSON.stringify({
        success: true,
        message: "Event ignored"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

  } catch (error) {
    console.error("Webhook processing error:", error);
    try {
      await logWebhook("ggcheckout-weekly", {}, "error", error.message);
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};

serve(handler);
