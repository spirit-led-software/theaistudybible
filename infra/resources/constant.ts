export class Constant extends sst.Linkable<{
  value: string;
}> {
  constructor(name: string, value: string) {
    super(name, { properties: { value } });
  }

  get value() {
    return this.properties.value;
  }
}
