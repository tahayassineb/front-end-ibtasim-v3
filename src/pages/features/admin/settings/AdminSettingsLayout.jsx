import React from "react";
import { BORDER, PRIMARY, SHADOW, SHADOW_P, TABS, TEXTM } from "./shared";
import BankTab from "./BankTab";
import CategoriesTab from "./CategoriesTab";
import NotificationsTab from "./NotificationsTab";
import ProfileTab from "./ProfileTab";
import TeamTab from "./TeamTab";
import WhatsAppTab from "./WhatsAppTab";

export default function AdminSettingsLayout({
  activeTab,
  adminAuthArgs,
  formData,
  handleConnect,
  handleDeleteSession,
  handleDisconnect,
  handleInputChange,
  handleListWaSenderSessions,
  handlePhoneChange,
  handleReconnect,
  handleRefreshQr,
  handleResyncApiKey,
  handleSaveBank,
  handleSaveCategories,
  handleSaveNotifications,
  handleSaveProfile,
  handleSelectSession,
  handleSyncStatus,
  isLoading,
  isRefreshingQr,
  isSavingBank,
  isSavingCategories,
  isSavingNotifications,
  isSavingProfile,
  refreshQrCodeAction,
  ribCopied,
  setActiveTab,
  setRibCopied,
  setWhatsappSession,
  syncSessionStatusAction,
  user,
  waSessionsList,
  waSessionsLoading,
  whatsappSession,
  projectCategories,
}) {
  return (
    <div style={{ fontFamily: "var(--font-arabic)", color: "#0e1a1b", padding: 24 }} dir="rtl">
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "white",
          borderRadius: 14,
          border: `1px solid ${BORDER}`,
          padding: 6,
          marginBottom: 20,
          boxShadow: SHADOW,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: activeTab === tab.id ? PRIMARY : "none",
              color: activeTab === tab.id ? "white" : "#64748b",
              fontFamily: "var(--font-arabic)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: activeTab === tab.id ? SHADOW_P : "none",
              transition: "all .15s",
            }}
          >
            <span className="material-symbols-outlined no-flip" style={{ fontSize: 18 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: 60, color: TEXTM, fontSize: 15 }}>
          ⏳ جاري التحميل...
        </div>
      )}

      {!isLoading && (
        <>
          {activeTab === "bank" && (
            <BankTab
              formData={formData}
              handleInputChange={handleInputChange}
              handleSaveBank={handleSaveBank}
              isSavingBank={isSavingBank}
              ribCopied={ribCopied}
              setRibCopied={setRibCopied}
            />
          )}
          {activeTab === "categories" && (
            <CategoriesTab
              categories={projectCategories}
              handleSaveCategories={handleSaveCategories}
              isSavingCategories={isSavingCategories}
            />
          )}
          {activeTab === "whatsapp" && (
            <WhatsAppTab
              whatsappSession={whatsappSession}
              setWhatsappSession={setWhatsappSession}
              isRefreshingQr={isRefreshingQr}
              waSessionsList={waSessionsList}
              waSessionsLoading={waSessionsLoading}
              handleConnect={handleConnect}
              handleReconnect={handleReconnect}
              handleRefreshQr={handleRefreshQr}
              handleDisconnect={handleDisconnect}
              handleSyncStatus={handleSyncStatus}
              handleResyncApiKey={handleResyncApiKey}
              handleListWaSenderSessions={handleListWaSenderSessions}
              handleSelectSession={handleSelectSession}
              handleDeleteSession={handleDeleteSession}
              handlePhoneChange={handlePhoneChange}
              refreshQrCodeAction={() => refreshQrCodeAction({ sessionToken: user?.sessionToken })}
              syncSessionStatusAction={() => syncSessionStatusAction({ sessionToken: user?.sessionToken })}
            />
          )}
          {activeTab === "team" && <TeamTab adminAuthArgs={adminAuthArgs} />}
          {activeTab === "profile" && (
            <ProfileTab
              adminAuthArgs={adminAuthArgs}
              formData={formData}
              handleInputChange={handleInputChange}
              handleSaveProfile={handleSaveProfile}
              isSavingProfile={isSavingProfile}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab
              formData={formData}
              handleInputChange={handleInputChange}
              handleSaveNotifications={handleSaveNotifications}
              isSavingNotifications={isSavingNotifications}
            />
          )}
        </>
      )}
    </div>
  );
}
