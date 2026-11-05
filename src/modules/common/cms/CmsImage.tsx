import React from 'react';
import { Image, type ImageProps } from 'react-native';
import { forgetCmsImage, getCmsImageUri, peekCmsImageUri } from './cmsImageCache';

type Props = Omit<ImageProps, 'source'> & { source: { uri: string } };

// Keeps native Image styling/events while sharing a bounded disk cache across
// every module. Visible artwork always has a source while the disk cache warms.
export default React.memo(function CmsImage({ source, onError, ...props }: Props) {
  const url = source.uri;
  const [resolved, setResolved] = React.useState<{ url: string; uri: string } | null>(() => {
    const uri = peekCmsImageUri(url);
    return uri ? { url, uri } : null;
  });
  React.useEffect(() => {
    let active = true;
    void getCmsImageUri(url).then(uri => { if (active) setResolved({ url, uri }); });
    return () => { active = false; };
  }, [url]);
  // Disk downloads can queue behind icons or stall on a slow CDN. Never leave
  // visible banners without a source while that optional work completes.
  const uri = resolved?.url === url ? resolved.uri : peekCmsImageUri(url) ?? url;
  return <Image {...props} source={uri ? { uri } : undefined} onError={event => {
    if (uri?.startsWith('file://')) {
      // CacheDir may be purged by the OS; preserve the remote-image fallback.
      forgetCmsImage(url);
      setResolved({ url, uri: url });
    } else onError?.(event);
  }} />;
});
