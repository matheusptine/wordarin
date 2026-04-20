import React from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Printer, Save, Download, Play, Square, Repeat, Languages } from 'lucide-react';
import { Editor, Transforms } from 'slate';

const Toolbar = ({ editor, savedSelection, onPrint, onTxtExport, onPlay, isPlaying, speechRate, onSpeechRateChange, isLooping, onToggleLoop, showPinyin, onTogglePinyin }) => {
  const handleColorChange = (e) => {
    if (editor) {
      if (!editor.selection && savedSelection) {
        Transforms.select(editor, savedSelection);
      }
      if (editor.selection) {
        Editor.addMark(editor, 'color', e.target.value);
      }
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-button" onMouseDown={(e) => { e.preventDefault(); onPlay(); }} title={isPlaying ? "Stop Playback" : "Play Selected Text"}>
          {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button 
          className={`toolbar-button ${isLooping ? 'demo-active' : ''}`} 
          onMouseDown={(e) => { e.preventDefault(); onToggleLoop(); }} 
          title="Toggle Repeat / Loop Mode"
        >
          <Repeat size={18} />
        </button>
        <div className="slider-container" title={`Speech speed: ${speechRate}x`}>
          <input 
            type="range" 
            min="0.1" 
            max="2.0" 
            step="0.1" 
            value={speechRate} 
            onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
            className="speed-slider"
          />
          <span className="speed-label">{speechRate.toFixed(1)}x</span>
        </div>
        <button className="toolbar-button" title="Save to Local (Auto-saves as you type)">
          <Save size={18} />
        </button>
        <button className="toolbar-button" onClick={onPrint} title="Print / Save to PDF">
          <Printer size={18} />
        </button>
        <button className="toolbar-button" onClick={onTxtExport} title="Download as TXT">
          <Download size={18} />
        </button>
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        <button className="toolbar-button demo-active"><Bold size={18} /></button>
        <button className="toolbar-button"><Italic size={18} /></button>
        <button className="toolbar-button"><Underline size={18} /></button>
        <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }} title="Text Color">
          <input 
             type="color" 
             onChange={handleColorChange} 
             defaultValue="#1f2937"
             style={{ width: '24px', height: '28px', padding: 0, border: 'none', cursor: 'pointer', background: 'none' }}
          />
        </div>
        <button 
           className={`toolbar-button ${showPinyin ? 'demo-active' : ''}`} 
           onMouseDown={(e) => { e.preventDefault(); onTogglePinyin(); }}
           title="Toggle Pinyin Visibility"
           style={{ marginLeft: '12px' }}
        >
          <Languages size={18} />
        </button>
      </div>
      <div className="toolbar-divider" />
       <div className="toolbar-group">
        <button className="toolbar-button demo-active"><AlignLeft size={18} /></button>
        <button className="toolbar-button"><AlignCenter size={18} /></button>
        <button className="toolbar-button"><AlignRight size={18} /></button>
      </div>
      <div className="toolbar-title">
        Wordarin - Mandarin Editor
      </div>
    </div>
  );
};

export default Toolbar;
