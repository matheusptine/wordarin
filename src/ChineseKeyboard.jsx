import { useState, useEffect, useRef, useCallback } from 'react';

// ── Minimal pinyin → candidates lookup using the Web Chinese IME approach ──
// We use the browser's built-in composition events when available,
// and fall back to a curated pinyin dictionary for common syllables.

const PINYIN_MAP = {
  // Numbers
  'yi': ['一','以','已','亿','义','意','易','益','艺','宜'],
  'er': ['二','而','耳','儿','尔','饵'],
  'san': ['三','山','参','散','伞'],
  'si': ['四','死','斯','思','寺','似','私','丝'],
  'wu': ['五','吾','无','武','雾','午','屋'],
  'liu': ['六','留','流','刘','柳','溜'],
  'qi': ['七','气','期','其','奇','起','妻','器'],
  'ba': ['八','把','爸','吧','拔','霸'],
  'jiu': ['九','久','就','酒','救','旧','究'],
  'shi': ['十','是','时','事','识','使','市','实','食','始'],
  // Common words
  'ni': ['你','腻','泥','拟'],
  'hao': ['好','号','浩','豪'],
  'wo': ['我','窝','握','卧'],
  'ta': ['他','她','它','塔','踏'],
  'men': ['们','门','闷','们'],
  'nin': ['您'],
  'gui': ['贵','鬼','桂','规','归'],
  'xing': ['姓','行','性','星','幸','型','醒'],
  'jiao': ['叫','脚','角','教','觉','饺'],
  'shen': ['什','深','神','身','沈'],
  'me': ['么'],
  'ming': ['名','命','明','鸣'],
  'zi': ['字','子','自','资','紫'],
  'ye': ['也','夜','业','叶','爷'],
  'dou': ['都','豆','斗','逗'],
  'shuo': ['说','朔'],
  'han': ['汉','喊','汗','寒'],
  'yu': ['语','鱼','于','与','玉','雨','遇','育'],
  'zhi': ['只','知','之','制','至','志','治','致'],
  'lao': ['老','劳','捞','烙'],
  'jia': ['家','加','假','价','甲','嫁'],
  'xue': ['学','雪','血','穴'],
  'sheng': ['生','声','升','剩','胜','绳'],
  'bu': ['不','步','部','布','补','捕'],
  'shi_2': ['是','时','事','识'],
  'zai': ['再','在','载','灾'],
  'jian': ['见','建','间','键','检','件','简'],
  'xie': ['谢','些','写','斜','协','邪'],
  'qing': ['请','清','情','轻','青'],
  'duo': ['多','朵','躲','夺'],
  'shao': ['少','烧','绍','稍'],
  'le': ['了','乐','勒'],
  'de': ['的','地','得','德'],
  'ge': ['个','各','歌','隔','葛'],
  'zhe': ['这','着','者','哲','折'],
  'na': ['那','哪','拿','纳'],
  'you': ['有','又','友','由','游','邮','油','右'],
  'he': ['和','喝','何','河','荷','合','核'],
  'guo': ['国','过','果','锅','裹'],
  'ren': ['人','任','认','忍','仁'],
  'ma': ['吗','妈','马','麻','骂'],
  'ne': ['呢','那'],
  'xia': ['下','夏','峡','虾','吓'],
  'shang': ['上','商','赏','晌'],
  'zhong': ['中','种','重','众','终','忠'],
  'wen': ['问','文','闻','温','吻'],
  'gao': ['高','告','搞','稿'],
  'xing_2': ['兴','行'],
  'hua': ['话','花','画','化','华'],
  'kan': ['看','砍','刊'],
  'dian': ['电','点','店','典','殿','垫'],
  'hua_2': ['话','花'],
  'hao_2': ['号','好'],
  'ma_2': ['码','马'],
  'gei': ['给'],
  'fa': ['发','法','伐','罚'],
  'zuo': ['做','坐','作','座','左'],
  'jin': ['进','金','近','今','紧','禁'],
  'peng': ['朋','碰','烹'],
  'you_2': ['友','有','又'],
  'he_2': ['喝','和'],
  'cha': ['茶','查','差','叉','察'],
  'kai': ['开','凯','慨'],
  'gong': ['公','工','共','功','攻'],
  'si_2': ['司','思','丝','私'],
  'zao': ['早','造','糟','灶'],
  'dai': ['大','带','代','待'],
  'xiao': ['小','笑','校','消','效','孝'],
  'da': ['大','打','达','答'],
  'li': ['里','力','历','利','理','立','李','离'],
  'lai': ['来','莱','赖'],
  'qu': ['去','取','趣','区'],
  'yuan': ['元','员','原','院','远','圆','愿'],
  'lian': ['练','联','链','恋','连'],
  'xi': ['习','西','希','系','细','洗','息','喜'],
  'xian': ['现','先','显','县','限','线','献','嫌'],
  'zai_2': ['在','再'],
  'guan': ['关','官','观','管','惯','贯'],
  'nv': ['女'],
  'nü': ['女'],
  'peng_2': ['朋'],
  'ting': ['听','停','亭','挺'],
  'lü': ['旅','绿','律'],
  'lv': ['旅','绿','律'],
  'duo_2': ['多','朵'],
  'shui': ['水','谁','睡'],
  'kou': ['口','扣','寇'],
  'ke': ['可','课','客','克','渴','颗'],
  'le_2': ['乐','了'],
  'gen': ['跟','根','亘'],
  'bei': ['被','北','背','备','悲','贝'],
  'bing': ['病','并','冰','兵','饼'],
  'jing': ['京','经','精','静','净','镜','竞','境'],
  'an': ['安','按','案','暗','岸'],
  'ban': ['班','半','版','般','办'],
  'cai': ['才','菜','采','猜','财'],
  'chang': ['常','长','唱','场','厂','肠'],
  'cheng': ['成','城','程','乘','称','橙'],
  'chu': ['出','初','除','处','储'],
  'cong': ['从','聪','丛'],
  'dong': ['东','动','懂','冬','洞'],
  'fang': ['方','放','房','访','防','仿'],
  'fen': ['分','粉','份','奋','愤','纷'],
  'feng': ['风','封','丰','逢','蜂'],
  'fu': ['父','府','福','负','付','复','富','浮'],
  'gang': ['刚','港','钢','岗'],
  'gao_2': ['高','搞','告'],
  'gen_2': ['跟','根'],
  'gou': ['够','狗','沟','购'],
  'gu': ['古','故','顾','股','鼓','固'],
  'guang': ['光','广','逛'],
  'gui_2': ['贵','归','规'],
  'hai': ['还','海','害','孩'],
  'hang': ['行','航','杭'],
  'hei': ['黑','嘿'],
  'hen': ['很','恨','狠'],
  'hong': ['红','洪','宏','轰'],
  'hou': ['后','候','厚','猴'],
  'hu': ['和','互','户','湖','虎','护','胡'],
  'hua_3': ['花','话','画','化'],
  'huan': ['还','换','环','患','欢'],
  'huang': ['黄','皇','荒','晃'],
  'huo': ['或','活','火','货','获'],
  'ji': ['机','计','级','集','技','际','记','几','极','即'],
  'jie': ['结','解','接','界','街','节','姐','借','届'],
  'kai_2': ['开','凯'],
  'kong': ['空','控','恐','孔'],
  'ku': ['苦','哭','库','裤'],
  'kuai': ['快','块','会'],
  'kun': ['困','昆'],
  'la': ['拉','啦','辣'],
  'lang': ['浪','朗','郎'],
  'lao_2': ['老','劳'],
  'lin': ['林','临','邻','令'],
  'ling': ['零','令','另','领','龄'],
  'long': ['龙','弄','隆','笼'],
  'lou': ['楼','漏','搂'],
  'lu': ['路','录','陆','鹿','露'],
  'lun': ['论','轮','伦'],
  'luo': ['落','洛','罗','骆'],
  'mao': ['毛','帽','猫','贸','冒'],
  'mei': ['没','每','美','妹','煤','梅'],
  'mian': ['面','棉','免','眠','绵'],
  'miao': ['秒','庙','苗','妙'],
  'min': ['民','敏','皿'],
  'mo': ['么','末','默','墨','摸'],
  'mu': ['木','目','母','幕','牧','墓'],
  'nai': ['乃','奶','耐','奈'],
  'nao': ['脑','闹','恼'],
  'nei': ['内','哪'],
  'neng': ['能'],
  'nian': ['年','念','粘'],
  'niao': ['鸟','尿'],
  'nin_2': ['您'],
  'nong': ['农','弄'],
  'nu': ['努','怒','奴'],
  'nuan': ['暖'],
  'pai': ['牌','拍','派','排'],
  'pan': ['判','盘','盼','攀'],
  'pao': ['跑','炮','泡','袍'],
  'pi': ['皮','批','比','啤','脾'],
  'pian': ['片','篇','偏','骗'],
  'pin': ['品','拼'],
  'ping': ['平','瓶','屏','评'],
  'po': ['破','坡','泊','婆'],
  'pu': ['普','铺','葡','蒲'],
  'ran': ['然','染'],
  'rang': ['让','嚷'],
  'rao': ['绕','扰','饶'],
  'ri': ['日'],
  'rong': ['容','融','荣','绒'],
  'rou': ['肉','柔'],
  'ru': ['如','入','乳','儒'],
  'ruan': ['软','阮'],
  'run': ['润'],
  'suo': ['所','锁','索','缩'],
  'tai': ['太','台','态','抬','泰'],
  'tan': ['谈','探','贪','弹','叹'],
  'tang': ['唐','堂','糖','趟','汤'],
  'tao': ['套','陶','逃','桃'],
  'tian': ['天','田','填','甜'],
  'tiao': ['条','跳','调'],
  'tie': ['铁','贴'],
  'tong': ['同','通','痛','童','统'],
  'tou': ['投','头','偷'],
  'tu': ['图','土','兔','涂'],
  'tuan': ['团','断'],
  'tui': ['推','退','腿'],
  'tun': ['吞','屯'],
  'tuo': ['拖','脱','妥','椭'],
  'wai': ['外','歪'],
  'wan': ['万','完','晚','碗','玩','弯'],
  'wang': ['王','望','往','网','忘','旺'],
  'wei': ['为','位','围','危','尾','胃','维','味'],
  'wo_2': ['我','窝','握'],
  'xuan': ['选','悬','旋','玄'],
  'xue_2': ['学','雪'],
  'xun': ['训','询','寻','巡'],
  'yan': ['言','眼','颜','研','延','演','严','烟','验','宴'],
  'yang': ['样','阳','扬','洋','养','仰'],
  'yao': ['要','药','腰','摇','邀','咬'],
  'yin': ['因','音','引','银','印','应','饮','阴'],
  'ying': ['应','影','英','迎','营','映','硬'],
  'yong': ['用','永','勇','涌','拥','泳'],
  'you_3': ['有','又','友','游','邮','由','油'],
  'yuan_2': ['元','员','原','远','院','圆'],
  'yue': ['月','越','约','岳','阅','悦'],
  'yun': ['运','云','晕','允'],
  'za': ['杂','砸'],
  'zang': ['脏','葬','藏'],
  'ze': ['则','责','择'],
  'zen': ['怎'],
  'zeng': ['增','曾','赠'],
  'zhan': ['战','站','展','沾','占'],
  'zhang': ['张','长','章','涨','掌','障'],
  'zhao': ['找','照','着','招','兆'],
  'zhen': ['真','针','阵','珍','镇','震'],
  'zheng': ['正','整','政','争','证','征'],
  'zhou': ['周','州','洲','粥','皱'],
  'zhu': ['主','住','注','著','祝','助','猪','珠'],
  'zhuan': ['转','专','赚','砖'],
  'zhuang': ['装','状','庄','撞'],
  'zhui': ['追','坠'],
  'zhun': ['准'],
  'zhuo': ['桌','捉','卓','浊'],
  'zong': ['总','种','综','纵'],
  'zou': ['走','奏'],
  'zu': ['组','足','族','租','阻'],
  'zuan': ['钻'],
  'zui': ['最','嘴','罪'],
  'zun': ['尊','遵'],
};

