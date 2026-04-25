import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { pinyin } from 'pinyin-pro';

// ── Pinyin → hanzi dictionary ────────────────────────────────────────────────
const DICT = {
  'a':['啊','阿'],
  'ai':['爱','哎','艾','癌','碍','挨','唉','矮'],
  'an':['安','按','案','暗','岸','俺'],
  'ang':['昂'],
  'ao':['澳','傲','奥','袄','熬'],
  'ba':['八','把','爸','吧','拔','霸','罢','巴'],
  'bai':['白','百','拜','败','摆','柏'],
  'ban':['班','半','版','般','办','搬','板','扮'],
  'bang':['帮','棒','邦','绑','磅'],
  'bao':['包','报','宝','保','抱','爆','薄','饱'],
  'bei':['被','北','背','备','悲','贝','杯','倍'],
  'ben':['本','奔','笨'],
  'beng':['崩','绷','泵'],
  'bi':['比','必','笔','闭','鼻','壁','毕','避','逼','币'],
  'bian':['变','边','便','遍','辩','编','鞭'],
  'biao':['表','标','彪'],
  'bie':['别','憋','瘪'],
  'bin':['宾','彬','濒'],
  'bing':['病','并','冰','兵','饼','丙'],
  'bo':['波','博','薄','伯','播','勃','拨'],
  'bu':['不','步','部','布','补','捕','哺'],
  'ca':['擦'],
  'cai':['才','菜','采','猜','财','彩','踩'],
  'can':['参','残','惨','蚕'],
  'cang':['藏','苍','仓'],
  'cao':['草','曹','操','槽'],
  'ce':['测','策','侧'],
  'ceng':['层','曾'],
  'cha':['茶','查','差','叉','察','插','拆'],
  'chai':['柴','拆','钗'],
  'chan':['产','禅','颤','铲','缠'],
  'chang':['常','长','唱','场','厂','肠','尝','偿'],
  'chao':['超','朝','炒','潮','钞'],
  'che':['车','扯','彻'],
  'chen':['沉','陈','晨','尘','衬','趁'],
  'cheng':['成','城','程','乘','称','橙','承','诚'],
  'chi':['吃','池','持','迟','尺','翅','耻'],
  'chong':['冲','虫','宠','崇','充'],
  'chou':['筹','仇','愁','丑','抽'],
  'chu':['出','初','除','处','储','厨','触','畜'],
  'chuai':['揣','踹'],
  'chuan':['传','船','穿','串','川'],
  'chuang':['创','床','窗','闯'],
  'chui':['吹','垂','锤'],
  'chun':['春','纯','唇','蠢'],
  'chuo':['戳','绰'],
  'ci':['词','次','此','刺','磁','慈','辞'],
  'cong':['从','聪','丛','匆'],
  'cou':['凑'],
  'cu':['粗','促','醋','簇'],
  'cuan':['蹿','篡'],
  'cui':['催','脆','翠','粹'],
  'cun':['村','存','寸'],
  'cuo':['错','措','挫','搓'],
  'da':['大','打','达','答','搭'],
  'dai':['带','代','待','贷','袋','歹','呆','戴'],
  'dan':['但','单','担','弹','淡','蛋','胆'],
  'dang':['当','党','档','挡'],
  'dao':['到','道','导','刀','倒','盗','稻'],
  'de':['的','地','得','德'],
  'dei':['得'],
  'deng':['等','灯','邓','登','凳'],
  'di':['地','第','底','低','弟','帝','敌','的','递','滴'],
  'dian':['点','电','店','典','殿','垫','碘','掂'],
  'diao':['调','掉','吊','雕','钓'],
  'die':['跌','蝶','碟','爹'],
  'ding':['定','顶','钉','订','丁','盯'],
  'diu':['丢'],
  'dong':['东','动','懂','冬','洞','董','栋'],
  'dou':['都','豆','斗','逗','抖','陡'],
  'du':['读','度','独','都','堵','肚','渡','毒'],
  'duan':['断','段','端','短','锻'],
  'dui':['对','队','堆'],
  'dun':['顿','吨','蹲','敦','盹'],
  'duo':['多','朵','躲','夺','堕','哆'],
  'e':['额','饿','恶','鹅','俄','厄'],
  'en':['恩'],
  'er':['二','而','耳','儿','尔'],
  'fa':['发','法','伐','罚','乏'],
  'fan':['反','饭','范','凡','烦','翻','繁','犯','贩'],
  'fang':['方','放','房','访','防','仿','纺','芳'],
  'fei':['非','飞','费','废','肥','菲','肺','匪'],
  'fen':['分','粉','份','奋','愤','纷','坟','焚'],
  'feng':['风','封','丰','逢','蜂','峰','缝'],
  'fo':['佛'],
  'fou':['否','缶'],
  'fu':['父','府','福','负','付','复','富','浮','服','符','幅','腐'],
  'ga':['噶','尬'],
  'gai':['改','该','盖','概'],
  'gan':['干','感','敢','赶','甘','肝','赣','尴'],
  'gang':['刚','港','钢','岗','纲'],
  'gao':['高','搞','告','稿','膏'],
  'ge':['个','各','歌','隔','葛','格','革','搁'],
  'gei':['给'],
  'gen':['跟','根','亘'],
  'geng':['更','耕','梗'],
  'gong':['公','工','共','功','攻','供','拱','贡'],
  'gou':['够','狗','沟','购','钩'],
  'gu':['古','故','顾','股','鼓','固','骨','孤','谷','估'],
  'gua':['瓜','挂','刮','卦'],
  'guai':['怪','乖','拐'],
  'guan':['关','官','观','管','惯','贯','馆'],
  'guang':['光','广','逛'],
  'gui':['贵','鬼','桂','规','归','柜','轨','跪'],
  'gun':['滚','棍','辊'],
  'guo':['国','过','果','锅','裹'],
  'ha':['哈'],
  'hai':['还','海','害','孩','骇'],
  'han':['汉','喊','汗','寒','含','韩','旱','憾'],
  'hang':['行','航','杭'],
  'hao':['好','号','浩','豪','耗','毫','好'],
  'he':['和','喝','何','河','荷','合','核','贺','呵'],
  'hei':['黑','嘿'],
  'hen':['很','恨','狠'],
  'heng':['横','恒','衡'],
  'hong':['红','洪','宏','轰','哄'],
  'hou':['后','候','厚','猴','喉'],
  'hu':['和','互','户','湖','虎','护','胡','花','呼','壶'],
  'hua':['花','话','画','化','华','滑','划'],
  'huai':['坏','怀','槐'],
  'huan':['还','换','环','患','欢','缓','幻','唤'],
  'huang':['黄','皇','荒','晃','慌','谎'],
  'hui':['会','回','惠','慧','汇','毁','灰','悔','恢'],
  'hun':['婚','混','浑','魂'],
  'huo':['或','活','火','货','获','伙','霍'],
  'ji':['机','计','级','集','技','际','记','几','极','即','急','鸡','基','己','积'],
  'jia':['家','加','假','价','甲','嫁','架','驾','夹'],
  'jian':['见','建','间','键','检','件','简','减','坚','监','肩','舰','剑'],
  'jiang':['江','将','讲','降','奖','酱','疆'],
  'jiao':['叫','脚','角','教','觉','饺','交','骄','娇','搅'],
  'jie':['结','解','接','界','街','节','姐','借','届','揭','截'],
  'jin':['进','金','近','今','紧','禁','仅','尽','津','锦'],
  'jing':['京','经','精','静','净','镜','竞','境','警','敬','景','晶'],
  'jiong':['炯'],
  'jiu':['九','久','就','酒','救','旧','究','揪'],
  'ju':['局','举','句','居','具','聚','剧','据','距','拒'],
  'juan':['卷','捐','眷','绢'],
  'jue':['决','绝','觉','掘','爵','崛'],
  'jun':['军','均','俊','君','菌'],
  'ka':['卡','咖'],
  'kai':['开','凯','慨'],
  'kan':['看','砍','刊','坎','侃'],
  'kang':['抗','康','炕','慷'],
  'kao':['考','靠','烤'],
  'ke':['可','课','客','克','渴','颗','棵','咳','科','壳'],
  'ken':['肯','垦'],
  'keng':['坑'],
  'kong':['空','控','恐','孔'],
  'kou':['口','扣','寇','叩'],
  'ku':['苦','哭','库','裤','枯','酷'],
  'kuai':['快','块','筷'],
  'kuan':['宽','款'],
  'kuang':['狂','矿','况','框','匡'],
  'kui':['亏','愧','馈','葵'],
  'kun':['困','昆','捆'],
  'kuo':['扩','括','阔'],
  'la':['拉','啦','辣','蜡','垃'],
  'lai':['来','莱','赖','徕'],
  'lan':['蓝','懒','滥','篮','览','烂'],
  'lang':['浪','朗','郎','廊'],
  'lao':['老','劳','捞','烙','牢','涝'],
  'le':['了','乐','勒','咯'],
  'lei':['类','泪','雷','累','擂'],
  'leng':['冷','愣'],
  'li':['里','力','历','利','理','立','李','离','礼','例','厉','粒','莉'],
  'lian':['练','联','链','恋','连','廉','脸','炼'],
  'liang':['两','量','亮','良','凉','粮','谅'],
  'liao':['了','聊','疗','辽','料','撩'],
  'lie':['列','烈','裂','劣','猎'],
  'lin':['林','临','邻','令','淋','磷'],
  'ling':['零','令','另','领','龄','铃','灵','凌'],
  'liu':['六','留','流','刘','柳','溜','硫'],
  'long':['龙','弄','隆','笼','拢'],
  'lou':['楼','漏','搂','陋'],
  'lu':['路','录','陆','鹿','露','卢','芦','颅'],
  'luan':['乱','卵','峦'],
  'lun':['论','轮','伦','仑'],
  'luo':['落','洛','罗','骆','络','螺'],
  'lv':['旅','绿','律','虑','铝','驴'],
  'lü':['旅','绿','律','虑','铝'],
  'ma':['吗','妈','马','麻','骂','嘛'],
  'mai':['买','卖','麦','脉','埋'],
  'man':['满','慢','漫','曼','蔓'],
  'mang':['忙','芒','盲','茫'],
  'mao':['毛','帽','猫','贸','冒','锚','茅'],
  'me':['么'],
  'mei':['没','每','美','妹','煤','梅','媒','眉'],
  'men':['们','门','闷'],
  'meng':['梦','蒙','猛','盟','孟'],
  'mi':['米','密','秘','迷','谜','觅','弥'],
  'mian':['面','棉','免','眠','绵','勉'],
  'miao':['秒','庙','苗','妙','描'],
  'mie':['灭','蔑'],
  'min':['民','敏','皿','闽'],
  'ming':['名','命','明','鸣','冥'],
  'miu':['谬'],
  'mo':['么','末','默','墨','摸','模','漠','魔'],
  'mou':['某','谋','牟'],
  'mu':['木','目','母','幕','牧','墓','亩','睦'],
  'na':['那','哪','拿','纳'],
  'nai':['乃','奶','耐','奈'],
  'nan':['南','男','难','楠'],
  'nao':['脑','闹','恼','挠'],
  'ne':['呢','那'],
  'nei':['内','哪'],
  'nen':['嫩'],
  'neng':['能'],
  'ni':['你','腻','泥','拟','逆','倪','尼'],
  'nian':['年','念','粘','捻'],
  'niang':['娘','酿'],
  'niao':['鸟','尿'],
  'nie':['捏','镊','蹑'],
  'nin':['您'],
  'ning':['宁','凝','拧','柠'],
  'niu':['牛','扭','纽'],
  'nong':['农','弄','脓'],
  'nu':['努','怒','奴'],
  'nuan':['暖'],
  'nv':['女'],
  'nü':['女'],
  'nuo':['诺','挪','懦'],
  'o':['哦','噢'],
  'ou':['欧','偶','呕','藕'],
  'pa':['怕','爬','扒','趴'],
  'pai':['牌','拍','派','排','徘'],
  'pan':['判','盘','盼','攀','叛'],
  'pang':['胖','旁','磅','膀'],
  'pao':['跑','炮','泡','袍','抛'],
  'pei':['配','陪','培','赔','佩'],
  'pen':['盆','喷'],
  'peng':['朋','碰','烹','膨','鹏'],
  'pi':['皮','批','啤','脾','匹','劈','琵'],
  'pian':['片','篇','偏','骗','翩'],
  'piao':['漂','飘','票','瞟'],
  'pie':['撇'],
  'pin':['品','拼','贫','频'],
  'ping':['平','瓶','屏','评','乒'],
  'po':['破','坡','泊','婆','迫'],
  'pou':['剖'],
  'pu':['普','铺','葡','蒲','朴','扑','瀑'],
  'qi':['七','气','期','其','奇','起','妻','器','骑','棋','旗','齐','岂'],
  'qia':['恰','卡'],
  'qian':['千','前','钱','欠','浅','牵','谦','签','潜','遣'],
  'qiang':['强','墙','枪','抢','腔'],
  'qiao':['桥','巧','瞧','俏','翘','敲'],
  'qie':['切','且','窃','茄','惬'],
  'qin':['亲','琴','勤','侵','禽','寝'],
  'qing':['请','清','情','轻','青','庆','倾','氢'],
  'qiong':['穷','琼'],
  'qiu':['球','秋','求','丘','囚'],
  'qu':['去','取','趣','区','渠','曲','娶','驱'],
  'quan':['全','权','圈','劝','泉','券','拳'],
  'que':['确','却','缺','瘸','雀'],
  'qun':['群','裙'],
  'ran':['然','染','燃'],
  'rang':['让','嚷','壤'],
  'rao':['绕','扰','饶'],
  're':['热','惹'],
  'ren':['人','任','认','忍','仁','韧'],
  'reng':['仍','扔'],
  'ri':['日'],
  'rong':['容','融','荣','绒','溶'],
  'rou':['肉','柔','揉'],
  'ru':['如','入','乳','儒','辱'],
  'ruan':['软','阮'],
  'rui':['锐','瑞','蕊'],
  'run':['润'],
  'ruo':['若','弱','偌'],
  'sa':['洒','撒','萨'],
  'sai':['赛','塞','腮'],
  'san':['三','山','参','散','伞'],
  'sang':['桑','嗓','丧'],
  'sao':['扫','嫂','搔'],
  'se':['色','塞','涩'],
  'sen':['森'],
  'sha':['沙','杀','傻','啥','纱'],
  'shai':['晒','筛'],
  'shan':['山','闪','善','单','汕','珊','鳝'],
  'shang':['上','商','赏','晌','裳'],
  'shao':['少','烧','绍','稍','勺','哨'],
  'she':['舍','蛇','射','社','设','摄'],
  'shen':['什','深','神','身','沈','审','甚','慎','绅'],
  'sheng':['生','声','升','剩','胜','绳','省','圣'],
  'shi':['是','时','事','识','使','市','实','食','始','诗','史','士','势','室','式','石','视'],
  'shou':['手','受','首','守','寿','收','售','瘦'],
  'shu':['书','树','数','输','熟','束','蜀','鼠','竖'],
  'shua':['刷','耍'],
  'shuai':['帅','衰','甩','摔'],
  'shuan':['拴','涮'],
  'shuang':['双','霜','爽'],
  'shui':['水','谁','睡'],
  'shun':['顺','瞬'],
  'shuo':['说','朔','硕'],
  'si':['四','死','斯','思','寺','似','私','丝','撕','嘶'],
  'song':['送','松','宋','颂','耸'],
  'sou':['搜','艘'],
  'su':['速','素','苏','宿','塑','诉'],
  'suan':['算','酸','蒜'],
  'sui':['虽','随','岁','碎','遂'],
  'sun':['孙','损','笋'],
  'suo':['所','锁','索','缩','琐'],
  'ta':['他','她','它','塔','踏','榻'],
  'tai':['太','台','态','抬','泰','胎'],
  'tan':['谈','探','贪','弹','叹','滩','毯','炭'],
  'tang':['唐','堂','糖','趟','汤','躺','烫'],
  'tao':['套','陶','逃','桃','淘','讨'],
  'te':['特'],
  'teng':['腾','疼','藤'],
  'ti':['体','题','提','踢','替','梯','剃'],
  'tian':['天','田','填','甜','添'],
  'tiao':['条','跳','调','挑','眺'],
  'tie':['铁','贴'],
  'ting':['听','停','亭','挺','厅','廷'],
  'tong':['同','通','痛','童','统','铜','桶'],
  'tou':['投','头','偷','透','骰'],
  'tu':['图','土','兔','涂','吐','突','秃'],
  'tuan':['团','断'],
  'tui':['推','退','腿','颓'],
  'tun':['吞','屯','臀'],
  'tuo':['拖','脱','妥','椭','托','驼'],
  'wa':['娃','挖','瓦','袜'],
  'wai':['外','歪'],
  'wan':['万','完','晚','碗','玩','弯','湾','顽'],
  'wang':['王','望','往','网','忘','旺'],
  'wei':['为','位','围','危','尾','胃','维','味','卫','威','微','违','伪'],
  'wen':['问','文','闻','温','吻','稳','蚊'],
  'weng':['翁','嗡'],
  'wo':['我','窝','握','卧','蜗'],
  'wu':['五','吾','无','武','雾','午','屋','误','污','舞','务'],
  'xi':['习','西','希','系','细','洗','息','喜','席','惜','昔','析','稀','悉'],
  'xia':['下','夏','峡','虾','吓','霞','侠'],
  'xian':['现','先','显','县','限','线','献','嫌','仙','鲜','险','闲','咸'],
  'xiang':['想','向','象','像','响','香','详','享','乡','箱','相','项'],
  'xiao':['小','笑','校','消','效','孝','削','晓','肖'],
  'xie':['谢','些','写','斜','协','邪','械','歇','鞋','蟹'],
  'xin':['新','心','信','辛','欣','薪','忻'],
  'xing':['行','姓','性','星','幸','型','醒','兴','杏'],
  'xiong':['熊','雄','胸'],
  'xiu':['修','秀','绣','锈','休','羞'],
  'xu':['需','许','续','序','虚','须','徐','叙'],
  'xuan':['选','悬','旋','玄','宣','轩','眩'],
  'xue':['学','雪','血','穴','靴'],
  'xun':['训','询','寻','巡','讯','循','勋'],
  'ya':['牙','压','呀','鸭','雅','亚','哑'],
  'yan':['言','眼','颜','研','延','演','严','烟','验','宴','燕','艳','厌','掩'],
  'yang':['样','阳','扬','洋','养','仰','央','秧','杨'],
  'yao':['要','药','腰','摇','邀','咬','谣','窑'],
  'ye':['也','夜','业','叶','爷','野','页','耶'],
  'yi':['一','以','已','亿','义','意','易','益','艺','宜','移','疑','椅','译','依','遗','医','仪','亦'],
  'yin':['因','音','引','银','印','应','饮','阴','隐','吟','姻','寅'],
  'ying':['应','影','英','迎','营','映','硬','赢','鹰'],
  'yong':['用','永','勇','涌','拥','泳','庸','踊'],
  'you':['有','又','友','由','游','邮','油','右','幼','优','诱','忧'],
  'yu':['语','鱼','于','与','玉','雨','遇','育','宇','预','愉','域','狱','浴','御'],
  'yuan':['元','员','原','院','远','圆','愿','源','缘','援','园','怨'],
  'yue':['月','越','约','岳','阅','悦','跃'],
  'yun':['运','云','晕','允','孕','韵','匀'],
  'za':['杂','砸','咋'],
  'zai':['再','在','载','灾','宰'],
  'zan':['咱','暂','赞','攒'],
  'zang':['脏','葬','藏','赃'],
  'zao':['早','造','糟','灶','枣','燥','噪'],
  'ze':['则','责','择','泽'],
  'zen':['怎'],
  'zeng':['增','曾','赠'],
  'zha':['扎','炸','闸','渣','榨'],
  'zhai':['摘','窄','斋','债'],
  'zhan':['战','站','展','沾','占','斩','盏','崭'],
  'zhang':['张','长','章','涨','掌','障','账','丈'],
  'zhao':['找','照','着','招','兆','沼','罩'],
  'zhe':['这','着','者','哲','折','遮','蔗'],
  'zhen':['真','针','阵','珍','镇','震','枕','诊','贞','侦'],
  'zheng':['正','整','政','争','证','征','蒸','挣','睁'],
  'zhi':['只','知','之','制','至','志','治','致','直','植','职','指','止','值','纸','质'],
  'zhong':['中','种','重','众','终','忠','钟','肿'],
  'zhou':['周','州','洲','粥','皱','轴','肘','咒'],
  'zhu':['主','住','注','著','祝','助','猪','珠','竹','煮','株','逐'],
  'zhuan':['转','专','赚','砖','撰'],
  'zhuang':['装','状','庄','撞','壮'],
  'zhui':['追','坠','锥'],
  'zhun':['准'],
  'zhuo':['桌','捉','卓','浊','灼','酌'],
  'zi':['字','子','自','资','紫','仔','姿','滋','综'],
  'zong':['总','种','综','纵','棕','宗'],
  'zou':['走','奏','揍'],
  'zu':['组','足','族','租','阻','祖'],
  'zuan':['钻'],
  'zui':['最','嘴','罪','醉'],
  'zun':['尊','遵'],
  'zuo':['做','坐','作','座','左','佐','昨'],
};

