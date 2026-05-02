"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { uploadImageFile } from "@/admin/lib/uploadImage";

type ImageUploadButtonProps = {
  folder: string;
  onUploaded: (url: string) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  label?: string;
};

export default function ImageUploadButton({
  folder,
  onUploaded,
  onError,
  onSuccess,
  label = "Upload",
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const triggerSelect = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const onSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const uploadedUrl = await uploadImageFile(file, folder);
      onUploaded(uploadedUrl);
      onSuccess?.("Image uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      onError?.(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm upload-btn"
        onClick={triggerSelect}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,.png,.jpg,.jpeg,.webp,.gif,.avif"
        style={{ display: "none" }}
        onChange={onSelectFile}
      />
    </>
  );
}
