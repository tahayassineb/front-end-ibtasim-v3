import React from 'react';
import {
  SettingsCard, FieldLabel, SaveBtn, fieldInput,
  PRIMARY, BORDER, P600, P100, TEAL_WASH,
} from './shared';

const BankTab = ({
  formData,
  handleInputChange,
  handleSaveBank,
  isSavingBank,
  ribCopied,
  setRibCopied,
}) => (
  <SettingsCard icon="🏦" title="إعدادات التحويل البنكي">
    {/* RIB display box */}
    <div style={{ background: TEAL_WASH, borderRadius: 12, padding: 16, border: `1px solid ${P100}`, textAlign: 'center', marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
        رقم الحساب الحالي (RIB)
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: P600, fontFamily: 'Inter, sans-serif', letterSpacing: '.06em' }}>
        {formData.rib || '—'}
      </div>
    </div>

    {/* Form grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div>
        <FieldLabel>اسم البنك</FieldLabel>
        <input style={fieldInput} type="text" value={formData.bankName}
          onChange={e => handleInputChange('bankName', e.target.value)}
          onFocus={e => e.target.style.borderColor = PRIMARY}
          onBlur={e => e.target.style.borderColor = BORDER} />
      </div>
      <div>
        <FieldLabel>اسم الحساب (المستفيد)</FieldLabel>
        <input style={fieldInput} type="text" value={formData.accountHolder}
          onChange={e => handleInputChange('accountHolder', e.target.value)}
          onFocus={e => e.target.style.borderColor = PRIMARY}
          onBlur={e => e.target.style.borderColor = BORDER} />
      </div>
      <div style={{ gridColumn: '1/-1' }}>
        <FieldLabel>رقم RIB (24 خانة)</FieldLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...fieldInput, flex: 1, direction: 'ltr', fontFamily: 'Inter, sans-serif', letterSpacing: '.04em' }}
            type="text" value={formData.rib} placeholder="000 000 0000000000000000 00"
            onChange={e => handleInputChange('rib', e.target.value)}
            onFocus={e => e.target.style.borderColor = PRIMARY}
            onBlur={e => e.target.style.borderColor = BORDER} />
          <button type="button" title="نسخ RIB"
            onClick={() => { if (formData.rib) { navigator.clipboard.writeText(formData.rib); setRibCopied(true); setTimeout(() => setRibCopied(false), 2000); } }}
            style={{ width: 48, height: 48, border: `1.5px solid ${BORDER}`, borderRadius: 12, background: 'white', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
            {ribCopied ? '✓' : '📋'}
          </button>
        </div>
      </div>
    </div>

    <div style={{ marginTop: 16 }}>
      <SaveBtn onClick={handleSaveBank} loading={isSavingBank}>💾 حفظ إعدادات البنك</SaveBtn>
    </div>
  </SettingsCard>
);

export default BankTab;
