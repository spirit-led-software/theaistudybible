import { useContext } from 'solid-js';
import { PublicResourceContext } from '~/components/providers/public-resource';

export function usePublicResources() {
  const resources = useContext(PublicResourceContext);
  if (!resources) {
    throw new Error('usePublicResources must be used within a PublicResourceProvider');
  }
  return resources;
}
