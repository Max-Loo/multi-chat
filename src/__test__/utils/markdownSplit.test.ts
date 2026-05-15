import { describe, it, expect } from "vitest";
import { findSafeSplitPoint } from "@/utils/markdownSplit";

describe("findSafeSplitPoint", () => {
  describe("基本场景", () => {
    it("空字符串返回 0", () => {
      expect(findSafeSplitPoint("")).toBe(0);
    });

    it("无空行的内容返回 0", () => {
      expect(findSafeSplitPoint("Hello world")).toBe(0);
    });

    it("单段落后跟空行", () => {
      const content = "Hello\n\nWorld";
      // 空行位于 position 6
      expect(findSafeSplitPoint(content)).toBe(6);
    });

    it("多个段落返回最后一个安全分割点", () => {
      const content = "P1\n\nP2\n\nP3";
      // 最后一个空行在 "\nP3" 之前
      const result = findSafeSplitPoint(content);
      expect(content.slice(0, result)).toBe("P1\n\nP2\n");
      expect(content.slice(result)).toBe("\nP3");
    });

    it("末尾空行不产生有效分割", () => {
      const content = "Hello\n\n";
      // 空行位于 position 6，是唯一的分割点
      expect(findSafeSplitPoint(content)).toBe(6);
    });
  });

  describe("代码块场景", () => {
    it("代码块内的空行不作为分割点", () => {
      const content = "Before\n\n```\nline1\n\nline2\n```\n\nAfter";
      const result = findSafeSplitPoint(content);
      // 最后一个安全分割点应在 ``` 之后
      expect(content.slice(result)).toBe("\nAfter");
    });

    it("使用 ~~~ 标记的代码块", () => {
      const content2 = "Before\n\n~~~\ncode\n\n~~~\n\nAfter";
      const result = findSafeSplitPoint(content2);
      expect(content2.slice(result)).toBe("\nAfter");
    });

    it("代码块后面紧跟的内容", () => {
      const content = "```\ncode\n```\n\nParagraph";
      const result = findSafeSplitPoint(content);
      expect(content.slice(result)).toBe("\nParagraph");
    });

    it("未关闭的代码块中空行不作为分割点", () => {
      const content = "Before\n\n```\ncode here\n\nstill code";
      // 代码块未关闭，空行在代码块内
      const result = findSafeSplitPoint(content);
      // 唯一的安全分割点是 "Before" 之后的空行
      expect(content.slice(result)).toBe("\n```\ncode here\n\nstill code");
    });

    it("多个代码块交替出现", () => {
      const content = "Text1\n\n```\nc1\n```\n\nText2\n\n```\nc2\n```\n\nText3";
      const result = findSafeSplitPoint(content);
      expect(content.slice(result)).toBe("\nText3");
    });
  });

  describe("边界情况", () => {
    it("内容以空行开头", () => {
      const content = "\n\nHello";
      // 空行在 position 0 和 1
      expect(findSafeSplitPoint(content)).toBe(1);
    });

    it("只有空行", () => {
      expect(findSafeSplitPoint("\n\n\n")).toBe(2);
    });

    it("单个换行（非空行，只有 \\n）不构成段落分隔", () => {
      const content = "line1\nline2\nline3";
      // 没有空行（\n\n），只有单个 \n
      expect(findSafeSplitPoint(content)).toBe(0);
    });

    it("带缩进的空行仍算作空行", () => {
      const content = "Hello\n \nWorld";
      // " " 是只有空格的行，trim() 后为空
      expect(findSafeSplitPoint(content)).toBe(6);
    });

    it("```后面带 info string", () => {
      const content = "Before\n\n```python\ncode\n```\n\nAfter";
      const result = findSafeSplitPoint(content);
      expect(content.slice(result)).toBe("\nAfter");
    });

    it("~~~ 和 ``` 是不同类型的代码块", () => {
      // 用 ~~~ 开头，不能用 ``` 关闭
      const content = "~~~\ncode\n```\n\nAfter";
      // 代码块未关闭（``` 不匹配 ~~~），After 前的空行在代码块内
      // 只有最开头可能有的分割点
      expect(findSafeSplitPoint(content)).toBe(0);
    });

    it("用更多反引号关闭需要至少相同数量", () => {
      const content = "````\ncode\n```\n````\n\nAfter";
      // ```` (4) 开头，``` (3) 不够关闭，```` (4) 关闭
      const result = findSafeSplitPoint(content);
      expect(content.slice(result)).toBe("\nAfter");
    });
  });

  describe("流式增量场景", () => {
    it("内容逐步追加时 split point 逐步推进", () => {
      const step1 = "A";
      expect(findSafeSplitPoint(step1)).toBe(0);

      const step2 = "A\n\nB";
      const r2 = findSafeSplitPoint(step2);
      expect(step2.slice(0, r2)).toBe("A\n");
      expect(step2.slice(r2)).toBe("\nB");

      const step3 = "A\n\nB\n\nC";
      const r3 = findSafeSplitPoint(step3);
      expect(step3.slice(0, r3)).toBe("A\n\nB\n");
      expect(step3.slice(r3)).toBe("\nC");
    });

    it("内容缩短时 split point 回退", () => {
      const long = "A\n\nB\n\nC";
      const rLong = findSafeSplitPoint(long);
      expect(long.slice(rLong)).toBe("\nC");

      const short = "A\n\nB";
      const rShort = findSafeSplitPoint(short);
      expect(short.slice(0, rShort)).toBe("A\n");
      expect(short.slice(rShort)).toBe("\nB");
    });

    it("流式追加到未关闭代码块中，空行不作为分割点", () => {
      const step1 = "```\ncode\n";
      expect(findSafeSplitPoint(step1)).toBe(0);

      const step2 = "```\ncode\n\nstill code";
      expect(findSafeSplitPoint(step2)).toBe(0);
    });
  });

  describe("LLM 输出模式", () => {
    it("纯代码块消息", () => {
      const content = "```\ncode\n```\n";
      expect(findSafeSplitPoint(content)).toBe(0);
    });

    it("极短消息：单字符和单个换行", () => {
      expect(findSafeSplitPoint("x")).toBe(0);
      expect(findSafeSplitPoint("\n")).toBe(0);
    });

    it("连续调用结果一致", () => {
      const content = "Hello\n\n```python\ncode\n```\n\nWorld";
      const first = findSafeSplitPoint(content);
      const second = findSafeSplitPoint(content);
      const third = findSafeSplitPoint(content);
      expect(first).toBe(second);
      expect(second).toBe(third);
    });

    it("内容以换行符开头", () => {
      const content = "\nHello\n\nWorld";
      const result = findSafeSplitPoint(content);
      expect(content.slice(0, result)).toBe("\nHello\n");
      expect(content.slice(result)).toBe("\nWorld");
    });
  });

  describe("复杂 Markdown 结构", () => {
    it("列表项之间的空行", () => {
      const content = "- item1\n\n- item2\n\n- item3";
      const result = findSafeSplitPoint(content);
      expect(content.slice(0, result)).toBe("- item1\n\n- item2\n");
      expect(content.slice(result)).toBe("\n- item3");
    });

    it("引用块内的空行", () => {
      const content = "> line1\n>\n> line2\n\nAfter";
      const result = findSafeSplitPoint(content);
      expect(content.slice(result)).toBe("\nAfter");
    });

    it("标题前后的空行", () => {
      const content = "# Title\n\n## Subtitle\n\nParagraph";
      const result = findSafeSplitPoint(content);
      expect(content.slice(0, result)).toBe("# Title\n\n## Subtitle\n");
      expect(content.slice(result)).toBe("\nParagraph");
    });

    it("文本中包含 ``` 但非代码围栏", () => {
      const content = "Use ``` to start a code block\n\nNew paragraph";
      const result = findSafeSplitPoint(content);
      expect(content.slice(result)).toBe("\nNew paragraph");
    });

    it("HTML 标签内的空行", () => {
      const content = "<div>\n\ncontent\n\n</div>\n\nAfter";
      const result = findSafeSplitPoint(content);
      expect(content.slice(0, result)).toBe("<div>\n\ncontent\n\n</div>\n");
      expect(content.slice(result)).toBe("\nAfter");
    });
  });

  describe("极端边界", () => {
    it("仅包含代码围栏标记", () => {
      expect(findSafeSplitPoint("```")).toBe(0);
    });

    it("连续多个空行", () => {
      const content = "A\n\n\n\nB";
      const result = findSafeSplitPoint(content);
      expect(content.slice(0, result)).toBe("A\n\n\n");
      expect(content.slice(result)).toBe("\nB");
    });

    it("超长单行内容", () => {
      const longLine = "x".repeat(10000);
      const content = longLine + "\n\nend";
      const result = findSafeSplitPoint(content);
      expect(content.slice(0, result)).toBe(longLine + "\n");
      expect(content.slice(result)).toBe("\nend");
    });

    it("CRLF 换行符", () => {
      const content = "Hello\r\n\r\nWorld";
      const result = findSafeSplitPoint(content);
      expect(result).not.toBe(0);
    });
  });
});
