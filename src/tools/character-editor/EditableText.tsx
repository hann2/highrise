import { useEffect, useState } from "preact/hooks";

/**
 * A text field that saves when it loses focus or on Enter (Cmd/Ctrl+Enter
 * when multiline), and goes back to the saved value on Escape.
 */
export function EditableText({
  value,
  onSave,
  multiline = false,
  placeholder,
  class: className = "",
}: {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  class?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const save = () => {
    if (draft !== value) {
      onSave(draft);
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLInputElement;
    if (event.key === "Escape") {
      setDraft(value);
      setTimeout(() => target.blur());
    } else if (
      event.key === "Enter" &&
      (!multiline || event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault();
      target.blur();
    }
  };
  const props = {
    class: `editable ${draft !== value ? "is-dirty" : ""} ${className}`,
    value: draft,
    placeholder,
    onInput: (event: Event) =>
      setDraft((event.target as HTMLInputElement).value),
    onBlur: save,
    onKeyDown,
  };
  return multiline ? <textarea rows={3} {...props} /> : <input {...props} />;
}
