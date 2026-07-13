import { createId } from "@/core/id";
import { ImageAsset } from "@/core/scene-types";

export function readFileAsImageAsset(file: File): Promise<ImageAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const image = new Image();
      image.onload = () => {
        resolve({ id: createId("asset"), name: file.name, dataUrl, width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => reject(new Error(`Failed to decode image: ${file.name}`));
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

const imageElementCache = new Map<string, HTMLImageElement>();

export function loadAssetImageElement(asset: ImageAsset): Promise<HTMLImageElement> {
  const cached = imageElementCache.get(asset.id);
  if (cached && cached.src === asset.dataUrl) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      imageElementCache.set(asset.id, image);
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Failed to load image asset: ${asset.name}`));
    image.src = asset.dataUrl;
  });
}
