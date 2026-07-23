import React from "react";
import CountryCodeSelector from "../../../components/CountryCodeSelector";

export default function KafalaAuthStep(props) {
  const {
    authErrors,
    authFormData,
    authMode,
    colors,
    countryCode,
    handleAuthChange,
    handlePhoneChange,
    handleResendOtp,
    inputStyle,
    lang,
    otpRefs,
    otpSent,
    otpTimer,
    otpValues,
    phoneInputRef,
    setAuthMode,
    setCountryCode,
    setOtpValues,
    setShowConfirmPassword,
    setShowPassword,
    showConfirmPassword,
    showPassword,
  } = props;

  if (!authMode) {
    return (
      <div style={{ padding: "20px 0" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>كيف تريد المتابعة؟</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>سجّل دخولك لمتابعة كفالاتك</div>
        {[
          { id: "login", icon: "🔑", title: "تسجيل الدخول", desc: "لديك حساب؟ سجّل دخولك", badge: "✓ الأسرع" },
          { id: "register", icon: "✨", title: "إنشاء حساب", desc: "انضم إلى مجتمع الكافلين", badge: "🎁 مجاني" },
        ].map((option) => (
          <div
            key={option.id}
            onClick={() => setAuthMode(option.id)}
            style={{
              background: "white",
              border: `1.5px solid ${colors.k100}`,
              borderRadius: 16,
              padding: 18,
              marginBottom: 12,
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{option.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{option.title}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{option.desc}</div>
            <div
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                background: colors.kbg,
                color: colors.kdark,
                padding: "2px 8px",
                borderRadius: 100,
                marginTop: 6,
                border: `1px solid ${colors.k100}`,
              }}
            >
              {option.badge}
            </div>
          </div>
        ))}
        <SecurityNotice colors={colors} />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 0" }}>
      <button
        onClick={() => setAuthMode(null)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: colors.kdark,
          fontSize: 13,
          fontWeight: 600,
          background: "none",
          border: "none",
          cursor: "pointer",
          marginBottom: 20,
          padding: 0,
          fontFamily: "var(--font-arabic)",
        }}
      >
        ← تغيير الخيار
      </button>

      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
        {authMode === "login" ? "🔑 تسجيل الدخول" : "✨ إنشاء حساب"}
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        {authMode === "login" ? "أدخل رقم هاتفك وكلمة المرور" : "انضم إلى مجتمع الكافلين"}
      </div>

      {otpSent ? (
        <div
          style={{
            background: colors.kbg,
            borderRadius: 16,
            padding: 20,
            border: `1px solid ${colors.k100}`,
            textAlign: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>أدخل رمز التحقق</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12, direction: "ltr" }}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={otpRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otpValues[index]}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/, "");
                  if (value.length <= 1) {
                    const nextValues = [...otpValues];
                    nextValues[index] = value;
                    setOtpValues(nextValues);
                    if (value && index < 5) {
                      otpRefs[index + 1].current?.focus();
                    }
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !otpValues[index] && index > 0) {
                    otpRefs[index - 1].current?.focus();
                  }
                }}
                style={{
                  width: 52,
                  height: 56,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  border: `2px solid ${otpValues[index] ? colors.kdark : colors.k100}`,
                  borderRadius: 12,
                  outline: "none",
                  background: otpValues[index] ? colors.kbg : "white",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            ))}
          </div>
          {otpTimer > 0 ? (
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              إعادة الإرسال بعد {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, "0")}
            </div>
          ) : (
            <button
              onClick={handleResendOtp}
              style={{
                fontSize: 13,
                color: colors.kdark,
                fontWeight: 700,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-arabic)",
              }}
            >
              إعادة إرسال الرمز
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: "16px", background: colors.kbg, borderRadius: 16, border: `1px solid ${colors.k100}`, marginBottom: 14 }}>
          {authMode === "register" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>الاسم *</div>
                <input
                  type="text"
                  name="fullName"
                  value={authFormData.fullName}
                  onChange={handleAuthChange}
                  placeholder="الاسم"
                  style={{ ...inputStyle, height: 44 }}
                />
                {authErrors.fullName && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 2 }}>{authErrors.fullName}</p>}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>البريد *</div>
                <input
                  type="email"
                  name="email"
                  value={authFormData.email}
                  onChange={handleAuthChange}
                  placeholder="email@..."
                  dir="ltr"
                  style={{ ...inputStyle, height: 44 }}
                />
                {authErrors.email && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 2 }}>{authErrors.email}</p>}
              </div>
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>رقم الهاتف *</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <CountryCodeSelector value={countryCode} onChange={setCountryCode} lang={lang} />
            <input
              ref={phoneInputRef}
              type="tel"
              name="phone"
              value={authFormData.phone}
              onChange={handlePhoneChange}
              placeholder="6XXXXXXXX"
              maxLength={15}
              dir="ltr"
              inputMode="numeric"
              style={{ ...inputStyle, flex: 1, height: 44 }}
            />
          </div>
          {authErrors.phone && <p style={{ color: "#ef4444", fontSize: 11, marginTop: -6, marginBottom: 8 }}>{authErrors.phone}</p>}

          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>كلمة المرور *</div>
          <div style={{ position: "relative", marginBottom: authMode === "register" ? 10 : 0 }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={authFormData.password}
              onChange={handleAuthChange}
              placeholder="••••••••"
              style={{ ...inputStyle, height: 44, paddingLeft: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          {authErrors.password && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 2 }}>{authErrors.password}</p>}

          {authMode === "register" && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>تأكيد كلمة المرور *</div>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={authFormData.confirmPassword}
                  onChange={handleAuthChange}
                  placeholder="••••••••"
                  style={{ ...inputStyle, height: 44, paddingLeft: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  {showConfirmPassword ? "🙈" : "👁"}
                </button>
              </div>
              {authErrors.confirmPassword && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 2 }}>{authErrors.confirmPassword}</p>}
            </>
          )}
        </div>
      )}

      <SecurityNotice colors={colors} />
    </div>
  );
}

function SecurityNotice({ colors }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        background: colors.kbg,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: "#64748b",
        border: `1px solid ${colors.k100}`,
      }}
    >
      🔒 <span>بياناتك محمية بتشفير آمن</span>
    </div>
  );
}
