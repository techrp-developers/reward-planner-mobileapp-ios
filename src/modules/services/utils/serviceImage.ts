export type ImageSizePreset = 'thumbnail' | 'small' | 'medium' | 'large';

export const getServiceImageUrl = (
  imageUrl?: string | null,
  _size: ImageSizePreset = 'medium',
  _quality = 75,
): string => {
  if (!imageUrl || typeof imageUrl !== 'string') return '';
  return imageUrl.trim();
};
