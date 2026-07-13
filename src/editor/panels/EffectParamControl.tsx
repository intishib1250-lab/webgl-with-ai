import { AngleDial } from "@/editor/controls/AngleDial";
import { ColorInput } from "@/editor/controls/ColorInput";
import { Field } from "@/editor/controls/Field";
import { SelectControl } from "@/editor/controls/SelectControl";
import { SliderControl } from "@/editor/controls/SliderControl";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { EffectParamSchema } from "@/effects/types";

interface EffectParamControlProps {
  schema: EffectParamSchema;
  value: number | string | boolean;
  onChange: (key: string, value: number | string | boolean, coalesce?: boolean) => void;
  onCommit: () => void;
  onPickImage?: () => void;
}

export function EffectParamControl({ schema, value, onChange, onCommit, onPickImage }: EffectParamControlProps) {
  if (schema.type === "number") {
    return (
      <Field label={schema.label}>
        <SliderControl
          value={Number(value)}
          min={schema.min}
          max={schema.max}
          step={schema.step}
          onChange={(v) => onChange(schema.key, v, true)}
          onCommit={onCommit}
        />
      </Field>
    );
  }

  if (schema.type === "angle") {
    return (
      <Field label={schema.label}>
        <AngleDial value={Number(value)} onChange={(v) => onChange(schema.key, v, true)} onCommit={onCommit} />
      </Field>
    );
  }

  if (schema.type === "boolean") {
    return (
      <Field label={schema.label}>
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(v) => {
            onChange(schema.key, v);
            onCommit();
          }}
        />
      </Field>
    );
  }

  if (schema.type === "select") {
    return (
      <Field label={schema.label}>
        <SelectControl
          value={String(value)}
          options={schema.options}
          onChange={(v) => {
            onChange(schema.key, v);
            onCommit();
          }}
        />
      </Field>
    );
  }

  if (schema.type === "color") {
    return (
      <Field label={schema.label}>
        <ColorInput value={String(value)} onChange={(v) => onChange(schema.key, v, true)} onCommit={onCommit} />
      </Field>
    );
  }

  // image param (e.g. displacement map)
  return (
    <Field label={schema.label}>
      <Button variant="outline" size="sm" onClick={onPickImage}>
        {value ? "Replace image…" : "Upload image…"}
      </Button>
    </Field>
  );
}
