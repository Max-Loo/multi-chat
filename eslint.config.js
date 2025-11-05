import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: ['dist'],
  },
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,tsx}']
  })),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.recommended.rules,

      // 自动删除未使用的变量
      '@typescript-eslint/no-unused-vars': ['warn', {
        args: 'after-used',
        vars: 'all',
        ignoreRestSiblings: false
      }],

      // 尾逗号规则，设置为warning，自动添加尾逗号
      'comma-dangle': ['warn', {
        'arrays': 'always-multiline',
        'objects': 'always-multiline',
        'imports': 'always-multiline',
        'exports': 'always-multiline',
        'functions': 'always-multiline'
      }],

      // 删除多余空格的规则
      'indent': ['error', 2], // 缩进只能是两个空格
      'no-trailing-spaces': 'error', // 行尾不能有多余的空格
      'no-multi-spaces': 'error', // 禁止使用多个空格
      'no-irregular-whitespace': 'error', // 禁止不规则的空白
      'no-whitespace-before-property': 'error', // 禁止属性前有空白
      'space-in-parens': ['error', 'never'], // 小括号里面不要有空格
      'space-infix-ops': 'error', // 中缀操作符周围有空格
      'space-unary-ops': ['error', { words: true, nonwords: false }], // 一元操作符的空格
      'object-curly-spacing': ['error', 'always'], // 对象大括号内的空格
      'array-bracket-spacing': ['error', 'never'], // 数组括号内不要空格
      'computed-property-spacing': ['error', 'never'], // 计算属性内不要空格
      'comma-spacing': ['error', { before: false, after: true }], // 逗号空格
      'semi-spacing': ['error', { before: false, after: true }], // 分号空格
      'key-spacing': ['error', { beforeColon: false, afterColon: true }], // 键值对空格
      'keyword-spacing': ['error', { before: true, after: true }], // 关键字空格
      'arrow-spacing': ['error', { before: true, after: true }], // 箭头函数空格
      'block-spacing': 'error', // 代码块空格
      'template-tag-spacing': ['error', 'never'], // 模板标签空格
    },
  },
]