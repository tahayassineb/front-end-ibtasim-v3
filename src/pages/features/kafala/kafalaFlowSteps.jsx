import React from "react";
import KafalaAvatar from "../../../components/kafala/KafalaAvatar";

export function KafalaLoadingState({ colors }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.kbg,
        fontFamily: "var(--font-arabic)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div>
        <p style={{ color: "#94a3b8" }}>جاري التحميل...</p>
      </div>
    </div>
  );
}

export function KafalaMissingState() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-arabic)",
      }}
    >
      الكفالة غير موجودة
    </div>
  );
}

export function KafalaSponsoredState({ colors, onBack }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.kbg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-arabic)",
      }}
      dir="rtl"
    >
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤲</div>
        <p style={{ fontSize: 17, fontWeight: 700, color: colors.kdark, marginBottom: 20 }}>
          هذا اليتيم مكفول بالفعل. الرجاء اختيار يتيم آخر.
        </p>
        <button
          onClick={onBack}
          style={{
            background: colors.kdark,
            color: "white",
            padding: "12px 28px",
            borderRadius: 14,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-arabic)",
          }}
        >
          العودة للقائمة
        </button>
      </div>
    </div>
  );
}

export function KafalaSuccessState({ colors, paymentMethod, onHome }) {
  const isPending = paymentMethod !== "card_whop";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.kbg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-arabic)",
      }}
      dir="rtl"
    >
      <div
        style={{
          background: "white",
          borderRadius: 28,
          boxShadow: "0 10px 40px rgba(0,0,0,.12)",
          padding: 40,
          maxWidth: 380,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            background: isPending ? "#FEF3C7" : "#D1FAE5",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 40,
          }}
        >
          {isPending ? "⏳" : "✅"}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: colors.kdark, marginBottom: 12 }}>
          {isPending ? "تم إرسال طلب الكفالة بنجاح ✅" : "تم تسجيل كفالتك!"}
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 16 }}>
          {isPending
            ? "طلبك قيد المراجعة من الفريق. سيصلك إشعار واتساب عند التأكيد."
            : "جزاك الله خيراً على هذا العمل الصالح. ستتلقى رسالة تأكيد عبر واتساب."}
        </p>
        <button
          onClick={onHome}
          style={{
            background: colors.kdark,
            color: "white",
            padding: "14px 32px",
            borderRadius: 14,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            fontFamily: "var(--font-arabic)",
            boxShadow: "0 4px 14px rgba(196,168,130,.4)",
          }}
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}

export function KafalaFlowHeader({ colors, id, navigate, step, setStep }) {
  return (
    <div
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        justifyContent: "space-between",
        borderBottom: `1px solid ${colors.k100}`,
        flexShrink: 0,
        background: "white",
      }}
    >
      <button
        onClick={() => {
          if (step > 1) {
            setStep((currentStep) => currentStep - 1);
          } else if (step === 1) {
            navigate(`/kafala/${id}`);
          } else {
            navigate(-1);
          }
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: colors.kbg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          border: "none",
          cursor: "pointer",
        }}
      >
        ←
      </button>
      <div style={{ fontSize: 15, fontWeight: 700 }}>🤲 إتمام الكفالة</div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: colors.kbg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: colors.kdark,
        }}
      >
        ?
      </div>
    </div>
  );
}

export function KafalaStepProgress({ colors, labels, step }) {
  if (step <= 0) return null;

  return (
    <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 100,
              background:
                segment < step
                  ? colors.kdark
                  : segment === step
                    ? colors.k
                    : "#E5E9EB",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "Inter, sans-serif" }}>
        {labels[step - 1] || ""}
      </div>
    </div>
  );
}

