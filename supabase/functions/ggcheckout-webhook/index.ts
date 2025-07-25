import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Resend
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Get webhook secret
const webhookSecret = Deno.env.get("GGCHECKOUT_WEBHOOK_SECRET");

interface GGCheckoutWebhookPayload {
  event: string;
  transaction_id: string;
  customer: {
    name: string;
    email: string;
  };
  product: {
    name: string;
  };
  amount: number;
  status: string;
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

async function sendWelcomeEmail(memberData: any, password: string) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Seu acesso foi liberado! 🎉</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Bem-vindo(a)!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Seu acesso foi liberado com sucesso!</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Olá <strong>${memberData.full_name}</strong>,<br>
          Obrigado por sua compra do produto <strong>${memberData.product_name}</strong>!
        </p>
        
        <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">📋 Seus dados de acesso:</h3>
          <p style="margin: 10px 0;"><strong>Login:</strong> ${memberData.email}</p>
          <p style="margin: 10px 0;"><strong>Senha:</strong> <code style="background: #f1f1f1; padding: 5px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${supabaseUrl.replace('.supabase.co', '.vercel.app')}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 16px;">
            🚀 Acessar Área de Membros
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          <strong>💡 Dica:</strong> Guarde bem seus dados de acesso em local seguro.<br>
          Em caso de dúvidas, entre em contato conosco.
        </p>
        
        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
          Bom aprendizado! 📚<br>
          <strong>Equipe de Suporte</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  const { error } = await resend.emails.send({
    from: "Área de Membros <onboarding@resend.dev>",
    to: [memberData.email],
    subject: "Seu acesso foi liberado! 🎉",
    html: emailHtml,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
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
    const signature = req.headers.get("x-ggcheckout-signature") || req.headers.get("signature") || "";

    console.log("Received webhook with signature:", signature);

    // Verify webhook signature
    if (!(await verifyWebhookSignature(payload, signature))) {
      console.error("Invalid webhook signature");
      await logWebhook("ggcheckout", JSON.parse(payload), "error", "Invalid signature");
      
      return new Response("Unauthorized", { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const webhookData: GGCheckoutWebhookPayload = JSON.parse(payload);
    console.log("Webhook data:", webhookData);

    // Log the webhook
    await logWebhook("ggcheckout", webhookData, "received");

    // Process only payment approved events
    if (webhookData.event === "pagamento_aprovado" || webhookData.status === "approved") {
      console.log("Processing approved payment for:", webhookData.customer.email);

      // Check if member already exists
      const { data: existingMember } = await supabase
        .from("members")
        .select("*")
        .eq("email", webhookData.customer.email)
        .eq("ggcheckout_transaction_id", webhookData.transaction_id)
        .single();

      if (existingMember) {
        console.log("Member already exists for this transaction");
        await logWebhook("ggcheckout", webhookData, "skipped", "Member already exists");
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Member already exists" 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Create new member
      const { member, plainPassword } = await createMember(
        webhookData.customer,
        webhookData.product.name,
        webhookData.transaction_id
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