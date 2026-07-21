import React from "react";
import { useApp } from "../../../../context/AppContext";
import AdminSettingsLayout from "./AdminSettingsLayout";
import { useAdminSettingsController } from "./adminSettingsController";

const AdminSettings = () => {
  const { showToast, user } = useApp();
  const controller = useAdminSettingsController({ showToast, user });

  return <AdminSettingsLayout {...controller} user={user} />;
};

export default AdminSettings;
