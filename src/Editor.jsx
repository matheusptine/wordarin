import React, { useMemo, useCallback } from 'react';
import { createEditor, Node, Text } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { pinyin } from 'pinyin-pro';

const isChineseCharacter = (char) => {
  return /[\u4E00-\u9FA5]/.test(char);
};

// Find consecutive Chinese character chunks and return their ranges
const decorate = ([node, path]) => {
  const ranges = [];

  if (Text.isText(node)) {
    const text = node.text;
    let chunkStart = null;

    for (let i = 0; i <= text.length; i++) {
        // Evaluate the character if we haven't reached the end
        const isChinese = i < text.length ? isChineseCharacter(text[i]) : false;
        
        if (isChinese) {
            if (chunkStart === null) chunkStart = i;
        } else {
             if (chunkStart !== null) {
                 // End of a Chinese chunk. Retrieve pinyin for the whole chunk.
                 const chunkText = text.substring(chunkStart, i);
                 // Get the pinyin array. E.g. ['hàn', 'yǔ']
                 const pinyinArray = pinyin(chunkText, { type: 'array' });
                 
                 // We will create individual character ranges so each `<ruby>` can align its `<rt>` perfectly
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
    return (
      <ruby {...attributes} className="pinyin-ruby">
        {renderChildren}
        <rt className="pinyin-rt" style={{ userSelect: 'none', pointerEvents: 'none' }}>{leaf.pinyinString}</rt>
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
