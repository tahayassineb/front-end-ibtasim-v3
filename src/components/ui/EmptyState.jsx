import React from 'react';
import { 
  Inbox, 
  Search, 
  FileX, 
  Heart,
  FolderOpen,
  AlertCircle,
  Plus
} from 'lucide-react';

const icons = {
  inbox: Inbox,
  search: Search,
  file: FileX,
  heart: Heart,
  folder: FolderOpen,
  alert: AlertCircle,
};

const EmptyState = ({
  icon = 'inbox',
  title,
  description,
  action,
  actionLabel,
  onAction,
  className = '',
}) => {
  const Icon = icons[icon] || Inbox;

  return (
    <div 
      className={`
        flex flex-col items-center justify-center text-center 
        p-8 md:p-12 rounded-2xl bg-surface-secondary
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      <div 
        className="
          w-16 h-16 mb-6 rounded-2xl 
          bg-surface-primary shadow-soft
          flex items-center justify-center
        "
      >
        <Icon className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-gray-500 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={onAction}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Specialized Empty States
export const NoProjectsEmptyState = ({ onAction }) => (
  <EmptyState
    icon="folder"
    title="Aucun projet pour le moment"
    description="Les projets en cours apparaîtront ici. Commencez par créer votre premier projet."
    action={!!onAction}
    actionLabel="Créer un projet"
    onAction={onAction}
  />
);

export const NoDonationsEmptyState = () => (
  <EmptyState
    icon="heart"
    title="Aucun don pour le moment"
    description="Les dons apparaîtront ici une fois que des donateurs commenceront à contribuer."
  />
);

export const NoResultsEmptyState = ({ searchTerm, onClear }) => (
  <EmptyState
    icon="search"
    title="Aucun résultat trouvé"
    description={`Aucun résultat ne correspond à "${searchTerm}". Essayez avec d'autres termes.`}
    action={true}
    actionLabel="Effacer la recherche"
    onAction={onClear}
  />
);

export const NoDonorsEmptyState = () => (
  <EmptyState
    icon="inbox"
    title="Aucun donateur inscrit"
    description="Les donateurs apparaîtront ici une fois qu'ils s'inscriront sur la plateforme."
  />
);

export const ErrorEmptyState = ({ onRetry }) => (
  <EmptyState
    icon="alert"
    title="Une erreur s'est produite"
    description="Impossible de charger les données. Veuillez réessayer."
    action={true}
    actionLabel="Réessayer"
    onAction={onRetry}
  />
);

export default EmptyState;
