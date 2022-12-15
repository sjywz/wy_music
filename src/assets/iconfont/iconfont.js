import { createGlobalStyle } from 'styled-components';

import iconfont from './iconfont.woff2';

export const IconStyle = createGlobalStyle`
  @font-face {
    font-family: "iconfont";
    src: url(${iconfont}) format('woff2');
  }
  .iconfont {
    font-family: "iconfont" !important;
    font-size: 16px;
    font-style: normal;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`