// ── Multi-syllable word dictionary (pinyin concatenated → hanzi words) ────────
const WORDS = {
  // Greetings & basic phrases
  'nihao':['你好'],'zaijian':['再见'],'xiexie':['谢谢'],
  'duibuqi':['对不起'],'meiguanxi':['没关系'],'bukeqi':['不客气'],
  'qingwen':['请问'],'guixing':['贵姓'],'mingzi':['名字'],
  'ninhao':['您好'],'zaoshang':['早上'],'wanshang':['晚上'],
  'zaoshanghao':['早上好'],'wanshanghao':['晚上好'],
  'xiawu':['下午'],'xiawuhao':['下午好'],'shangwu':['上午'],
  // People
  'laoshi':['老师'],'xuesheng':['学生'],'tongxue':['同学'],
  'pengyou':['朋友'],'dajia':['大家'],'women':['我们'],
  'nimen':['你们'],'tamen':['他们'],'tamen':['她们'],
  'nansheng':['男生'],'nvsheng':['女生'],'tongshi':['同事'],
  // Countries & languages
  'zhongguo':['中国'],'meiguo':['美国'],'yingguo':['英国'],
  'faguo':['法国'],'deguo':['德国'],'riben':['日本'],
  'hanguo':['韩国'],'xibanya':['西班牙'],'yidali':['意大利'],
  'putouyaren':['葡萄牙人'],'putaoya':['葡萄牙'],
  'zhongwen':['中文'],'yingwen':['英文'],'fawen':['法文'],
  'riwen':['日文'],'hanwen':['韩文'],'hanyu':['汉语'],
  'putonghua':['普通话'],'guangdonghua':['广东话'],
  // Identity & questions
  'shenme':['什么'],'naguoren':['哪国人'],'zenme':['怎么'],
  'zenyang':['怎样'],'weishenme':['为什么'],'zenmele':['怎么了'],
  'duoshao':['多少'],'jige':['几个'],'nali':['哪里'],
  'nage':['那个'],'zhege':['这个'],'yige':['一个'],
  'nali':['哪里','那里'],'zheli':['这里'],'nali':['那里'],
  // Places
  'xuexiao':['学校'],'daxue':['大学'],'zhongxue':['中学'],
  'xiaoxue':['小学'],'jiaoshi':['教室'],'tushuguan':['图书馆'],
  'shitang':['食堂'],'sushe':['宿舍'],'yiyuan':['医院'],
  'gongyuan':['公园'],'shangdian':['商店'],'chaoshi':['超市'],
  'yinhang':['银行'],'youju':['邮局'],'binguan':['宾馆'],
  'fandian':['饭店'],'canting':['餐厅'],'kafeidian':['咖啡店'],
  'feijichang':['飞机场'],'jichang':['机场'],
  'huochezhan':['火车站'],'ditiezhan':['地铁站'],
  'gonggongqiche':['公共汽车'],'chuzuche':['出租车'],
  'beijing':['北京'],'shanghai':['上海'],'guangzhou':['广州'],
  'shenzhen':['深圳'],'nanjing':['南京'],'xian':['西安'],
  'beijingyuyandaxue':['北京语言大学'],
  // Time
  'jintian':['今天'],'mingtian':['明天'],'zuotian':['昨天'],
  'qiantian':['前天'],'houtian':['后天'],'xingqi':['星期'],
  'xingqiyi':['星期一'],'xingqier':['星期二'],'xingqisan':['星期三'],
  'xingqisi':['星期四'],'xingqiwu':['星期五'],'xingqiliu':['星期六'],
  'xingqitian':['星期天'],'zhou':['周'],'zhouri':['周日'],
  'nian':['年'],'yue':['月'],'ri':['日'],'hao':['号'],
  'shijian':['时间'],'xianzai':['现在'],'yiqian':['以前'],
  'yihou':['以后'],'zuijin':['最近'],'changchang':['常常'],
  // Verbs
  'renshi':['认识'],'zhidao':['知道'],'juede':['觉得'],
  'xihuan':['喜欢'],'kaishi':['开始'],'jieshu':['结束'],
  'gongzuo':['工作'],'xuexi':['学习'],'shenghuo':['生活'],
  'xuexizhongwen':['学习中文'],'jiaoshu':['教书'],
  'wanfan':['晚饭'],'chifan':['吃饭'],'hefan':['喝饭'],
  'shuijiao':['睡觉'],'qichuang':['起床'],'xizao':['洗澡'],
  'dunshu':['读书'],'kanshui':['看书'],'kan':['看'],
  'ting':['听'],'shuo':['说'],'xie':['写'],'du':['读'],
  'wenti':['问题'],'huida':['回答'],'yundong':['运动'],
  // Food & drink
  'mifan':['米饭'],'miantiao':['面条'],'jiaozi':['饺子'],
  'baozi':['包子'],'mantou':['馒头'],'chaofan':['炒饭'],
  'chaomian':['炒面'],'niurou':['牛肉'],'jidan':['鸡蛋'],
  'doufu':['豆腐'],'shucai':['蔬菜'],'shuiguo':['水果'],
  'pingguo':['苹果'],'xiangjiao':['香蕉'],'xigua':['西瓜'],
  'putao':['葡萄'],'caomei':['草莓'],'juzi':['橘子'],
  'kafei':['咖啡'],'chaye':['茶叶'],'pijiu':['啤酒'],
  'kuangquanshui':['矿泉水'],'guozhi':['果汁'],'niunaì':['牛奶'],
  'niunai':['牛奶'],'kele':['可乐'],
  // Objects & technology
  'dianhua':['电话'],'shouji':['手机'],'diannao':['电脑'],
  'dianshi':['电视'],'dianyingyuan':['电影院'],'baozhi':['报纸'],
  'qianbi':['铅笔'],'gangbi':['钢笔'],'benzi':['本子'],
  'shuben':['书本'],'zidian':['字典'],'cishu':['词书'],
  // Family
  'baba':['爸爸'],'mama':['妈妈'],'gege':['哥哥'],
  'jiejie':['姐姐'],'didi':['弟弟'],'meimei':['妹妹'],
  'yeye':['爷爷'],'nainai':['奶奶'],'waigong':['外公'],
  'waipo':['外婆'],'shushu':['叔叔'],'ayi':['阿姨'],
  'erzi':['儿子'],'nver':['女儿'],'nvr':['女儿'],
  // Adjectives & common words
  'gaoxing':['高兴'],'kuaile':['快乐'],'piaoliang':['漂亮'],
  'congming':['聪明'],'keai':['可爱'],'haochi':['好吃'],
  'haohe':['好喝'],'pianyi':['便宜'],'guiyide':['贵的'],
  'haokao':['好看'],'nanhao':['难好'],'rongyi':['容易'],
  'nanti':['难题'],'zhongyao':['重要'],'youyisi':['有意思'],
  'meiyou':['没有'],'youde':['有的'],'keyi':['可以'],
  'yiding':['一定'],'keneng':['可能'],'yexu':['也许'],
  'yidianr':['一点儿'],'yidian':['一点'],'yiqi':['一起'],
  'yiqie':['一切'],'yiding':['一定'],
  // Numbers & measure words
  'yige':['一个'],'liangge':['两个'],'jige':['几个'],
  'duoshao':['多少'],'baifen':['百分'],'qianbai':['千百'],
  // Study & work
  'zuoye':['作业'],'kaoshi':['考试'],'chengji':['成绩'],
  'biye':['毕业'],'shangke':['上课'],'xiake':['下课'],
  'keben':['课本'],'jiaocai':['教材'],'zuoye':['作业'],
  'duihua':['对话'],'lianxi':['练习'],'fuxi':['复习'],
  'yufa':['语法'],'hanzi':['汉字'],'pinyin':['拼音'],
  'shengdiao':['声调'],'shengmu':['声母'],'yunmu':['韵母'],
  // Colors
  'hongse':['红色'],'lvse':['绿色'],'lanse':['蓝色'],
  'huangse':['黄色'],'heise':['黑色'],'baise':['白色'],
  'zise':['紫色'],'chengse':['橙色'],'fense':['粉色'],
  // Common phrases
  'meitian':['每天'],'meige':['每个'],'suoyou':['所有'],
  'yiban':['一般'],'tongchang':['通常'],'zhunque':['准确'],
  'jianglai':['将来'],'danshi':['但是'],'suiran':['虽然'],
  'yinwei':['因为'],'suoyi':['所以'],'ruguo':['如果'],
  'zhiyao':['只要'],'haishi':['还是'],'huozhe':['或者'],
  'buguo':['不过'],'erqie':['而且'],'lianghao':['良好'],
  'fengfu':['丰富'],'jichu':['基础'],'jingyan':['经验'],
  // Greetings extended
  'shengrikuaile':['生日快乐'],'xinniankuaile':['新年快乐'],
  'zhujunhao':['祝你好'],'baozhong':['保重'],
  'manzouma':['慢走吧'],'youkong':['有空'],'youkonglaiwan':['有空来玩'],
};

