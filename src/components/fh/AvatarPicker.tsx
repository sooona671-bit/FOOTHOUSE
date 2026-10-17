import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageCropper } from "@/components/fh/ImageCropper";
import { Icon } from "@/components/fh/primitives";
import { profileQuery, removeAvatar, uploadAvatar, type Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

type Props = {
  userId: string;
  initial: string;
  className?: string;
};

export function AvatarPicker({ userId, initial, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ ...profileQuery(userId), enabled: !!userId });
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const avatarUrl = previewUrl ?? profile?.avatar_url ?? null;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error("Please choose a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Profile photos must be under 10 MB.");
      return;
    }
    setCropFile(file);
  };

  const onDone = async (cropped: File) => {
    const preview = URL.createObjectURL(cropped);
    const key = ["profile", userId] as const;
    const previous = queryClient.getQueryData<Profile | null>(key);
    setPreviewUrl(preview);
    queryClient.setQueryData<Profile | null>(key, (old) => (old ? { ...old, avatar_url: preview } : old));
    setCropFile(null);
    setUploading(true);
    try {
      const url = await uploadAvatar(userId, cropped);
      queryClient.setQueryData<Profile | null>(key, (old) => (old ? { ...old, avatar_url: url } : old));
      setPreviewUrl(null);
      URL.revokeObjectURL(preview);
      await queryClient.invalidateQueries({ queryKey: key });
    } catch {
      setPreviewUrl(null);
      URL.revokeObjectURL(preview);
      queryClient.setQueryData(key, previous);
      toast.error("Couldn't save your profile photo. Please try again.");
      await queryClient.invalidateQueries({ queryKey: key });
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    const key = ["profile", userId] as const;
    const previous = queryClient.getQueryData<Profile | null>(key);
    setPreviewUrl(null);
    queryClient.setQueryData<Profile | null>(key, (old) => (old ? { ...old, avatar_url: null } : old));
    setUploading(true);
    try {
      await removeAvatar(userId);
      await queryClient.invalidateQueries({ queryKey: key });
    } catch {
      queryClient.setQueryData(key, previous);
      toast.error("Couldn't remove your profile photo. Please try again.");
      await queryClient.invalidateQueries({ queryKey: key });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        aria-label="Choose profile photo"
        disabled={!userId || uploading}
        onClick={() => inputRef.current?.click()}
        className={cn("relative shrink-0 rounded-full disabled:opacity-60", className)}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" width={512} height={512} decoding="async" className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">{initial}</span>
        )}
        <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <Icon name="photo_camera" className="text-[15px]" />
        </span>
      </button>
      {profile?.avatar_url && !uploading && (
        <button type="button" onClick={remove} className="text-xs text-muted-foreground underline hover:text-foreground">Remove photo</button>
      )}
      {cropFile && <ImageCropper file={cropFile} outputSize={512} round onDone={onDone} onCancel={() => setCropFile(null)} />}
    </div>
  );
}
