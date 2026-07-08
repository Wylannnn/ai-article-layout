import { describe, it, expect } from "vitest";
import { cleanHTMLOutput, extractJSON } from "../html-utils";

describe("cleanHTMLOutput", () => {
  it("passes through clean HTML unchanged", () => {
    const html = "<!DOCTYPE html>\n<html><body>hello</body></html>";
    expect(cleanHTMLOutput(html)).toBe(html);
  });

  it("strips ```html fence from beginning", () => {
    const raw = '```html\n<!DOCTYPE html>\n<html></html>';
    expect(cleanHTMLOutput(raw)).toBe("<!DOCTYPE html>\n<html></html>");
  });

  it("strips ```HTML (uppercase) fence", () => {
    const raw = '```HTML\n<div>test</div>';
    expect(cleanHTMLOutput(raw)).toBe("<div>test</div>");
  });

  it("strips bare ``` fence", () => {
    const raw = '```\n<!DOCTYPE html>\n<html></html>\n```';
    expect(cleanHTMLOutput(raw)).toBe("<!DOCTYPE html>\n<html></html>");
  });

  it("strips trailing ``` only", () => {
    const raw = "<!DOCTYPE html>\n<html></html>\n```";
    expect(cleanHTMLOutput(raw)).toBe("<!DOCTYPE html>\n<html></html>");
  });

  it("strips fence with leading whitespace", () => {
    const raw = '\n  ```html\n<!DOCTYPE html>\n<html></html>\n```';
    expect(cleanHTMLOutput(raw)).toBe("<!DOCTYPE html>\n<html></html>");
  });

  it("handles empty string", () => {
    expect(cleanHTMLOutput("")).toBe("");
  });

  it("handles whitespace-only string", () => {
    expect(cleanHTMLOutput("   \n  ")).toBe("");
  });
});

describe("extractJSON", () => {
  it("extracts simple JSON object", () => {
    const raw = '{"a":1,"b":2}';
    expect(extractJSON(raw)).toBe('{"a":1,"b":2}');
  });

  it("extracts JSON with surrounding chat text", () => {
    const raw = '好的，分析结果如下：\n{"title":"hello","category":"tech"}\n希望对你有帮助';
    expect(extractJSON(raw)).toBe('{"title":"hello","category":"tech"}');
  });

  it("extracts JSON from markdown code fence", () => {
    const raw = '```json\n{"key":"value"}\n```';
    expect(extractJSON(raw)).toBe('{"key":"value"}');
  });

  it("extracts nested JSON object", () => {
    const raw = '{"outer":{"inner":"value"},"arr":[1,{"nested":true}]}';
    expect(extractJSON(raw)).toBe(raw);
  });

  it("returns empty string when no braces found", () => {
    expect(extractJSON("hello world")).toBe("");
    expect(extractJSON("")).toBe("");
  });

  it("extracts JSON even with leading whitespace", () => {
    const raw = '   \n  {"key":"value"}';
    expect(extractJSON(raw)).toBe('{"key":"value"}');
  });
});
