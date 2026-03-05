import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Badge from '../components/Badge';

// ============================================
// ADMIN ERROR LOGS PAGE
// Displays all backend errors logged to the errorLogs table
// ============================================

const LEVEL_COLORS = {
  error: { badge: 'danger', dot: 'bg-red-500', row: 'border-l-red-500' },
  warning: { badge: 'warning', dot: 'bg-amber-500', row: 'border-l-amber-500' },
  info: { badge: 'neutral', dot: 'bg-blue-500', row: 'border-l-blue-500' },
};

const SOURCE_ICONS = {
  payments: 'payments',
  storage: 'cloud_upload',
  projects: 'folder_special',
  webhooks: 'webhook',
};

const formatDate = (ts) => {
  if (!ts) return '-';
  return new Intl.DateTimeFormat('fr-MA', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(ts));
};

const AdminErrorLogs = () => {
  const { currentLanguage, showToast } = useApp();
  const lang = currentLanguage?.code || 'en';

  const [sourceFilter, setSourceFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const logs = useQuery(api.errorLogs.getErrorLogs, {
    limit: 200,
    source: sourceFilter || undefined,
    level: levelFilter || undefined,
  });

  const deleteLog = useMutation(api.errorLogs.deleteErrorLog);
  const clearAll = useMutation(api.errorLogs.clearAllErrorLogs);

  const t = {
    ar: {
      title: 'سجل الأخطاء',
      subtitle: 'جميع الأخطاء المسجلة من الخادم',
      source: 'المصدر',
      level: 'المستوى',
      message: 'الرسالة',
      time: 'الوقت',
      details: 'التفاصيل',
      apiUrl: 'رابط API',
      apiStatus: 'كود الحالة',
      apiResponse: 'استجابة API',
      clearAll: 'مسح الكل',
      clearConfirmBtn: 'تأكيد المسح',
      cancel: 'إلغاء',
      noLogs: 'لا توجد أخطاء مسجلة',
      delete: 'حذف',
      allSources: 'جميع المصادر',
      allLevels: 'جميع المستويات',
      logsCount: (n) => `${n} سجل`,
    },
    fr: {
      title: 'Journal des Erreurs',
      subtitle: 'Toutes les erreurs enregistrées côté serveur',
      source: 'Source',
      level: 'Niveau',
      message: 'Message',
      time: 'Heure',
      details: 'Détails',
      apiUrl: 'URL API',
      apiStatus: 'Code statut',
      apiResponse: 'Réponse API',
      clearAll: 'Tout effacer',
      clearConfirmBtn: 'Confirmer',
      cancel: 'Annuler',
      noLogs: 'Aucune erreur enregistrée',
      delete: 'Supprimer',
      allSources: 'Toutes les sources',
      allLevels: 'Tous les niveaux',
      logsCount: (n) => `${n} entrée(s)`,
    },
    en: {
      title: 'Error Logs',
      subtitle: 'All backend errors recorded in the system',
      source: 'Source',
      level: 'Level',
      message: 'Message',
      time: 'Time',
      details: 'Details',
      apiUrl: 'API URL',
      apiStatus: 'Status Code',
      apiResponse: 'API Response',
      clearAll: 'Clear All',
      clearConfirmBtn: 'Confirm Clear',
      cancel: 'Cancel',
      noLogs: 'No errors logged',
      delete: 'Delete',
      allSources: 'All Sources',
      allLevels: 'All Levels',
      logsCount: (n) => `${n} log(s)`,
    },
  };

  const tx = t[lang] || t.en;

  const handleDelete = async (logId) => {
    try {
      await deleteLog({ logId });
      if (expandedId === logId) setExpandedId(null);
    } catch (err) {
      showToast('Failed to delete log', 'error');
    }
  };

  const handleClearAll = async () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 5000);
      return;
    }
    try {
      const count = await clearAll({});
      showToast(`Cleared ${count} log(s)`, 'success');
      setClearConfirm(false);
    } catch (err) {
      showToast('Failed to clear logs', 'error');
    }
  };

  if (logs === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500">bug_report</span>
            {tx.title}
          </h1>
          <p className="text-sm text-text-secondary mt-1">{tx.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">{tx.logsCount(logs.length)}</span>
          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                clearConfirm
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {clearConfirm ? 'warning' : 'delete_sweep'}
              </span>
              {clearConfirm ? tx.clearConfirmBtn : tx.clearAll}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card variant="default" className="p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-text-primary dark:text-white"
          >
            <option value="">{tx.allSources}</option>
            <option value="payments">payments</option>
            <option value="storage">storage</option>
            <option value="projects">projects</option>
            <option value="webhooks">webhooks</option>
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-text-primary dark:text-white"
          >
            <option value="">{tx.allLevels}</option>
            <option value="error">error</option>
            <option value="warning">warning</option>
            <option value="info">info</option>
          </select>
        </div>
      </Card>

      {/* Log List */}
      {logs.length === 0 ? (
        <Card variant="default" className="p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-green-400 mb-3">check_circle</span>
          <p className="text-text-secondary">{tx.noLogs}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const colors = LEVEL_COLORS[log.level] || LEVEL_COLORS.error;
            const isExpanded = expandedId === log._id;

            return (
              <Card
                key={log._id}
                variant="default"
                className={`border-l-4 ${colors.row} overflow-hidden`}
              >
                {/* Summary row */}
                <div
                  className="flex items-start gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : log._id)}
                >
                  {/* Level dot */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={colors.badge} size="sm">{log.level}</Badge>
                      <span className="flex items-center gap-1 text-xs text-text-secondary bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-xs">
                          {SOURCE_ICONS[log.source] || 'code'}
                        </span>
                        {log.source}
                      </span>
                      {log.apiStatus && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                          log.apiStatus >= 400
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-text-secondary'
                        }`}>
                          HTTP {log.apiStatus}
                        </span>
                      )}
                      <span className="text-xs text-text-secondary ml-auto shrink-0">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-text-primary dark:text-white line-clamp-2">
                      {log.message}
                    </p>
                    {log.apiUrl && !isExpanded && (
                      <p className="text-xs text-text-secondary mt-1 truncate font-mono">
                        {log.apiUrl}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(log._id); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title={tx.delete}
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <span className="material-symbols-outlined text-sm text-text-secondary">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-100 dark:border-gray-800">
                    {log.apiUrl && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                          {tx.apiUrl}
                        </p>
                        <p className="text-sm font-mono text-text-primary dark:text-white break-all bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                          {log.apiUrl}
                        </p>
                      </div>
                    )}

                    {log.details && (() => {
                      let parsed;
                      try { parsed = JSON.parse(log.details); } catch { parsed = log.details; }
                      return (
                        <div>
                          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                            {tx.details}
                          </p>
                          <pre className="text-xs font-mono text-text-primary dark:text-white bg-gray-50 dark:bg-gray-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                            {typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : parsed}
                          </pre>
                        </div>
                      );
                    })()}

                    {log.apiResponse && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                          {tx.apiResponse}
                        </p>
                        <pre className="text-xs font-mono text-text-primary dark:text-white bg-gray-50 dark:bg-gray-900 rounded-lg p-3 overflow-x-auto max-h-60 whitespace-pre-wrap">
                          {(() => {
                            try { return JSON.stringify(JSON.parse(log.apiResponse), null, 2); }
                            catch { return log.apiResponse; }
                          })()}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminErrorLogs;
