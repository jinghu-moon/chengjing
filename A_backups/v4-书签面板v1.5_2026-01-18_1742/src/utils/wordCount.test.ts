import { describe, test, expect } from 'vitest'
import { getWordCount } from './wordCount'

const count = (text: string) => getWordCount(text).total

describe('getWordCount - 完整测试套件', () => {
  // ========================================================================
  // 基础功能
  // ========================================================================

  describe('基础功能', () => {
    test('空字符串返回 0', () => {
      expect(count('')).toBe(0)
      expect(count('   ')).toBe(0)
      expect(count('\t\t\t')).toBe(0)
      expect(count('\n\n\n')).toBe(0)
    })

    test('纯英文计数', () => {
      expect(count('hello')).toBe(1)
      expect(count('hello world')).toBe(2)
      expect(count('Hello, World!')).toBe(2)
      expect(count('The quick brown fox')).toBe(4)
    })

    test('纯中文逐字计数', () => {
      expect(count('你好')).toBe(2)
      expect(count('你好世界')).toBe(4)
      expect(count('你好，世界！')).toBe(4)
      expect(count('今天天气真不错')).toBe(7)
    })

    test('中英混合', () => {
      expect(count('Hello世界')).toBe(3)
      expect(count('我爱 TypeScript')).toBe(3)
      expect(count('Vue 是一个渐进式框架')).toBe(9)
      expect(count('使用 Vue 3 开发应用')).toBe(8)
    })

    test('日韩文字', () => {
      expect(count('こんにちは')).toBe(5) // 平假名
      expect(count('カタカナ')).toBe(4) // 片假名
      expect(count('안녕하세요')).toBe(5) // 韩文
      expect(count('ひらがなカタカナ')).toBe(8) // 混合
    })

    test('多语言混合', () => {
      expect(count('Hello世界こんにちは안녕')).toBe(10)
      expect(count('TypeScript开発ガイド')).toBe(6)
      expect(count('Vue3で作る웹앱')).toBe(6)
    })
  })

  // ========================================================================
  // 标点符号处理
  // ========================================================================

  describe('标点符号处理', () => {
    test('英文缩写完整保留', () => {
      expect(count("it's fine")).toBe(2)
      expect(count("don't worry")).toBe(2)
      expect(count("I'm ready")).toBe(2)
      expect(count("can't won't shouldn't")).toBe(3)
      expect(count("we're they're you're")).toBe(3)
    })

    test('数字中的标点保留', () => {
      expect(count('10,000')).toBe(1)
      expect(count('1,234.56')).toBe(1)
      expect(count('$99.99')).toBe(1)
      expect(count('3.14159')).toBe(1)
      expect(count('1,000,000')).toBe(1)
    })

    test('纯标点不计数', () => {
      expect(count('...')).toBe(0)
      expect(count('---')).toBe(0)
      expect(count('!!!')).toBe(0)
      expect(count('***')).toBe(0)
      expect(count('???')).toBe(0)
      expect(count('~~~')).toBe(0)
      expect(count('@#$%^&*()')).toBe(0)
    })

    test('引号包裹的词', () => {
      expect(count('"hello"')).toBe(1)
      expect(count("'world'")).toBe(1)
      expect(count('(test)')).toBe(1)
      expect(count('[item]')).toBe(1)
      expect(count('{data}')).toBe(1)
      expect(count('"Hello World"')).toBe(2)
    })

    test('中文标点', () => {
      expect(count('你好，世界！')).toBe(4)
      expect(count('什么？为什么？')).toBe(5)
      expect(count('是的、对的、没错')).toBe(6)
      expect(count('「引用」')).toBe(2)
      expect(count('【标题】')).toBe(2)
    })

    test('混合标点', () => {
      expect(count('Hello, 世界!')).toBe(3)
      expect(count('What? 什么?')).toBe(3)
      expect(count('Yes! 对的！')).toBe(3)
    })
  })

  // ========================================================================
  // 特殊字符
  // ========================================================================

  describe('特殊字符', () => {
    test('零宽字符作为分隔符', () => {
      expect(count('hello\u200Bworld')).toBe(2)
      expect(count('你\u200B好')).toBe(2)
      expect(count('test\uFEFFing')).toBe(2)
      expect(count('word\u200Ctest')).toBe(2)
      expect(count('a\u200Db\u200Bc')).toBe(2)
    })

    test('编程符号', () => {
      expect(count('C++')).toBe(1)
      expect(count('C#')).toBe(1)
      expect(count('F#')).toBe(1)
      expect(count('@username')).toBe(1)
      expect(count('#hashtag')).toBe(1)
      expect(count('user@email.com')).toBe(1)
      expect(count('$variable')).toBe(1)
    })

    test('URL 和路径', () => {
      expect(count('https://example.com')).toBe(1)
      expect(count('http://vue.js.org')).toBe(1)
      expect(count('www.google.com')).toBe(1)
      expect(count('/path/to/file')).toBe(1)
      expect(count('C:\\Windows\\System32')).toBe(1)
    })

    test('Emoji 表情', () => {
      expect(count('Hello 👋 World')).toBe(3)
      expect(count('😀😃😄')).toBe(1)
      expect(count('I ❤️ Vue')).toBe(3)
      expect(count('🎉 庆祝 🎊')).toBe(4)
      expect(count('👨‍👩‍👧‍👦')).toBe(1) // 家庭 emoji (ZWJ序列)
    })

    test('特殊 Unicode 字符', () => {
      expect(count('café')).toBe(1) // 带音标
      expect(count('naïve')).toBe(1)
      expect(count('Zürich')).toBe(1)
      expect(count('São Paulo')).toBe(2)
    })
  })

  // ========================================================================
  // 数字处理
  // ========================================================================

  describe('数字处理', () => {
    test('纯数字', () => {
      expect(count('123')).toBe(1)
      expect(count('2024')).toBe(1)
      expect(count('3.14')).toBe(1)
      expect(count('100 200 300')).toBe(3)
    })

    test('数字与单位', () => {
      expect(count('100km')).toBe(1)
      expect(count('3.5GB')).toBe(1)
      expect(count('25°C')).toBe(1)
      expect(count('$100')).toBe(1)
      expect(count('€50')).toBe(1)
    })

    test('中文数字混合', () => {
      expect(count('第1章')).toBe(3) // "第" + "1章"
      expect(count('100个')).toBe(2) // "100" + "个"
      expect(count('2024年')).toBe(2)
      expect(count('3.14的值')).toBe(3)
    })

    test('科学计数法和特殊格式', () => {
      expect(count('1e10')).toBe(1)
      expect(count('6.022e23')).toBe(1)
      expect(count('0x1A2B')).toBe(1)
      expect(count('IPv4: 192.168.1.1')).toBe(2)
    })
  })

  // ========================================================================
  // 空白符和换行
  // ========================================================================

  describe('空白符和换行处理', () => {
    test('多种空白符', () => {
      expect(count('hello   world')).toBe(2)
      expect(count('hello\tworld')).toBe(2)
      expect(count('hello\nworld')).toBe(2)
      expect(count('hello\r\nworld')).toBe(2)
      expect(count('hello\u00A0world')).toBe(2) // 不换行空格
    })

    test('段落和换行', () => {
      expect(count('第一段\n第二段')).toBe(6)
      expect(count('Line 1\nLine 2\nLine 3')).toBe(6)
      expect(count('你好\n\n世界')).toBe(4)
    })

    test('行首行尾空格', () => {
      expect(count('  hello  ')).toBe(1)
      expect(count('\n\nhello\n\n')).toBe(1)
      expect(count('  你好  ')).toBe(2)
    })
  })

  // ========================================================================
  // 复杂文本场景
  // ========================================================================

  describe('复杂文本场景', () => {
    test('技术文档', () => {
      const text = 'Vue 3 使用 TypeScript 重写，性能提升 100%'
      expect(count(text)).toBe(12)
    })

    test('对话文本', () => {
      const text = '他说："Hello World"很简单'
      expect(count(text)).toBe(7)
    })

    test('代码片段', () => {
      const text = "const name = 'Vue 3';"
      expect(count(text)).toBe(4) // const, name, Vue, 3
    })

    test('Markdown 文本', () => {
      expect(count('# 标题')).toBe(2)
      expect(count('**粗体**')).toBe(2)
      expect(count('*斜体*')).toBe(2)
      expect(count('- 列表项')).toBe(3)
      expect(count('[链接](url)')).toBe(3)
    })

    test('混合标记', () => {
      const text = '访问 https://vue.js.org 学习 Vue 3.0'
      expect(count(text)).toBe(7)
    })

    test('邮件地址', () => {
      expect(count('联系 hello@example.com 获取帮助')).toBe(7)
      expect(count('Email: user@domain.com')).toBe(2)
    })
  })

  // ========================================================================
  // 边界情况
  // ========================================================================

  describe('边界情况', () => {
    test('单个字符', () => {
      expect(count('a')).toBe(1)
      expect(count('我')).toBe(1)
      expect(count('1')).toBe(1)
      expect(count('!')).toBe(0)
    })

    test('极长文本', () => {
      const longText = 'word '.repeat(1000) + '字'.repeat(1000)
      expect(count(longText)).toBe(2000)
    })

    test('超长单词', () => {
      const longWord = 'a'.repeat(1000)
      expect(count(longWord)).toBe(1)
    })

    test('大量空格', () => {
      expect(count('     ')).toBe(0)
      expect(count(' '.repeat(100))).toBe(0)
      expect(count('word' + ' '.repeat(50) + 'test')).toBe(2)
    })

    test('大量换行', () => {
      expect(count('\n'.repeat(10))).toBe(0)
      expect(count('hello\n\n\n\nworld')).toBe(2)
    })

    test('Unicode 边界', () => {
      expect(count('𝕳𝖊𝖑𝖑𝖔')).toBe(1) // 数学字母
      expect(count('𝓗𝓮𝓵𝓵𝓸')).toBe(1) // 手写体
    })
  })

  // ========================================================================
  // 详细统计测试
  // ========================================================================

  describe('详细统计', () => {
    test('CJK 分类统计', () => {
      const result = getWordCount('中文ひらがなカタカナ한글')
      expect(result.cjk).toBe(12)
      expect(result.details.chinese).toBe(2)
      expect(result.details.japanese).toBe(8)
      expect(result.details.korean).toBe(2)
    })

    test('拉丁字母和数字', () => {
      const result = getWordCount('Hello123 World456')
      expect(result.nonCjk).toBe(2)
      expect(result.details.latin).toBe(10)
      expect(result.details.digits).toBe(6)
    })

    test('字符数统计', () => {
      const result = getWordCount('Hello 世界')
      expect(result.characters).toBe(7) // 不含空格
      expect(result.charactersWithSpaces).toBe(8) // 含空格
    })

    test('段落统计', () => {
      const result = getWordCount('第一段\n第二段\n第三段')
      expect(result.paragraphs).toBe(3)
    })

    test('行数统计', () => {
      // 基础情况
      expect(getWordCount('').lines).toBe(0)
      expect(getWordCount('hello').lines).toBe(1)
      expect(getWordCount('a\nb').lines).toBe(2)
      expect(getWordCount('第一行\n第二行\n第三行').lines).toBe(3)

      // 空行分别计数
      expect(getWordCount('a\n\nb').lines).toBe(3)
      expect(getWordCount('a\n\n\nb').lines).toBe(4)

      // 末尾空行忽略
      expect(getWordCount('a\nb\n').lines).toBe(2)
      expect(getWordCount('a\nb\n\n\n').lines).toBe(2)

      // 开头空行计数
      expect(getWordCount('\na').lines).toBe(2)
      expect(getWordCount('\n\na').lines).toBe(3)
    })

    test('标点符号统计', () => {
      const result = getWordCount('Hello, World!')
      expect(result.details.punctuation).toBe(2) // 逗号和感叹号
    })

    test('混合内容详细统计', () => {
      const result = getWordCount('Vue 3.0 使用 TypeScript 开发，性能提升 100%！')

      expect(result.total).toBeGreaterThan(0)
      expect(result.cjk).toBeGreaterThan(0)
      expect(result.nonCjk).toBeGreaterThan(0)
      expect(result.characters).toBeGreaterThan(0)
      expect(result.charactersWithSpaces).toBeGreaterThan(result.characters)
      expect(result.details.chinese).toBeGreaterThan(0)
      expect(result.details.latin).toBeGreaterThan(0)
      expect(result.details.digits).toBeGreaterThan(0)
    })
  })

  // ========================================================================
  // 实际应用场景
  // ========================================================================

  describe('实际应用场景', () => {
    test('博客文章摘要', () => {
      const article = `
        Vue 3 正式发布！
        
        经过两年的开发，Vue 3 终于在 2020 年 9 月发布了。
        新版本带来了诸多改进：
        - 更快的性能
        - 更小的体积
        - 更好的 TypeScript 支持
      `
      const result = getWordCount(article)
      expect(result.total).toBeGreaterThan(20)
      expect(result.paragraphs).toBeGreaterThan(1)
    })

    test('社交媒体帖子', () => {
      const post = '今天学习了 Vue 3 的 Composition API，真的太好用了！👍 #Vue3 #前端开发'
      const result = getWordCount(post)
      expect(result.total).toBeGreaterThan(10)
      expect(result.cjk).toBeGreaterThan(0)
      expect(result.nonCjk).toBeGreaterThan(0)
    })

    test('代码注释', () => {
      const comment = '// 初始化 Vue 应用，配置 TypeScript 支持'
      const result = getWordCount(comment)
      expect(result.total).toBeGreaterThan(5)
    })

    test('表单输入验证', () => {
      const input = '请输入至少 10 个字的简介'
      const result = getWordCount(input)
      expect(result.total).toBe(11)
    })

    test('搜索查询', () => {
      expect(count('Vue 3 教程')).toBe(4)
      expect(count('TypeScript 入门指南')).toBe(5)
      expect(count('how to learn Vue')).toBe(4)
    })
  })

  // ========================================================================
  // 性能测试
  // ========================================================================

  describe('性能测试', () => {
    test('1000字中文 < 10ms', () => {
      const text = '字'.repeat(1000)
      const start = performance.now()
      getWordCount(text)
      const end = performance.now()
      expect(end - start).toBeLessThan(10)
    })

    test('1000词英文 < 10ms', () => {
      const text = 'word '.repeat(1000)
      const start = performance.now()
      getWordCount(text)
      const end = performance.now()
      expect(end - start).toBeLessThan(10)
    })

    test('10万字符混合文本 < 50ms', () => {
      const text = 'Hello世界 '.repeat(10000)
      const start = performance.now()
      getWordCount(text)
      const end = performance.now()
      expect(end - start).toBeLessThan(50)
    })

    test('批量处理 100 个文本 < 100ms', () => {
      const texts = Array(100).fill('Hello 世界 Vue 3')
      const start = performance.now()
      texts.forEach(text => getWordCount(text))
      const end = performance.now()
      expect(end - start).toBeLessThan(100)
    })
  })

  // ========================================================================
  // 回归测试（防止已修复的 bug 再次出现）
  // ========================================================================

  describe('回归测试', () => {
    test('零宽字符应作为分隔符而非被删除', () => {
      // 之前的 bug：零宽字符被删除导致 "hello\u200Bworld" 变成 "helloworld"
      expect(count('hello\u200Bworld')).toBe(2)
      expect(count('test\u200Bing')).toBe(2)
    })

    test('Emoji 应被正确识别为独立词', () => {
      // 确保 edgePunct 不会移除 emoji
      expect(count('👋')).toBe(1)
      expect(count('Hello👋')).toBe(1)
    })

    test('空字符串各项指标应为 0', () => {
      const result = getWordCount('')
      expect(result.total).toBe(0)
      expect(result.cjk).toBe(0)
      expect(result.nonCjk).toBe(0)
      expect(result.characters).toBe(0)
      expect(result.charactersWithSpaces).toBe(0)
      expect(result.paragraphs).toBe(0)
    })

    test('纯空格文本应返回正确的空格计数', () => {
      const result = getWordCount('   ')
      expect(result.total).toBe(0)
      expect(result.charactersWithSpaces).toBe(3)
      expect(result.characters).toBe(0)
    })
  })

  // ========================================================================
  // 极端情况测试
  // ========================================================================

  describe('极端情况', () => {
    test('只有一个字符的各种情况', () => {
      expect(count('a')).toBe(1)
      expect(count('我')).toBe(1)
      expect(count('1')).toBe(1)
      expect(count('あ')).toBe(1)
      expect(count('가')).toBe(1)
      expect(count('!')).toBe(0)
      expect(count(' ')).toBe(0)
    })

    test('重复字符', () => {
      expect(count('aaa')).toBe(1)
      expect(count('我我我')).toBe(3)
      expect(count('111')).toBe(1)
    })

    test('所有类型混合', () => {
      const text = 'Abc123你好あア가!@# 😀'
      const result = getWordCount(text)
      expect(result.total).toBeGreaterThan(0)
      expect(result.details.latin).toBeGreaterThan(0)
      expect(result.details.digits).toBeGreaterThan(0)
      expect(result.details.chinese).toBeGreaterThan(0)
      expect(result.details.japanese).toBeGreaterThan(0)
      expect(result.details.korean).toBeGreaterThan(0)
    })

    test('连续标点后跟文字', () => {
      expect(count('...hello')).toBe(1)
      expect(count('!!!world')).toBe(1)
      expect(count('???test')).toBe(1)
    })

    test('文字后跟连续标点', () => {
      expect(count('hello...')).toBe(1)
      expect(count('world!!!')).toBe(1)
      expect(count('test???')).toBe(1)
    })

    test('标点包围文字', () => {
      expect(count('...hello...')).toBe(1)
      expect(count('!!!world!!!')).toBe(1)
      expect(count('((test))')).toBe(1)
    })
  })

  // ========================================================================
  // 更多语言脚本测试
  // ========================================================================

  describe('更多语言脚本', () => {
    test('阿拉伯语', () => {
      expect(count('مرحبا')).toBe(1)
      expect(count('مرحبا بالعالم')).toBe(2)
      expect(count('السلام عليكم')).toBe(2)
    })

    test('希伯来语', () => {
      expect(count('שלום')).toBe(1)
      expect(count('שלום עולם')).toBe(2)
    })

    test('泰语', () => {
      expect(count('สวัสดี')).toBe(1)
      expect(count('สวัสดี ครับ')).toBe(2)
    })

    test('越南语', () => {
      expect(count('Xin chào')).toBe(2)
      expect(count('Việt Nam')).toBe(2)
    })

    test('希腊语', () => {
      expect(count('Γειά σου')).toBe(2)
      expect(count('Ελλάδα')).toBe(1)
    })

    test('俄语（西里尔字母）', () => {
      expect(count('Привет')).toBe(1)
      expect(count('Привет мир')).toBe(2)
      expect(count('Добрый день')).toBe(2)
    })

    test('印地语（天城文）', () => {
      expect(count('नमस्ते')).toBe(1)
      expect(count('नमस्ते दुनिया')).toBe(2)
    })

    test('多语言混合', () => {
      expect(count('Hello مرحبا 你好')).toBe(4)
      expect(count('Привет World 世界')).toBe(4)
      expect(count('שלום สวัสดี こんにちは')).toBe(7)
    })
  })

  // ========================================================================
  // Emoji 深度测试
  // ========================================================================

  describe('Emoji 深度测试', () => {
    test('肤色修饰符', () => {
      expect(count('👋🏻')).toBe(1)
      expect(count('👋🏽')).toBe(1)
      expect(count('👋🏿')).toBe(1)
      expect(count('👋🏻 👋🏿')).toBe(2)
    })

    test('ZWJ 组合序列', () => {
      expect(count('👨‍💻')).toBe(1) // 男程序员
      expect(count('👩‍🔬')).toBe(1) // 女科学家
      expect(count('🧑‍🤝‍🧑')).toBe(1) // 握手的人
      expect(count('👨‍👩‍👧‍👦')).toBe(1) // 家庭
    })

    test('国旗 Emoji', () => {
      // 国旗 emoji 由区域指示符组成，当前算法暂不单独计数
      expect(count('🇨🇳')).toBe(0)
      expect(count('🇺🇸')).toBe(0)
      expect(count('🇯🇵')).toBe(0)
      expect(count('🇨🇳 🇺🇸 🇯🇵')).toBe(0)
    })

    test('Emoji 与文字混合', () => {
      expect(count('我🇨🇳爱你')).toBe(3) // 国旗 emoji 不计数
      expect(count('Vue 3 is 🔥')).toBe(4)
      expect(count('👨‍💻 写代码')).toBe(4)
      expect(count('🎉庆祝🎊活动🎈开始')).toBe(9) // emoji 也被单独计数
    })

    test('连续 Emoji', () => {
      expect(count('🎉🎊🎈')).toBe(1)
      expect(count('👍👍👍')).toBe(1)
      expect(count('🔥💯🚀')).toBe(1)
    })

    test('Emoji 符号变体', () => {
      expect(count('❤️')).toBe(1)
      expect(count('☀️')).toBe(1)
      expect(count('⭐')).toBe(1)
    })
  })

  // ========================================================================
  // 编程场景深度测试
  // ========================================================================

  describe('编程场景深度测试', () => {
    test('变量命名风格', () => {
      expect(count('camelCase')).toBe(1)
      expect(count('snake_case')).toBe(1)
      expect(count('kebab-case')).toBe(1)
      expect(count('PascalCase')).toBe(1)
      expect(count('SCREAMING_SNAKE_CASE')).toBe(1)
    })

    test('代码语句', () => {
      expect(count('const x = 1;')).toBe(3)
      expect(count('function foo() {}')).toBe(2)
      expect(count("import { ref } from 'vue';")).toBe(4)
      expect(count('export default {};')).toBe(2)
    })

    test('代码注释', () => {
      expect(count('// TODO: fix this')).toBe(3)
      expect(count('/* 多行注释 */')).toBe(4) // 多、行、注、释 各算 1 词
      expect(count('/** JSDoc 注释 */')).toBe(3) // JSDoc、注、释
      expect(count('# Python 注释')).toBe(3) // Python、注、释
    })

    test('正则表达式', () => {
      expect(count('/^hello$/')).toBe(1)
      expect(count('/\\d+/g')).toBe(1)
      expect(count('regex: /[a-z]+/i')).toBe(2)
    })

    test('JSON 数据', () => {
      expect(count('{"key": "value"}')).toBe(2)
      expect(count('{"name": "Vue", "version": 3}')).toBe(4)
    })

    test('HTML/XML 标签', () => {
      expect(count('<div>内容</div>')).toBe(4) // div、内、容、div
      expect(count("<p class='test'>文本</p>")).toBe(5) // p、class='test'、文、本、p
      expect(count("<?xml version='1.0'?>")).toBe(2) // xml、version='1.0'
    })

    test('终端命令', () => {
      expect(count('npm install vue')).toBe(3)
      expect(count("git commit -m 'feat: 新功能'")).toBe(7) // git、commit、m、feat、新、功、能
      expect(count('cd /usr/local/bin')).toBe(2)
    })
  })

  // ========================================================================
  // 时间日期格式测试
  // ========================================================================

  describe('时间日期格式', () => {
    test('常见日期格式', () => {
      expect(count('2024-01-15')).toBe(1)
      expect(count('2024/01/15')).toBe(1)
      expect(count('01-15-2024')).toBe(1)
      expect(count('15.01.2024')).toBe(1)
    })

    test('时间格式', () => {
      expect(count('12:30')).toBe(1)
      expect(count('12:30:45')).toBe(1)
      expect(count('12:30 PM')).toBe(2)
      expect(count('08:00 AM')).toBe(2)
    })

    test('ISO 时间戳', () => {
      expect(count('2024-01-15T12:30:45Z')).toBe(1)
      expect(count('2024-01-15T12:30:45+08:00')).toBe(1)
    })

    test('相对时间表述', () => {
      expect(count('3天前')).toBe(3) // 3、天、前
      expect(count('2 hours ago')).toBe(3)
      expect(count('下周一')).toBe(3)
    })

    test('中文日期', () => {
      expect(count('2024年1月15日')).toBe(6) // 2024、年、1、月、15、日
      expect(count('上午10点30分')).toBe(6) // 上、午、10点30分
      expect(count('今天是星期一')).toBe(6)
    })
  })

  // ========================================================================
  // 版本号和标识符测试
  // ========================================================================

  describe('版本号和标识符', () => {
    test('语义化版本号', () => {
      expect(count('v1.0.0')).toBe(1)
      expect(count('v2.3.4-beta')).toBe(1)
      expect(count('1.0.0-alpha.1')).toBe(1)
      expect(count('3.0.0-rc.1')).toBe(1)
    })

    test('软件版本', () => {
      expect(count('Vue 3.4.0')).toBe(2)
      expect(count('Node.js v20.10.0')).toBe(2)
      expect(count('TypeScript 5.3')).toBe(2)
    })

    test('UUID', () => {
      expect(count('550e8400-e29b-41d4-a716-446655440000')).toBe(1)
      expect(count('ID: 550e8400-e29b-41d4-a716-446655440000')).toBe(2)
    })

    test('哈希值', () => {
      expect(count('abc123def')).toBe(1)
      expect(count('sha256: abc123')).toBe(2)
      expect(count('commit abc1234')).toBe(2)
    })

    test('产品型号', () => {
      expect(count('iPhone 15 Pro Max')).toBe(4)
      expect(count('MacBook Pro M3')).toBe(3) // MacBook、Pro、M3
      expect(count('RTX-4090')).toBe(1)
    })
  })

  // ========================================================================
  // 文件路径测试
  // ========================================================================

  describe('文件路径', () => {
    test('Unix 路径', () => {
      expect(count('/home/user/documents')).toBe(1)
      expect(count('~/Desktop/file.txt')).toBe(1)
      expect(count('./src/components/')).toBe(1)
      expect(count('../parent/folder')).toBe(1)
    })

    test('Windows 路径', () => {
      expect(count('C:\\Users\\Admin')).toBe(1)
      expect(count('D:\\Projects\\vue-app')).toBe(1)
      expect(count('C:\\Program Files\\App')).toBe(2) // 空格分隔
    })

    test('文件名', () => {
      expect(count('index.html')).toBe(1)
      expect(count('app.vue')).toBe(1)
      expect(count('styles.module.css')).toBe(1)
      expect(count('package.json')).toBe(1)
    })

    test('路径与描述混合', () => {
      expect(count('编辑 /path/to/file.txt 文件')).toBe(5) // 编、辑、path、文、件
      expect(count('Open C:\\Windows\\System32')).toBe(2)
    })
  })

  // ========================================================================
  // 特殊格式测试
  // ========================================================================

  describe('特殊格式', () => {
    test('电话号码', () => {
      expect(count('+86-138-0000-0000')).toBe(1)
      expect(count('(021) 1234-5678')).toBe(2)
      expect(count('+1 (555) 123-4567')).toBe(3)
    })

    test('IP 地址', () => {
      expect(count('192.168.1.1')).toBe(1)
      expect(count('10.0.0.1:8080')).toBe(1)
      expect(count('::1')).toBe(1)
      expect(count('2001:0db8:85a3::8a2e:0370:7334')).toBe(1)
    })

    test('坐标和经纬度', () => {
      expect(count('39.9042° N, 116.4074° E')).toBe(4)
      expect(count('(39.9042, 116.4074)')).toBe(2)
    })

    test('货币金额', () => {
      expect(count('¥99.00')).toBe(1)
      expect(count('$1,234.56')).toBe(1)
      expect(count('€50.00')).toBe(1)
      expect(count('£100')).toBe(1)
    })

    test('百分比', () => {
      expect(count('50%')).toBe(1)
      expect(count('99.9%')).toBe(1)
      expect(count('提升 100%')).toBe(3)
    })

    test('分数', () => {
      expect(count('1/2')).toBe(1)
      expect(count('3/4 杯')).toBe(2)
      expect(count('½')).toBe(1)
    })
  })

  // ========================================================================
  // RTL 和双向文本测试
  // ========================================================================

  describe('RTL 和双向文本', () => {
    test('阿拉伯语与英语混合', () => {
      expect(count('مرحبا Hello')).toBe(2)
      expect(count('Welcome مرحبا بك')).toBe(3)
    })

    test('希伯来语与英语混合', () => {
      expect(count('שלום Hello')).toBe(2)
      expect(count('Welcome שלום')).toBe(2)
    })

    test('多方向文本', () => {
      expect(count('Hello مرحبا 你好 שלום')).toBe(5)
      expect(count('English عربي עברית 中文')).toBe(5)
    })
  })

  // ========================================================================
  // 自然语言场景测试
  // ========================================================================

  describe('自然语言场景', () => {
    test('英文长句', () => {
      const text = 'The quick brown fox jumps over the lazy dog.'
      expect(count(text)).toBe(9)
    })

    test('中文长句', () => {
      const text = '这是一个用于测试字数统计功能的中文长句子。'
      expect(count(text)).toBe(20) // 20 个中文字符
    })

    test('问答对话', () => {
      expect(count('Q: What is Vue?\nA: A JavaScript framework.')).toBe(8) // Q、What、is、Vue、A、A、JavaScript、framework
      expect(count('问：Vue 是什么？\n答：一个 JavaScript 框架。')).toBe(11) // 问、Vue、是、什、么、答、一、个、JavaScript、框、架
    })

    test('列表内容', () => {
      const list = '1. 第一项\n2. 第二项\n3. 第三项'
      const result = getWordCount(list)
      expect(result.total).toBe(12)
      expect(result.paragraphs).toBe(3)
    })

    test('引用文本', () => {
      expect(count('> 这是一段引用文字')).toBe(8) // >、这、是、一、段、引、用、文、字 (> 被过滤后 8 个)
      expect(count('他说："你好，世界！"')).toBe(6)
    })

    test('脚注和注释', () => {
      expect(count('[1] 参考文献')).toBe(5) // 1、参、考、文、献
      expect(count('注[a]: 备注内容')).toBe(6) // 注、a、备、注、内、容
    })
  })
})
