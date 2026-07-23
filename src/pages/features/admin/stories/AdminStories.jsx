import React, { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useApp } from "../../../../context/AppContext";
import { convexFileUrl } from "../../../../lib/convex";
import { getLocalizedText } from "../../../../lib/i18nContent";
import { optimizeImageFile } from "../../../../lib/imageOptimization";
import AdminStoriesFormModal from "./AdminStoriesFormModal";
import AdminStoriesList from "./AdminStoriesList";
import {
  buildStoryForm,
  buildStoryPayload,
  EMPTY_FORM,
  slugifyStoryTitle,
  validateStoryImageFile,
  validateStoryInlineImageFile,
} from "./adminStoriesHelpers";

export default function AdminStories() {
  const { showToast, user: adminUser } = useApp();
  const adminAuthArgs = adminUser?.sessionToken ? { sessionToken: adminUser?.sessionToken } : "skip";
  const stories = useQuery(api.stories.getAllStories, adminAuthArgs);
  const createStory = useMutation(api.stories.createStory);
  const updateStory = useMutation(api.stories.updateStory);
  const deleteStory = useMutation(api.stories.deleteStory);
  const publishStory = useMutation(api.stories.publishStory);
  const unpublishStory = useMutation(api.stories.unpublishStory);
  const generateUploadUrl = useMutation(api.stories.generateStoryImageUploadUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const coverInputRef = useRef();

  const handleField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleOpenNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setCoverPreview(null);
    setSeoOpen(false);
    setShowForm(true);
  };

  const handleOpenEdit = (story) => {
    setForm(buildStoryForm(story));
    setCoverPreview(story.coverImage ? convexFileUrl(story.coverImage) : null);
    setEditingId(story._id);
    setSeoOpen(Boolean(story.slug || story.metaDescription || story.metaTitle || story.imageAlt));
    setShowForm(true);
  };

  const uploadStoryAsset = async (file, optimizeConfig) => {
    const optimized = await optimizeImageFile(file, optimizeConfig);
    const uploadUrl = await generateUploadUrl({ sessionToken: adminUser?.sessionToken });
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": optimized.file.type },
      body: optimized.file,
    });
    return response.json();
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    const error = validateStoryImageFile(file);
    if (error) {
      showToast?.(error, "error");
      return;
    }

    setUploadingCover(true);
    try {
      const { storageId } = await uploadStoryAsset(file, { maxWidth: 1600, maxHeight: 1200, quality: 0.82 });
      handleField("coverImage", storageId);
      setCoverPreview(URL.createObjectURL(file));
    } catch {
      showToast?.("فشل رفع الصورة", "error");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleInlineImageUpload = async (file) => {
    const error = validateStoryInlineImageFile(file);
    if (error) throw new Error(error);

    const { storageId } = await uploadStoryAsset(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.82 });
    return convexFileUrl(storageId);
  };

  const handleSave = async () => {
    if (!getLocalizedText(form.title).trim() || !getLocalizedText(form.excerpt).trim()) {
      showToast?.("العنوان والمختصر مطلوبان", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = buildStoryPayload(form);
      if (editingId) {
        await updateStory({ id: editingId, sessionToken: adminUser?.sessionToken, ...payload });
        showToast?.("تم تحديث المنشور", "success");
      } else {
        await createStory({ ...payload, sessionToken: adminUser?.sessionToken });
        showToast?.("تم إنشاء المنشور", "success");
      }
      setShowForm(false);
    } catch (error) {
      showToast?.(error?.message || "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذه القصة؟")) return;
    try {
      await deleteStory({ id, sessionToken: adminUser?.sessionToken });
      showToast?.("تم الحذف", "success");
    } catch {
      showToast?.("فشل الحذف", "error");
    }
  };

  const handleTogglePublish = async (story) => {
    try {
      if (story.isPublished) {
        await unpublishStory({ id: story._id, sessionToken: adminUser?.sessionToken });
        showToast?.("تم إلغاء النشر", "info");
      } else {
        await publishStory({ id: story._id, sessionToken: adminUser?.sessionToken });
        showToast?.("تم النشر", "success");
      }
    } catch {
      showToast?.("فشل تغيير الحالة", "error");
    }
  };

  return (
    <div style={{ fontFamily: "var(--font-arabic)", color: "#0e1a1b", padding: 24 }} dir="rtl">
      {showForm && (
        <AdminStoriesFormModal
          coverInputRef={coverInputRef}
          coverPreview={coverPreview}
          editingId={editingId}
          form={form}
          handleCoverUpload={handleCoverUpload}
          handleField={handleField}
          handleInlineImageUpload={handleInlineImageUpload}
          handleSave={handleSave}
          saving={saving}
          seoOpen={seoOpen}
          setCoverPreview={setCoverPreview}
          setForm={setForm}
          setSeoOpen={setSeoOpen}
          setShowForm={setShowForm}
          slugifyStoryTitle={slugifyStoryTitle}
          uploadingCover={uploadingCover}
        />
      )}

      <AdminStoriesList
        handleDelete={handleDelete}
        handleOpenEdit={handleOpenEdit}
        handleOpenNew={handleOpenNew}
        handleTogglePublish={handleTogglePublish}
        stories={stories}
      />
    </div>
  );
}
