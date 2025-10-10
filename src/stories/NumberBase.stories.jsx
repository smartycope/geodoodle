import Number from "../Menus/Number"

export default {
  title: "Components/Number",
  component: Number,
  globals: {
    backgrounds: "dark",
  },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "number",
      description: "Current value of the number field",
    },
    min: {
      control: "number",
      description: "Minimum allowed value",
    },
    max: {
      control: "number",
      description: "Maximum allowed value",
    },
    step: {
      control: "number",
      description: "Step increment/decrement value",
    },
    label: {
      control: "text",
      description: "Label text for the number field",
    },
    title: {
      control: "text",
      description: "Tooltip text",
    },
    scrubDirection: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Direction for scrubbing",
    },
    compact: {
      control: "boolean",
      description: "Compact mode",
    },
    vertical: {
      control: "boolean",
      description: "Vertical orientation",
    },
    snapOnStep: {
      control: "boolean",
      description: "Snap value to step increments",
    },
  },
}

// Default story
export const Default = {
  args: {
    label: "Number Field",
    value: 0,
    min: -100,
    max: 100,
    step: 1,
  },
}

// With tooltip
export const WithTooltip = {
  args: {
    label: "Value",
    value: 50,
    title: "This is a helpful tooltip",
    min: 0,
    max: 100,
    step: 5,
  },
}

// Decimal values
export const DecimalValues = {
  args: {
    label: "Precision",
    value: 3.14,
    min: 0,
    max: 10,
    step: 0.01,
    snapOnStep: true,
  },
}

// With custom range
export const CustomRange = {
  args: {
    label: "Temperature (°C)",
    value: 20,
    min: -50,
    max: 50,
    step: 0.5,
  },
}

// Vertical orientation
export const VerticalOrientation = {
  args: {
    label: "Vertical",
    value: 10,
    vertical: true,
    min: 0,
    max: 100,
    step: 10,
  },
}

// With callbacks
export const WithCallbacks = {
  args: {
    label: "Interactive",
    value: 0,
    min: -10,
    max: 10,
    step: 1,
    onPlus: () => console.log("Plus clicked"),
    onMinus: () => console.log("Minus clicked"),
    onChange: (value) => console.log("Value changed:", value),
  },
}

// Large numbers
export const LargeNumbers = {
  args: {
    label: "Population",
    value: 1000000,
    min: 0,
    max: 10000000,
    step: 100000,
  },
}

// Compact mode
export const CompactMode = {
  args: {
    label: "Compact",
    value: 505,
    compact: true,
    min: 0,
    max: 10,
    step: 1,
  },
}
