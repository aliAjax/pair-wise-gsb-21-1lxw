import { ChecklistStatus, ItemResult } from "./types";

export const AIRCRAFT_TYPES = ["A320", "B737", "ARJ21", "C919"];

export interface AtaChapter {
  ata: string;
  name: string;
  items: string[];
}

export const ATA_TEMPLATE: AtaChapter[] = [
  {
    ata: "ATA 21",
    name: "空调系统",
    items: ["组件活门与管道渗漏检查", "座舱增压功能检查", "再循环风扇运转检查"],
  },
  {
    ata: "ATA 24",
    name: "电源系统",
    items: ["电瓶电压与充电状态检查", "发电机负载测试", "外部电源接口检查"],
  },
  {
    ata: "ATA 27",
    name: "飞行操纵",
    items: ["副翼/升降舵行程检查", "襟缝翼作动测试", "操纵钢索张力检查"],
  },
  {
    ata: "ATA 28",
    name: "燃油系统",
    items: ["油箱油量指示校验", "燃油泵运转检查", "放油沉淀检查"],
  },
  {
    ata: "ATA 29",
    name: "液压系统",
    items: ["液压油量与渗漏检查", "蓄压器压力检查", "液压泵压力测试"],
  },
  {
    ata: "ATA 32",
    name: "起落架",
    items: ["轮胎磨耗与气压检查", "减震支柱镜面高度检查", "刹车组件磨耗检查"],
  },
  {
    ata: "ATA 34",
    name: "导航系统",
    items: ["皮托管/静压口外观检查", "惯导校准检查", "天线外观检查"],
  },
  {
    ata: "ATA 49",
    name: "APU",
    items: ["APU 启动测试", "APU 滑油量检查", "排气区域检查"],
  },
  {
    ata: "ATA 71-80",
    name: "动力装置",
    items: ["发动机滑油量检查", "风扇叶片外观检查", "尾喷管区域检查"],
  },
];

export const RESULT_LABELS: Record<ItemResult, string> = {
  normal: "正常",
  watch: "观察",
  defect: "缺陷",
};

export const STATUS_LABELS: Record<ChecklistStatus, string> = {
  draft: "草稿",
  submitted: "待复核",
  returned: "已退回",
  released: "已放行",
};
