import React, { useMemo, useCallback } from 'react';
import { createEditor, Node, Text } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { pinyin } from 'pinyin-pro';

const isChineseCharacter = (char) => {
  return /[\u4E00-\u9FA5]/.test(char);
};

// Cache pinyin results to avoid recomputation and keep decorate deterministic.
const pinyinCache = new Map();
const getPinyinArray = (chunk) => {
  if (pinyinCache.has(chunk)) return pinyinCache.get(chunk);
  let arr = [];
  try {
    arr = pinyin(chunk, { type: 'array' });
  } catch (_) {
    arr = [];
  }
  if (!Array.isArray(arr) || arr.length !== chunk.length) {
    arr = Array.from(chunk, () => '');
  }
  pinyinCache.set(chunk, arr);
  return arr;
};

// Find consecutive Chinese character chunks and return per-character ranges.
// Each range wraps exactly one hanzi so Slate can split the text leaf into
// individual <ruby> leaves and <rt> pinyin stays aligned above each char.
const decorate = ([node, path]) => {
  const ranges = [];

  if (!Text.isText(node)) return ranges;
  const text = node.text;
  if (!text) return ranges;

  let chunkStart = null;
  for (let i = 0; i <= text.length; i++) {
    const isChinese = i < text.length ? isChineseCharacter(text[i]) : false;

    if (isChinese) {
      if (chunkStart === null) chunkStart = i;
    } else if (chunkStart !== null) {
      const chunkText = text.substring(chunkStart, i);
      const pinyinArray = getPinyinArray(chunkText);
      for (let j = 0; j < chunkText.length; j++) {
        ranges.push({
          isPinyinRuby: true,
          pinyinString: pinyinArray[j] || '',
          anchor: { path, offset: chunkStart + j },
          focus: { path, offset: chunkStart + j + 1 },
        });
      }
      chunkStart = null;
    }
  }
  return ranges;
};

const Leaf = ({ attributes, children, leaf }) => {
  let renderChildren = children;
  if (leaf.color) {
    renderChildren = <span style={{ color: leaf.color }}>{children}</span>;
  }

  if (leaf.isPinyinRuby) {
    // contentEditable={false} on <rt> is CRITICAL: Slate's toSlatePoint walks
    // textContent to compute offsets and explicitly removes [contenteditable=false]
    // nodes. Without this flag, the pinyin text gets counted into Slate offsets,
    // corrupting state on every input and eventually throwing "Cannot resolve a
    // DOM point from Slate point".
    return (
      <ruby {...attributes} className="pinyin-ruby">
        {renderChildren}
        <rt
          className="pinyin-rt"
          contentEditable={false}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {leaf.pinyinString}
        </rt>
      </ruby>
    );
  }
  return <span {...attributes}>{renderChildren}</span>;
};

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'paragraph':
      return <p {...attributes}>{children}</p>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const WordarinEditor = ({ editor, value, onChange, showPinyin, fontSize = 20 }) => {
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const renderElement = useCallback((props) => <Element {...props} />, []);

  return (
    <div className="editor-page print-container">
      <Slate editor={editor} initialValue={value} onChange={onChange}>
        <Editable
          className={`editor-content ${!showPinyin ? 'hide-pinyin' : ''}`}
          style={{ '--editor-font-size': `${fontSize}px` }}
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          decorate={decorate}
          placeholder="Comece a escrever em mandarim..."
          spellCheck={false}
        />
      </Slate>
    </div>
  );
};

export default WordarinEditor;