// Normalize input: v→ü
function norm(s) { return s.toLowerCase().replace(/v/g, 'ü'); }

function getCandidates(buf) {
  const n = norm(buf);
  if (!n) return [];

  const results = [];
  const seen = new Set();
  const add = (arr) => { for (const c of arr) { if (!seen.has(c)) { seen.add(c); results.push(c); } } };

  // 1. Exact word match (multi-char)
  if (WORDS[n]) add(WORDS[n]);

  // 2. Prefix word matches (user is still typing the word)
  for (const [k, v] of Object.entries(WORDS)) {
    if (k !== n && k.startsWith(n)) add(v);
  }

  // 3. Exact syllable match
  if (DICT[n]) add(DICT[n]);

  // 4. Syllable prefix match (incomplete syllable)
  if (!DICT[n]) {
    for (const [k, v] of Object.entries(DICT)) {
      if (k.startsWith(n)) add(v);
    }
  }

  return results.slice(0, 10);
}

// ── Context ──────────────────────────────────────────────────────────────────
export const IMEContext = createContext(null);

export function useIME() {
  return useContext(IMEContext);
}

// ── Insert text into any focused element ─────────────────────────────────────
function insertIntoFocused(text) {
  const el = document.activeElement;
  if (!el) return;

  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    const start = el.selectionStart ?? el.value.length;
    const end   = el.selectionEnd   ?? el.value.length;
    const before = el.value.slice(0, start);
    const after  = el.value.slice(end);
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      el.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;
    nativeInputValueSetter?.call(el, before + text + after);
    el.setSelectionRange(start + text.length, start + text.length);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // contentEditable / Slate editor
    const event = new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: text,
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(event);
    if (!event.defaultPrevented) {
      document.execCommand('insertText', false, text);
    }
  }
}

