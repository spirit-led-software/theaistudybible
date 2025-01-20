// biome-ignore lint/suspicious/noExplicitAny: Don't care
export function isLinkable(obj: any): obj is sst.Linkable<any> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && 'getSSTLink' in obj;
}

// biome-ignore lint/suspicious/noExplicitAny: Accept any type
export function buildLinks(links: any[]) {
  return links
    .map((link) => {
      if (!link) {
        throw new Error('An undefined or null link was passed into a `link` array.');
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

// biome-ignore lint/suspicious/noExplicitAny: Accept any
export function linksToEnv(links: { name: string; properties: any }[]) {
  return {
    ...links.reduce(
      (acc, l) => {
        acc[`SST_RESOURCE_${l.name}`] = JSON.stringify(l.properties);
        return acc;
      },
      {} as Record<string, string>,
    ),
    SST_RESOURCE_App: JSON.stringify({ name: $app.name, stage: $app.stage }),
  };
}

export function getInclude<T>(
  type: string,
  // biome-ignore lint/suspicious/noExplicitAny: Accept any type
  input?: $util.Input<any[]>,
): $util.Output<T[]> {
  if (!input) return $output([]);
  return $output(input).apply((links) => {
    // biome-ignore lint/suspicious/noExplicitAny: Accept any type
    return links.filter(isLinkable).flatMap((l: sst.Linkable<any>) => {
      const link = l.getSSTLink();
      return (link.include || []).filter((i) => i.type === type) as T[];
    });
  });
}
