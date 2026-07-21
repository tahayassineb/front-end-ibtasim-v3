import React from "react";
import { RECEIPT_ALLOWED_TYPES, RECEIPT_MAX_BYTES, validateUploadFile } from "../../../lib/uploadValidation";
import { DONATION_AMOUNTS, getImpactItems } from "./donationFlowHelpers";

const MOROCCAN_BANKS = [
  "CIH Bank",
  "Attijariwafa Bank",
  "BMCE Bank (Bank of Africa)",
  "Banque Populaire",
  "BCP (Banque Centrale Populaire)",
  "Société Générale Maroc",
  "BMCI",
  "Crédit Agricole du Maroc",
  "CDG Capital",
  "CFG Bank",
  "Al Barid Bank",
  "Umnia Bank",
  "Wafa Cash",
  "Cash Plus",
  "أخرى / Autre / Other",
];

export const Step1Amount = ({ donationData, setDonationData, benefitCards }) => {
  const amount = donationData.customAmount ? parseFloat(donationData.customAmount) || 0 : donationData.amount;
  const impactItems = getImpactItems(benefitCards);

  return (
    <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>كم تريد أن تتبرع؟</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 18 }}>اختر مبلغاً أو أدخل مبلغاً مخصصاً</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        {DONATION_AMOUNTS.map((amt) => {
          const isActive = donationData.amount === amt && !donationData.customAmount;
          return (
            <button
              key={amt}
              onClick={() => setDonationData((p) => ({ ...p, amount: amt, customAmount: "" }))}
              style={{
                height: 64,
                border: `2px solid ${isActive ? "#0d7477" : "#E5E9EB"}`,
                borderRadius: 16,
                background: isActive ? "#E6F4F4" : "white",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: isActive ? "0 0 0 3px rgba(13,116,119,.1)" : "none",
                transition: "all .15s",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: isActive ? "#0A5F62" : "#0e1a1b", fontFamily: "Inter, sans-serif" }}>
                {amt >= 1000 ? `${(amt / 1000).toLocaleString("fr-MA")}k` : amt}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>درهم{amt === 500 ? " ⭐" : ""}</div>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>أو أدخل مبلغاً آخر:</div>
      <div style={{ position: "relative", marginBottom: 18 }}>
        <input
          type="number"
          inputMode="numeric"
          value={donationData.customAmount}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d*$/.test(v)) {
              setDonationData((p) => ({ ...p, customAmount: v, amount: 0 }));
            }
          }}
          placeholder="0"
          style={{
            width: "100%",
            height: 60,
            padding: "0 56px 0 16px",
            border: `2px solid ${donationData.customAmount ? "#0d7477" : "#E5E9EB"}`,
            borderRadius: 14,
            fontSize: 26,
            fontWeight: 800,
            color: "#0A5F62",
            outline: "none",
            background: donationData.customAmount ? "#E6F4F4" : "white",
            fontFamily: "Inter, var(--font-arabic), sans-serif",
            boxSizing: "border-box",
            boxShadow: donationData.customAmount ? "0 0 0 3px rgba(13,116,119,.1)" : "none",
          }}
          dir="ltr"
        />
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "#94a3b8", fontFamily: "Inter, sans-serif" }}>
          د.م
        </span>
      </div>

      {amount > 0 && impactItems.length > 0 && (
        <div style={{ background: "#F0F7F7", borderRadius: 14, padding: 14, marginBottom: 16, border: "1px solid #CCF0F0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0A5F62", marginBottom: 10 }}>✨ {amount} درهم ستغطي:</div>
          {impactItems.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 6 }}>
              <span style={{ color: "#0d7477", fontWeight: 700 }}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, background: "#F0FFF4", borderRadius: 10, border: "1px solid #BBF7D0", marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={donationData.coverFees}
          onChange={(e) => setDonationData((p) => ({ ...p, coverFees: e.target.checked }))}
          style={{ width: 18, height: 18, accentColor: "#0d7477", marginTop: 2, flexShrink: 0 }}
        />
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>أريد تغطية رسوم المعالجة حتى تصل كامل تبرعتي للمشروع</div>
      </div>

      <div style={{ padding: "10px 14px", background: "#F0F7F7", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
        🔒 <span>تبرعك سيصل كاملاً للمشروع</span>
      </div>
    </div>
  );
};

export const Step2Payment = ({ donationData, setDonationData, bankInfo, showToast, lang }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast(lang === "ar" ? "تم النسخ" : "Copied", "success");
  };

  const METHODS = [
    { id: "transfer", icon: "🏦", title: "تحويل بنكي أو وكالة نقد", desc: "حوّل وأرفق وصل الإيداع", badge: "الأكثر استخداماً" },
    { id: "card", icon: "💳", title: "بطاقة بنكية", desc: "فيزا، ماستركارد — مباشر وآمن", badge: "متاح" },
  ];

  const transferType = donationData.transferType || "bank";

  return (
    <div style={{ flex: 1, padding: "16px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>كيف تريد الدفع؟</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>اختر طريقة الدفع المناسبة لك</div>

      {METHODS.map((m) => {
        const sel = donationData.paymentMethod === m.id;
        return (
          <div
            key={m.id}
            onClick={() => setDonationData((p) => ({ ...p, paymentMethod: m.id }))}
            style={{
              border: `2px solid ${sel ? "#0d7477" : "#E5E9EB"}`,
              borderRadius: 18,
              padding: 18,
              marginBottom: 12,
              cursor: "pointer",
              background: sel ? "#E6F4F4" : "white",
              boxShadow: sel ? "0 0 0 3px rgba(13,116,119,.08)" : "none",
              transition: "all .15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${sel ? "#0d7477" : "#E5E9EB"}`, background: sel ? "#0d7477" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {sel && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
              </div>
              <div style={{ fontSize: 24 }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{m.desc}</div>
                {m.badge && (
                  <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, background: m.id === "card" ? "#FEF3C7" : "#E6F4F4", color: m.id === "card" ? "#b45309" : "#0A5F62", padding: "2px 8px", borderRadius: 100, marginTop: 4 }}>
                    {m.badge}
                  </div>
                )}
              </div>
            </div>

            {sel && m.id === "transfer" && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", background: "#F0F7F7", borderRadius: 10, padding: 4, marginBottom: 14, border: "1px solid #CCF0F0" }}>
                  {[{ id: "bank", label: "🏦 تحويل بنكي" }, { id: "cash", label: "💳 Wafacash · Cash Plus" }].map((t) => (
                    <button
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDonationData((p) => ({ ...p, transferType: t.id }));
                      }}
                      style={{
                        flex: 1,
                        height: 34,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-arabic)",
                        background: transferType === t.id ? "white" : "transparent",
                        color: transferType === t.id ? "#0A5F62" : "#64748b",
                        boxShadow: transferType === t.id ? "0 1px 3px rgba(0,0,0,.1)" : "none",
                        transition: "all .15s",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {transferType === "bank" && (
                  <div style={{ padding: 14, background: "white", borderRadius: 12, border: "1px solid #CCF0F0" }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 3, fontFamily: "Inter, sans-serif" }}>البنك</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{bankInfo.bankName || "بنك التجاري وفا بنك"}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 3, fontFamily: "Inter, sans-serif" }}>رقم الحساب (RIB)</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#0A5F62", fontFamily: "Inter, sans-serif", letterSpacing: ".08em", margin: "2px 0" }} dir="ltr">
                        {bankInfo.rib || "—"}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard((bankInfo.rib || "").replace(/\s/g, ""));
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0d7477", background: "#E6F4F4", padding: "3px 10px", borderRadius: 100, cursor: "pointer", border: "none", fontFamily: "var(--font-arabic)", marginTop: 4 }}
                      >
                        📋 نسخ الرقم
                      </button>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 3, fontFamily: "Inter, sans-serif" }}>اسم المستفيد</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{bankInfo.accountHolder || "جمعية ابتسام للأعمال الخيرية"}</div>
                    </div>
                    {bankInfo.agency && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 3, fontFamily: "Inter, sans-serif" }}>الفرع / الوكالة</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{bankInfo.agency}</div>
                      </div>
                    )}
                    <div style={{ background: "#F0F7F7", borderRadius: 10, padding: 12, marginTop: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0A5F62", marginBottom: 6 }}>📋 خطوات التحويل:</div>
                      {["حوّل المبلغ عبر تطبيق بنكك", "احتفظ بوصل التحويل", "ارفع الوصل في الخطوة التالية"].map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#0d7477", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {transferType === "cash" && (
                  <div style={{ padding: 14, background: "white", borderRadius: 12, border: "1px solid #CCF0F0" }}>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 12 }}>
                      حوّل المبلغ عبر <strong>Wafacash</strong> أو <strong>Cash Plus</strong> — في خانة المستفيد أدخل رقم هاتف الجمعية
                    </div>
                    {bankInfo.agency && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 3, fontFamily: "Inter, sans-serif" }}>الوكالة / الفرع المستهدف</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{bankInfo.agency}</div>
                      </div>
                    )}
                    <div style={{ background: "#E6F4F4", borderRadius: 10, padding: 12, marginBottom: 12, border: "1px solid #CCF0F0", textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 3, fontFamily: "Inter, sans-serif" }}>رقم هاتف الجمعية</div>
                      {bankInfo.associationPhone ? (
                        <>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#0A5F62", fontFamily: "Inter, sans-serif", letterSpacing: ".06em", margin: "4px 0" }} dir="ltr">
                            {bankInfo.associationPhone}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(bankInfo.associationPhone);
                            }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0d7477", background: "white", padding: "3px 10px", borderRadius: 100, cursor: "pointer", border: "none", fontFamily: "var(--font-arabic)", marginTop: 4 }}
                          >
                            📋 نسخ الرقم
                          </button>
                        </>
                      ) : (
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#b45309", margin: "4px 0" }}>لم يتم تحديد رقم الهاتف بعد</div>
                      )}
                    </div>
                    <div style={{ background: "#F0F7F7", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0A5F62", marginBottom: 6 }}>📋 خطوات الإيداع:</div>
                      {["توجه لأقرب وكالة Wafacash أو Cash Plus", "أدخل رقم هاتف الجمعية في خانة المستفيد", "احتفظ بوصل الإيداع", "ارفع الوصل في الخطوة التالية"].map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#0d7477", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ padding: "10px 14px", background: "#F0F7F7", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b", marginTop: 4 }}>
        🔒 <span>جميع معاملاتك آمنة ومحمية</span>
      </div>
    </div>
  );
};

export const Step3Receipt = ({ uploadedFile, setUploadedFile, dragActive, setDragActive, showToast, amount, donationData, setDonationData }) => {
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleFile = (file) => {
    const error = validateUploadFile(file, {
      allowedTypes: RECEIPT_ALLOWED_TYPES,
      maxBytes: RECEIPT_MAX_BYTES,
      label: "ملف الإيصال",
    });
    if (error) {
      showToast(error, "error");
      return;
    }
    setUploadedFile(file);
  };

  return (
    <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>ارفع وصل التحويل</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>أرفق صورة وصل التحويل البنكي للتحقق من تبرعك</div>

      {uploadedFile ? (
        <div style={{ border: "2px solid #0d7477", borderRadius: 20, padding: 16, marginBottom: 16, background: "#E6F4F4", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 72, height: 72, borderRadius: 12, background: "linear-gradient(135deg,#e0e7ff,#c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🧾</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{uploadedFile.name}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontFamily: "Inter, sans-serif" }}>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, background: "#D1FAE5", color: "#16a34a", padding: "3px 10px", borderRadius: 100 }}>✓ تم الرفع بنجاح</div>
            <button onClick={() => setUploadedFile(null)} style={{ display: "block", fontSize: 11, color: "#ef4444", cursor: "pointer", textDecoration: "underline", marginTop: 6, background: "none", border: "none", fontFamily: "var(--font-arabic)" }}>
              × حذف والاستبدال
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          style={{ border: `2px dashed ${dragActive ? "#0d7477" : "#E5E9EB"}`, borderRadius: 20, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: dragActive ? "#E6F4F4" : "#f6f8f8", transition: "all .2s", marginBottom: 16 }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>اسحب وأفلت الوصل هنا</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>أو استخدم الكاميرا مباشرةً</div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, background: "#0d7477", color: "white", padding: "8px 20px", borderRadius: 100, boxShadow: "0 4px 14px rgba(13,116,119,.25)", cursor: "pointer" }}>
            📷 اختر من الجهاز
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: "none" }} />
          </label>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 10 }}>PNG · JPG · WebP · PDF · حتى 5 ميغابايت</div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#0e1a1b" }}>تفاصيل التحويل</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>البنك أو الوكالة التي حوّلت منها <span style={{ color: "#ef4444" }}>*</span></div>
          <select value={donationData?.bankName || ""} onChange={(e) => setDonationData((p) => ({ ...p, bankName: e.target.value }))} style={{ width: "100%", height: 52, border: `1.5px solid ${donationData?.bankName ? "#33C0C0" : "#E5E9EB"}`, borderRadius: 14, padding: "0 16px", fontSize: 14, fontFamily: "var(--font-arabic)", color: "#0e1a1b", background: "white", outline: "none", boxSizing: "border-box", appearance: "none", cursor: "pointer" }}>
            <option value="">-- اختر البنك أو الوكالة التي أرسلت منها --</option>
            {MOROCCAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>اسم صاحب الحساب المُحوِّل</div>
          <input type="text" value={donationData?.senderName || ""} onChange={(e) => setDonationData((p) => ({ ...p, senderName: e.target.value }))} placeholder="الاسم الكامل كما هو في البطاقة البنكية" style={{ width: "100%", height: 52, border: "1.5px solid #E5E9EB", borderRadius: 14, padding: "0 16px", fontSize: 14, fontFamily: "var(--font-arabic)", color: "#0e1a1b", background: "white", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>رقم المرجع (اختياري)</div>
          <input type="text" value={donationData?.transactionReference || ""} onChange={(e) => setDonationData((p) => ({ ...p, transactionReference: e.target.value }))} placeholder="رقم الوصل من البنك" dir="ltr" style={{ width: "100%", height: 52, border: "1.5px solid #E5E9EB", borderRadius: 14, padding: "0 16px", fontSize: 14, fontFamily: "Inter, sans-serif", color: "#0e1a1b", background: "white", outline: "none", boxSizing: "border-box", letterSpacing: ".04em" }} />
        </div>
      </div>

      <div style={{ background: "#F0F7F7", borderRadius: 14, padding: 14, marginBottom: 14, border: "1px solid #CCF0F0" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0A5F62", marginBottom: 10 }}>📋 ما الذي يجب أن يظهر في الوصل؟</div>
        {[`المبلغ: ${amount} درهم`, "رقم الحساب المستفيد", "تاريخ ووقت العملية", "ختم / توقيع البنك أو الرقم المرجعي"].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#0d7477", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "10px 14px", background: "#F0F7F7", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
        🔒 <span>صورة الوصل محمية ولا تُشارك مع أي طرف ثالث</span>
      </div>
    </div>
  );
};

export const Step4Info = ({ donationData, setDonationData }) => {
  const inputStyle = { width: "100%", height: 52, border: "1.5px solid #E5E9EB", borderRadius: 14, padding: "0 16px", fontSize: 15, fontFamily: "var(--font-arabic)", color: "#0e1a1b", background: "white", outline: "none", boxSizing: "border-box", transition: "border-color .15s" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 };

  return (
    <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>بياناتك الشخصية</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>للتواصل معك وإرسال وصل التبرع الرسمي</div>
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>الاسم الكامل <span style={{ color: "#ef4444" }}>*</span></div>
        <input type="text" value={donationData.donorName || ""} onChange={(e) => setDonationData((p) => ({ ...p, donorName: e.target.value }))} placeholder="أدخل اسمك الكامل" style={{ ...inputStyle, borderColor: donationData.donorName ? "#33C0C0" : "#E5E9EB" }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>رقم الهاتف <span style={{ color: "#ef4444" }}>*</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ height: 52, padding: "0 14px", background: "#F0F7F7", border: "1.5px solid #E5E9EB", borderRadius: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", fontFamily: "Inter, sans-serif" }}>🇲🇦 +212</div>
          <input type="tel" value={donationData.donorPhone || ""} onChange={(e) => setDonationData((p) => ({ ...p, donorPhone: e.target.value.replace(/\D/g, "").slice(0, 9) }))} placeholder="661234567" dir="ltr" inputMode="numeric" style={{ ...inputStyle, flex: 1, fontFamily: "Inter, sans-serif", borderColor: donationData.donorPhone ? "#33C0C0" : "#E5E9EB" }} />
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>سنرسل إليك رسالة تأكيد على واتساب</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>البريد الإلكتروني <span style={{ color: "#94a3b8", fontWeight: 500 }}>(اختياري)</span></div>
        <input type="email" value={donationData.donorEmail || ""} onChange={(e) => setDonationData((p) => ({ ...p, donorEmail: e.target.value }))} placeholder="example@email.com" dir="ltr" style={inputStyle} />
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>لإرسال وصل التبرع الرسمي بالبريد</div>
      </div>
      <div onClick={() => setDonationData((p) => ({ ...p, isAnonymous: !p.isAnonymous }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: "#E6F4F4", borderRadius: 14, border: "1.5px solid #CCF0F0", marginBottom: 16, cursor: "pointer" }}>
        <div style={{ width: 44, height: 24, background: donationData.isAnonymous ? "#0d7477" : "#94a3b8", borderRadius: 100, position: "relative", flexShrink: 0, transition: "background .15s" }}>
          <div style={{ width: 20, height: 20, background: "white", borderRadius: "50%", position: "absolute", top: 2, left: donationData.isAnonymous ? 22 : 2, boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left .15s" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>التبرع باسم مجهول</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>لن يظهر اسمك في قائمة المتبرعين العامة</div>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>إهداء التبرع <span style={{ color: "#94a3b8", fontWeight: 500 }}>(اختياري)</span></div>
        <textarea value={donationData.dedication || ""} onChange={(e) => setDonationData((p) => ({ ...p, dedication: e.target.value.slice(0, 150) }))} placeholder="مثال: باسم والدي رحمه الله..." style={{ width: "100%", minHeight: 80, border: "1.5px solid #E5E9EB", borderRadius: 14, padding: "14px 16px", fontSize: 14, fontFamily: "var(--font-arabic)", color: "#0e1a1b", background: "white", outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "left", marginTop: 4, fontFamily: "Inter, sans-serif" }}>{(donationData.dedication || "").length} / 150</div>
      </div>
      <div style={{ padding: "10px 14px", background: "#F0F7F7", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
        🔒 <span>بياناتك لن تُشارك مع أي طرف ثالث</span>
      </div>
    </div>
  );
};

export const Step5Review = ({ donationData, project, uploadedFile, amount, agreedTerms, setAgreedTerms, setStep }) => {
  const paymentLabel = donationData.paymentMethod === "transfer"
    ? donationData.transferType === "cash" ? "💵 وكالة نقد (Wafacash / Cash Plus)" : "🏦 تحويل بنكي"
    : "💳 بطاقة بنكية";

  return (
    <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>راجع تبرعك</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>تأكد من صحة التفاصيل قبل الإرسال</div>
      <div style={{ background: "#0A5F62", borderRadius: 16, padding: 16, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginBottom: 4 }}>إجمالي تبرعك</div>
        <div><span style={{ fontSize: 36, fontWeight: 900, color: "white", fontFamily: "Inter, sans-serif" }}>{amount}</span>{" "}<span style={{ fontSize: 16, color: "rgba(255,255,255,.7)", fontFamily: "Inter, sans-serif" }}>درهم مغربي</span></div>
      </div>
      <div style={{ background: "white", border: "1.5px solid #E5E9EB", borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ background: "#F0F7F7", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #CCF0F0" }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#0A5F62,#33C0C0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎓</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{project?.title || "تبرع لجمعية ابتسام"}</div>
            <div style={{ fontSize: 11, color: "#0A5F62", fontWeight: 600, marginTop: 2 }}>✓ مشروع معتمد</div>
          </div>
        </div>
        {[
          { label: "المبلغ", value: `${amount} درهم`, editStep: 1, teal: true },
          { label: "طريقة الدفع", value: paymentLabel, editStep: 2 },
          ...(uploadedFile ? [{ label: "وصل التحويل", value: uploadedFile.name, editStep: 3, isFile: true }] : []),
          { label: "المتبرع", value: donationData.isAnonymous ? "مجهول الهوية 🙈" : donationData.donorName || "—", editStep: 4 },
          { label: "رقم الهاتف", value: `+212 ${donationData.donorPhone || "—"}`, editStep: null },
          ...(donationData.dedication ? [{ label: "الإهداء", value: donationData.dedication, editStep: null }] : []),
        ].map((row, i, arr) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: i < arr.length - 1 ? "1px solid #E5E9EB" : "none" }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>{row.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {row.isFile ? <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#e0e7ff,#c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🧾</div> : null}
              <div style={{ fontSize: row.isFile ? 12 : 14, fontWeight: 700, color: row.teal ? "#0A5F62" : "#0e1a1b", maxWidth: 150, textAlign: "left", direction: row.label === "رقم الهاتف" ? "ltr" : "rtl", fontFamily: row.label === "رقم الهاتف" ? "Inter, sans-serif" : "var(--font-arabic)" }}>{row.value}</div>
              {row.editStep != null && <button onClick={() => setStep(row.editStep)} style={{ fontSize: 12, fontWeight: 600, color: "#0d7477", padding: "3px 8px", background: "#E6F4F4", borderRadius: 100, cursor: "pointer", border: "none", fontFamily: "var(--font-arabic)" }}>تعديل</button>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {["🔒 SSL 256-bit", "✓ جمعية معتمدة", "📋 وصل رسمي"].map((b) => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 100, background: "#F0F7F7", color: "#0A5F62" }}>{b}</div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
        <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#0d7477", marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>أوافق على <span style={{ color: "#0d7477", textDecoration: "underline", cursor: "pointer" }}>شروط الاستخدام</span> و<span style={{ color: "#0d7477", textDecoration: "underline", cursor: "pointer" }}>سياسة الخصوصية</span> لجمعية ابتسام</div>
      </div>
    </div>
  );
};

export const Step6Success = ({ donationReference, project, navigate, resetDonation }) => {
  const displayReference = donationReference ? String(donationReference) : "--------";
  const handleShare = (platform) => {
    const text = `تبرعت لجمعية ابتسام! انضم إليّ في دعم ${project?.title || "مشاريع الخير"}`;
    const url = window.location.origin;
    if (platform === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank");
    else window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 24px", overflowY: "auto" }}>
      <div style={{ position: "relative", marginBottom: 24 }}>
        <div style={{ position: "absolute", inset: -16, background: "rgba(13,116,119,.1)", borderRadius: "50%", filter: "blur(16px)" }} />
        <div style={{ position: "relative", width: 88, height: 88, background: "#0d7477", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid white", boxShadow: "0 8px 24px rgba(13,116,119,.3)" }}>
          <span style={{ fontSize: 40, color: "white", fontWeight: 900 }}>✓</span>
        </div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>شكراً لك!</div>
        <div style={{ fontSize: 18, color: "#64748b", fontWeight: 500 }}>Thank you!</div>
      </div>
      <div style={{ width: "100%", background: "white", border: "1.5px solid #CCF0F0", borderRadius: 20, padding: 20, marginBottom: 20, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0d7477", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, fontFamily: "Inter, sans-serif" }}>رقم مرجع التبرع</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: ".02em" }} dir="ltr">{displayReference}</div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #E5E9EB", fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>سنقوم بالتحقق من التبرع وإرسال تأكيد عبر واتساب</div>
      </div>
      <div style={{ width: "100%", background: "#F0F7F7", borderRadius: 16, padding: 16, marginBottom: 20, border: "1px solid #CCF0F0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0A5F62", marginBottom: 12 }}>ما الذي سيحدث بعد ذلك؟</div>
        {[
          { icon: "✅", text: "تم استلام طلب تبرعك", done: true },
          { icon: "🔍", text: "مراجعة الوصل خلال 24 ساعة", done: false },
          { icon: "📲", text: "إشعار تأكيد على واتساب", done: false },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontSize: 13, color: s.done ? "#0A5F62" : "#64748b", fontWeight: s.done ? 700 : 400 }}>{s.text}</div>
          </div>
        ))}
      </div>
      <div style={{ width: "100%", marginBottom: 20 }}>
        <div style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginBottom: 12 }}>انشر الخير مع أصدقائك</div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => handleShare("whatsapp")} style={{ flex: 1, height: 48, background: "#25D366", border: "none", borderRadius: 14, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-arabic)", boxShadow: "0 4px 14px rgba(37,211,102,.3)" }}>واتساب</button>
          <button onClick={() => handleShare("facebook")} style={{ flex: 1, height: 48, background: "#1877F2", border: "none", borderRadius: 14, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-arabic)", boxShadow: "0 4px 14px rgba(24,119,242,.3)" }}>فيسبوك</button>
        </div>
      </div>
      <button onClick={() => { resetDonation(); navigate("/", { replace: true }); }} style={{ width: "100%", height: 52, background: "#0d7477", color: "white", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-arabic)", boxShadow: "0 4px 14px rgba(13,116,119,.25)" }}>
        العودة للرئيسية
      </button>
    </div>
  );
};
