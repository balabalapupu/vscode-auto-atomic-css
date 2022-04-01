# auto-atomic-css README

Convert the selected class’s style in the style tag into the attribute corresponding to the atomic style sheet, and replace the corresponding tag to the HTML.

## Features

1. The selected class needs to be in Vue
2. The corresponding atomic style sheet currently supports the less file format

<image src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8bce24ddf07344aabfd84f72bcb3524e~tplv-k3u1fbpfcp-zoom-1.image" width="70%" />

## Known Issues

1. If the selected class is wrapped by other classes, the outer wrapping range will be ignored
   - Maybe I won't fix this to prevent users from existing outside wrapper classes

## Release Notes

### 1.0.0

Automatically modify atomic CSS styles in Vue template syntax.

Directory selected atom files support LESS or CSS format.

Recommended for use with ESLint.
