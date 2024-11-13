export class Constant extends $util.ComponentResource {
  private _name: string;
  private _value: $util.Input<string>;

  constructor(name: string, value: $util.Input<string>, opts?: $util.ComponentResourceOptions) {
    super('asb:asb:Constant', name, { value }, opts);
    this._name = name;
    this._value = value;
  }

  public get name(): $util.Output<string> {
    return $output(this._name);
  }

  public get value(): $util.Output<string> {
    return $output(this._value);
  }
}
