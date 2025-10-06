

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/preset-create-react-app",
    "@storybook/addon-docs",
    // '@alexgorbatchev/storybook-addon-localstorage',
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  core: {
    builder: '@storybook/builder-vite',
  },
};
export default config;