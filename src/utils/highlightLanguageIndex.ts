/**
 * Highlight.js 语言包索引
 *
 * 此文件用于让 Vite 正确分析和分割 highlight.js 语言包
 * 所有语言包都会被动态导入，但在构建时 Vite 会将它们分割成独立的 chunk
 */

// 动态导入所有支持的语言
// Vite 会在构建时将这些 import 语句转换为可动态加载的 chunk
export async function loadLanguageModule(lang: string) {
  switch (lang) {
    // 预加载语言（15 种常见语言）
    case 'javascript':
      return import('highlight.js/lib/languages/javascript');
    case 'typescript':
      return import('highlight.js/lib/languages/typescript');
    case 'python':
      return import('highlight.js/lib/languages/python');
    case 'java':
      return import('highlight.js/lib/languages/java');
    case 'cpp':
      return import('highlight.js/lib/languages/cpp');
    case 'xml':
      return import('highlight.js/lib/languages/xml');
    case 'css':
      return import('highlight.js/lib/languages/css');
    case 'bash':
      return import('highlight.js/lib/languages/bash');
    case 'json':
      return import('highlight.js/lib/languages/json');
    case 'markdown':
      return import('highlight.js/lib/languages/markdown');
    case 'sql':
      return import('highlight.js/lib/languages/sql');
    case 'go':
      return import('highlight.js/lib/languages/go');
    case 'rust':
      return import('highlight.js/lib/languages/rust');
    case 'yaml':
      return import('highlight.js/lib/languages/yaml');
    case 'csharp':
      return import('highlight.js/lib/languages/csharp');

    // 其他常见语言（可选，根据需求添加）
    case 'ruby':
      return import('highlight.js/lib/languages/ruby');
    case 'php':
      return import('highlight.js/lib/languages/php');
    case 'swift':
      return import('highlight.js/lib/languages/swift');
    case 'kotlin':
      return import('highlight.js/lib/languages/kotlin');
    case 'scala':
      return import('highlight.js/lib/languages/scala');
    case 'objectivec':
      return import('highlight.js/lib/languages/objectivec');
    case 'haskell':
      return import('highlight.js/lib/languages/haskell');
    case 'lua':
      return import('highlight.js/lib/languages/lua');
    case 'perl':
      return import('highlight.js/lib/languages/perl');
    case 'r':
      return import('highlight.js/lib/languages/r');
    case 'matlab':
      return import('highlight.js/lib/languages/matlab');
    case 'dart':
      return import('highlight.js/lib/languages/dart');
    case 'elixir':
      return import('highlight.js/lib/languages/elixir');
    case 'erlang':
      return import('highlight.js/lib/languages/erlang');
    case 'clojure':
      return import('highlight.js/lib/languages/clojure');
    case 'fsharp':
      return import('highlight.js/lib/languages/fsharp');
    case 'groovy':
      return import('highlight.js/lib/languages/groovy');
    case 'julia':
      return import('highlight.js/lib/languages/julia');
    case 'powershell':
      return import('highlight.js/lib/languages/powershell');
    case 'dockerfile':
      return import('highlight.js/lib/languages/dockerfile');
    case 'nginx':
      return import('highlight.js/lib/languages/nginx');
    case 'apache':
      return import('highlight.js/lib/languages/apache');
    case 'diff':
      return import('highlight.js/lib/languages/diff');
    case 'plaintext':
      return import('highlight.js/lib/languages/plaintext');

    default:
      throw new Error(`Unsupported language: ${lang}`);
  }
}
