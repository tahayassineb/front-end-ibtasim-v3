import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
// Note: React-Quill removed - using textarea instead for React 19 compatibility

// ============================================
// ADMIN PROJECT FORM PAGE - Create/Edit Projects
// With Rich Text Editor, Gallery Management, Featured Toggle
// ============================================

const AdminProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, isDarkMode, showToast } = useApp();
  const isEditMode = Boolean(id);
  const [activeTab, setActiveTab] = useState('en');
  const [progress, setProgress] = useState(65);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Translations
  const translations = {
    ar: {
      createTitle: 'إنشاء مشروع جديد',
      editTitle: 'تعديل المشروع',
      basicInfo: 'المعلومات الأساسية',
      financialSettings: 'الإعدادات المالية',
      mediaGallery: 'معرض الوسائط',
      description: 'الوصف التفصيلي',
      projectTitle: 'عنوان المشروع',
      shortDescription: 'وصف قصير',
      goalAmount: 'المبلغ المستهدف',
      currency: 'العملة',
      visibility: 'الرؤية',
      public: 'عام',
      private: 'خاص',
      featured: 'مشروع مميز',
      featuredDesc: 'يظهر على الصفحة الرئيسية',
      saveDraft: 'حفظ كمسودة',
      publish: 'نشر المشروع',
      preview: 'معاينة',
      help: 'مساعدة',
      completionProgress: 'تقدم الإكمال',
      maxFiles: 'الحد الأقصى 10 ملفات. الصيغ المدعومة: JPG, PNG.',
      addImage: 'إضافة صورة',
      dragToReorder: 'اسحب لإعادة الترتيب',
      mainImage: 'الصورة الرئيسية',
      changeImage: 'تغيير الصورة',
      uploadImage: 'رفع صورة',
      remove: 'حذف',
      loading: 'جاري التحميل...',
      imageUploaded: 'تم رفع الصورة',
      errorUpload: 'خطأ في رفع الصورة',
      impact: 'التأثير',
      impactDesc: 'وصف التأثير المتوقع للمشروع',
      impactMetrics: 'مؤشرات التأثير',
      metricLabel: 'المؤشر',
      metricValue: 'القيمة المستهدفة',
      addMetric: 'إضافة مؤشر',
      updates: 'التحديثات',
      addUpdate: 'إضافة تحديث',
      updateTitle: 'عنوان التحديث',
      updateContent: 'محتوى التحديث',
      noUpdates: 'لا توجد تحديثات بعد',
    },
    fr: {
      createTitle: 'Créer un Nouveau Projet',
      editTitle: 'Modifier le Projet',
      basicInfo: 'Informations de Base',
      financialSettings: 'Paramètres Financiers',
      mediaGallery: 'Galerie Média',
      description: 'Description Détaillée',
      projectTitle: 'Titre du Projet',
      shortDescription: 'Description Courte',
      goalAmount: 'Montant Objectif',
      currency: 'Devise',
      visibility: 'Visibilité',
      public: 'Public',
      private: 'Privé',
      featured: 'Projet en Vedette',
      featuredDesc: 'Apparaît sur la page d\'accueil',
      saveDraft: 'Enregistrer Brouillon',
      publish: 'Publier le Projet',
      preview: 'Aperçu',
      help: 'Aide',
      completionProgress: 'Progression',
      maxFiles: 'Maximum 10 fichiers. Formats supportés: JPG, PNG.',
      addImage: 'Ajouter une Image',
      dragToReorder: 'Glisser pour réorganiser',
      mainImage: 'Image Principale',
      changeImage: 'Changer l\'image',
      uploadImage: 'Télécharger une image',
      remove: 'Supprimer',
      loading: 'Chargement...',
      imageUploaded: 'Image téléchargée',
      errorUpload: 'Erreur de téléchargement',
      impact: 'Impact',
      impactDesc: 'Description de l\'impact attendu du projet',
      impactMetrics: 'Indicateurs d\'Impact',
      metricLabel: 'Indicateur',
      metricValue: 'Valeur Cible',
      addMetric: 'Ajouter un Indicateur',
      updates: 'Mises à Jour',
      addUpdate: 'Ajouter une Mise à Jour',
      updateTitle: 'Titre de la Mise à Jour',
      updateContent: 'Contenu de la Mise à Jour',
      noUpdates: 'Aucune mise à jour pour l\'instant',
    },
    en: {
      createTitle: 'Create New Project',
      editTitle: 'Edit Project',
      basicInfo: 'Basic Information',
      financialSettings: 'Financial Settings',
      mediaGallery: 'Media Gallery',
      description: 'Detailed Description',
      projectTitle: 'Project Title',
      shortDescription: 'Short Description',
      goalAmount: 'Goal Amount',
      currency: 'Currency',
      visibility: 'Visibility',
      public: 'Public',
      private: 'Private',
      featured: 'Featured Project',
      featuredDesc: 'Appears on homepage',
      saveDraft: 'Save Draft',
      publish: 'Publish Project',
      preview: 'Preview',
      help: 'Help',
      completionProgress: 'Completion Progress',
      maxFiles: 'Maximum 10 files. Supported formats: JPG, PNG.',
      addImage: 'Add Image',
      dragToReorder: 'Drag to reorder',
      mainImage: 'Main Image',
      changeImage: 'Change Image',
      uploadImage: 'Upload Image',
      remove: 'Remove',
      loading: 'Loading...',
      imageUploaded: 'Image uploaded',
      errorUpload: 'Upload error',
      impact: 'Impact',
      impactDesc: 'Description of the project\'s expected impact',
      impactMetrics: 'Impact Metrics',
      metricLabel: 'Metric',
      metricValue: 'Target Value',
      addMetric: 'Add Metric',
      updates: 'Updates',
      addUpdate: 'Add Update',
      updateTitle: 'Update Title',
      updateContent: 'Update Content',
      noUpdates: 'No updates yet',
    },
  };

  const t = translations[currentLanguage.code] || translations.en;

  // Form state - initialize with default data, will be overridden by localStorage in edit mode
  const [formData, setFormData] = useState({
    title: {
      en: 'Community Water Access Initiative',
      fr: 'Initiative d\'Accès à l\'Eau Communautaire',
      ar: 'مبادرة الوصول إلى المياه المجتمعية',
    },
    shortDescription: {
      en: 'Providing sustainable clean water solutions for rural communities in the Atlas Mountains region.',
      fr: 'Fournir des solutions d\'eau potable durables pour les communautés rurales de la région de l\'Atlas.',
      ar: 'توفير حلول مياه نظيفة مستدامة للمجتمعات الريفية في منطقة جبال الأطلس.',
    },
    description: {
      en: '<p>In the heart of the Atlas Mountains, access to clean water remains a critical challenge for many communities. This project aims to provide sustainable water solutions through modern infrastructure while respecting traditional practices.</p><p><strong>Our Approach:</strong></p><ul><li>Community-led planning and implementation</li><li>Sustainable technology adapted to local conditions</li><li>Long-term maintenance and training programs</li></ul>',
      fr: '<p>Au cœur des montagnes de l\'Atlas, l\'accès à l\'eau potable reste un défi critique pour de nombreuses communautés. Ce projet vise à fournir des solutions durables grâce à une infrastructure moderne tout en respectant les pratiques traditionnelles.</p><p><strong>Notre Approche:</strong></p><ul><li>Planification et mise en œuvre dirigées par la communauté</li><li>Technologie durable adaptée aux conditions locales</li><li>Programmes de maintenance et de formation à long terme</li></ul>',
      ar: '<p>في قلب جبال الأطلس، يظل الوصول إلى المياه النظيفة تحدياً حرجاً للعديد من المجتمعات. يهدف هذا المشروع إلى توفير حلول مياه مستدامة من خلال بنية تحتية حديثة مع احترام الممارسات التقليدية.</p><p><strong>نهجنا:</strong></p><ul><li>التخطيط والتنفيذ بقيادة المجتمع</li><li>تقنية مستدامة مكيفة مع الظروف المحلية</li><li>برامج الصيانة والتدريب على المدى الطويل</li></ul>',
    },
    goal: 25000,
    currency: 'MAD',
    visibility: 'public',
    featured: false,
    mainImage: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1541544537156-21c5299228d8?w=400',
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400',
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400',
    ],
    impact: {
      en: '<p>This project will provide sustainable clean water access to over 500 families in rural communities.</p>',
      fr: '<p>Ce projet fournira un accès durable à l\'eau potable à plus de 500 familles dans les communautés rurales.</p>',
      ar: '<p>سيوفر هذا المشروع وصولاً مستداماً إلى المياه النظيفة لأكثر من 500 عائلة في المجتمعات الريفية.</p>',
    },
    impactMetrics: [
      { label: 'Families Served', value: '500' },
      { label: 'Water Points', value: '12' },
    ],
    updates: [],
  });

  const [draggedItem, setDraggedItem] = useState(null);

  // Load project data from localStorage when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const savedProjects = JSON.parse(localStorage.getItem('admin_projects') || '[]');
      const projectToEdit = savedProjects.find(p => String(p.id) === String(id));
      if (projectToEdit) {
        setFormData(prev => ({
          ...prev,
          title: projectToEdit.title || prev.title,
          shortDescription: projectToEdit.shortDescription || prev.shortDescription,
          description: projectToEdit.description || prev.description,
          goal: projectToEdit.goal || prev.goal,
          currency: projectToEdit.currency || prev.currency,
          visibility: projectToEdit.visibility || prev.visibility,
          featured: projectToEdit.featured ?? prev.featured,
          mainImage: projectToEdit.mainImage || prev.mainImage,
          gallery: projectToEdit.gallery || prev.gallery,
          impact: projectToEdit.impact || prev.impact,
          impactMetrics: projectToEdit.impactMetrics || prev.impactMetrics,
          updates: projectToEdit.updates || prev.updates,
        }));
      }
    }
  }, [isEditMode, id]);

  const handleInputChange = (field, value, lang = null) => {
    if (lang) {
      setFormData(prev => ({
        ...prev,
        [field]: { ...prev[field], [lang]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle rich text editor change
  const handleDescriptionChange = (value) => {
    setFormData(prev => ({
      ...prev,
      description: { ...prev.description, [activeTab]: value },
    }));
  };

  // Handle main image upload
  const handleMainImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(t.errorUpload, 'error');
      return;
    }

    setIsUploading(true);
    
    // Simulate upload - in real app, upload to server
    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => {
        setFormData(prev => ({ ...prev, mainImage: event.target.result }));
        setIsUploading(false);
        showToast(t.imageUploaded, 'success');
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  // Handle gallery image upload
  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (formData.gallery.length + validFiles.length > 10) {
      showToast(t.maxFiles, 'error');
      return;
    }

    setIsUploading(true);

    // Simulate uploads
    const uploadPromises = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(uploadPromises).then(newImages => {
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          gallery: [...prev.gallery, ...newImages],
        }));
        setIsUploading(false);
        showToast(t.imageUploaded, 'success');
      }, 1000);
    });
  };

  // Handle gallery image removal
  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  // Drag and drop handlers for gallery reordering
  const handleDragStart = (index) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newGallery = [...formData.gallery];
    const item = newGallery[draggedItem];
    newGallery.splice(draggedItem, 1);
    newGallery.splice(index, 0, item);
    
    setFormData(prev => ({ ...prev, gallery: newGallery }));
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Handle impact description change
  const handleImpactChange = (value) => {
    setFormData(prev => ({
      ...prev,
      impact: { ...prev.impact, [activeTab]: value },
    }));
  };

  // Handle impact metrics
  const handleAddMetric = () => {
    setFormData(prev => ({
      ...prev,
      impactMetrics: [...prev.impactMetrics, { label: '', value: '' }],
    }));
  };

  const handleRemoveMetric = (index) => {
    setFormData(prev => ({
      ...prev,
      impactMetrics: prev.impactMetrics.filter((_, i) => i !== index),
    }));
  };

  const handleMetricChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      impactMetrics: prev.impactMetrics.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  // Handle updates
  const handleAddUpdate = () => {
    setFormData(prev => ({
      ...prev,
      updates: [
        ...prev.updates,
        {
          id: Date.now(),
          title: { en: '', fr: '', ar: '' },
          content: { en: '', fr: '', ar: '' },
          date: new Date().toISOString().split('T')[0],
        }
      ],
    }));
  };

  const handleRemoveUpdate = (updateId) => {
    setFormData(prev => ({
      ...prev,
      updates: prev.updates.filter(u => u.id !== updateId),
    }));
  };

  const handleUpdateChange = (updateId, field, value, lang = null) => {
    setFormData(prev => ({
      ...prev,
      updates: prev.updates.map(u => {
        if (u.id !== updateId) return u;
        if (lang) {
          return { ...u, [field]: { ...u[field], [lang]: value } };
        }
        return { ...u, [field]: value };
      }),
    }));
  };

  // Handle preview
  const handlePreview = () => {
    // Store current form data in sessionStorage for preview
    sessionStorage.setItem('projectPreview', JSON.stringify(formData));
    window.open(`/projects/preview-${isEditMode ? id : 'new'}`, '_blank');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save to localStorage
    const savedProjects = JSON.parse(localStorage.getItem('admin_projects') || '[]');
    
    // Prepare project data
    const projectData = {
      ...formData,
      id: isEditMode ? parseInt(id, 10) : Date.now(),
      status: formData.status || 'draft',
      category: formData.category || 'General',
      raised: isEditMode ? (savedProjects.find(p => String(p.id) === String(id))?.raised || 0) : 0,
      donors: isEditMode ? (savedProjects.find(p => String(p.id) === String(id))?.donors || 0) : 0,
      daysLeft: isEditMode ? (savedProjects.find(p => String(p.id) === String(id))?.daysLeft || 30) : 30,
      image: formData.mainImage,
    };
    
    let updatedProjects;
    if (isEditMode) {
      // Update existing project
      updatedProjects = savedProjects.map(p =>
        String(p.id) === String(id) ? projectData : p
      );
      // If not found in existing projects, add it
      if (!savedProjects.find(p => String(p.id) === String(id))) {
        updatedProjects.push(projectData);
      }
    } else {
      // Add new project
      updatedProjects = [...savedProjects, projectData];
    }
    
    localStorage.setItem('admin_projects', JSON.stringify(updatedProjects));
    showToast(isEditMode ? 'Project updated' : 'Project created', 'success');
    navigate('/admin/projects');
  };

  return (
    <div className="max-w-5xl mx-auto pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-bg-dark-card/80 backdrop-blur-md border-b border-border-light dark:border-white/10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/projects')}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-lg font-bold leading-tight tracking-tight text-text-primary dark:text-white">
              {isEditMode ? t.editTitle : t.createTitle}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePreview}
              className="text-primary text-sm font-bold cursor-pointer hover:opacity-80"
            >
              {t.preview}
            </button>
            <button 
              onClick={() => showToast('Help - coming soon', 'info')}
              className="text-primary text-sm font-bold cursor-pointer hover:opacity-80"
            >
              {t.help}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.05em]">{t.completionProgress}</span>
            <span className="text-xs font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-xl">info</span>
            <h3 className="font-bold text-base tracking-tight text-text-primary dark:text-white">{t.basicInfo}</h3>
          </div>

          <div className="space-y-5">
            {/* Main Image Upload */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.mainImage}</label>
              <div className="relative group">
                {formData.mainImage ? (
                  <div className="aspect-video w-full rounded-xl border border-border-light dark:border-white/10 overflow-hidden relative">
                    <img
                      src={formData.mainImage}
                      alt="Main project"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                      >
                        <span className="material-symbols-outlined">upload</span>
                        {isUploading ? t.loading : t.changeImage}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="aspect-video w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-4xl text-slate-400">add_photo_alternate</span>
                    <span className="text-sm font-medium text-slate-500">{t.uploadImage}</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Title with Language Tabs */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.projectTitle}</label>
              <div className="flex gap-1 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg mb-3">
                {['en', 'fr', 'ar'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveTab(lang)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                      activeTab === lang
                        ? 'bg-white text-primary shadow-sm border border-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.title[activeTab]}
                onChange={(e) => handleInputChange('title', e.target.value, activeTab)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg text-sm py-3 px-4 border border-slate-200 dark:border-slate-700 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.shortDescription}</label>
              <textarea
                value={formData.shortDescription[activeTab]}
                onChange={(e) => handleInputChange('shortDescription', e.target.value, activeTab)}
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg text-sm py-3 px-4 border border-slate-200 dark:border-slate-700 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Description - Rich Text Editor replaced with Textarea for React 19 compatibility */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.description}</label>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden p-3">
                <div className="flex gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-400">HTML tags supported: {'<p>'}, {'<strong>'}, {'<ul>'}, {'<li>'}, etc.</span>
                </div>
                <textarea
                  value={formData.description[activeTab]}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  rows={8}
                  className="w-full bg-transparent text-sm py-2 px-1 text-text-primary dark:text-white focus:outline-none resize-none font-mono"
                  placeholder="<p>Enter description here...</p>"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Financial Settings */}
        <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-xl">payments</span>
            <h3 className="font-bold text-base tracking-tight text-text-primary dark:text-white">{t.financialSettings}</h3>
          </div>

          <div className="space-y-5">
            {/* Goal Amount */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.goalAmount}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-sm">
                    {formData.currency === 'MAD' ? 'DH' : formData.currency === 'EUR' ? '€' : '$'}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.goal}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numeric input
                    if (value === '' || /^\d*$/.test(value)) {
                      handleInputChange('goal', value === '' ? '' : parseInt(value, 10) || 0);
                    }
                  }}
                  className="w-full pl-10 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm py-3 px-4 border border-slate-200 dark:border-slate-700 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Currency */}
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.currency}</label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg text-sm py-3 px-4 border border-slate-200 dark:border-slate-700 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="MAD">MAD - Moroccan Dirham</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.visibility}</label>
                <div className="flex items-center h-[46px] px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{formData.visibility === 'public' ? t.public : t.private}</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('visibility', formData.visibility === 'public' ? 'private' : 'public')}
                    className={`ml-auto w-9 h-5 rounded-full relative cursor-pointer transition-colors ${
                      formData.visibility === 'public' ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                      formData.visibility === 'public' ? 'right-0.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Toggle */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.featured}</label>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.featured}</p>
                  <p className="text-xs text-slate-400">{t.featuredDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('featured', !formData.featured)}
                  className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
                    formData.featured ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                    formData.featured ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Media Gallery */}
        <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">perm_media</span>
              <h3 className="font-bold text-base tracking-tight text-text-primary dark:text-white">{t.mediaGallery}</h3>
            </div>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isUploading || formData.gallery.length >= 10}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t.addImage}
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
            />
          </div>

          {/* Gallery Grid with Drag & Drop */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {/* Upload Button */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isUploading || formData.gallery.length >= 10}
              className="aspect-square rounded-xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:border-primary/50 hover:text-primary transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              <span className="text-[10px] font-bold uppercase mt-1">{t.addImage}</span>
            </button>
            
            {/* Gallery Images */}
            {formData.gallery.map((image, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`aspect-square rounded-xl border-2 overflow-hidden relative group cursor-move transition-all ${
                  draggedItem === index
                    ? 'border-primary opacity-50'
                    : 'border-transparent hover:border-primary/50'
                }`}
              >
                <img
                  src={image}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="p-2 bg-error text-white rounded-lg hover:bg-error-600 transition-colors"
                    title={t.remove}
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
                <div className="absolute top-1 left-1 w-6 h-6 bg-primary/80 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11px] text-slate-500">{t.maxFiles}</p>
            <p className="text-[11px] text-slate-400">{formData.gallery.length}/10 {t.dragToReorder}</p>
          </div>
        </Card>

        {/* Impact Section */}
        <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-xl">eco</span>
            <h3 className="font-bold text-base tracking-tight text-text-primary dark:text-white">{t.impact}</h3>
          </div>

          <div className="space-y-5">
            {/* Impact Description - Rich Text Editor replaced with Textarea for React 19 compatibility */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.impactDesc}</label>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden p-3">
                <div className="flex gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-400">HTML tags supported: {'<p>'}, {'<strong>'}, {'<ul>'}, {'<li>'}, etc.</span>
                </div>
                <textarea
                  value={formData.impact[activeTab]}
                  onChange={(e) => handleImpactChange(e.target.value)}
                  rows={5}
                  className="w-full bg-transparent text-sm py-2 px-1 text-text-primary dark:text-white focus:outline-none resize-none font-mono"
                  placeholder="<p>Describe the impact...</p>"
                />
              </div>
            </div>

            {/* Impact Metrics */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t.impactMetrics}</label>
                <button
                  type="button"
                  onClick={handleAddMetric}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  {t.addMetric}
                </button>
              </div>
              <div className="space-y-3">
                {formData.impactMetrics.map((metric, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={metric.label}
                      onChange={(e) => handleMetricChange(index, 'label', e.target.value)}
                      placeholder={t.metricLabel}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm py-3 px-4 border border-slate-200 dark:border-slate-700 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="text"
                      value={metric.value}
                      onChange={(e) => handleMetricChange(index, 'value', e.target.value)}
                      placeholder={t.metricValue}
                      className="w-32 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm py-3 px-4 border border-slate-200 dark:border-slate-700 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMetric(index)}
                      className="p-2.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Updates Section */}
        <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">update</span>
              <h3 className="font-bold text-base tracking-tight text-text-primary dark:text-white">{t.updates}</h3>
            </div>
            <button
              type="button"
              onClick={handleAddUpdate}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t.addUpdate}
            </button>
          </div>

          <div className="space-y-4">
            {formData.updates.length === 0 ? (
              <p className="text-center text-slate-400 py-8">{t.noUpdates}</p>
            ) : (
              formData.updates.map((update) => (
                <div key={update.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="date"
                      value={update.date}
                      onChange={(e) => handleUpdateChange(update.id, 'date', e.target.value)}
                      className="bg-white dark:bg-slate-700 rounded-lg text-sm py-2 px-3 border border-slate-200 dark:border-slate-600 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveUpdate(update.id)}
                      className="p-2 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={update.title[activeTab]}
                    onChange={(e) => handleUpdateChange(update.id, 'title', e.target.value, activeTab)}
                    placeholder={t.updateTitle}
                    className="w-full mb-3 bg-white dark:bg-slate-700 rounded-lg text-sm py-2 px-3 border border-slate-200 dark:border-slate-600 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <textarea
                    value={update.content[activeTab]}
                    onChange={(e) => handleUpdateChange(update.id, 'content', e.target.value, activeTab)}
                    placeholder={t.updateContent}
                    rows={3}
                    className="w-full bg-white dark:bg-slate-700 rounded-lg text-sm py-2 px-3 border border-slate-200 dark:border-slate-600 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              ))
            )}
          </div>
        </Card>
      </form>

      {/* Footer Actions */}
      <footer className="fixed bottom-0 left-0 right-0 lg:left-64 p-4 pb-8 bg-white/95 dark:bg-bg-dark-card/95 backdrop-blur-lg border-t border-border-light dark:border-white/10 flex gap-4 z-30">
        <button
          type="button"
          onClick={() => navigate('/admin/projects')}
          className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-sm text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
        >
          {t.saveDraft}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-[1.5] py-3.5 px-4 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform"
        >
          {t.publish}
        </button>
      </footer>

    </div>
  );
};

export default AdminProjectForm;
