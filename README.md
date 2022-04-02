# auto-atomic-css README

Automatically fix styles that are not atomized in style tags, when the style exists in the atomic stylesheet.

If some properties of the current class do not exist in the atomic style sheet, they are fixed to the template by user selection or still exist in the same style tag.

Atomic style sheets can be written through LESS and CSS.

The first step of the plugin is to determine the location of the atomic style sheets, and then click the class you want to fix in the style tag.

<image src="./r1.png" />
<image src="./r2.png" />
<image src="./r3.png" />
<image src="./r4.png" />

## Features

<image src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8bce24ddf07344aabfd84f72bcb3524e~tplv-k3u1fbpfcp-zoom-1.image" width="70%" />

## Known Issues

## Release Notes

### 0.0.1

- Plugin can handle LESS / CSS compiled atomic styles
- Plugins can handle Vue template syntax
- Supports processing styles in which the style's level is completely class single tag

- Fix template code confusion caused by correcting styles

### 0.0.2

- Supports split margin complex style

- Supports split padding complex style
- Supports split border complex style
- Support for fixed into templates style tags

### 0.0.3

- Supports border-radius margin complex style
