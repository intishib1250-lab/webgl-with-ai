import { Plus, X } from "lucide-react";
import { AngleDial } from "@/editor/controls/AngleDial";
import { ColorInput } from "@/editor/controls/ColorInput";
import { Field } from "@/editor/controls/Field";
import { SliderControl } from "@/editor/controls/SliderControl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Fill, GradientFill } from "@/core/scene-types";

const DEFAULT_MESH_CORNERS: [string, string, string, string] = ["#ff7a33ff", "#ff8f52ff", "#1a0f08ff", "#0b0b0cff"];

/** For shape/text layers, whose fill can be either solid or gradient. */
export function FillControl({ fill, onChange, allowMesh = true }: { fill: Fill; onChange: (fill: Fill) => void; allowMesh?: boolean }) {
  return (
    <Tabs
      value={fill.type}
      onValueChange={(type) =>
        onChange(
          type === "solid"
            ? { type: "solid", color: fill.type === "solid" ? fill.color : fill.gradient.stops[0]?.color ?? "#ff7a33ff" }
            : {
                type: "gradient",
                gradient:
                  fill.type === "gradient"
                    ? fill.gradient
                    : {
                        kind: "linear",
                        angleDeg: 45,
                        stops: [
                          { offset: 0, color: fill.color },
                          { offset: 1, color: "#00000000" },
                        ],
                      },
              },
        )
      }
    >
      <TabsList className="w-full">
        <TabsTrigger value="solid">Solid</TabsTrigger>
        <TabsTrigger value="gradient">Gradient</TabsTrigger>
      </TabsList>

      {fill.type === "solid" && (
        <TabsContent value="solid">
          <Field label="Color">
            <ColorInput value={fill.color} onChange={(color) => onChange({ type: "solid", color })} />
          </Field>
        </TabsContent>
      )}

      {fill.type === "gradient" && (
        <TabsContent value="gradient">
          <GradientFillEditor
            gradient={fill.gradient}
            onChange={(gradient) => onChange({ type: "gradient", gradient })}
            allowMesh={allowMesh}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}

/**
 * For gradient layers, which have no solid variant — always a gradient, so
 * no Solid/Gradient tab makes sense here (unlike FillControl above).
 */
export function GradientFillEditor({
  gradient,
  onChange,
  allowMesh = true,
}: {
  gradient: GradientFill;
  onChange: (gradient: GradientFill) => void;
  allowMesh?: boolean;
}) {
  return (
    <Tabs
      value={gradient.kind}
      onValueChange={(kind) =>
        onChange({
          ...gradient,
          kind: kind as GradientFill["kind"],
          meshCorners: kind === "mesh" ? (gradient.meshCorners ?? DEFAULT_MESH_CORNERS) : gradient.meshCorners,
        })
      }
    >
      <TabsList className="w-full">
        <TabsTrigger value="linear">Linear</TabsTrigger>
        <TabsTrigger value="radial">Radial</TabsTrigger>
        {allowMesh && <TabsTrigger value="mesh">Mesh</TabsTrigger>}
      </TabsList>

      {gradient.kind === "linear" && (
        <TabsContent value="linear" className="flex flex-col gap-1.5">
          <Field label="Angle">
            <AngleDial value={gradient.angleDeg} onChange={(angleDeg) => onChange({ ...gradient, angleDeg })} />
          </Field>
          <GradientStops gradient={gradient} onChange={onChange} />
        </TabsContent>
      )}

      {gradient.kind === "radial" && (
        <TabsContent value="radial" className="flex flex-col gap-1.5">
          <GradientStops gradient={gradient} onChange={onChange} />
        </TabsContent>
      )}

      {allowMesh && gradient.kind === "mesh" && (
        <TabsContent value="mesh" className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {(gradient.meshCorners ?? DEFAULT_MESH_CORNERS).map((color, i) => (
              <ColorInput
                key={i}
                value={color}
                onChange={(next) => {
                  const corners = [...(gradient.meshCorners ?? DEFAULT_MESH_CORNERS)] as [string, string, string, string];
                  corners[i] = next;
                  onChange({ ...gradient, meshCorners: corners });
                }}
              />
            ))}
          </div>
          <Field label="Warp">
            <SliderControl
              value={gradient.meshWarp ?? 0}
              min={0}
              max={1}
              step={0.01}
              onChange={(meshWarp) => onChange({ ...gradient, meshWarp })}
            />
          </Field>
        </TabsContent>
      )}
    </Tabs>
  );
}

function GradientStops({ gradient, onChange }: { gradient: GradientFill; onChange: (gradient: GradientFill) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {gradient.stops.map((stop, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <ColorInput
            value={stop.color}
            onChange={(color) => onChange({ ...gradient, stops: gradient.stops.map((s, i) => (i === index ? { ...s, color } : s)) })}
          />
          <SliderControl
            value={stop.offset}
            min={0}
            max={1}
            step={0.01}
            onChange={(offset) => onChange({ ...gradient, stops: gradient.stops.map((s, i) => (i === index ? { ...s, offset } : s)) })}
          />
          {gradient.stops.length > 2 && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onChange({ ...gradient, stops: gradient.stops.filter((_, i) => i !== index) })}
            >
              <X size={12} />
            </Button>
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-auto self-start gap-1 px-1 py-0.5 text-2xs-plus text-muted-foreground hover:text-foreground"
        onClick={() => onChange({ ...gradient, stops: [...gradient.stops, { offset: 1, color: "#ffffffff" }] })}
      >
        <Plus size={11} /> Add stop
      </Button>
    </div>
  );
}