export function KafalaContextCard({ colors, kafala, photoUrl, priceMAD }) {
  return (
    <div
      style={{
        margin: "14px 16px",
        background: colors.kbg,
        borderRadius: 14,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: `1px solid ${colors.k100}`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: `linear-gradient(135deg,${colors.kdark},${colors.k})`,
          border: `2px solid ${colors.k100}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={52} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: colors.kdark }}>{kafala.name}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          🎂 {kafala.age} سنة · 📍 {kafala.location}
        </div>
      </div>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: colors.kdark, fontFamily: "Inter, sans-serif" }}>
          {priceMAD}
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>درهم/شهر</div>
      </div>
    </div>
  );
}

export function KafalaPlanStep({ annualPrice, colors, kafalaName, planType, priceMAD, setPlanType }) {
  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>اختر خطة الكفالة</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        الكفالة الشهرية تُجدَّد تلقائياً — يمكنك الإيقاف في أي وقت
      </div>

      {[
        {
          id: "monthly",
          title: "كفالة شهرية",
          desc: "تجديد تلقائي كل شهر",
          badge: "⭐ الأكثر اختياراً",
          price: priceMAD,
          unit: "درهم/شهر",
          badgeBg: colors.kbg,
          badgeColor: colors.kdark,
        },
        {
          id: "annual",
          title: "كفالة سنوية",
          desc: "ادفع مرة واحدة وفّر 10%",
          badge: "توفير 360 درهم",
          price: annualPrice,
          unit: "درهم/سنة",
          badgeBg: "#FEF3C7",
          badgeColor: "#b45309",
        },
      ].map((plan) => {
        const isSelected = planType === plan.id;

        return (
          <div
            key={plan.id}
            onClick={() => setPlanType(plan.id)}
            style={{
              border: `2px solid ${isSelected ? colors.kdark : "#E5E9EB"}`,
              borderRadius: 16,
              padding: 16,
              marginBottom: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: isSelected ? colors.kbg : "white",
              boxShadow: isSelected ? "0 0 0 3px rgba(139,105,20,.1)" : "none",
              transition: "all .15s",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `2px solid ${isSelected ? colors.kdark : "#E5E9EB"}`,
                background: isSelected ? colors.kdark : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{plan.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{plan.desc}</div>
              <div
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 700,
                  background: plan.badgeBg,
                  color: plan.badgeColor,
                  padding: "2px 8px",
                  borderRadius: 100,
                  marginTop: 4,
                  border: `1px solid ${colors.k100}`,
                }}
              >
                {plan.badge}
              </div>
            </div>
            <div style={{ textAlign: "left", flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.kdark, fontFamily: "Inter, sans-serif" }}>
                {plan.price}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{plan.unit}</div>
            </div>
          </div>
        );
      })}

      <div style={{ background: colors.kbg, borderRadius: 14, padding: 14, marginBottom: 14, border: `1px solid ${colors.k100}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.kdark, marginBottom: 10 }}>🤲 كفالتك الشهرية ستغطي:</div>
        {[
          "كتب ولوازم مدرسية كاملة",
          "وجبات يومية صحية",
          "رعاية صحية شهرية",
          `تقرير ربع سنوي عن أحوال ${kafalaName}`,
        ].map((item, index) => (
          <div
            key={index}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 6 }}
          >
            <span style={{ color: colors.kdark, fontWeight: 700 }}>✓</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "white",
          border: `1px solid ${colors.k100}`,
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
          fontSize: 12,
          color: "#64748b",
          lineHeight: 1.6,
        }}
      >
        💳 <strong>طريقة الدفع:</strong> يمكنك الدفع بتحويل بنكي شهري أو بطاقة بنكية. ستُرسَل لك تذكيرات على واتساب قبل كل تجديد.
      </div>
    </div>
  );
}

