import { Text as DefaultText, View as DefaultView } from "react-native";
import { cn } from "../util/class-names";

export type TextProps = DefaultText["props"];
export type ViewProps = DefaultView["props"];

export function Text(props: TextProps) {
  const { style, className, ...otherProps } = props;

  return (
    <DefaultText
      style={[style]}
      className={cn("font-catamaran")}
      {...otherProps}
    />
  );
}

export function View(props: ViewProps) {
  const { style, className, ...otherProps } = props;

  return (
    <DefaultView style={[style]} className={cn(className)} {...otherProps} />
  );
}
