import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyToClipboard } from "@/utils/clipboard";

describe("copyToClipboard", () => {
  let originalClipboard: Clipboard | undefined;

  beforeEach(() => {
    originalClipboard = navigator.clipboard;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  /**
   * Clipboard API 成功时应直接使用，不触发 fallback
   */
  it("should use Clipboard API when available and succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    await copyToClipboard("test-text");
    expect(writeText).toHaveBeenCalledWith("test-text");
  });

  /**
   * Clipboard API 失败时应回退到 execCommand
   */
  it("should fallback to execCommand when Clipboard API fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException("NotAllowedError", "NotAllowedError"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    // jsdom 没有 execCommand，需要手动定义
    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    await copyToClipboard("fallback-text");

    expect(writeText).toHaveBeenCalledWith("fallback-text");
    expect(execCommandMock).toHaveBeenCalledWith("copy");
  });

  /**
   * 两者均失败时应抛出错误
   */
  it("should throw when both Clipboard API and execCommand fail", async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException("NotAllowedError", "NotAllowedError"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    document.execCommand = vi.fn().mockReturnValue(false);

    await expect(copyToClipboard("fail-text")).rejects.toThrow();
  });

  /**
   * fallback 创建的 textarea 应被从 DOM 中移除
   */
  it("should remove temporary textarea from DOM after fallback", async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException("NotAllowedError", "NotAllowedError"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    document.execCommand = vi.fn().mockReturnValue(true);
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    await copyToClipboard("cleanup-test");

    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
});
