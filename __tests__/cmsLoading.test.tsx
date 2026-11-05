import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CmsAppShellProvider, useCmsAppShell } from '../src/modules/common/cms/CmsAppShellContext';
import { fetchResolvedModules, fetchResolvedNavbar } from '../src/modules/common/cms/cmsContentApi';
import { readCmsSnapshot } from '../src/modules/common/cms/cmsSnapshotCache';
import { useCmsQuery } from '../src/modules/common/cms/useCmsQuery';

jest.mock('../src/modules/common/cms/cmsContentApi', () => ({ fetchResolvedModules: jest.fn(), fetchResolvedNavbar: jest.fn() }));
jest.mock('../src/modules/common/cms/cmsSnapshotCache', () => ({ CMS_FRESH_MS: 300000, readCmsSnapshot: jest.fn(async () => null) }));
let renderer: ReactTestRenderer;
let client: QueryClient;
beforeEach(() => {
  jest.useFakeTimers();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  jest.mocked(readCmsSnapshot).mockReset().mockResolvedValue(null);
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  client.clear();
  jest.useRealTimers();
});
const flush = async () => { await act(async () => { jest.advanceTimersByTime(10); }); };

it('publishes module icons while the navbar endpoint is still pending', async () => {
  jest.mocked(fetchResolvedModules).mockResolvedValue([{ module_key: 'product' }] as any);
  jest.mocked(fetchResolvedNavbar).mockReturnValue(new Promise(() => {}));
  let state!: ReturnType<typeof useCmsAppShell>;
  function Probe() { state = useCmsAppShell(); return null; }
  await act(async () => { renderer = create(<QueryClientProvider client={client}>
    <CmsAppShellProvider><Probe /></CmsAppShellProvider>
  </QueryClientProvider>); });
  await flush();
  expect(state.modules).toEqual([{ module_key: 'product' }]);
  expect(state.navbar).toEqual({});
  expect(state.isLoading).toBe(true);
});

it('shows a saved zone while the live CMS request is pending', async () => {
  jest.mocked(readCmsSnapshot).mockResolvedValue({ data: { title: 'Cached offer' }, savedAt: Date.now() - 1000 });
  let data: any;
  const load = () => new Promise<{ title: string }>(() => {});
  function Probe() { data = useCmsQuery('resolved:product', load).data; return null; }
  await act(async () => { renderer = create(<QueryClientProvider client={client}><Probe /></QueryClientProvider>); });
  await flush();
  expect(data).toEqual({ title: 'Cached offer' });
});

it('does not let a slow storage read overwrite a newer network response', async () => {
  let resolveDisk!: (value: any) => void;
  jest.mocked(readCmsSnapshot).mockReturnValue(new Promise(resolve => { resolveDisk = resolve; }));
  const load = async () => ({ title: 'Fresh offer' });
  let data: any;
  function Probe() { data = useCmsQuery('resolved:product', load).data; return null; }
  await act(async () => { renderer = create(<QueryClientProvider client={client}><Probe /></QueryClientProvider>); });
  await flush();
  await act(async () => resolveDisk({ data: { title: 'Old offer' }, savedAt: Date.now() - 1000 }));
  await flush();
  expect(data).toEqual({ title: 'Fresh offer' });
});
