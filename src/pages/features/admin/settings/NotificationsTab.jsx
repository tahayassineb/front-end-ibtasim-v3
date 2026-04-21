import React from 'react';
import { SettingsCard, SaveBtn, ToggleRow } from './shared';

const NotificationsTab = ({ formData, handleInputChange, handleSaveNotifications, isSavingNotifications }) => (
  <SettingsCard icon="🔔" title="إعدادات الإشعارات">
    <ToggleRow title="إشعار عند تبرع جديد" desc="واتساب للمدير عند كل تبرع جديد" value={!!formData.newDonation} onChange={v => handleInputChange('newDonation', v)} />
    <ToggleRow title="تأكيد للمتبرع تلقائياً" desc="رسالة واتساب تلقائية عند قبول التبرع" value={!!formData.donationVerified} onChange={v => handleInputChange('donationVerified', v)} />
    <ToggleRow title="تقارير أسبوعية" desc="ملخص أسبوعي للتبرعات والنشاط" value={!!formData.weeklyReports} onChange={v => handleInputChange('weeklyReports', v)} />
    <ToggleRow title="تذكير تجديد الكفالة" desc="تذكير للكافل 3 أيام قبل موعد التجديد" value={!!formData.monthlyReports} onChange={v => handleInputChange('monthlyReports', v)} isLast />
    <div style={{ marginTop: 16 }}>
      <SaveBtn onClick={handleSaveNotifications} loading={isSavingNotifications}>💾 حفظ إعدادات الإشعارات</SaveBtn>
    </div>
  </SettingsCard>
);

export default NotificationsTab;
