# Release Notes

### 0.0.15

- adaptation LESS syntax （&）
  - The '&any {' or '& &any {' syntax can be used in style.
  - Attention when your mouse points to '& & {', automatic style modification will not be triggered, because ' & &any{' belongs to multiple classes and it is not currently adapted.

### 0.0.12

- fix bug

### 0.0.9

- add color modal and fix border modal

### 0.0.9

- add background-color fix

### 0.0.8

- fix border-radius template problem again

### 0.0.7

- fix border-radius template problem

### 0.0.6

- Support stylehub > 0.1.3
- Now users can select the stylehub version type and customize the path of atomized stylesheet file

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
