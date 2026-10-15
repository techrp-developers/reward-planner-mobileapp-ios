import React from 'react';
import { Linking, type StyleProp, type ViewStyle } from 'react-native';
import type { CmsModuleKey } from '../../../common/cms/cmsContentApi';
import { useModuleContent } from '../../../common/cms/useModuleContent';
import CmsBannerGallery from './CmsBannerGallery';

type Props = { module: CmsModuleKey; inset?: number; style?: StyleProp<ViewStyle> };

// The CMS offers_banner zone, laid out like the Product home's offers strip.
function CmsOffersBanner({ module, inset = 12, style }: Props) {
  const { moduleContent } = useModuleContent(module);
  const banner = moduleContent?.offers_banner;
  const press = React.useCallback(() => {
    if (banner?.redirect_link) Linking.openURL(banner.redirect_link).catch(() => undefined);
  }, [banner?.redirect_link]);
  return <CmsBannerGallery banner={banner} fallbackRatio={720 / 900} inset={inset} visibleItems={2.5}
    style={style} onPress={banner?.redirect_link ? press : undefined} />;
}

export default React.memo(CmsOffersBanner);
