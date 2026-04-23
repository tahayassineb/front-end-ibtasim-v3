import React from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { SettingsCard, FieldLabel, SaveBtn, fieldInput, PRIMARY, BORDER } from './shared';

const ProfileTab = ({ formData, handleInputChange, handleSaveProfile, isSavingProfile }) => {
  const fontSystem = useQuery(api.config.getConfig, { key: 'font_system' });
  const setConfig = useMutation(api.config.setConfig);

  return (
    <>
      <SettingsCard icon="👤" title="ملف الجمعية">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'اسم المنظمة', field: 'organizationName', type: 'text' },
            { label: 'البريد الإلكتروني', field: 'email', type: 'email' },
            { label: 'الهاتف', field: 'phone', type: 'tel' },
            { label: 'العنوان', field: 'address', type: 'text' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <FieldLabel>{label}</FieldLabel>
              <input style={fieldInput} type={type} value={formData[field] || ''}
                onChange={e => handleInputChange(field, e.target.value)}
                onFocus={e => e.target.style.borderColor = PRIMARY}
                onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
          ))}
          <div>
            <FieldLabel>الوصف</FieldLabel>
            <textarea value={formData.description || ''} onChange={e => handleInputChange('description', e.target.value)} rows={3}
              style={{ ...fieldInput, height: 'auto', padding: '12px 14px', resize: 'none', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = BORDER} />
          </div>
          <SaveBtn onClick={handleSaveProfile} loading={isSavingProfile}>💾 حفظ ملف الجمعية</SaveBtn>
        </div>
      </SettingsCard>

      <SettingsCard icon="Aa" title="المظهر والخط">
        <FieldLabel>نظام الخط</FieldLabel>
        <select
          value={fontSystem === 'legacy' ? 'legacy' : 'thmanyah'}
          onChange={async (e) => {
            await setConfig({ key: 'font_system', value: e.target.value });
            document.documentElement.dataset.fontSystem = e.target.value;
          }}
          style={fieldInput}
        >
          <option value="thmanyah">خط ثمانية الجديد</option>
          <option value="legacy">النظام القديم</option>
        </select>
      </SettingsCard>
    </>
  );
};

export default ProfileTab;