export function KafalaPaymentStep(props) {
  const {
    bankInfo,
    colors,
    fileRef,
    inputStyle,
    paymentCategory,
    paymentMethod,
    receipt,
    reference,
    setPaymentCategory,
    setPaymentMethod,
    setReference,
    setReceipt,
    showToast,
    validateReceiptFile,
  } = props;

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>طريقة الدفع</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>اختر الطريقة المناسبة لك</div>

      <div
        onClick={() => {
          setPaymentCategory("card");
          setPaymentMethod("card_whop");
        }}
        style={{
          border: `2px solid ${paymentCategory === "card" ? colors.kdark : "#E5E9EB"}`,
          borderRadius: 18,
          padding: 18,
          marginBottom: 12,
          cursor: "pointer",
          background: paymentCategory === "card" ? colors.kbg : "white",
          boxShadow: paymentCategory === "card" ? "0 0 0 3px rgba(139,105,20,.08)" : "none",
          transition: "all .15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: `2px solid ${paymentCategory === "card" ? colors.kdark : "#E5E9EB"}`,
              background: paymentCategory === "card" ? colors.kdark : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {paymentCategory === "card" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
          </div>
          <div style={{ fontSize: 22 }}>💳</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>بطاقة بنكية</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Visa، Mastercard — اشتراك تلقائي شهري</div>
          </div>
        </div>
        {paymentCategory === "card" && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.k100}`, fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
            ستُوجَّه إلى صفحة دفع آمنة عبر Whop. يتجدد الاشتراك تلقائياً كل شهر ويمكنك الإلغاء في أي وقت.
          </div>
        )}
      </div>

      <div
        onClick={() => {
          setPaymentCategory("bank_agency");
          if (paymentMethod === "card_whop") {
            setPaymentMethod("bank_transfer");
          }
        }}
        style={{
          border: `2px solid ${paymentCategory === "bank_agency" ? colors.kdark : "#E5E9EB"}`,
          borderRadius: 18,
          padding: 18,
          marginBottom: 12,
          cursor: "pointer",
          background: paymentCategory === "bank_agency" ? colors.kbg : "white",
          boxShadow: paymentCategory === "bank_agency" ? "0 0 0 3px rgba(139,105,20,.08)" : "none",
          transition: "all .15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: `2px solid ${paymentCategory === "bank_agency" ? colors.kdark : "#E5E9EB"}`,
              background: paymentCategory === "bank_agency" ? colors.kdark : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {paymentCategory === "bank_agency" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
          </div>
          <div style={{ fontSize: 22 }}>🏦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>تحويل بنكي أو وكالة</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>بنك · Wafacash · Cash Plus</div>
          </div>
        </div>

        {paymentCategory === "bank_agency" && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.k100}` }}>
            <div style={{ background: "white", borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${colors.k100}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.kdark, marginBottom: 10 }}>🏦 بيانات الحساب البنكي</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>صاحب الحساب</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0e1a1b" }}>{bankInfo.name}</div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3, fontFamily: "Inter, sans-serif" }}>رقم الحساب (RIB)</div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: colors.kdark,
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: ".04em",
                  }}
                  dir="ltr"
                >
                  {bankInfo.rib}
                </div>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  navigator.clipboard.writeText((bankInfo.rib || "").replace(/\s/g, ""));
                  showToast("تم نسخ الرقم", "success");
                }}
                style={{
                  fontSize: 11,
                  background: colors.kbg,
                  color: colors.kdark,
                  border: `1px solid ${colors.k100}`,
                  padding: "4px 14px",
                  borderRadius: 100,
                  cursor: "pointer",
                  fontFamily: "var(--font-arabic)",
                }}
              >
                📋 نسخ رقم الحساب
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[
                { id: "bank_transfer", label: "🏦 تحويل بنكي" },
                { id: "cash_agency", label: "💵 وكالة نقد" },
              ].map((subMethod) => (
                <button
                  key={subMethod.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPaymentMethod(subMethod.id);
                  }}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    border: `1.5px solid ${paymentMethod === subMethod.id ? colors.kdark : colors.k100}`,
                    background: paymentMethod === subMethod.id ? colors.kdark : "white",
                    color: paymentMethod === subMethod.id ? "white" : "#64748b",
                    cursor: "pointer",
                    fontFamily: "var(--font-arabic)",
                    transition: "all .15s",
                  }}
                >
                  {subMethod.label}
                </button>
              ))}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (!file) {
                  setReceipt(null);
                  return;
                }
                if (validateReceiptFile(file, showToast)) {
                  setReceipt(file);
                }
              }}
            />

            {paymentMethod === "bank_transfer" && (
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>رفع وصل الدفع</div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    fileRef.current?.click();
                  }}
                  style={{
                    width: "100%",
                    border: `2px dashed ${colors.k100}`,
                    borderRadius: 12,
                    padding: "14px",
                    textAlign: "center",
                    background: "white",
                    cursor: "pointer",
                    fontSize: 13,
                    color: receipt ? "#16a34a" : "#64748b",
                    fontFamily: "var(--font-arabic)",
                  }}
                >
                  {receipt ? `✓ ${receipt.name}` : "📷 أرفق وصل الدفع *"}
                </button>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>رقم المرجع (اختياري)</div>
                  <input
                    type="text"
                    placeholder="رقم الوصل من البنك"
                    value={reference}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setReference(event.target.value)}
                    style={{ ...inputStyle, height: 44, borderColor: colors.k100 }}
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {paymentMethod === "cash_agency" && (
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, lineHeight: 1.6 }}>
                  حوّل المبلغ عبر أي وكالة نقد (Wafacash، Cash Plus...) ثم ارفع وصل الدفع أدناه.
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>رفع وصل الدفع</div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    fileRef.current?.click();
                  }}
                  style={{
                    width: "100%",
                    border: `2px dashed ${colors.k100}`,
                    borderRadius: 12,
                    padding: "14px",
                    textAlign: "center",
                    background: "white",
                    cursor: "pointer",
                    fontSize: 13,
                    color: receipt ? "#16a34a" : "#64748b",
                    fontFamily: "var(--font-arabic)",
                    marginBottom: 10,
                  }}
                >
                  {receipt ? `✓ ${receipt.name}` : "📷 أرفق وصل الدفع *"}
                </button>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>رقم الوصل / المرجع</div>
                <input
                  type="text"
                  placeholder="أدخل رقم الوصل من الوكالة"
                  value={reference}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => setReference(event.target.value)}
                  style={{ ...inputStyle, height: 44, borderColor: colors.k100 }}
                  dir="ltr"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function KafalaReviewStep({
  colors,
  donorName,
  isAnonymous,
  kafala,
  paymentMethod,
  photoUrl,
  planType,
  priceMAD,
  setIsAnonymous,
}) {
  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>مراجعة التفاصيل</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>تأكد من صحة التفاصيل</div>

      <div style={{ background: colors.kdark, borderRadius: 16, padding: 16, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginBottom: 4 }}>إجمالي الكفالة الشهرية</div>
        <div>
          <span style={{ fontSize: 32, fontWeight: 900, color: "white", fontFamily: "Inter, sans-serif" }}>{priceMAD}</span>{" "}
          <span style={{ fontSize: 14, color: "rgba(255,255,255,.7)" }}>درهم / شهر</span>
        </div>
      </div>

      <div style={{ background: "white", border: `1.5px solid ${colors.k100}`, borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
        <div
          style={{
            background: colors.kbg,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: `1px solid ${colors.k100}`,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: `linear-gradient(135deg,${colors.kdark},${colors.k})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={44} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.kdark }}>{kafala.name}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              ✓ {planType === "monthly" ? "كفالة شهرية" : "كفالة سنوية"}
            </div>
          </div>
        </div>
        {[
          { label: "المبلغ الشهري", value: `${priceMAD} درهم/شهر`, accent: true },
          {
            label: "طريقة الدفع",
            value:
              paymentMethod === "bank_transfer"
                ? "🏦 تحويل بنكي"
                : paymentMethod === "card_whop"
                  ? "💳 بطاقة بنكية"
                  : "💵 وكالة نقد",
          },
          { label: "المتبرع", value: donorName },
        ].map((row, index, items) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "13px 16px",
              borderBottom: index < items.length - 1 ? `1px solid ${colors.k100}` : "none",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b" }}>{row.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: row.accent ? colors.kdark : "#0e1a1b" }}>{row.value}</div>
          </div>
        ))}
      </div>

      <div
        onClick={() => setIsAnonymous((currentValue) => !currentValue)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 14,
          background: colors.kbg,
          borderRadius: 14,
          border: `1.5px solid ${colors.k100}`,
          marginBottom: 14,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 44,
            height: 24,
            background: isAnonymous ? colors.kdark : "#94a3b8",
            borderRadius: 100,
            position: "relative",
            flexShrink: 0,
            transition: "background .15s",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              background: "white",
              borderRadius: "50%",
              position: "absolute",
              top: 2,
              left: isAnonymous ? 22 : 2,
              transition: "left .15s",
              boxShadow: "0 1px 3px rgba(0,0,0,.2)",
            }}
          />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>التبرع باسم مجهول</div>
      </div>

      <div
        style={{
          background: colors.kbg,
          borderRadius: 12,
          padding: "10px 14px",
          border: `1px solid ${colors.k100}`,
          marginBottom: 14,
          fontSize: 12,
          color: "#64748b",
          lineHeight: 1.6,
        }}
      >
        🔒 بياناتك محمية · يمكنك الإلغاء في أي وقت · جمعية معتمدة رسمياً
      </div>
    </div>
  );
}

export function KafalaActionBar(props) {
  const {
    authMode,
    colors,
    handleLogin,
    handleOtpVerify,
    handleRegister,
    handleSubmit,
    isAuthLoading,
    isFemale,
    otpSent,
    paymentMethod,
    priceMAD,
    step,
    submitting,
    setStep,
  } = props;

  return (
    <div style={{ flexShrink: 0, padding: "14px 16px", background: "white", borderTop: `1px solid ${colors.k100}` }}>
      {step === 0 ? (
        <button
          onClick={otpSent ? handleOtpVerify : authMode === "login" ? handleLogin : handleRegister}
          disabled={isAuthLoading}
          style={{
            width: "100%",
            height: 52,
            background: isAuthLoading ? "#94a3b8" : colors.kdark,
            color: "white",
            border: "none",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            cursor: isAuthLoading ? "not-allowed" : "pointer",
            fontFamily: "var(--font-arabic)",
            boxShadow: "0 4px 14px rgba(196,168,130,.35)",
          }}
        >
          {isAuthLoading ? "..." : otpSent ? "تحقق من الرمز" : authMode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
        </button>
      ) : step < 3 ? (
        <button
          onClick={() => setStep((currentStep) => currentStep + 1)}
          style={{
            width: "100%",
            height: 56,
            background: colors.kdark,
            color: "white",
            border: "none",
            borderRadius: 16,
            fontSize: 17,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "var(--font-arabic)",
            boxShadow: "0 4px 14px rgba(196,168,130,.35)",
          }}
        >
          {step === 1 ? `🤲 اكفل${isFemale ? "ها" : "ه"} — ${priceMAD} درهم/شهر` : "التالي: مراجعة التفاصيل →"}
        </button>
      ) : (
        <div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              height: 56,
              background: submitting ? "#94a3b8" : colors.kdark,
              color: "white",
              border: "none",
              borderRadius: 16,
              fontSize: 17,
              fontWeight: 800,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "var(--font-arabic)",
              boxShadow: submitting ? "none" : "0 4px 14px rgba(196,168,130,.35)",
            }}
          >
            {submitting
              ? paymentMethod === "card_whop"
                ? "جاري التحويل..."
                : "جاري الإرسال..."
              : paymentMethod === "card_whop"
                ? "💳 الدفع بالبطاقة"
                : "🤲 إرسال طلب الكفالة"}
          </button>
          <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
            بدون التزام طويل المدى · إلغاء مجاني في أي وقت
          </div>
        </div>
      )}
    </div>
  );
}
