import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ============================================
// PASSWORD HASHING (PBKDF2 via Web Crypto API)
// Works in Convex's runtime without external deps
// ============================================

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID().replace(/-/g, "");
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 2) {
    // Legacy: plaintext comparison (for accounts before hashing was added)
    return password === stored;
  }
  const [salt, storedHash] = parts;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return hash === storedHash;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

export const requestOTP = mutation({
  args: {
    phoneNumber: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    cooldownSeconds: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const COOLDOWN_MS = 60000; // 1 minute cooldown
    const MAX_ATTEMPTS = 3;
    const WINDOW_MS = 3600000; // 1 hour window
    
    // Find user by phone
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();
    
    if (!user) {
      return {
        success: false,
        message: "User not found. Please register first.",
      };
    }
    
    // Check cooldown
    if (user.lastOtpRequestAt && now - user.lastOtpRequestAt < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - user.lastOtpRequestAt)) / 1000);
      return {
        success: false,
        message: "Please wait before requesting another code.",
        cooldownSeconds: remainingSeconds,
      };
    }
    
    // Check rate limiting
    let requestCount = user.otpRequestCount || 0;
    let windowStart = user.otpWindowStart || now;
    
    // Reset window if expired
    if (now - windowStart > WINDOW_MS) {
      requestCount = 0;
      windowStart = now;
    }
    
    if (requestCount >= MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((WINDOW_MS - (now - windowStart)) / 1000);
      return {
        success: false,
        message: "Too many attempts. Please try again later.",
        cooldownSeconds: retryAfter,
      };
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = now + 10 * 60 * 1000; // 10 minutes expiry
    
    // Update user with new OTP
    await ctx.db.patch(user._id, {
      verificationCode: otp,
      codeExpiresAt,
      otpRequestCount: requestCount + 1,
      otpWindowStart: windowStart,
      lastOtpRequestAt: now,
    });
    
    // Schedule OTP WhatsApp message
    // (ctx.scheduler.runAfter is used here because mutations cannot call ctx.runAction)
    try {
      const message = `رمز التحقق الخاص بك هو: ${otp}`;
      await ctx.scheduler.runAfter(0, api.notifications.sendWhatsApp, {
        to: args.phoneNumber,
        text: message,
      });
    } catch (error) {
      console.error("Failed to schedule WhatsApp OTP:", error);
      // Continue even if scheduling fails - user can request again
    }
    
    return {
      success: true,
      message: "Verification code sent successfully.",
    };
  },
});

export const verifyOTP = mutation({
  args: {
    phoneNumber: v.string(),
    code: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    userId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();
    
    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }
    
    if (!user.verificationCode) {
      return {
        success: false,
        message: "No verification code requested.",
      };
    }
    
    if (Date.now() > (user.codeExpiresAt || 0)) {
      return {
        success: false,
        message: "Verification code expired.",
      };
    }
    
    if (user.verificationCode !== args.code) {
      return {
        success: false,
        message: "Invalid verification code.",
      };
    }
    
    // Verify user
    await ctx.db.patch(user._id, {
      isVerified: true,
      verificationCode: undefined,
      codeExpiresAt: undefined,
      lastLoginAt: Date.now(),
    });
    
    return {
      success: true,
      message: "Verification successful.",
      userId: user._id,
    };
  },
});

export const registerUser = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    userId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();
    
    if (existingUser) {
      return {
        success: false,
        message: "Phone number already registered.",
      };
    }
    
    // Check email uniqueness
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existingEmail) {
      return {
        success: false,
        message: "Email already registered.",
      };
    }
    
    // Create user
    const userId = await ctx.db.insert("users", {
      fullName: args.fullName,
      email: args.email,
      phoneNumber: args.phoneNumber,
      isVerified: false,
      preferredLanguage: args.preferredLanguage,
      notificationsEnabled: true,
      totalDonated: 0,
      donationCount: 0,
      dataRetentionConsent: true,
      consentGivenAt: now,
      createdAt: now,
      lastLoginAt: now,
    });
    
    return {
      success: true,
      message: "Registration successful. Please verify your phone number.",
      userId,
    };
  },
});

// ============================================
// PASSWORD-BASED AUTHENTICATION
// ============================================

export const setPassword = mutation({
  args: {
    userId: v.id("users"),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const hashed = await hashPassword(args.password);
    await ctx.db.patch(args.userId, {
      passwordHash: hashed,
    });
    return {
      success: true,
      message: "Password set successfully.",
    };
  },
});

export const loginWithPassword = mutation({
  args: {
    phoneNumber: v.string(),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    userId: v.optional(v.id("users")),
    user: v.optional(v.object({
      _id: v.id("users"),
      fullName: v.string(),
      email: v.string(),
      phoneNumber: v.string(),
      preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
      isVerified: v.boolean(),
    })),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();
    
    if (!user) {
      return {
        success: false,
        message: "Invalid phone number or password.",
      };
    }
    
    if (!user.passwordHash) {
      return {
        success: false,
        message: "Password not set. Please use OTP login or set a password.",
      };
    }
    
    const isValid = await verifyPassword(args.password, user.passwordHash);
    
    if (!isValid) {
      return {
        success: false,
        message: "Invalid phone number or password.",
      };
    }
    
    // Update last login
    await ctx.db.patch(user._id, {
      lastLoginAt: Date.now(),
    });
    
    return {
      success: true,
      message: "Login successful.",
      userId: user._id,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        preferredLanguage: user.preferredLanguage,
        isVerified: user.isVerified,
      },
    };
  },
});