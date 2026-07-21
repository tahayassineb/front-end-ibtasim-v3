import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  defaultFormData,
  defaultWhatsAppSession,
  normalizeWhatsAppPhoneNumber,
  parseJson,
} from "./adminSettingsHelpers";
import { DEFAULT_PROJECT_CATEGORIES, parseProjectCategories } from "../../../../lib/i18nContent";

export function useAdminSettingsController({ showToast, user }) {
  const [activeTab, setActiveTab] = useState("bank");
  const [formData, setFormData] = useState(defaultFormData);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [projectCategories, setProjectCategories] = useState(DEFAULT_PROJECT_CATEGORIES);
  const [ribCopied, setRibCopied] = useState(false);
  const [waSessionsList, setWaSessionsList] = useState(null);
  const [waSessionsLoading, setWaSessionsLoading] = useState(false);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [whatsappSession, setWhatsappSession] = useState(defaultWhatsAppSession);

  const adminAuthArgs = user?.sessionToken ? { sessionToken: user.sessionToken } : "skip";

  const bankInfoData = useQuery(
    api.config.getPrivateConfig,
    adminAuthArgs === "skip" ? "skip" : { ...adminAuthArgs, key: "bank_info" }
  );
  const whatsappSettingsData = useQuery(
    api.config.getPrivateConfig,
    adminAuthArgs === "skip" ? "skip" : { ...adminAuthArgs, key: "whatsapp_settings" }
  );
  const orgProfileData = useQuery(
    api.config.getPrivateConfig,
    adminAuthArgs === "skip" ? "skip" : { ...adminAuthArgs, key: "org_profile" }
  );
  const notificationsData = useQuery(
    api.config.getPrivateConfig,
    adminAuthArgs === "skip" ? "skip" : { ...adminAuthArgs, key: "notifications" }
  );
  const projectCategoriesData = useQuery(
    api.config.getPrivateConfig,
    adminAuthArgs === "skip" ? "skip" : { ...adminAuthArgs, key: "project_categories" }
  );

  const setConfig = useMutation(api.config.setConfig);
  const createAndConnectSession = useAction(api.whatsapp.createAndConnectSession);
  const disconnectSessionAction = useAction(api.whatsapp.disconnectSession);
  const refreshQrCodeAction = useAction(api.whatsapp.refreshQrCode);
  const syncSessionStatusAction = useAction(api.whatsapp.syncSessionStatus);
  const deleteSessionAction = useAction(api.whatsapp.deleteSession);
  const resyncApiKeyAction = useAction(api.whatsapp.resyncApiKey);
  const listWaSenderSessionsAction = useAction(api.whatsapp.listWaSenderSessions);
  const selectSessionForSendingAction = useAction(api.whatsapp.selectSessionForSending);

  const isLoading =
    bankInfoData === undefined ||
    whatsappSettingsData === undefined ||
    orgProfileData === undefined ||
    notificationsData === undefined ||
    projectCategoriesData === undefined;

  const whatsappInitialized = useRef(false);

  useEffect(() => {
    const parsed = parseJson(bankInfoData, null);
    if (!parsed) return;
    setFormData((prev) => ({
      ...prev,
      accountHolder: parsed.accountHolder || prev.accountHolder,
      rib: parsed.rib || prev.rib,
      bankName: parsed.bankName || prev.bankName,
      agency: parsed.agency || prev.agency,
      associationPhone: parsed.associationPhone || prev.associationPhone,
    }));
  }, [bankInfoData]);

  useEffect(() => {
    const parsed = parseJson(orgProfileData, null);
    if (!parsed) return;
    setFormData((prev) => ({
      ...prev,
      organizationName: parsed.organizationName || prev.organizationName,
      email: parsed.email || prev.email,
      phone: parsed.phone || prev.phone,
      address: parsed.address || prev.address,
      description: parsed.description || prev.description,
    }));
  }, [orgProfileData]);

  useEffect(() => {
    const parsed = parseJson(notificationsData, null);
    if (!parsed) return;
    setFormData((prev) => ({
      ...prev,
      newDonation: parsed.newDonation ?? prev.newDonation,
      donationVerified: parsed.donationVerified ?? prev.donationVerified,
      weeklyReports: parsed.weeklyReports ?? prev.weeklyReports,
      monthlyReports: parsed.monthlyReports ?? prev.monthlyReports,
    }));
  }, [notificationsData]);

  useEffect(() => {
    setProjectCategories(parseProjectCategories(projectCategoriesData));
  }, [projectCategoriesData]);

  useEffect(() => {
    if (!whatsappSettingsData || whatsappInitialized.current) return;
    whatsappInitialized.current = true;
    const parsed = parseJson(whatsappSettingsData, null);
    if (!parsed) return;
    setWhatsappSession((prev) => ({ ...prev, ...parsed, isLoading: false }));
  }, [whatsappSettingsData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const persistConfig = async (key, value, successMessage, errorMessage, setSaving) => {
    setSaving(true);
    try {
      await setConfig({ ...adminAuthArgs, key, value });
      showToast(successMessage, "success");
    } catch (error) {
      console.error(errorMessage, error);
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBank = async () => {
    await persistConfig(
      "bank_info",
      JSON.stringify({
        accountHolder: formData.accountHolder,
        rib: formData.rib,
        bankName: formData.bankName,
        agency: formData.agency,
        associationPhone: formData.associationPhone,
      }),
      "تم حفظ معلومات البنك بنجاح",
      "فشل حفظ معلومات البنك",
      setIsSavingBank
    );
  };

  const handleSaveProfile = async () => {
    await persistConfig(
      "org_profile",
      JSON.stringify({
        organizationName: formData.organizationName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        description: formData.description,
      }),
      "تم حفظ ملف الجمعية بنجاح",
      "فشل حفظ ملف الجمعية",
      setIsSavingProfile
    );
  };

  const handleSaveNotifications = async () => {
    await persistConfig(
      "notifications",
      JSON.stringify({
        newDonation: formData.newDonation,
        donationVerified: formData.donationVerified,
        weeklyReports: formData.weeklyReports,
        monthlyReports: formData.monthlyReports,
      }),
      "تم حفظ إعدادات الإشعارات بنجاح",
      "فشل حفظ إعدادات الإشعارات",
      setIsSavingNotifications
    );
  };

  const handleSaveCategories = async (categories) => {
    setProjectCategories(categories);
    await persistConfig(
      "project_categories",
      JSON.stringify(categories),
      "تم حفظ الفئات بنجاح",
      "فشل حفظ الفئات",
      setIsSavingCategories
    );
  };

  const handleConnect = async () => {
    const phoneNumber = normalizeWhatsAppPhoneNumber(whatsappSession.phoneNumber);
    if (!phoneNumber || phoneNumber.length < 12) {
      showToast("يرجى إدخال رقم هاتف صحيح بالتنسيق الدولي", "error");
      return;
    }
    setWhatsappSession((prev) => ({ ...prev, isLoading: true, qrCode: null }));
    try {
      const result = await createAndConnectSession({
        phoneNumber,
        sessionToken: user?.sessionToken,
      });
      if (!result.success) {
        setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
        showToast(result.error || "فشل إنشاء الجلسة", "error");
        return;
      }
      setWhatsappSession((prev) => ({
        ...prev,
        isLoading: false,
        qrCode: result.qrCode || null,
      }));
      showToast(
        result.qrCode ? "تم إنشاء الجلسة بنجاح" : "تم إنشاء الجلسة لكن لم يتم إرجاع QR",
        result.qrCode ? "success" : "warning"
      );
    } catch (error) {
      setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
      showToast(error.message || "فشل إنشاء الجلسة", "error");
    }
  };

  const handleReconnect = async () => {
    setWhatsappSession((prev) => ({ ...prev, isLoading: true, qrCode: null }));
    try {
      const result = await refreshQrCodeAction({ sessionToken: user?.sessionToken });
      if (!result.success) {
        setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
        showToast(result.error || "فشل إعادة الاتصال", "error");
        return;
      }
      setWhatsappSession((prev) => ({
        ...prev,
        isLoading: false,
        qrCode: result.qrCode || null,
      }));
      showToast(
        result.qrCode ? "تم تجديد رمز QR بنجاح" : "لم يتم إرجاع رمز QR جديد",
        result.qrCode ? "success" : "warning"
      );
    } catch (error) {
      setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
      showToast(error.message || "فشل إعادة الاتصال", "error");
    }
  };

  const handleRefreshQr = async () => {
    setIsRefreshingQr(true);
    try {
      const result = await refreshQrCodeAction({ sessionToken: user?.sessionToken });
      if (result.qrCode) {
        setWhatsappSession((prev) => ({ ...prev, qrCode: result.qrCode }));
        showToast("تم تجديد رمز QR", "success");
      } else {
        showToast("لم يتم إرجاع رمز QR جديد", "warning");
      }
    } catch (error) {
      showToast(error.message || "فشل تجديد رمز QR", "error");
    } finally {
      setIsRefreshingQr(false);
    }
  };

  const handleDisconnect = async () => {
    setWhatsappSession((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await disconnectSessionAction({ sessionToken: user?.sessionToken });
      if (!result.success) {
        setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
        showToast(result.error || "فشل قطع الاتصال", "error");
        return;
      }
      setWhatsappSession((prev) => ({
        ...prev,
        isConnected: false,
        qrCode: null,
        isLoading: false,
      }));
      showToast("تم قطع الاتصال بنجاح", "success");
    } catch (error) {
      setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
      showToast(error.message || "فشل قطع الاتصال", "error");
    }
  };

  const handleSyncStatus = async () => {
    setWhatsappSession((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await syncSessionStatusAction({ sessionToken: user?.sessionToken });
      if (!result.success) {
        setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
        showToast(result.error || "فشل مزامنة الحالة", "error");
        return;
      }
      setWhatsappSession((prev) => ({
        ...prev,
        isConnected: result.isConnected,
        qrCode: result.isConnected ? null : prev.qrCode,
        isLoading: false,
      }));
      showToast(
        result.isConnected ? "الجلسة متصلة" : "الجلسة غير متصلة",
        result.isConnected ? "success" : "warning"
      );
    } catch (error) {
      setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
      showToast(error.message || "فشل مزامنة الحالة", "error");
    }
  };

  const handleResyncApiKey = async () => {
    setWhatsappSession((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await resyncApiKeyAction({ sessionToken: user?.sessionToken });
      showToast(
        result.success
          ? "تم تحديث مفتاح الجلسة بنجاح"
          : result.error || "فشل تحديث مفتاح الجلسة",
        result.success ? "success" : "error"
      );
    } catch (error) {
      showToast(error.message || "فشل تحديث مفتاح الجلسة", "error");
    } finally {
      setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleListWaSenderSessions = async () => {
    setWaSessionsLoading(true);
    try {
      const result = await listWaSenderSessionsAction({ sessionToken: user?.sessionToken });
      if (!result.success) {
        showToast(result.error || "فشل جلب الجلسات", "error");
      } else {
        setWaSessionsList(result.sessions || []);
      }
    } catch (error) {
      showToast(error.message || "فشل جلب الجلسات", "error");
    } finally {
      setWaSessionsLoading(false);
    }
  };

  const handleSelectSession = async (sessionId) => {
    setWaSessionsLoading(true);
    try {
      const result = await selectSessionForSendingAction({
        sessionId,
        sessionToken: user?.sessionToken,
      });
      if (!result.success) {
        showToast(result.error || "فشل تحديد الجلسة", "error");
        return;
      }
      setWaSessionsList(null);
      showToast("تم تحديد الجلسة بنجاح", "success");
      const sync = await syncSessionStatusAction({ sessionToken: user?.sessionToken });
      if (sync.success) {
        setWhatsappSession((prev) => ({ ...prev, isConnected: sync.isConnected }));
      }
    } catch (error) {
      showToast(error.message || "فشل تحديد الجلسة", "error");
    } finally {
      setWaSessionsLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!window.confirm("هل أنت متأكد من حذف جلسة الواتساب؟")) return;
    setWhatsappSession((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await deleteSessionAction({ sessionToken: user?.sessionToken });
      if (!result.success) {
        setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
        showToast(result.error || "فشل حذف الجلسة", "error");
        return;
      }
      setWhatsappSession(defaultWhatsAppSession);
      showToast("تم حذف الجلسة بنجاح", "success");
    } catch (error) {
      setWhatsappSession((prev) => ({ ...prev, isLoading: false }));
      showToast(error.message || "فشل حذف الجلسة", "error");
    }
  };

  const handlePhoneChange = async () => {
    try {
      const {
        phoneNumber,
        instanceId,
        apiKey,
        isConnected,
        lastConnected,
        messagesSent,
        messagesReceived,
      } = whatsappSession;

      await setConfig({
        ...adminAuthArgs,
        key: "whatsapp_settings",
        value: JSON.stringify({
          phoneNumber,
          instanceId,
          apiKey,
          isConnected,
          lastConnected,
          messagesSent,
          messagesReceived,
        }),
      });
      showToast("تم تحديث رقم الهاتف بنجاح", "success");
    } catch (error) {
      showToast(error.message || "فشل تحديث رقم الهاتف", "error");
    }
  };

  return {
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
    projectCategories,
    setActiveTab,
    setRibCopied,
    setWhatsappSession,
    syncSessionStatusAction,
    waSessionsList,
    waSessionsLoading,
    whatsappSession,
  };
}
