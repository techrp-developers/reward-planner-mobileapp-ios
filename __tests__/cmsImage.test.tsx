import React from 'react';
import { Image } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import CmsImage from '../src/modules/common/cms/CmsImage';
import { getCmsImageUri, forgetCmsImage } from '../src/modules/common/cms/cmsImageCache';

jest.mock('../src/modules/common/cms/cmsImageCache', () => ({
  peekCmsImageUri: jest.fn(), getCmsImageUri: jest.fn(), forgetCmsImage: jest.fn(),
}));
let renderer: ReactTestRenderer;
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); jest.clearAllMocks(); });

it('falls back to the original URL if the OS removed its cached file', async () => {
  jest.mocked(getCmsImageUri).mockResolvedValue('file:///cache/image.img');
  const onError = jest.fn();
  await act(async () => { renderer = create(<CmsImage source={{ uri: 'https://example.test/image.png' }} onError={onError} />); });
  const image = () => renderer.root.findByType(Image);
  expect(image().props.source.uri).toBe('file:///cache/image.img');
  await act(async () => image().props.onError({ nativeEvent: {} }));
  expect(image().props.source.uri).toBe('https://example.test/image.png');
  expect(forgetCmsImage).toHaveBeenCalledWith('https://example.test/image.png');
  expect(onError).not.toHaveBeenCalled();
  await act(async () => image().props.onError({ nativeEvent: {} }));
  expect(onError).toHaveBeenCalledTimes(1);
});

it('ignores an older image download after a CMS URL change', async () => {
  let finishOld!: (uri: string) => void;
  jest.mocked(getCmsImageUri).mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; }))
    .mockResolvedValueOnce('file:///cache/new.img');
  await act(async () => { renderer = create(<CmsImage source={{ uri: 'https://example.test/old.png' }} />); });
  await act(async () => renderer.update(<CmsImage source={{ uri: 'https://example.test/new.png' }} />));
  await act(async () => finishOld('file:///cache/old.img'));
  expect(renderer.root.findByType(Image).props.source.uri).toBe('file:///cache/new.img');
});

it('provides the remote image immediately while its cache download is pending', async () => {
  jest.mocked(getCmsImageUri).mockReturnValue(new Promise(() => {}));
  await act(async () => { renderer = create(<CmsImage source={{ uri: 'https://example.test/banner.png' }} />); });
  expect(renderer.root.findByType(Image).props.source.uri).toBe('https://example.test/banner.png');
  await act(async () => renderer.update(<CmsImage source={{ uri: 'https://example.test/updated.png' }} />));
  expect(renderer.root.findByType(Image).props.source.uri).toBe('https://example.test/updated.png');
});
