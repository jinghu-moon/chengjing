import dayjs from 'dayjs'
import {
  getLunarDate,
  getDayDetail,
  getSolarTerms,
  getLunarFestivals,
  isHoliday,
  isInLieu,
  isWorkday,
} from 'chinese-days'

// --- 静态配置数据 ---

// 1. 传统节日白名单 (农历)
const traditionalFestivals = new Set([
  '除夕',
  '春节',
  '元宵节',
  '龙抬头',
  '清明节',
  '端午节',
  '七夕节',
  '中元节',
  '中秋节',
  '重阳节',
  '寒衣节',
  '下元节',
  '腊八节',
  '小年',
  '祭灶节',
])

// 2. 公历固定节日表 (MM-DD)
const gregorianFestivals: Record<string, string> = {
  '01-01': '元旦',
  '02-14': '情人节',
  '03-08': '妇女节',
  '03-12': '植树节',
  '04-01': '愚人节',
  '05-01': '劳动节',
  '05-04': '青年节',
  '06-01': '儿童节',
  '07-01': '建党节',
  '08-01': '建军节',
  '09-10': '教师节',
  '10-01': '国庆节',
  '10-31': '万圣夜',
  '12-24': '平安夜',
  '12-25': '圣诞节',
}

// 3. 动态节日配置表 (月份0-11, 第几个周N, 周几0-6, 节日名)
const dynamicFestivals = [
  { month: 4, weekIdx: 2, dayOfWeek: 0, name: '母亲节' }, // 5月第2个周日
  { month: 5, weekIdx: 3, dayOfWeek: 0, name: '父亲节' }, // 6月第3个周日
  { month: 10, weekIdx: 4, dayOfWeek: 4, name: '感恩节' }, // 11月第4个周四
]

// --- 类型定义 ---
export interface DayMetadata {
  dateStr: string // YYYY-MM-DD
  dayNum: number // D
  lunarText: string // 用于显示的农历或节日文本
  isToday: boolean // 动态计算，不存入静态缓存
  type: 'holiday' | 'lieu' | 'work' | 'festival' | 'term' | null // 状态颜色类型
  tagLabel: string // 休/班/调
  tagType: 'holiday' | 'lieu' | 'work' | null
  solarTerm: string | null
  festival: string | null
}

// 全局缓存：只存储“静态”数据 (因为农历、节日在某一天是永远不变的)
// 避免存储 isToday，防止跨天后缓存失效
const staticCache = new Map<string, Omit<DayMetadata, 'isToday'>>()

export function useCalendarData() {
  // 辅助：计算某月第N个星期X的日期对象
  const getDynamicDateObj = (year: number, month: number, weekIdx: number, dayOfWeek: number) => {
    const date = dayjs().year(year).month(month).date(1)
    const day = date.day()
    let diff = dayOfWeek - day
    if (diff < 0) diff += 7
    return date.add(diff + (weekIdx - 1) * 7, 'day')
  }

  /**
   * 核心函数：获取日期元数据 (带缓存)
   */
  const getDayMetadata = (date: Date): DayMetadata => {
    const d = dayjs(date)
    const dateStr = d.format('YYYY-MM-DD')
    const todayStr = dayjs().format('YYYY-MM-DD') // 实时获取“今天”

    // 1. 尝试从缓存读取静态数据
    let staticData = staticCache.get(dateStr)

    if (!staticData) {
      // --- 开始计算静态数据 (开销较大，只计算一次) ---
      const dayNum = d.date()
      let solarTerm: string | null = null
      let festival: string | null = null
      let type: DayMetadata['type'] = null
      let tagLabel = ''
      let tagType: DayMetadata['tagType'] = null
      let lunarText = ''

      try {
        // A. 节气
        const terms = getSolarTerms(dateStr)
        if (terms.length > 0) {
          solarTerm = terms[0].name
          type = 'term'
        }

        // B. 农历 & 传统节日
        const lunar = getLunarDate(dateStr)
        const festivals = getLunarFestivals(dateStr)
        if (festivals.length > 0) {
          const match = festivals[0].name.find(n => traditionalFestivals.has(n))
          if (match) {
            festival = match
            type = 'festival'
          }
        }

        // C. 公历固定节日 (优先级：传统 > 公历)
        const shortDate = d.format('MM-DD')
        if (gregorianFestivals[shortDate] && !festival) {
          festival = gregorianFestivals[shortDate]
          type = 'festival'
        }

        // D. 动态节日 (母亲节等)
        if (!festival) {
          const m = d.month()
          const y = d.year()
          const targetConfig = dynamicFestivals.find(c => c.month === m)
          if (targetConfig) {
            const targetDate = getDynamicDateObj(
              y,
              targetConfig.month,
              targetConfig.weekIdx,
              targetConfig.dayOfWeek
            )
            if (d.isSame(targetDate, 'day')) {
              festival = targetConfig.name
              type = 'festival'
            }
          }
        }

        // E. 法定节假日/调休
        if (isHoliday(dateStr)) {
          const dayInfo = getDayDetail(dateStr)
          const isWeekend = d.day() === 0 || d.day() === 6
          // 判断是否为法定节假日（即名字不是 Saturday 或 Sunday）
          const isStatutory = dayInfo.name && !['Saturday', 'Sunday'].includes(dayInfo.name)

          if (isInLieu(dateStr)) {
            tagLabel = '调'
            tagType = 'lieu'
          } else {
            // [核心修复]
            // 只有当：1. 不是周末 (周一到周五放假)  OR  2. 是周末但属于法定节假日 (如春节落在周日)
            // 才显示“休”字，避免普通周末也显示
            if (!isWeekend || isStatutory) {
              tagLabel = '休'
              tagType = 'holiday'
              if (isStatutory) type = 'holiday'
            }
          }
        } else if (isWorkday(dateStr)) {
          const dayOfWeek = d.day()
          // 周末补班
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            tagLabel = '班'
            tagType = 'work'
          }
        }

        // F. 生成最终显示文本 (优先级：节日 > 节气 > 初一 > 日期)
        if (festival) lunarText = festival
        else if (solarTerm) lunarText = solarTerm
        else if (lunar.lunarDay === 1) lunarText = lunar.lunarMonCN
        else lunarText = lunar.lunarDayCN
      } catch (e) {
        console.warn('Date calc error:', e)
      }

      staticData = {
        dateStr,
        dayNum,
        lunarText,
        type,
        tagLabel,
        tagType,
        solarTerm,
        festival,
      }

      // 写入缓存
      staticCache.set(dateStr, staticData)
    }

    // 2. 动态合并 isToday (不存入缓存，解决跨天问题)
    return {
      ...staticData,
      isToday: dateStr === todayStr,
    }
  }

  return {
    getDayMetadata,
    traditionalFestivals,
    gregorianFestivals,
  }
}
