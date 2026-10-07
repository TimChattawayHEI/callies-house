const R = window.React;
export const Fragment = R.Fragment;
export const jsx = (type, props, key) => R.createElement(type, key === undefined ? props : { ...props, key });
export const jsxs = jsx;
