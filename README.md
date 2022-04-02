## Features

<image src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8bce24ddf07344aabfd84f72bcb3524e~tplv-k3u1fbpfcp-zoom-1.image" width="70%" />

# auto-atomic-css

Automatically fix unatomicized styles in style tags when styles exist in atomic stylesheets.

The first step for the plugin is to locate the atomic stylesheet, then click on the class you want to fix in the styles tab. If some properties of the current class do not exist in the atomic stylesheet, either pin them into the template by user selection or still exist in the same style tag.

Support Less and Css styles.

Support Vue2, Vue3 template syntax.

## Release Notes

### 0.0.4

- Support users to choose whether to atomize all the selected style into the template
  - Select to generate all styles that which style not exist in the atomic style sheet will generate into template
  - Select to generate all styles that which style not exist in the atomic style sheet will keep in it style tag

### 0.0.3

- Support for border-radius composite property

### 0.0.2

- Support margin, padding, border composite properties
- Compatible with composition classes present in stylesheets

### 0.0.1

- The plugin supports atomized style sheets written in Less and Css
- Plugins can handle Vue2, Vue3 template syntax
- Plugin supports nested class styles in user styles
- Fixed the typographical confusion caused by formatting templates

## Known Issues
