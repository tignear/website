import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { d2Diagrams } from '../src/lib/markdown-d2.ts';

const renderer = await createSatteriMarkdownProcessor({
  mdastPlugins: [d2Diagrams()],
  shikiConfig: { theme: 'github-dark-default' },
});
const fileURL = new URL('./diagram-article.md', import.meta.url);
const flow = 'direction: right\na: 論理合成\nb: 配置配線\na -> b';
const fence = (source: string, caption = '') => `\`\`\`d2 ${caption}\n${source}\n\`\`\``;

test('renders Japanese diagrams with captions, light/dark themes, and normal code blocks', async () => {
  const result = await renderer.render([
    '# Example',
    fence(flow, '合成から配置配線まで'),
    '```js\nconsole.log("hello");\n```',
  ].join('\n\n'), { fileURL });

  assert.match(result.code, /<svg role="img"[^>]*viewBox=/);
  assert.match(result.code, /<figcaption>合成から配置配線まで<\/figcaption>/);
  assert.match(result.code, /論理合成/);
  assert.match(result.code, /配置配線/);
  assert.match(result.code, /prefers-color-scheme:\s*dark/);
  assert.match(result.code, /#7265ad/i);
  assert.match(result.code, /#b4a7e6/i);
  assert.match(result.code, /<pre[^>]*astro-code/);
  assert.doesNotMatch(result.code, /<script\b|<\?xml|language-d2/);
  assert.doesNotMatch(result.code, /\.(?:md|light-code|dark-code|shape|connection)\s*\{/);
});

test('keeps repeated diagrams and their SVG references independent', async () => {
  const result = await renderer.render(`${fence(flow)}\n\n${fence(flow)}`, { fileURL });
  const ids = [...result.code.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const titles = [...result.code.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1]);

  assert.equal(titles.length, 2);
  assert.equal(new Set(ids).size, ids.length);
  for (const title of titles) assert.ok(ids.includes(title));
  assert.doesNotMatch(result.code, /<figcaption>/);
});

test('keeps captions literal, including HTML and replacement-string characters', async () => {
  const caption = '入出力 <script>alert("x")</script> & $&';
  const result = await renderer.render(fence(flow, caption), { fileURL });

  assert.match(result.code, /<figcaption>入出力 &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; \$&amp;<\/figcaption>/);
  assert.match(result.code, /<title[^>]*>入出力 &lt;script&gt;/);
  assert.doesNotMatch(result.code, /<script\b/);
});

test('reports invalid D2 with the article location and can render after a failure', async () => {
  await assert.rejects(
    renderer.render(`# Example\n\n${fence('a: {')}`, { fileURL }),
    /D2 diagram could not be rendered \(tests\/diagram-article\.md:3\)/,
  );

  const result = await renderer.render(`> ${fence(flow).replaceAll('\n', '\n> ')}`, { fileURL });
  assert.match(result.code, /<blockquote>[\s\S]*<figure class="diagram">/);
});