// Normalize pinyin input (handle v→ü substitution)
function normalizePinyin(input) {
  return input.toLowerCase()
    .replace(/v/g, 'ü')
    .replace(/uu/g, 'ü');
}

// Get candidates for a pinyin string
function getCandidates(pinyin) {
  const norm = normalizePinyin(pinyin);
  // Direct lookup
  let candidates = PINYIN_MAP[norm] || [];
  // Also try with alternate keys
  if (!candidates.length) {
    // Try all keys that start with this pinyin
    const prefix = norm;
    candidates = Object.entries(PINYIN_MAP)
      .filter(([k]) => k.startsWith(prefix) || k.replace(/_\d+$/, '') === prefix)
      .flatMap(([, v]) => v);
    // Remove duplicates
    candidates = [...new Set(candidates)];
  }
  return candidates.slice(0, 12);
}

// ── Virtual keyboard layout ─────────────────────────────────────────────────
const ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['SHIFT','z','x','c','v','b','n','m','⌫'],
];

const TONE_KEYS = ['ā','á','ǎ','à','ē','é','ě','è','ī','í','ǐ','ì','ō','ó','ǒ','ò','ū','ú','ǔ','ù','ǖ','ǘ','ǚ','ǜ'];

export default function ChineseKeyboard({ onInsert, visible, onClose }) {
  const [pinyinBuffer, setPinyinBuffer] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [shifted, setShifted] = useState(false);
  const [tab, setTab] = useState('pinyin'); // 'pinyin' | 'tones' | 'symbols'

  useEffect(() => {
    if (pinyinBuffer.length > 0) {
      setCandidates(getCandidates(pinyinBuffer));
    } else {
      setCandidates([]);
    }
  }, [pinyinBuffer]);

  const pressKey = useCallback((key) => {
    if (key === '⌫') {
      setPinyinBuffer(b => b.slice(0, -1));
    } else if (key === 'SHIFT') {
      setShifted(s => !s);
    } else if (key === ' ') {
      // Select first candidate or insert space
      if (candidates.length > 0) {
        onInsert(candidates[0]);
        setPinyinBuffer('');
        setCandidates([]);
      } else {
        onInsert(' ');
      }
    } else {
      const char = shifted ? key.toUpperCase() : key;
      // If it's a letter, add to pinyin buffer
      if (/[a-züüüü]/i.test(char) || char === 'v') {
        setPinyinBuffer(b => b + char.toLowerCase());
      } else {
        onInsert(char);
      }
    }
  }, [candidates, onInsert, shifted]);

  const selectCandidate = useCallback((char) => {
    onInsert(char);
    setPinyinBuffer('');
    setCandidates([]);
  }, [onInsert]);

  const clearBuffer = () => {
    setPinyinBuffer('');
    setCandidates([]);
  };

  if (!visible) return null;

  return (
    <div className="cjk-keyboard">
      <div className="cjk-header">
        <div className="cjk-tabs">
          <button className={`cjk-tab ${tab === 'pinyin' ? 'active' : ''}`} onClick={() => setTab('pinyin')}>拼音</button>
          <button className={`cjk-tab ${tab === 'tones' ? 'active' : ''}`} onClick={() => setTab('tones')}>声调</button>
          <button className={`cjk-tab ${tab === 'symbols' ? 'active' : ''}`} onClick={() => setTab('symbols')}>符号</button>
        </div>
        <button className="cjk-close" onClick={onClose}>✕</button>
      </div>

      {/* Pinyin buffer + candidates */}
      <div className="cjk-buffer-row">
        <div className="cjk-buffer">
          {pinyinBuffer || <span className="cjk-buffer-placeholder">Digite pinyin...</span>}
          {pinyinBuffer && <button className="cjk-clear" onClick={clearBuffer}>✕</button>}
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="cjk-candidates">
          {candidates.map((c, i) => (
            <button key={i} className="cjk-candidate" onClick={() => selectCandidate(c)}>
              <span className="cjk-cand-num">{i + 1}</span>
              {c}
            </button>
          ))}
        </div>
      )}

      {tab === 'pinyin' && (
        <div className="cjk-keys">
          {ROWS.map((row, ri) => (
            <div key={ri} className="cjk-row">
              {row.map((key) => (
                <button
                  key={key}
                  className={`cjk-key ${key === 'SHIFT' ? 'cjk-key-wide' + (shifted ? ' active' : '') : ''} ${key === '⌫' ? 'cjk-key-wide' : ''}`}
                  onClick={() => pressKey(key)}
                >
                  {key === 'SHIFT' ? '⇧' : shifted && key.length === 1 ? key.toUpperCase() : key}
                </button>
              ))}
            </div>
          ))}
          <div className="cjk-row cjk-bottom-row">
            <button className="cjk-key cjk-key-v" onClick={() => pressKey('v')} title="ü (v)">ü/v</button>
            <button className="cjk-key cjk-key-space" onClick={() => pressKey(' ')}>
              {candidates.length > 0 ? `▶ ${candidates[0]}` : '空格'}
            </button>
            <button className="cjk-key cjk-key-enter" onClick={() => { onInsert('\n'); }}>↵</button>
          </div>
        </div>
      )}

      {tab === 'tones' && (
        <div className="cjk-tone-grid">
          <p className="cjk-tone-hint">Clique para inserir vogal com tom</p>
          <div className="cjk-tone-rows">
            {[
              { label: '1.º tom', chars: ['ā','ē','ī','ō','ū','ǖ'] },
              { label: '2.º tom', chars: ['á','é','í','ó','ú','ǘ'] },
              { label: '3.º tom', chars: ['ǎ','ě','ǐ','ǒ','ǔ','ǚ'] },
              { label: '4.º tom', chars: ['à','è','ì','ò','ù','ǜ'] },
            ].map(row => (
              <div key={row.label} className="cjk-tone-row">
                <span className="cjk-tone-label">{row.label}</span>
                {row.chars.map(c => (
                  <button key={c} className="cjk-tone-btn" onClick={() => onInsert(c)}>{c}</button>
                ))}
              </div>
            ))}
          </div>
          <div className="cjk-tone-extra">
            <span className="cjk-tone-label">Neutro</span>
            {['a','e','i','o','u','ü'].map(c => (
              <button key={c} className="cjk-tone-btn" onClick={() => onInsert(c)}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {tab === 'symbols' && (
        <div className="cjk-symbols-grid">
          {['，','。','！','？','、','；','：','"','"','《','》','（','）','【','】','……','—','～',
            '·','〈','〉','『','』','〔','〕','｛','｝','「','」','〖','〗'].map(s => (
            <button key={s} className="cjk-symbol-btn" onClick={() => onInsert(s)}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
