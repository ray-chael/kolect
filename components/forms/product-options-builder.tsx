"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductCustomField } from "@/lib/types";

interface ProductOptionsBuilderProps {
  colors: string[];
  sizes: string[];
  customFields: ProductCustomField[];
  onColorsChange: (colors: string[]) => void;
  onSizesChange: (sizes: string[]) => void;
  onCustomFieldsChange: (fields: ProductCustomField[]) => void;
}

function nextFieldId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ProductOptionsBuilder({
  colors,
  sizes,
  customFields,
  onColorsChange,
  onSizesChange,
  onCustomFieldsChange,
}: ProductOptionsBuilderProps) {
  function updateListItem(
    list: string[],
    setter: (next: string[]) => void,
    index: number,
    value: string,
  ) {
    const next = [...list];
    next[index] = value;
    setter(next);
  }

  function addListItem(list: string[], setter: (next: string[]) => void) {
    setter([...list, ""]);
  }

  function removeListItem(
    list: string[],
    setter: (next: string[]) => void,
    index: number,
  ) {
    setter(list.filter((_, itemIndex) => itemIndex !== index));
  }

  function addCustomField() {
    onCustomFieldsChange([
      ...customFields,
      {
        id: nextFieldId(),
        label: "",
        type: "text",
        required: false,
        options: [],
      },
    ]);
  }

  function updateCustomField(
    index: number,
    patch: Partial<ProductCustomField>,
  ) {
    onCustomFieldsChange(
      customFields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    );
  }

  function removeCustomField(index: number) {
    onCustomFieldsChange(
      customFields.filter((_, fieldIndex) => fieldIndex !== index),
    );
  }

  function addFieldOption(index: number) {
    onCustomFieldsChange(
      customFields.map((field, fieldIndex) =>
        fieldIndex === index
          ? {
              ...field,
              options: [...field.options, { label: "", value: "" }],
            }
          : field,
      ),
    );
  }

  function updateFieldOption(
    fieldIndex: number,
    optionIndex: number,
    key: "label" | "value",
    value: string,
  ) {
    onCustomFieldsChange(
      customFields.map((field, currentFieldIndex) => {
        if (currentFieldIndex !== fieldIndex) return field;

        return {
          ...field,
          options: field.options.map((option, currentOptionIndex) =>
            currentOptionIndex === optionIndex
              ? { ...option, [key]: value }
              : option,
          ),
        };
      }),
    );
  }

  function removeFieldOption(fieldIndex: number, optionIndex: number) {
    onCustomFieldsChange(
      customFields.map((field, currentFieldIndex) =>
        currentFieldIndex === fieldIndex
          ? {
              ...field,
              options: field.options.filter(
                (_, currentOptionIndex) => currentOptionIndex !== optionIndex,
              ),
            }
          : field,
      ),
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-6">
      <div>
        <h2 className="font-display text-xl tracking-tight">Product Options</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add simple choices like colors and sizes, plus any extra fields the buyer must fill or pick from.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Colors</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addListItem(colors, onColorsChange)}
              className="rounded-full"
            >
              <Plus className="mr-1 h-4 w-4" /> Add color
            </Button>
          </div>
          {colors.length === 0 && (
            <p className="text-sm text-muted-foreground">No color variants yet.</p>
          )}
          {colors.map((color, index) => (
            <div key={`color-${index}`} className="flex gap-2">
              <Input
                value={color}
                onChange={(event) =>
                  updateListItem(colors, onColorsChange, index, event.target.value)
                }
                placeholder="e.g. Gold"
                className="rounded-xl"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeListItem(colors, onColorsChange, index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Sizes</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addListItem(sizes, onSizesChange)}
              className="rounded-full"
            >
              <Plus className="mr-1 h-4 w-4" /> Add size
            </Button>
          </div>
          {sizes.length === 0 && (
            <p className="text-sm text-muted-foreground">No size variants yet.</p>
          )}
          {sizes.map((size, index) => (
            <div key={`size-${index}`} className="flex gap-2">
              <Input
                value={size}
                onChange={(event) =>
                  updateListItem(sizes, onSizesChange, index, event.target.value)
                }
                placeholder="e.g. XL"
                className="rounded-xl"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeListItem(sizes, onSizesChange, index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Custom Fields</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Examples: Engraving, Storage Variant, Fabric Note.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomField}
            className="rounded-full"
          >
            <Plus className="mr-1 h-4 w-4" /> Add field
          </Button>
        </div>

        {customFields.length === 0 && (
          <p className="text-sm text-muted-foreground">No custom buyer fields yet.</p>
        )}

        {customFields.map((field, fieldIndex) => (
          <div
            key={field.id}
            className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,2fr)_180px]">
                <div className="space-y-2">
                  <Label>Field Label</Label>
                  <Input
                    value={field.label}
                    onChange={(event) =>
                      updateCustomField(fieldIndex, { label: event.target.value })
                    }
                    placeholder="e.g. Storage Option"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <select
                    title="Select custom field type"
                    value={field.type}
                    onChange={(event) =>
                      updateCustomField(fieldIndex, {
                        type: event.target.value as "select" | "text",
                        options:
                          event.target.value === "select" ? field.options : [],
                      })
                    }
                    className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="text">Text</option>
                    <option value="select">Select</option>
                  </select>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCustomField(fieldIndex)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(event) =>
                  updateCustomField(fieldIndex, { required: event.target.checked })
                }
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Required field
            </label>

            {field.type === "select" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addFieldOption(fieldIndex)}
                    className="rounded-full"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add option
                  </Button>
                </div>

                {field.options.length === 0 && (
                  <p className="text-sm text-muted-foreground">Add at least one option.</p>
                )}

                {field.options.map((option, optionIndex) => (
                  <div key={`${field.id}-option-${optionIndex}`} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]">
                    <Input
                      value={option.label}
                      onChange={(event) =>
                        updateFieldOption(fieldIndex, optionIndex, "label", event.target.value)
                      }
                      placeholder="Option label"
                      className="rounded-xl"
                    />
                    <Input
                      value={option.value}
                      onChange={(event) =>
                        updateFieldOption(fieldIndex, optionIndex, "value", event.target.value)
                      }
                      placeholder="Option value"
                      className="rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFieldOption(fieldIndex, optionIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}