import type { ItemRecord } from "./types";

export const AIRCRAFT_TYPES = ["A320", "B737", "ARJ21", "C919", "A330", "B787"];

export interface CheckItemTemplate {
  id: string;
  title: string;
}

export interface AtaChapter {
  ata: string;
  name: string;
  items: CheckItemTemplate[];
}

export const ATA_TEMPLATE: AtaChapter[] = [
  {
    ata: "ATA 21",
    name: "空调系统",
    items: [
      { id: "21-1", title: "空调组件活门外观及安装" },
      { id: "21-2", title: "引气管道渗漏检查" },
      { id: "21-3", title: "座舱增压功能测试" },
      { id: "21-4", title: "空调出风口温度检查" },
    ],
  },
  {
    ata: "ATA 24",
    name: "电源系统",
    items: [
      { id: "24-1", title: "电瓶电压及充电状态" },
      { id: "24-2", title: "IDG 滑油量检查" },
      { id: "24-3", title: "外部电源接口外观" },
      { id: "24-4", title: "发电机驱动状态指示" },
    ],
  },
  {
    ata: "ATA 27",
    name: "飞行操纵",
    items: [
      { id: "27-1", title: "副翼外观及行程检查" },
      { id: "27-2", title: "襟翼收放功能测试" },
      { id: "27-3", title: "方向舵行程及阻尼" },
      { id: "27-4", title: "升降舵及配平检查" },
    ],
  },
  {
    ata: "ATA 28",
    name: "燃油系统",
    items: [
      { id: "28-1", title: "机翼油箱渗漏检查" },
      { id: "28-2", title: "油量指示一致性" },
      { id: "28-3", title: "燃油滤压差指示" },
      { id: "28-4", title: "加油面板及活门状态" },
    ],
  },
  {
    ata: "ATA 29",
    name: "液压系统",
    items: [
      { id: "29-1", title: "液压油箱油量" },
      { id: "29-2", title: "液压管路渗漏检查" },
      { id: "29-3", title: "蓄压器预充压力" },
      { id: "29-4", title: "液压泵工作及异响" },
    ],
  },
  {
    ata: "ATA 32",
    name: "起落架",
    items: [
      { id: "32-1", title: "轮胎磨耗及损伤" },
      { id: "32-2", title: "减震支柱镜面高度" },
      { id: "32-3", title: "刹车磨损指示销" },
      { id: "32-4", title: "起落架舱门密封" },
    ],
  },
  {
    ata: "ATA 34",
    name: "导航系统",
    items: [
      { id: "34-1", title: "皮托管外观及堵塞" },
      { id: "34-2", title: "静压孔外观检查" },
      { id: "34-3", title: "导航天线外观" },
      { id: "34-4", title: "备用罗盘指示" },
    ],
  },
  {
    ata: "ATA 49",
    name: "APU",
    items: [
      { id: "49-1", title: "APU 滑油量检查" },
      { id: "49-2", title: "排气口及尾锥外观" },
      { id: "49-3", title: "APU 火警探测测试" },
      { id: "49-4", title: "APU 启动及引气测试" },
    ],
  },
];

export const TOTAL_ITEMS = ATA_TEMPLATE.reduce((n, ch) => n + ch.items.length, 0);

export function emptyItems(): Record<string, ItemRecord> {
  const items: Record<string, ItemRecord> = {};
  for (const ch of ATA_TEMPLATE) {
    for (const it of ch.items) {
      items[it.id] = { status: null, defectDescription: "", disposition: "" };
    }
  }
  return items;
}
