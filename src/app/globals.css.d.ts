// This file tells TypeScript that importing .css files is allowed
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}