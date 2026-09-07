import { describe, expect, test } from "bun:test"
import { createMarkedParser } from "../context/marked"

const parse = async (text: string) => String(await createMarkedParser({}).parse(text))
const spans = (html: string) => (html.match(/class="katex"/g) ?? []).length

describe("Inline dollar math ($...$)", () => {
  test("renders guarded single-dollar math inline", async () => {
    const html = await parse("where $\\phi$ is golden and $x^2$ grows")
    expect(spans(html)).toBe(2)
    expect(html).not.toContain("$\\phi$")
  })

  test("renders math that starts with a digit", async () => {
    expect(spans(await parse("$2x$ and $3y$ are roots"))).toBe(2)
  })

  test("keeps \\(...\\) working", async () => {
    expect(spans(await parse("inline \\(\\phi\\) still works"))).toBe(1)
  })

  test.each([
    "costs $93K to $307K per run",
    "fee $5 and tax $8",
    "from $1.50 to $2.25 today",
    "the $5-$8 range",
    "$5K-$10K plans",
    "Send $50 please and $60 thanks",
    "echo $HOME and $PATH in shell",
    "total 5$ and 6$",
    "lone $ sign here",
    "the \\$\\phi\\$ symbol stays literal",
    "a $10$-off coupon for $20$ items",
    "paid $5$ in cash and $8$ tax",
  ])("leaves money and shell text untouched: %s", async (text) => {
    expect(spans(await parse(text))).toBe(0)
  })

  test("mixes currency and math in one line", async () => {
    const html = await parse("cost $10M for $\\sigma$ only")
    expect(spans(html)).toBe(1)
    expect(html).toContain("$10M")
  })

  test("keeps $$ block math as display mode", async () => {
    const html = await parse("text\n\n$$\n\\phi = 1\n$$\n\nmore")
    expect(spans(html)).toBe(1)
    expect(html).toContain("katex-display")
  })

  test("keeps mid-line $$...$$ rendering", async () => {
    expect(spans(await parse("mid-line $$\\phi$$ double"))).toBe(1)
  })
})
