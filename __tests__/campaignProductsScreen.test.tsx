import React from 'react';
import { Image } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = jest.fn();
let mockParams: Record<string, unknown> = {};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: mockParams }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0, top: 0 }) }));
jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ theme: { background: '#fff', card: '#eee', secondaryText: '#333' } }) }));
jest.mock('../src/bottombar/BottomTabs', () => ({ TAB_BAR_HEIGHT: 60 }));
jest.mock('../src/modules/ecommerce/constants/heading/Poduct_Head_Color', () => () => null);
jest.mock('../src/modules/services/component/constant/SkeletonBox', () => () => null);
jest.mock('../src/modules/ecommerce/constants/product_cart/ProductCard', () => {
  const { Text } = require('react-native');
  return ({ item, onProductPress }: any) => <Text testID="product-card" onPress={() => onProductPress(item.id, item)}>{item.title}</Text>;
});
jest.mock('../src/config/cmsApiClient', () => ({ cmsApi: { get: jest.fn() } }));
jest.mock('../src/modules/ecommerce/api/CampaignAPI', () => ({ getCampaignProducts: jest.fn() }));
jest.mock('../src/modules/common/auth/api/axios', () => ({ api: { get: jest.fn() } }));

import CampaignProductsScreen, { bannerImageUri, parseProductIds } from '../src/modules/ecommerce/screens/CampaignProductsScreen';
import { api } from '../src/modules/common/auth/api/axios';
import { getCampaignProducts } from '../src/modules/ecommerce/api/CampaignAPI';

const banner = 'https://cdn.rewardplanners.com/public/notifications/2026/11/a.jpg';
let mounted: ReactTestRenderer | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => {
    mounted = create(<QueryClientProvider client={client}><CampaignProductsScreen /></QueryClientProvider>);
  });
  // Wait for react-query to finish loading before asserting.
  for (let attempt = 0; attempt < 50 && cards(mounted!).length === 0; attempt += 1) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
  }
  return mounted!;
}
const cards = (tree: ReactTestRenderer) => tree.root.findAll((node) => node.props.testID === 'product-card' && typeof node.type !== 'string');

beforeEach(() => {
  jest.clearAllMocks();
  (api.get as jest.Mock).mockResolvedValue({ data: { success: true, data: [
    { product_id: 1125, product_name: 'Desk lamp', price: 10, variant_id: 3 },
    { product_id: 77, product_name: 'Mug', price: 5 },
  ] } });
});
afterEach(async () => {
  await act(async () => mounted?.unmount());
  mounted = null;
});

it('keeps only positive, unique ids in CRM order, capped at 50', () => {
  expect(parseProductIds('1125, 77,abc,0,-3,77,1.5,')).toEqual(['1125', '77']);
  expect(parseProductIds(Array.from({ length: 60 }, (_, i) => i + 1).join(','))).toHaveLength(50);
  expect(parseProductIds(undefined)).toEqual([]);
});

it.each([undefined, '', 'http://cdn.rewardplanners.com/a.jpg', 'https://evil.example/a.jpg', 'https://cdn.rewardplanners.com.evil.example/a.jpg'])(
  'refuses the banner %s', (value) => {
    expect(bannerImageUri(value)).toBeNull();
  });

it('loads a collection by its ids, shows the banner, and opens each product', async () => {
  mockParams = { productIds: '1125,77', title: 'Festive picks', bannerUrl: banner };
  const tree = await render();
  expect(api.get).toHaveBeenCalledWith('/v1/product/by-ids', { params: { ids: '1125,77' } });
  expect(getCampaignProducts).not.toHaveBeenCalled();
  expect(tree.root.findAllByType(Image)[0].props.source).toEqual({ uri: banner });
  expect(cards(tree)).toHaveLength(2);

  await act(async () => cards(tree)[0].props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('ProductDescription', { productId: 1125, variantId: 3 });
});

it('keeps an offer campaign on its campaign products, with campaign pricing', async () => {
  mockParams = { campaignId: 9, title: 'Offer' };
  (getCampaignProducts as jest.Mock).mockResolvedValue({ data: [{ product_id: 5, product_name: 'Bag' }] });
  const tree = await render();
  expect(getCampaignProducts).toHaveBeenCalledWith(9);
  expect(api.get).not.toHaveBeenCalled();
  expect(tree.root.findAllByType(Image)).toHaveLength(0);
  await act(async () => cards(tree)[0].props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('ProductDescription', expect.objectContaining({ productId: 5, campaignId: 9 }));
});

it('drops a banner that fails to load', async () => {
  mockParams = { productIds: '1125', bannerUrl: banner };
  const tree = await render();
  await act(async () => tree.root.findAllByType(Image)[0].props.onError());
  expect(tree.root.findAllByType(Image)).toHaveLength(0);
  expect(cards(tree)).toHaveLength(2);
});
