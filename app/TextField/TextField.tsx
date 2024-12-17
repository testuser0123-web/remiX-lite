import { getInputProps, type FieldMetadata } from "@conform-to/react";
import type { FC } from "react";

type TextFieldProps = Readonly<{
  field: FieldMetadata;
  label: string;
  type: "text" | "email" | "password";
  defaultValue?: string;
}>;

export const TextField: FC<TextFieldProps> = ({
  field,
  label,
  type,
  defaultValue,
}) => {
  return (
    <div className="flex gap-2">
      <label htmlFor={field.id} className="w-24 text-right mt-1">
        {label}
      </label>
      <div className="flex flex-col gap-1">
        <input
          {...getInputProps(field, { type })}
          className="text-black p-1 rounded-md w-64"
          defaultValue={defaultValue}
        />
        <div id={field.errorId} className="text-red-300 max-w-64 text-sm">
          {field.errors}
        </div>
      </div>
    </div>
  );
};