function deleteLastInFocused() {
  const el = document.activeElement;
  if (!el) return;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    const start = el.selectionStart ?? 0;
    const end   = el.selectionEnd   ?? 0;
    if (start === end && start > 0) {
      const before = el.value.slice(0, start - 1);
      const after  = el.value.slice(end);
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        el.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(el, before + after);
      el.setSelectionRange(start - 1, start - 1);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else {
    const event = new InputEvent('beforeinput', {
      inputType: 'deleteContentBackward',
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(event);
    if (!event.defaultPrevented) {
      document.execCommand('delete', false);
    }
  }
}

// ── Popup position ────────────────────────────────────────────────────────────
function getCaretPos() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const r = sel.getRangeAt(0).getBoundingClientRect();
    if (r.width > 0 || r.height > 0) {
      return { x: r.left, y: r.bottom + 6 };
    }
  }
  const el = document.activeElement;
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.bottom + 6 };
  }
  return { x: 100, y: 100 };
}

// ── IMEProvider ───────────────────────────────────────────────────────────────
export function IMEProvider({ children }) {
  const [active, setActive]       = useState(false);
  const [buffer, setBuffer]       = useState('');
  const [candidates, setCandidates] = useState([]);
  const [pos, setPos]             = useState({ x: 0, y: 0 });
  const bufRef = useRef('');
  const activeRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { bufRef.current = buffer; }, [buffer]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    if (buffer) {
      setCandidates(getCandidates(buffer));
    } else {
      setCandidates([]);
    }
  }, [buffer]);

  const confirmCandidate = useCallback((char) => {
    insertIntoFocused(char);
    setBuffer('');
  }, []);

  const clearBuffer = useCallback(() => setBuffer(''), []);

  // Global keydown handler
  useEffect(() => {
    const handler = (e) => {
      if (!activeRef.current) return;

      // Don't intercept modifier combos (Ctrl+C, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const buf = bufRef.current;
      const cands = getCandidates(buf);

      // Number keys 1–9: pick candidate
      if (buf && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (cands[idx]) {
          e.preventDefault();
          confirmCandidate(cands[idx]);
          return;
        }
      }

      // Space: confirm first candidate or insert space
      if (e.key === ' ') {
        if (buf && cands.length > 0) {
          e.preventDefault();
          confirmCandidate(cands[0]);
          return;
        }
        if (buf) {
          // no match — clear buffer, insert nothing (user can retry)
          e.preventDefault();
          setBuffer('');
          return;
        }
        return; // let space pass through
      }

      // Enter: confirm first candidate or pass through
      if (e.key === 'Enter') {
        if (buf && cands.length > 0) {
          e.preventDefault();
          confirmCandidate(cands[0]);
          return;
        }
        if (buf) {
          e.preventDefault();
          setBuffer('');
          return;
        }
        return;
      }

      // Escape: clear buffer
      if (e.key === 'Escape') {
        if (buf) { e.preventDefault(); setBuffer(''); }
        return;
      }

      // Backspace: remove last pinyin char if buffer exists
      if (e.key === 'Backspace') {
        if (buf.length > 0) {
          e.preventDefault();
          setBuffer(b => b.slice(0, -1));
          return;
        }
        // else let backspace delete normally
        return;
      }

      // Letters → add to pinyin buffer
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const p = getCaretPos();
        setPos(p);
        setBuffer(b => b + e.key.toLowerCase());
        return;
      }

      // Punctuation / special: clear buffer and let through
      if (buf && e.key.length === 1) {
        setBuffer('');
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [confirmCandidate]);

  const toggle   = useCallback(() => { setActive(a => !a); setBuffer(''); }, []);
  const activate = useCallback(() => { setActive(true);   setBuffer(''); }, []);
  const deactivate = useCallback(() => { setActive(false); setBuffer(''); }, []);

  return (
    <IMEContext.Provider value={{ active, toggle, activate, deactivate, buffer, clearBuffer }}>
      {children}
      {active && buffer && (
        <IMEPopup
          buffer={buffer}
          candidates={candidates}
          pos={pos}
          onSelect={confirmCandidate}
          onClear={clearBuffer}
        />
      )}
    </IMEContext.Provider>
  );
}

// ── Floating popup ────────────────────────────────────────────────────────────
function IMEPopup({ buffer, candidates, pos, onSelect, onClear }) {
  const ref = useRef(null);

  // Keep popup on screen
  const style = {
    position: 'fixed',
    left: Math.min(pos.x, window.innerWidth - 320),
    top: Math.min(pos.y, window.innerHeight - 160),
    zIndex: 9999,
  };

  return (
    <div ref={ref} className="ime-popup" style={style}>
      <div className="ime-buffer">
        <span className="ime-buffer-text">{buffer}</span>
        <span className="ime-buffer-hint">Space/Enter = confirmar · Esc = limpar</span>
      </div>
      {candidates.length > 0 ? (
        <div className="ime-candidates">
          {candidates.map((c, i) => (
            <button
              key={i}
              className="ime-cand"
              // onMouseDown preventDefault keeps focus on the Slate editor so
              // insertIntoFocused dispatches beforeinput on the correct element.
              // Without this, mousedown steals focus to the button and the
              // char insertion falls back to execCommand, bypassing Slate state
              // — so decorate never runs and pinyin never appears on new chars.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(c)}
            >
              <span className="ime-cand-num">{i + 1}</span>
              <span className="ime-cand-hz">{c}</span>
              <span className="ime-cand-py">{pinyin(c, { type: 'string' })}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="ime-no-cand">Sem correspondência — tente outro pinyin</div>
      )}
    </div>
  );
}
