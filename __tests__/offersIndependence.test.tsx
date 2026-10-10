import React from 'react';
import { act, create } from 'react-test-renderer';
import OfferHome from '../src/modules/ecommerce/components/home/OfferHome';
let mockProducts: any;
const mockOffers = {
  content_id: 42, content_type: 'image', display_mode: 'carousel', title: 'Independent offers',
  images: [{ image_id: 1, image_url: 'https://example.test/offer.jpg', sort_order: 1, is_active: 1 }],
};
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('@tanstack/react-query', () => ({ useQuery: ({ queryKey }: any) => queryKey[0] === 'cms' ? mockProducts : {} }));
jest.mock('../src/modules/common/cms/useModuleContent', () => ({
  useModuleContent: () => ({ moduleContent: { offers_banner: mockOffers, promotional_banner: { content_id: 999 } } }),
  moduleContentQueryKey: () => [],
}));
jest.mock('../src/modules/common/cms/cmsContentApi', () => ({ fetchResolvedZones: jest.fn() }));
jest.mock('../src/modules/ecommerce/components/home/CmsBannerGallery', () => ({ __esModule: true,
  default: (props: any) => require('react').createElement('CmsGallery', props),
}));
jest.mock('../src/modules/ecommerce/api/ProductApi', () => ({}));
jest.mock('../src/modules/ecommerce/api/CampaignAPI', () => ({}));
jest.mock('../src/modules/ecommerce/api/WishlistApi', () => ({}));
jest.mock('../src/config/cmsApiClient', () => ({}));
jest.mock('../src/config/apiConfig', () => ({ normalizeLocalCmsImageUrl: (uri: any) => uri }));
jest.mock('../src/modules/ecommerce/utils/normalizeProduct', () => ({}));
jest.mock('../src/query/queryClient', () => ({}));
jest.mock('../src/modules/ecommerce/navigation/navigationPerformance', () => ({}));
jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ theme: { background: '#fff' }, isDark: false }) }));
jest.mock('react-native-linear-gradient', () => 'Gradient');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('../src/assets/homepage/Flash_Sale_Bg.svg', () => 'FlashBackground');

it.each(['loading', 'empty', 'failed'])('renders CMS offers while flash-sale products are %s', async state => {
  mockProducts = state === 'loading' ? { isLoading: true } : state === 'failed'
    ? { isLoading: false, isError: true, error: new Error('Product API unavailable') }
    : { isLoading: false, data: { products: [] } };
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  let renderer: ReturnType<typeof create>;
  try {
    await act(async () => { renderer = create(<OfferHome />); });
    const gallery = renderer!.root.findByType('CmsGallery' as any);
    expect(gallery.props.banner).toBe(mockOffers);
    expect(gallery.props.banner.content_id).toBe(42);
    expect(gallery.props.fallbackRatio).toBe(720 / 900);
    expect(gallery.props.visibleItems).toBe(2.5);
    await act(async () => renderer!.unmount());
  } finally { jest.restoreAllMocks(); }
});
