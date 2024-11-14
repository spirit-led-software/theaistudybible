// biome-ignore lint/suspicious/noExplicitAny: Don't care
export function isLinkable(obj: any): obj is sst.Linkable<any> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && 'getSSTLink' in obj;
}

// biome-ignore lint/suspicious/noExplicitAny: Don't care
export function buildLinks(links: any[]) {
  return links
    .map((link) => {
      if (!link) {
        throw new Error('An undefined link was passed into a `link` array.');
      }
      return link;
    })
    .filter((l) => isLinkable(l))
    .map((l) => {
      const link = l.getSSTLink();
      return $util.all([l.urn, link]).apply(([urn, link]) => ({
        name: urn.split('::').at(-1)!,
        properties: {
          ...link.properties,
          type: urn.split('::').at(-2),
        },
      }));
    });
}
