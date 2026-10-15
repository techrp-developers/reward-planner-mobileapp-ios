import React from 'react';
import { Linking, type StyleProp, type ViewStyle } from 'react-native';
import type { CmsModuleKey } from '../../../common/cms/cmsContentApi';
import { useModuleContent } from '../../../common/cms/useModuleContent';
import CmsBannerGallery from './CmsBannerGallery';

type Props = { module?: CmsModuleKey; inset?: number; style?: StyleProp<ViewStyle> };

export default function BrandPromotionalBanner({ module = 'product', inset = 16, style }: Props) {
  const { moduleContent } = useModuleContent(module);
  const banner = moduleContent?.brand_promotional_banner;
  const press = React.useCallback(() => {
    if (banner?.redirect_link) Linking.openURL(banner.redirect_link).catch(() => undefined);
  }, [banner?.redirect_link]);
  return <CmsBannerGallery banner={banner} fallbackRatio={2} inset={inset} style={style} onPress={banner?.redirect_link ? press : undefined} />;
}
