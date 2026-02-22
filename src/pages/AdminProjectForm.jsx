import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';

// ============================================
// CONVEX STORAGE UTILITIES
// ============================================

/**
 * Upload a file to Convex storage and return the storageId.
 * @param {File} file - The file to upload
 * @param {Function} getUploadUrlMutation - The mutation function from useMutation(api.storage.generateProjectImageUploadUrl)
 * @returns {Promise<string>} - The storageId of the uploaded file
 */
const uploadFileToConvex = async (file, getUploadUrlMutation) => {
  // 1. Get a signed upload URL from Convex
  const uploadUrl = await getUploadUrlMutation();

  // 2. Upload the file to the signed URL
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  // 3. Parse the response to get the storageId
  const result = await response.json();
  
  // Convex returns the storageId in the response
  return result.storageId;
};

/**
 * Get the URL for displaying a Convex stored image.
 * Uses Convex's HTTP API to serve the file.
 * @param {string} storageId - The Convex storageId
 * @returns {string} - The URL to display the image
 */
const convexFileUrl = (storageId) => {
  if (!storageId) return null;
  
  // Check if it's already a URL (backward compatibility)
  if (storageId.startsWith('http://') || storageId.startsWith('https://') || storageId.startsWith('data:')) {
    return storageId;
  }
  
  // Get the Convex URL from environment
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    console.error('VITE_CONVEX_URL not set');
    return null;
  }
  
  // Extract the deployment name from the Convex URL
  // URL format: https://<deployment-name>.convex.cloud
  const urlMatch = convexUrl.match(/https:\/\/([^.]+)\.convex\.cloud/);
  if (!urlMatch) {
    console.error('Invalid Convex URL format');
    return null;
  }
  
  const deploymentName = urlMatch[1];
  return `https://${deploymentName}.convex.site/api/storage/${storageId}`;
};

// ============================================

// ============================================
// ADMIN PROJECT FORM PAGE - Create/Edit Projects
// With Simple Text Inputs, Gallery Management, Featured Toggle
// ============================================

const AdminProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, isDarkMode, showToast, user } = useApp();
  const isEditMode = Boolean(id);
  const [activeTab, setActiveTab] = useState('en');
  const [progress, setProgress] = useState(65);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  
  // Convex hooks
  const existingProject = useQuery(api.projects.getProjectById, isEditMode ? { projectId: id } : 'skip');
  const createProjectMutation = useMutation(api.projects.createProject);
  const updateProjectMutation = useMutation(api.projects.updateProject);
  const getUploadUrlMutation = useMutation(api.storage.generateProjectImageUploadUrl);
  const deleteImageMutation = useMutation(api.storage.deleteProjectImage);

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState({ mainImage: 0, gallery: {} });

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

  const t = translations[currentLanguage?.code] || translations.en;

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
      en: 'In the heart of the Atlas Mountains, access to clean water remains a critical challenge for many communities. This project aims to provide sustainable water solutions through modern infrastructure while respecting traditional practices.\n\nOur Approach:\n• Community-led planning and implementation\n• Sustainable technology adapted to local conditions\n• Long-term maintenance and training programs',
      fr: 'Au cœur des montagnes de l\'Atlas, l\'accès à l\'eau potable reste un défi critique pour de nombreuses communautés. Ce projet vise à fournir des solutions durables grâce à une infrastructure moderne tout en respectant les pratiques traditionnelles.\n\nNotre Approche:\n• Planification et mise en œuvre dirigées par la communauté\n• Technologie durable adaptée aux conditions locales\n• Programmes de maintenance et de formation à long terme',
      ar: 'في قلب جبال الأطلس، يظل الوصول إلى المياه النظيفة تحدياً حرجاً للعديد من المجتمعات. يهدف هذا المشروع إلى توفير حلول مياه مستدامة من خلال بنية تحتية حديثة مع احترام الممارسات التقليدية.\n\nنهجنا:\n• التخطيط والتنفيذ بقيادة المجتمع\n• تقنية مستدامة مكيفة مع الظروف المحلية\n• برامج الصيانة والتدريب على المدى الطويل',
    },
    goal: 25000,
    category: 'water',
    status: 'draft',
    location: '',
    beneficiaries: '',
    currency: 'MAD',
    visibility: 'public',
    featured: false,
    // Storage IDs for Convex file storage (separate from preview URLs)
    mainImageStorageId: null,
    galleryStorageIds: [],
    // Preview URLs for display (set only after actual upload)
    mainImage: '',
    gallery: [],
    impact: {
      en: 'This project will provide sustainable clean water access to over 500 families in rural communities.',
      fr: 'Ce projet fournira un accès durable à l\'eau potable à plus de 500 familles dans les communautés rurales.',
      ar: 'سيوفر هذا المشروع وصولاً مستداماً إلى المياه النظيفة لأكثر من 500 عائلة في المجتمعات الريفية.',
    },
    impactMetrics: [
      { label: 'Families Served', value: '500' },
      { label: 'Water Points', value: '12' },
    ],
    updates: [],
  });

  const [draggedItem, setDraggedItem] = useState(null);

  // Load project data from Convex when in edit mode
  useEffect(() => {
    if (isEditMode && existingProject) {
      setFormData(prev => ({
        ...prev,
        title: existingProject.title || prev.title,
        description: existingProject.description || prev.description,
        category: existingProject.category || prev.category,
        goal: existingProject.goalAmount ? Math.round(existingProject.goalAmount / 100) : prev.goal,
        featured: existingProject.isFeatured ?? prev.featured,
        mainImage: existingProject.mainImage || prev.mainImage,
        mainImageStorageId: existingProject.mainImage || null,
        location: existingProject.location || '',
        beneficiaries: existingProject.beneficiaries?.toString() || '',
        status: existingProject.status || 'draft',
      }));
    }
  }, [isEditMode, existingProject]);

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

  // Handle main image upload to Convex storage
  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(t.errorUpload, 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(prev => ({ ...prev, mainImage: 0 }));

    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, mainImage: previewUrl }));

      // Upload to Convex storage
      const storageId = await uploadFileToConvex(file, getUploadUrlMutation);

      // Update form data with storageId
      setFormData(prev => ({
        ...prev,
        mainImage: previewUrl,
        mainImageStorageId: storageId
      }));

      setUploadProgress(prev => ({ ...prev, mainImage: 100 }));
      showToast(t.imageUploaded, 'success');
    } catch (error) {
      console.error('Main image upload error:', error);
      showToast(t.errorUpload, 'error');
      // Revert to default if upload fails
      setFormData(prev => ({
        ...prev,
        mainImage: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800',
        mainImageStorageId: null
      }));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle gallery image upload to Convex storage
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (formData.gallery.length + validFiles.length > 10) {
      showToast(t.maxFiles, 'error');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview URLs for immediate display
      const previewUrls = validFiles.map(file => URL.createObjectURL(file));
      
      // Add preview URLs to gallery immediately
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...previewUrls],
        galleryStorageIds: [...(prev.galleryStorageIds || []), ...Array(validFiles.length).fill(null)],
      }));

      // Upload each file to Convex storage
      const uploadPromises = validFiles.map(async (file, index) => {
        try {
          const storageId = await uploadFileToConvex(file, getUploadUrlMutation);
          return { index, storageId, success: true };
        } catch (error) {
          console.error(`Gallery upload error for file ${index}:`, error);
          return { index, storageId: null, success: false };
        }
      });

      const results = await Promise.all(uploadPromises);

      // Update storage IDs
      setFormData(prev => {
        const newStorageIds = [...(prev.galleryStorageIds || [])];
        results.forEach(({ index, storageId }) => {
          const actualIndex = prev.gallery.length - validFiles.length + index;
          newStorageIds[actualIndex] = storageId;
        });
        return { ...prev, galleryStorageIds: newStorageIds };
      });

      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        showToast(`${successCount} ${t.imageUploaded}`, 'success');
      }
      if (successCount < validFiles.length) {
        showToast(`${validFiles.length - successCount} uploads failed`, 'error');
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      showToast(t.errorUpload, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle gallery image removal
  const removeGalleryImage = async (index) => {
    const storageId = formData.galleryStorageIds?.[index];
    
    // Try to delete from Convex storage if it exists
    if (storageId) {
      try {
        await deleteImageMutation({ storageId });
      } catch (error) {
        console.error('Failed to delete image from storage:', error);
        // Continue with removal from UI even if deletion fails
      }
    }
    
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
      galleryStorageIds: prev.galleryStorageIds?.filter((_, i) => i !== index) || [],
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

  // statusOverride: 'draft' for Save Draft button, 'active' for Publish button
  const handleSubmit = async (e, statusOverride) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    setIsLoading(true);

    try {
      // Validate that we have a main image storage ID
      if (!formData.mainImageStorageId) {
        showToast('Please upload a main image / يرجى رفع صورة رئيسية', 'error');
        setIsLoading(false);
        return;
      }

      const submitStatus = statusOverride || formData.status || 'draft';
      const submitIsFeatured = formData.featured;

      // Filter out null storage IDs from gallery
      const validGalleryStorageIds = (formData.galleryStorageIds || []).filter(id => id !== null);

      if (isEditMode) {
        // Update existing project
        await updateProjectMutation({
          projectId: id,
          updates: {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            goalAmount: Math.round((parseFloat(formData.goal) || 0) * 100),
            mainImageStorageId: formData.mainImageStorageId,
            galleryStorageIds: validGalleryStorageIds,
            status: submitStatus,
            isFeatured: submitIsFeatured,
            location: formData.location,
            beneficiaries: parseInt(formData.beneficiaries) || 0,
          }
        });
        showToast(submitStatus === 'active' ? 'Project published!' : 'Draft saved', 'success');
      } else {
        // Create new project - get admin ID from auth context
        const adminId = user?.id;
        if (!adminId) {
          showToast('Session expired. Please log in again.', 'error');
          setIsLoading(false);
          return;
        }
        await createProjectMutation({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          goalAmount: Math.round((parseFloat(formData.goal) || 0) * 100),
          mainImageStorageId: formData.mainImageStorageId,
          galleryStorageIds: validGalleryStorageIds,
          status: submitStatus,
          location: formData.location,
          beneficiaries: parseInt(formData.beneficiaries) || 0,
          isFeatured: submitIsFeatured,
          createdBy: adminId,
        });
        showToast(submitStatus === 'active' ? 'Project published!' : 'Draft saved', 'success');
      }
      navigate('/admin/projects');
    } catch (error) {
      console.error('Submit error:', error);
      showToast(isEditMode ? 'Failed to update project' : 'Failed to create project', 'error');
    } finally {
      setIsLoading(false);
    }
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
                      src={convexFileUrl(formData.mainImageStorageId) || formData.mainImage}
                      alt="Main project"
                      className="w-full h-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
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

            {/* Description - Simple Textarea */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.description}</label>
              <textarea
                value={formData.description[activeTab]}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Enter description here..."
                rows={8}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg text-sm py-3 px-4 border border-slate-200 dark:border-slate-700 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
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

            {/* Category */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Category / التصنيف</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg text-sm py-3 px-4 border border-slate-200 dark:border-slate-700 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="education">Education / التعليم</option>
                <option value="health">Health / الصحة</option>
                <option value="housing">Housing / السكن</option>
                <option value="emergency">Emergency / الطوارئ</option>
                <option value="food">Food / الغذاء</option>
                <option value="water">Water / المياه</option>
                <option value="orphan_care">Orphan Care / رعاية الأيتام</option>
              </select>
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
                  src={convexFileUrl(formData.galleryStorageIds?.[index]) || image}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {!formData.galleryStorageIds?.[index] && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
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
            {/* Impact Description - Simple Textarea */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">{t.impactDesc}</label>
              <textarea
                value={formData.impact[activeTab]}
                onChange={(e) => handleImpactChange(e.target.value)}
                placeholder="Describe the impact..."
                rows={5}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg text-sm py-3 px-4 border border-slate-200 dark:border-slate-700 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
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
          onClick={(e) => handleSubmit(e, 'draft')}
          disabled={isLoading}
          className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-sm text-slate-600 dark:text-slate-300 active:scale-95 transition-transform disabled:opacity-50"
        >
          {isLoading ? '...' : t.saveDraft}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'active')}
          disabled={isLoading}
          className="flex-[1.5] py-3.5 px-4 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {isLoading ? 'Publishing...' : t.publish}
        </button>
      </footer>

    </div>
  );
};

export default AdminProjectForm;
