import React from 'react';
import { Linking, type StyleProp, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { fetchResolvedZones } from '../../../common/cms/cmsContentApi';
import type { CmsModuleKey, CmsOffersBannerEntry } from '../../../common/cms/cmsContentApi';
import { useModuleContent, moduleContentQueryKey } from '../../../common/cms/useModuleContent';
import { queryClient } from '../../../../query/queryClient';
import CmsBannerGallery from './CmsBannerGallery';

// Full-width banner attached under the navbar; slides every few seconds when
// the CMS entry has several images.
export const PROMOTIONAL_SLIDE_MS = 4000;

type Props = { module?: CmsModuleKey; inset?: number; style?: StyleProp<ViewStyle> };

function PromotionalBanner({ module = 'product', inset, style }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { moduleContent } = useModuleContent(module);
  const banner = moduleContent?.promotional_banner as CmsOffersBannerEntry | null | undefined;
  const contentId = module === 'product' ? Number(banner?.content_id) : 0;
  const press = React.useCallback(() => {
    if (contentId > 0) navigation.navigate('CampaignProducts', { contentId, title: banner?.title || 'Offers' });
    else if (banner?.redirect_link) Linking.openURL(banner.redirect_link).catch(() => undefined);
  }, [contentId, banner?.title, banner?.redirect_link, navigation]);
  return <CmsBannerGallery banner={banner} fallbackRatio={2048 / 1008} inset={inset} style={style}
    slider autoplayMs={PROMOTIONAL_SLIDE_MS}
    onPress={contentId > 0 || banner?.redirect_link ? press : undefined} />;
}
export default React.memo(PromotionalBanner);
export const prefetchPromotionalBanner = (module: CmsModuleKey = 'product') => queryClient.prefetchQuery({
  queryKey: moduleContentQueryKey(module), queryFn: () => fetchResolvedZones(module), staleTime: 5 * 60 * 1000,
});
