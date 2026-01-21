declare module 'lunar-javascript' {
  export class Solar {
    static fromDate(date: Date): Solar;
    getXingZuo(): string;
  }

  export class Lunar {
    static fromDate(date: Date): Lunar;

    // 节气
    getJieQi(): string;

    // 干支
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;

    // 生肖
    getYearShengXiao(): string;

    // 纳音
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;

    // 冲煞
    getDayChongDesc(): string;
    getDaySha(): string;

    // 彭祖百忌
    getPengZuGan(): string;
    getPengZuZhi(): string;

    // 宜忌
    getDayYi(): string[];
    getDayJi(): string[];

    // 九宫飞星 (如果你还需要用的话)
    getGong(): string;
  }
}